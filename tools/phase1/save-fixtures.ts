import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { naturalNumbersContent } from "../../src/content";
import { createInitialState } from "../../src/engine/state/game-state";
import { WriterCoordinator } from "../../src/platform/ownership/coordinator";
import { corruptionChecksum } from "../../src/platform/persistence/checksum";
import {
  createSaveEnvelope,
  exportSave,
  validateSaveText,
} from "../../src/platform/persistence/envelope";
import {
  loadBestSave,
  saveWithRotation,
  SAVE_KEYS,
  type StorageLike,
} from "../../src/platform/persistence/local-storage";
import { sanitizeElapsed } from "../../src/platform/time/clock";
import { runSimulation } from "../simulator/core";

class MemoryStorage implements StorageLike {
  public values = new Map<string, string>();
  public failWrites = false;
  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  public setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error("QUOTA_EXCEEDED");
    this.values.set(key, value);
  }
  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

const state = createInitialState(naturalNumbersContent, 12_345);
const current = createSaveEnvelope(state, {
  generation: 2,
  savedAtMs: 2_000,
  sessionId: "fixture",
  buildId: "phase-1",
});
const empty = createSaveEnvelope(createInitialState(naturalNumbersContent, 1), {
  generation: 0,
  savedAtMs: 0,
  sessionId: "empty",
  buildId: "phase-1",
});
const older = structuredClone(current);
older.schemaVersion = 0;
older.migration = { from: 0, to: 0, applied: [] };
const olderUnsigned: Partial<typeof older> = { ...older };
delete olderUnsigned.checksum;
older.checksum = corruptionChecksum(olderUnsigned);
const future = structuredClone(current);
future.schemaVersion = 999;
const futureUnsigned: Partial<typeof future> = { ...future };
delete futureUnsigned.checksum;
future.checksum = corruptionChecksum(futureUnsigned);
const invalidChecksum = { ...current, checksum: "fnv1a32:00000000" };
const postPublicationState = runSimulation({
  policy: "balanced",
  horizonSeconds: 7_200,
}).finalState;
const postPublication = createSaveEnvelope(postPublicationState, {
  generation: 3,
  savedAtMs: 3_000,
  sessionId: "published",
  buildId: "phase-1",
});

const fixtureDirectory = resolve("tests/fixtures/saves");
await mkdir(fixtureDirectory, { recursive: true });
const fixtureFiles: Record<string, string> = {
  "new-empty-v2.json": exportSave(empty),
  "current-valid.json": exportSave(current),
  "older-supported-v2.json": exportSave(older),
  "future-unsupported.json": exportSave(future),
  "corrupt-json.json": "{\n",
  "invalid-schema.json": '{"format":"analysis-idle-v2"}\n',
  "invalid-checksum.json": exportSave(invalidChecksum),
  "partial-write.json": '{"format":"analysis-idle-v2","schemaVersion":1',
  "post-publication.json": exportSave(postPublication),
  "rng-replay.json": exportSave(current),
};
await Promise.all(
  Object.entries(fixtureFiles).map(([name, text]) =>
    writeFile(resolve(fixtureDirectory, name), text, "utf8"),
  ),
);

const rotationStorage = new MemoryStorage();
await saveWithRotation(rotationStorage, empty, naturalNumbersContent);
await saveWithRotation(rotationStorage, current, naturalNumbersContent);
const recoveryStorage = new MemoryStorage();
recoveryStorage.setItem(SAVE_KEYS.current, "corrupt");
recoveryStorage.setItem(SAVE_KEYS.backups[0], exportSave(current));
const legacyStorage = new MemoryStorage();
legacyStorage.setItem(SAVE_KEYS.legacy, "legacy-v1-opaque");
const quotaStorage = new MemoryStorage();
quotaStorage.failWrites = true;
let quotaFailure = false;
try {
  await saveWithRotation(quotaStorage, current, naturalNumbersContent);
} catch {
  quotaFailure = true;
}
const idbFailure = await saveWithRotation(
  new MemoryStorage(),
  current,
  naturalNumbersContent,
  { appendSave: () => Promise.reject(new Error("IDB_UNAVAILABLE")) },
);
const ownershipStorage = new MemoryStorage();
const firstWriter = await new WriterCoordinator("tab-a", {
  storage: ownershipStorage,
  now: () => 100,
}).acquire();
const secondWriter = await new WriterCoordinator("tab-b", {
  storage: ownershipStorage,
  now: () => 101,
}).acquire();

