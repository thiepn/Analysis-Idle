import { indexedDB } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { naturalNumbersContent } from "../../src/content";
import { createInitialState } from "../../src/engine/state/game-state";
import { corruptionChecksum } from "../../src/platform/persistence/checksum";
import {
  createSaveEnvelope,
  exportSave,
  previewImport,
  validateSaveText,
} from "../../src/platform/persistence/envelope";
import {
  IndexedDbHistory,
  openPersistenceDatabase,
} from "../../src/platform/persistence/indexed-db";
import {
  loadBestSave,
  saveWithRotation,
  SAVE_KEYS,
} from "../../src/platform/persistence/local-storage";
import { sanitizeElapsed } from "../../src/platform/time/clock";
import { WriterCoordinator } from "../../src/platform/ownership/coordinator";
import { MemoryStorage } from "../helpers";

const makeEnvelope = (generation = 1) =>
  createSaveEnvelope(createInitialState(naturalNumbersContent), {
    generation,
    savedAtMs: 1000 + generation,
    sessionId: "test",
    buildId: "phase-1-test",
  });

describe("save envelope and recovery", () => {
  it("round trips current canonical state with game numbers as strings", () => {
    const envelope = makeEnvelope();
    expect(
      typeof (envelope.state.resources as Record<string, unknown>).PRECISION,
    ).toBe("string");
    const result = validateSaveText(
      exportSave(envelope),
      naturalNumbersContent,
    );
    expect(result.valid).toBe(true);
    if (result.valid)
      expect(result.state).toEqual(createInitialState(naturalNumbersContent));
  });

  it("rejects corrupt, future, incompatible, invalid-checksum and oversized imports", () => {
    expect(validateSaveText("{", naturalNumbersContent).code).toBe(
      "CORRUPT_JSON",
    );
    const future = makeEnvelope();
    future.schemaVersion = 999;
    const futureUnsigned: Partial<typeof future> = { ...future };
    delete futureUnsigned.checksum;
    future.checksum = corruptionChecksum(futureUnsigned);
    expect(
      validateSaveText(exportSave(future), naturalNumbersContent).code,
    ).toBe("FUTURE_SCHEMA");
    const incompatible = makeEnvelope();
    incompatible.format = "other" as never;
    const incompatibleUnsigned: Partial<typeof incompatible> = {
      ...incompatible,
    };
    delete incompatibleUnsigned.checksum;
    incompatible.checksum = corruptionChecksum(incompatibleUnsigned);
    expect(
      validateSaveText(exportSave(incompatible), naturalNumbersContent).code,
    ).toBe("INCOMPATIBLE_APP");
    const bad = makeEnvelope();
    bad.checksum = "bad";
    expect(previewImport(exportSave(bad), naturalNumbersContent).code).toBe(
      "INVALID_CHECKSUM",
    );
    expect(
      validateSaveText(`"${"x".repeat(600_000)}"`, naturalNumbersContent).code,
    ).toBe("OVERSIZED");
  });

  it("stages, validates, rotates and selects the highest valid generation", async () => {
    const storage = new MemoryStorage();
    await saveWithRotation(storage, makeEnvelope(1), naturalNumbersContent);
    await saveWithRotation(storage, makeEnvelope(2), naturalNumbersContent);
    expect(storage.getItem(SAVE_KEYS.staging)).toBeNull();
    expect(storage.getItem(SAVE_KEYS.backups[0])).not.toBeNull();
    const loaded = loadBestSave(storage, naturalNumbersContent);
    expect(loaded.status).toBe("LOADED");
    if (loaded.status === "LOADED") expect(loaded.envelope.generation).toBe(2);
  });

  it("uses valid fallback and detects legacy without conversion", () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEYS.current, "corrupt");
    storage.setItem(SAVE_KEYS.backups[0], exportSave(makeEnvelope(3)));
    const recovered = loadBestSave(storage, naturalNumbersContent);
    expect(recovered.status).toBe("LOADED");
    if (recovered.status === "LOADED")
      expect(recovered.source).toBe("fallback-0");
    const legacyOnly = new MemoryStorage();
    legacyOnly.setItem(SAVE_KEYS.legacy, "legacy-data");
    expect(loadBestSave(legacyOnly, naturalNumbersContent).status).toBe(
      "LEGACY_V1_FOUND",
    );
    expect(legacyOnly.getItem(SAVE_KEYS.legacy)).toBe("legacy-data");
  });

  it("keeps a confirmed local save valid when IndexedDB append fails", async () => {
    const storage = new MemoryStorage();
    const result = await saveWithRotation(
      storage,
      makeEnvelope(),
      naturalNumbersContent,
      { appendSave: () => Promise.reject(new Error("unavailable")) },
    );
    expect(result.saved).toBe(true);
    expect(result.backupAppendFailed).toBe(true);
    expect(loadBestSave(storage, naturalNumbersContent).status).toBe("LOADED");
  });

  it("appends save, replay and diagnostics to IndexedDB", async () => {
    const database = await openPersistenceDatabase(indexedDB);
    const history = new IndexedDbHistory(database);
    await expect(history.appendSave(makeEnvelope(22))).resolves.toBeUndefined();
    await expect(
      history.appendReplay({
        sessionId: "test",
        sequence: 1,
        data: { type: "command" },
      }),
    ).resolves.toBeUndefined();
    await expect(
      history.appendDiagnostic({ code: "test" }),
    ).resolves.toBeUndefined();
    database.close();
  });
});

describe("clock and multi-tab integrity", () => {
  it("sanitizes rollback and caps large forward jumps", () => {
    expect(sanitizeElapsed(200, 100, 1000)).toMatchObject({
      elapsedMs: 0,
      anomaly: "ROLLBACK",
    });
    expect(sanitizeElapsed(0, 2000, 1000)).toMatchObject({
      elapsedMs: 1000,
      anomaly: "FORWARD_JUMP",
      capped: true,
    });
  });

  it("selects Web Locks first and otherwise enforces one lease writer", async () => {
    const storage = new MemoryStorage();
    const web = new WriterCoordinator("a", {
      storage,
      now: () => 100,
      requestWebLock: () => Promise.resolve(true),
    });
    await expect(web.acquire()).resolves.toMatchObject({
      writer: true,
      method: "web-lock",
    });
    const first = new WriterCoordinator("a", { storage, now: () => 100 });
    const second = new WriterCoordinator("b", { storage, now: () => 101 });
    await expect(first.acquire()).resolves.toMatchObject({
      writer: true,
      method: "lease",
    });
    await expect(second.acquire()).resolves.toMatchObject({
      writer: false,
      method: "passive",
    });
  });
});
