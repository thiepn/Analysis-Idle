import { naturalNumbersContent } from "../content";
import {
  envelope,
  reduceCommand,
  type CommandResult,
  type GameCommand,
  type GameEvent,
} from "../engine";
import { createInitialState, type GameState } from "../engine/state/game-state";
import {
  createSaveEnvelope,
  exportSave,
  loadBestSave,
  previewImport,
  saveWithRotation,
  promoteLocalSave,
  SaveScheduler,
  SAVE_KEYS,
  type SaveValidationResult,
  IndexedDbHistory,
  openPersistenceDatabase,
} from "../platform/persistence";
import { WriterCoordinator } from "../platform/ownership/coordinator";
import { createBrowserOwnershipAdapter } from "../platform/ownership/browser-services";
import { sanitizeElapsed } from "../platform/time/clock";
import { advanceOffline } from "../platform/time/offline";

export interface StoreSnapshot {
  state: GameState;
  events: GameEvent[];
  lastResult: CommandResult | null;
  statusMessage: string;
  exportText: string;
}

export interface AppStore {
  getSnapshot(): StoreSnapshot;
  subscribe(listener: () => void): () => void;
  dispatch(command: GameCommand): CommandResult;
  save(): Promise<void>;
  load(): void;
  export(): void;
  import(text: string): SaveValidationResult;
  initialize(): Promise<void>;
}