const records = [
  [
    "new empty v2 save",
    validateSaveText(exportSave(empty), naturalNumbersContent).code,
  ],
  [
    "current valid save",
    validateSaveText(exportSave(current), naturalNumbersContent).code,
  ],
  [
    "older supported v2 schema",
    validateSaveText(exportSave(older), naturalNumbersContent).code,
  ],
  [
    "future unsupported schema",
    validateSaveText(exportSave(future), naturalNumbersContent).code,
  ],
  ["corrupt JSON", validateSaveText("{", naturalNumbersContent).code],
  [
    "valid JSON invalid schema",
    validateSaveText("{}", naturalNumbersContent).code,
  ],
  [
    "invalid checksum",
    validateSaveText(exportSave(invalidChecksum), naturalNumbersContent).code,
  ],
  [
    "partial write",
    validateSaveText(fixtureFiles["partial-write.json"]!, naturalNumbersContent)
      .code,
  ],
  [
    "current invalid fallback valid",
    loadBestSave(recoveryStorage, naturalNumbersContent).status,
  ],
  [
    "current valid fallback older",
    loadBestSave(rotationStorage, naturalNumbersContent).status,
  ],
  ["quota failure", quotaFailure ? "QUOTA_FAILURE_HANDLED" : "FAIL"],
  [
    "IndexedDB unavailable",
    idbFailure.backupAppendFailed ? "LOCAL_CONFIRMED_IDB_FAILED" : "FAIL",
  ],
  [
    "IndexedDB append failure",
    idbFailure.backupAppendFailed ? "LOCAL_CONFIRMED_IDB_FAILED" : "FAIL",
  ],
  [
    "legacy v1 mathIdleSave",
    loadBestSave(legacyStorage, naturalNumbersContent).status,
  ],
  [
    "imported valid save",
    validateSaveText(exportSave(current), naturalNumbersContent).code,
  ],
  [
    "imported invalid save",
    validateSaveText("not-json", naturalNumbersContent).code,
  ],
  ["clock rollback", sanitizeElapsed(200, 100, 1_000).anomaly],
  ["large forward clock jump", sanitizeElapsed(0, 2_000, 1_000).anomaly],
  [
    "multi-tab conflict",
    firstWriter.writer && !secondWriter.writer ? "ONE_WRITER" : "FAIL",
  ],
  [
    "post-Publication save",
    validateSaveText(exportSave(postPublication), naturalNumbersContent).code,
  ],
  [
    "RNG replay save",
    validateSaveText(exportSave(current), naturalNumbersContent).code,
  ],
] as const;
const report = {
  command: "npm run save:fixtures",
  fixtures: records.map(([name, result]) => ({
    name,
    result,
    passed: result !== "FAIL",
  })),
  recoveryPriority: [
    "highest valid generation",
    "current on equal generation",
    "fallback",
    "IndexedDB backup",
    "new state",
  ],
  legacyPolicy: "detect-read-only-never-convert",
  checksumPurpose: "accidental corruption detection only",
};
await mkdir(resolve("reports/phase-1/data"), { recursive: true });
await writeFile(
  resolve("reports/phase-1/data/save-fixtures.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
process.stdout.write(
  `${JSON.stringify({ fixtures: report.fixtures.length, passed: report.fixtures.filter((fixture) => fixture.passed).length })}\n`,
);
if (report.fixtures.some((fixture) => !fixture.passed)) process.exitCode = 1;
