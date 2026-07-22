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
import {
  registerPersistenceCheckpoints,
  SaveScheduler,
  type LifecycleTarget,
} from "../../src/platform/persistence/scheduler";
import { sanitizeElapsed } from "../../src/platform/time/clock";
import { WriterCoordinator } from "../../src/platform/ownership/coordinator";
import { createBrowserOwnershipAdapter } from "../../src/platform/ownership/browser-services";
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

  it("rejects incomplete or content-incompatible canonical state", () => {
    const missing = makeEnvelope();
    delete (missing.state.resources as Record<string, unknown>).PRECISION;
    const missingUnsigned: Partial<typeof missing> = { ...missing };
    delete missingUnsigned.checksum;
    missing.checksum = corruptionChecksum(missingUnsigned);
    expect(
      validateSaveText(exportSave(missing), naturalNumbersContent).code,
    ).toBe("INVALID_STATE");

    const incompatible = makeEnvelope();
    incompatible.contentVersion = "other-content";
    incompatible.state.contentVersion = "other-content";
    const incompatibleUnsigned: Partial<typeof incompatible> = {
      ...incompatible,
    };
    delete incompatibleUnsigned.checksum;
    incompatible.checksum = corruptionChecksum(incompatibleUnsigned);
    expect(
      validateSaveText(exportSave(incompatible), naturalNumbersContent).code,
    ).toBe("INVALID_STATE");
  });

  it("migrates a schema-zero envelope that predates replay metadata", () => {
    const legacy = makeEnvelope() as unknown as Record<string, unknown>;
    legacy.schemaVersion = 0;
    delete legacy.migration;
    delete legacy.replayMetadata;
    delete legacy.checksum;
    legacy.checksum = corruptionChecksum(legacy);
    const result = validateSaveText(
      JSON.stringify(legacy),
      naturalNumbersContent,
    );
    expect(result.valid).toBe(true);
    if (result.valid)
      expect(result.envelope.migration.applied).toContain(
        "v0-to-v1-envelope-metadata",
      );
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

  it("recovers a newer validated staging write before older current data", () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEYS.current, exportSave(makeEnvelope(1)));
    storage.setItem(SAVE_KEYS.staging, exportSave(makeEnvelope(2)));
    const recovered = loadBestSave(storage, naturalNumbersContent);
    expect(recovered.status).toBe("LOADED");
    if (recovered.status === "LOADED") {
      expect(recovered.source).toBe("staging");
      expect(recovered.envelope.generation).toBe(2);
    }
  });

  it("selects a newer fallback or IndexedDB candidate and ignores corrupt candidates", () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEYS.current, exportSave(makeEnvelope(2)));
    storage.setItem(SAVE_KEYS.backups[1], exportSave(makeEnvelope(5)));
    let recovered = loadBestSave(storage, naturalNumbersContent);
    expect(recovered.status).toBe("LOADED");
    if (recovered.status === "LOADED") {
      expect(recovered.source).toBe("fallback-1");
      expect(recovered.envelope.generation).toBe(5);
    }

    recovered = loadBestSave(storage, naturalNumbersContent, [
      "{corrupt",
      exportSave(makeEnvelope(8)),
    ]);
    expect(recovered.status).toBe("LOADED");
    if (recovered.status === "LOADED") {
      expect(recovered.source).toBe("indexeddb-1");
      expect(recovered.envelope.generation).toBe(8);
      expect(recovered.rejected).toContainEqual({
        source: "indexeddb-0",
        code: "CORRUPT_JSON",
      });
    }
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
    await expect(history.appendSave(makeEnvelope(22))).resolves.toBeUndefined();
    await expect(history.listSaveTexts()).resolves.toHaveLength(1);
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

  it("releases a held Web Lock, honors broadcast conflict, and recovers an expired lease", async () => {
    const storage = new MemoryStorage();
    let released = false;
    const web = new WriterCoordinator("web", {
      storage,
      now: () => 100,
      requestWebLock: () => Promise.resolve(true),
      releaseWebLock: () => {
        released = true;
      },
    });
    await expect(web.acquire()).resolves.toMatchObject({
      writer: true,
      method: "web-lock",
    });
    web.release();
    expect(released).toBe(true);

    const conflict = new WriterCoordinator("broadcast", {
      storage,
      now: () => 200,
      requestWebLock: () => Promise.resolve(false),
      broadcast: () => Promise.resolve(true),
    });
    await expect(conflict.acquire()).resolves.toMatchObject({
      writer: false,
      method: "passive",
    });

    storage.setItem(
      SAVE_KEYS.lease,
      JSON.stringify({ tabId: "stale", expiresAtMs: 300 }),
    );
    const recovered = new WriterCoordinator("recovery", {
      storage,
      now: () => 301,
    });
    await expect(recovered.acquire()).resolves.toMatchObject({
      writer: true,
      method: "lease",
      diagnostic: "Expired lease recovered",
    });
  });

  it("resolves simultaneous BroadcastChannel claims to one deterministic writer", async () => {
    type OwnershipMessage = {
      type: "claim" | "release" | "conflict";
      tabId: string;
      expiresAtMs: number;
      targetTabId?: string;
    };
    const listeners = new Set<
      (event: MessageEvent<OwnershipMessage>) => void
    >();
    const createChannel = () => ({
      postMessage(message: OwnershipMessage) {
        for (const listener of listeners)
          listener({ data: message } as MessageEvent<OwnershipMessage>);
      },
      addEventListener(
        _type: "message",
        listener: (event: MessageEvent<OwnershipMessage>) => void,
      ) {
        listeners.add(listener);
      },
      removeEventListener(
        _type: "message",
        listener: (event: MessageEvent<OwnershipMessage>) => void,
      ) {
        listeners.delete(listener);
      },
      close() {},
    });
    const storage = new MemoryStorage();
    const environment = {
      createChannel,
      setTimer: (callback: () => void) => setTimeout(callback, 0),
      clearTimer: (handle: unknown) => clearTimeout(handle as number),
    };
    const firstAdapter = createBrowserOwnershipAdapter(
      "tab-a",
      storage,
      () => 100,
      environment,
    );
    const secondAdapter = createBrowserOwnershipAdapter(
      "tab-b",
      storage,
      () => 100,
      environment,
    );
    const [first, second] = await Promise.all([
      new WriterCoordinator("tab-a", firstAdapter.services).acquire(),
      new WriterCoordinator("tab-b", secondAdapter.services).acquire(),
    ]);
    expect(first).toMatchObject({ writer: true, method: "broadcast-lease" });
    expect(second).toMatchObject({ writer: false, method: "passive" });
    firstAdapter.close();
    secondAdapter.close();
  });

  it("recovers safely from malformed lease data", async () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEYS.lease, "{broken");
    const coordinator = new WriterCoordinator("a", { storage, now: () => 100 });
    await expect(coordinator.acquire()).resolves.toMatchObject({
      writer: true,
      method: "lease",
    });
    expect(coordinator.renew()).toBe(true);
    coordinator.release();
    expect(storage.getItem(SAVE_KEYS.lease)).toBeNull();
  });

  it("debounces accepted-command saves with a hard maximum delay", async () => {
    let now = 0;
    let callback: (() => void) | null = null;
    let delay = -1;
    let saves = 0;
    const scheduler = new SaveScheduler(
      {
        now: () => now,
        setTimer: (next, nextDelay) => {
          callback = next;
          delay = nextDelay;
          return next;
        },
        clearTimer: () => undefined,
      },
      () => {
        saves += 1;
      },
    );
    scheduler.markAcceptedCommand();
    expect(delay).toBe(1_000);
    now = 9_500;
    scheduler.markAcceptedCommand();
    expect(delay).toBe(500);
    expect(callback).not.toBeNull();
    callback!();
    await Promise.resolve();
    expect(saves).toBe(1);
    expect(scheduler.isDirty()).toBe(false);
  });

  it("keeps commands dirty when they arrive during an in-flight save", async () => {
    let release: (() => void) | null = null;
    let callback: (() => void) | null = null;
    let saves = 0;
    const scheduler = new SaveScheduler(
      {
        now: () => 0,
        setTimer: (next) => {
          callback = next;
          return next;
        },
        clearTimer: () => undefined,
      },
      async () => {
        saves += 1;
        if (saves === 1)
          await new Promise<void>((resolve) => {
            release = resolve;
          });
      },
    );
    scheduler.markAcceptedCommand();
    const first = scheduler.flush();
    await Promise.resolve();
    scheduler.markAcceptedCommand();
    release!();
    await first;
    expect(scheduler.isDirty()).toBe(true);
    callback!();
    await Promise.resolve();
    await Promise.resolve();
    expect(saves).toBe(2);
    expect(scheduler.isDirty()).toBe(false);
  });

  it("checkpoints on hidden visibility and pagehide", () => {
    const listeners = new Map<string, () => void>();
    const target: LifecycleTarget = {
      visibilityState: "visible",
      addEventListener: (type, listener) => listeners.set(type, listener),
      removeEventListener: (type) => listeners.delete(type),
    };
    let checkpoints = 0;
    const unregister = registerPersistenceCheckpoints(target, () => {
      checkpoints += 1;
    });
    listeners.get("visibilitychange")!();
    target.visibilityState = "hidden";
    listeners.get("visibilitychange")!();
    listeners.get("pagehide")!();
    expect(checkpoints).toBe(2);
    unregister();
    expect(listeners.size).toBe(0);
  });
});