export function createAppStore(seed = 12_345): AppStore {
  let snapshot: StoreSnapshot = {
    state: createInitialState(naturalNumbersContent, seed),
    events: [],
    lastResult: null,
    statusMessage: "Engine ready.",
    exportText: "",
  };
  let generation = 0;
  let indexedDbHistory: IndexedDbHistory | null = null;
  let writer = true;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const update = (patch: Partial<StoreSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    notify();
  };

  const persist = async (): Promise<void> => {
    if (!writer) return;
    const saveEnvelope = createSaveEnvelope(snapshot.state, {
      generation: generation + 1,
      savedAtMs: Date.now(),
      sessionId: "debug-ui",
      buildId: "phase-1",
    });
    try {
      const result = await saveWithRotation(
        localStorage,
        saveEnvelope,
        naturalNumbersContent,
        indexedDbHistory ?? undefined,
      );
      generation = result.generation;
      update({ statusMessage: result.message });
    } catch (error) {
      update({
        statusMessage: `SAVE_FAILED: ${error instanceof Error ? error.message : "Unknown save error"}`,
      });
      throw error;
    }
  };
  const saveScheduler = new SaveScheduler(
    {
      now: () => Date.now(),
      setTimer: (callback, delayMs) => window.setTimeout(callback, delayMs),
      clearTimer: (handle) => window.clearTimeout(handle as number),
    },
    persist,
  );

  const dispatch = (command: GameCommand): CommandResult => {
    if (!writer) {
      const result: CommandResult = {
        accepted: false,
        state: snapshot.state,
        events: [],
        reason: {
          code: "UNSUPPORTED_FUTURE_FEATURE",
          message:
            "This tab is a passive reader while another tab owns the writer lease",
          details: {},
        },
      };
      update({ lastResult: result, statusMessage: result.reason.message });
      return result;
    }
    const result = reduceCommand(
      snapshot.state,
      envelope(command, snapshot.state.sequence + 1, "ui"),
      naturalNumbersContent,
    );
    if (result.accepted) {
      update({
        state: result.state,
        events: [...snapshot.events, ...result.events].slice(-100),
        lastResult: result,
        statusMessage: `${command.type} accepted.`,
      });
      saveScheduler.markAcceptedCommand();
      if (command.type === "publishChapter") void saveScheduler.flush();
    } else {
      update({
        lastResult: result,
        statusMessage: `${result.reason.code}: ${result.reason.message}`,
      });
    }
    return result;
  };

  const applyLoaded = (
    result: Extract<ReturnType<typeof loadBestSave>, { status: "LOADED" }>,
  ) => {
    generation = result.envelope.generation;
    const maximumMs =
      naturalNumbersContent.configuration.offline.maximumCreditedHours *
      3_600_000;
    const elapsed = sanitizeElapsed(
      result.envelope.savedAtMs,
      Date.now(),
      maximumMs,
    );
    let state = result.state;
    let offlineMessage = "";
    if (elapsed.elapsedMs > 0) {
      const advanced = advanceOffline(
        state,
        naturalNumbersContent,
        elapsed.elapsedMs,
        false,
      );
      state = advanced.state;
      offlineMessage = ` Offline credited ${advanced.creditedMs} ms${advanced.stoppedForDecision ? " and stopped at a decision" : ""}.`;
    }
    if (elapsed.anomaly !== "NONE") state.records.clockAnomalies += 1;
    update({
      state,
      statusMessage: `Loaded generation ${generation} from ${result.source}.${offlineMessage}`,
    });
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch,
    async save() {
      try {
        if (saveScheduler.isDirty()) await saveScheduler.flush();
        else await persist();
      } catch {
        // persist already exposes the actionable failure in the status region.
      }
    },
    load() {
      const result = loadBestSave(localStorage, naturalNumbersContent);
      if (result.status === "LOADED") applyLoaded(result);
      else if (result.status === "LEGACY_V1_FOUND")
        update({
          statusMessage: "LEGACY_V1_FOUND: legacy data remains untouched.",
        });
      else
        update({
          statusMessage: "No valid v2 save found; current new state retained.",
        });
    },
    export() {
      const text = exportSave(
        createSaveEnvelope(snapshot.state, {
          generation: generation + 1,
          savedAtMs: Date.now(),
          sessionId: "debug-ui",
          buildId: "phase-1",
        }),
      );
      update({
        exportText: text,
        statusMessage: "Export prepared as inert JSON text.",
      });
    },
    import(text) {
      const result = previewImport(text, naturalNumbersContent);
      if (!writer) {
        const passiveResult: SaveValidationResult = {
          valid: false,
          code: "PASSIVE_READER",
          message:
            "This tab is a passive reader while another tab owns the writer lease",
        };
        update({ statusMessage: passiveResult.message });
        return passiveResult;
      }
      if (result.valid) {
        const previous = localStorage.getItem(SAVE_KEYS.current);
        try {
          const imported = createSaveEnvelope(result.state, {
            generation: Math.max(generation, result.envelope.generation) + 1,
            savedAtMs: Date.now(),
            sessionId: "debug-ui-import",
            buildId: "phase-1",
          });
          promoteLocalSave(localStorage, imported, naturalNumbersContent);
          if (indexedDbHistory)
            void indexedDbHistory.appendSave(imported).catch(() =>
              update({
                statusMessage:
                  "Imported locally; IndexedDB backup append failed.",
              }),
            );
          generation = imported.generation;
          update({
            state: result.state,
            statusMessage: `Imported validated generation ${generation}.`,
          });
        } catch (error) {
          localStorage.removeItem(SAVE_KEYS.staging);
          if (previous !== null)
            localStorage.setItem(SAVE_KEYS.current, previous);
          else localStorage.removeItem(SAVE_KEYS.current);
          update({
            statusMessage: `IMPORT_ROLLED_BACK: ${error instanceof Error ? error.message : "Storage failure"}`,
          });
        }
      } else update({ statusMessage: `${result.code}: ${result.message}` });
      return result;
    },
    async initialize() {
      let candidates: string[] = [];
      try {
        const database = await openPersistenceDatabase(indexedDB);
        indexedDbHistory = new IndexedDbHistory(database);
        candidates = await indexedDbHistory.listSaveTexts();
      } catch {
        indexedDbHistory = null;
      }
      const tabId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `tab-${Date.now()}`;
      const ownershipAdapter = createBrowserOwnershipAdapter(
        tabId,
        localStorage,
        () => Date.now(),
      );
      const coordinator = new WriterCoordinator(
        tabId,
        ownershipAdapter.services,
      );
      const ownership = await coordinator.acquire();
      writer = ownership.writer;
      ownershipAdapter.setWriter(writer);
      let ownershipRefreshInFlight = false;
      const renewal = window.setInterval(() => {
        if (ownershipRefreshInFlight) return;
        if (writer) {
          if (!coordinator.renew()) {
            writer = false;
            ownershipAdapter.setWriter(false);
            update({
              statusMessage: "Writer ownership was lost; tab is passive.",
            });
          }
          return;
        }
        ownershipRefreshInFlight = true;
        void coordinator
          .acquire()
          .then((takeover) => {
            writer = takeover.writer;
            ownershipAdapter.setWriter(writer);
            if (writer) update({ statusMessage: takeover.diagnostic });
          })
          .finally(() => {
            ownershipRefreshInFlight = false;
          });
      }, 5_000);
      window.addEventListener(
        "pagehide",
        () => {
          window.clearInterval(renewal);
          coordinator.release();
          ownershipAdapter.close();
        },
        { once: true },
      );
      const result = loadBestSave(
        localStorage,
        naturalNumbersContent,
        candidates,
      );
      if (result.status === "LOADED") applyLoaded(result);
      else if (result.status === "LEGACY_V1_FOUND")
        update({
          statusMessage: "LEGACY_V1_FOUND: legacy data remains untouched.",
        });
      else update({ statusMessage: ownership.diagnostic });
    },
  };
}
