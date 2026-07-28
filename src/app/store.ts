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
import { importantEventMessage } from "../ui/notifications";
import { selectCurrentObjective, type AppView } from "../ui/view-models";
import type { ProjectId } from "../shared/contracts";

export interface StoreSnapshot {
  state: GameState;
  events: GameEvent[];
  lastResult: CommandResult | null;
  statusMessage: string;
  exportText: string;
  saveState: "saved" | "dirty" | "saving" | "error";
  lastSavedAtMs: number | null;
  generation: number;
  writer: boolean;
  legacyFound: boolean;
  recoverySource: string | null;
  recoveryPreview: RecoveryPreview | null;
  importPreview: {
    generation: number;
    savedAtMs: number;
    contentVersion: string;
  } | null;
  offlineSummary: OfflineSummary | null;
}

export interface RecoveryPreview {
  source: string;
  generation: number;
  savedAtMs: number;
  contentVersion: string;
}

export interface OfflineSummary {
  elapsedMs: number;
  creditedMs: number;
  discardedMs: number;
  fullEfficiencyMs: number;
  tailEfficiencyCreditedMs: number;
  resourceChanges: Record<string, number>;
  insightChange: number;
  acquiredArtifactIds: string[];
  completedProjectIds: string[];
  reachedMilestoneIds: string[];
  recordedAchievementIds: string[];
  stoppedForDecision: boolean;
  stopReason: string | null;
  policyTrace: string[];
  automationTrace: string[];
  reserves: Record<string, number>;
  targetView: AppView;
  targetProjectId: ProjectId | null;
}

export interface AppStore {
  getSnapshot(): StoreSnapshot;
  subscribe(listener: () => void): () => void;
  dispatch(command: GameCommand): CommandResult;
  save(): Promise<void>;
  load(): void;
  confirmRecovery(): void;
  export(): void;
  exportLegacy(): string | null;
  previewImport(text: string): SaveValidationResult;
  import(text: string): SaveValidationResult;
  dismissOfflineSummary(): void;
  initialize(): Promise<void>;
}

export function summarizeOffline(
  before: GameState,
  after: GameState,
  elapsedMs: number,
  creditedMs: number,
  discardedMs: number,
  policyTrace: string[],
): OfflineSummary {
  const fullWindow =
    naturalNumbersContent.configuration.offline.fullEfficiencyHours * 3_600_000;
  const objective = selectCurrentObjective(after);
  const fullEfficiencyMs = Math.min(elapsedMs, creditedMs, fullWindow);
  return {
    elapsedMs,
    creditedMs,
    discardedMs,
    fullEfficiencyMs,
    tailEfficiencyCreditedMs: Math.max(0, creditedMs - fullEfficiencyMs),
    resourceChanges: Object.fromEntries(
      Object.keys(after.resources).map((id) => [
        id,
        (after.resources[id] ?? 0) - (before.resources[id] ?? 0),
      ]),
    ),
    insightChange: after.insight - before.insight,
    acquiredArtifactIds: after.ownedArtifacts.filter(
      (id) => !before.ownedArtifacts.includes(id),
    ),
    completedProjectIds: Object.values(after.projects)
      .filter(
        (project) =>
          project.status === "completed" &&
          before.projects[project.id]?.status !== "completed",
      )
      .map((project) => project.id),
    reachedMilestoneIds: after.reachedMilestones.filter(
      (id) => !before.reachedMilestones.includes(id),
    ),
    recordedAchievementIds: after.recordedAchievements.filter(
      (id) => !before.recordedAchievements.includes(id),
    ),
    stoppedForDecision: after.diagnostics.unresolvedDecision !== null,
    stopReason: after.diagnostics.unresolvedDecision,
    policyTrace,
    automationTrace: after.automationTrace
      .slice(before.automationTrace.length)
      .map((entry) => `${entry.action}: ${entry.result} (${entry.stopReason})`),
    reserves: Object.fromEntries(
      Object.entries(after.resourceReserves).map(([id, amount]) => [
        id,
        amount,
      ]),
    ),
    targetView: objective.targetView,
    targetProjectId: objective.projectId,
  };
}

export function createAppStore(
  seed = 12_345,
  initialState?: GameState,
  standaloneWriter = false,
): AppStore {
  let snapshot: StoreSnapshot = {
    state: initialState
      ? structuredClone(initialState)
      : createInitialState(naturalNumbersContent, seed),
    events: [],
    lastResult: null,
    statusMessage: "Ready. Your plan advances with time.",
    exportText: "",
    saveState: "saved",
    lastSavedAtMs: null,
    generation: 0,
    writer: standaloneWriter,
    legacyFound: false,
    recoverySource: null,
    recoveryPreview: null,
    importPreview: null,
    offlineSummary: null,
  };
  let generation = 0;
  let indexedDbHistory: IndexedDbHistory | null = null;
  let indexedDbCandidates: string[] = [];
  let pendingRecovery: Extract<
    ReturnType<typeof loadBestSave>,
    { status: "LOADED" }
  > | null = null;
  let writer = standaloneWriter;
  const sessionId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${seed}`;
  let simulationTimer: number | null = null;
  let hiddenAtMs: number | null = null;
  let lastMonotonicMs =
    typeof performance === "undefined" ? 0 : performance.now();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const update = (patch: Partial<StoreSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    notify();
  };

  const persist = async (): Promise<void> => {
    if (!writer) return;
    update({ saveState: "saving" });
    const saveEnvelope = createSaveEnvelope(snapshot.state, {
      generation: generation + 1,
      savedAtMs: Date.now(),
      sessionId,
      buildId: "phase-2",
    });
    try {
      const result = await saveWithRotation(
        localStorage,
        saveEnvelope,
        naturalNumbersContent,
        indexedDbHistory ?? undefined,
      );
      generation = result.generation;
      update({
        statusMessage: result.message,
        saveState: "saved",
        lastSavedAtMs: saveEnvelope.savedAtMs,
        generation,
      });
    } catch (error) {
      update({
        statusMessage: `SAVE_FAILED: ${error instanceof Error ? error.message : "Unknown save error"}`,
        saveState: "error",
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
      const importantMessage = importantEventMessage(result.events);
      update({
        state: result.state,
        events: [...snapshot.events, ...result.events].slice(-100),
        lastResult: result,
        statusMessage:
          importantMessage ??
          (command.type === "advanceTime"
            ? snapshot.statusMessage
            : `${command.type} accepted.`),
        saveState: "dirty",
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
        true,
      );
      const before = state;
      state = advanced.state;
      offlineMessage = ` Offline progress reconciled${advanced.stoppedForDecision ? " and stopped at a decision" : ""}.`;
      update({
        offlineSummary: summarizeOffline(
          before,
          state,
          elapsed.rawElapsedMs,
          advanced.creditedMs,
          advanced.discardedMs,
          advanced.policyTrace,
        ),
      });
    }
    if (elapsed.anomaly !== "NONE") state.records.clockAnomalies += 1;
    update({
      state,
      statusMessage: `Loaded generation ${generation} from ${result.source}.${offlineMessage}`,
      generation,
      lastSavedAtMs: result.envelope.savedAtMs,
      saveState: "saved",
      recoverySource: result.source,
      recoveryPreview: null,
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
      const result = loadBestSave(
        localStorage,
        naturalNumbersContent,
        indexedDbCandidates,
      );
      if (result.status === "LOADED") {
        pendingRecovery = result;
        update({
          recoveryPreview: {
            source: result.source,
            generation: result.envelope.generation,
            savedAtMs: result.envelope.savedAtMs,
            contentVersion: result.envelope.contentVersion,
          },
          statusMessage: `Recovery candidate found: generation ${result.envelope.generation} from ${result.source}. Review before replacing the current game.`,
        });
      } else if (result.status === "LEGACY_V1_FOUND")
        update({
          statusMessage: "LEGACY_V1_FOUND: legacy data remains untouched.",
          legacyFound: true,
        });
      else
        update({
          statusMessage: "No valid v2 save found; current new state retained.",
        });
    },
    confirmRecovery() {
      if (!pendingRecovery) {
        update({
          statusMessage: "No validated recovery candidate is pending.",
        });
        return;
      }
      applyLoaded(pendingRecovery);
      pendingRecovery = null;
    },
    export() {
      const text = exportSave(
        createSaveEnvelope(snapshot.state, {
          generation: generation + 1,
          savedAtMs: Date.now(),
          sessionId,
          buildId: "phase-2",
        }),
      );
      update({
        exportText: text,
        statusMessage: "Export prepared as inert JSON text.",
      });
    },
    exportLegacy() {
      const legacy = localStorage.getItem("mathIdleSave");
      if (legacy === null) {
        update({ statusMessage: "No legacy v1 save was found." });
        return null;
      }
      update({
        statusMessage:
          "Legacy v1 save copied as read-only text. It was not changed or converted.",
      });
      return legacy;
    },
    previewImport(text) {
      const result = previewImport(text, naturalNumbersContent);
      update({
        statusMessage: result.valid
          ? `Import validated: generation ${result.envelope.generation}, content ${result.envelope.contentVersion}. Confirm to replace the current game.`
          : `${result.code}: ${result.message}`,
        importPreview: result.valid ? (result.preview ?? null) : null,
      });
      return result;
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
            sessionId,
            buildId: "phase-2",
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
            generation,
            lastSavedAtMs: imported.savedAtMs,
            saveState: "saved",
            recoverySource: "import",
            importPreview: null,
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
    dismissOfflineSummary() {
      update({ offlineSummary: null });
    },
    async initialize() {
      try {
        const database = await openPersistenceDatabase(indexedDB);
        indexedDbHistory = new IndexedDbHistory(database);
        indexedDbCandidates = await indexedDbHistory.listSaveTexts();
      } catch {
        indexedDbHistory = null;
        indexedDbCandidates = [];
      }
      const tabId = sessionId;
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
      ownershipAdapter.setWriter(false);
      let ownershipRefreshInFlight = false;
      const renewal = window.setInterval(() => {
        if (ownershipRefreshInFlight) return;
        if (writer) {
          if (!coordinator.renew()) {
            writer = false;
            ownershipAdapter.setWriter(false);
            update({
              statusMessage: "Writer ownership was lost; tab is passive.",
              writer: false,
            });
          }
          return;
        }
        ownershipRefreshInFlight = true;
        void coordinator
          .acquire()
          .then(async (takeover) => {
            if (!takeover.writer) return;
            const latestIndexed = indexedDbHistory
              ? await indexedDbHistory.listSaveTexts().catch(() => [])
              : [];
            indexedDbCandidates = latestIndexed;
            const latest = loadBestSave(
              localStorage,
              naturalNumbersContent,
              latestIndexed,
            );
            if (latest.status === "LOADED") applyLoaded(latest);
            writer = true;
            ownershipAdapter.setWriter(true);
            update({
              writer: true,
              statusMessage: `${takeover.diagnostic}. Latest validated save reloaded before writer activation.`,
            });
          })
          .finally(() => {
            ownershipRefreshInFlight = false;
          });
      }, 5_000);
      window.addEventListener(
        "pagehide",
        () => {
          window.clearInterval(renewal);
          if (simulationTimer !== null) window.clearInterval(simulationTimer);
          coordinator.release();
          ownershipAdapter.close();
        },
        { once: true },
      );
      const result = loadBestSave(
        localStorage,
        naturalNumbersContent,
        indexedDbCandidates,
      );
      if (result.status === "LOADED") applyLoaded(result);
      else if (result.status === "LEGACY_V1_FOUND")
        update({
          statusMessage: "LEGACY_V1_FOUND: legacy data remains untouched.",
          legacyFound: true,
        });
      else update({ statusMessage: ownership.diagnostic });
      writer = ownership.writer;
      ownershipAdapter.setWriter(writer);
      update({ writer });

      const advanceVisibleTime = () => {
        if (!writer || document.visibilityState === "hidden") return;
        const now = performance.now();
        const durationMs = Math.min(1_000, Math.max(0, now - lastMonotonicMs));
        lastMonotonicMs = now;
        if (durationMs < 1) return;
        dispatch({
          type: "advanceTime",
          payload: { durationMs, offline: false, safePolicy: false },
        });
      };
      simulationTimer = window.setInterval(advanceVisibleTime, 250);

      const onVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          hiddenAtMs = Date.now();
          void saveScheduler.flush().catch(() => undefined);
          return;
        }
        lastMonotonicMs = performance.now();
        if (hiddenAtMs === null || !writer) return;
        const wallDurationMs = Math.max(0, Date.now() - hiddenAtMs);
        hiddenAtMs = null;
        if (wallDurationMs < 1_000) return;
        const before = snapshot.state;
        const advanced = advanceOffline(
          before,
          naturalNumbersContent,
          wallDurationMs,
          true,
        );
        update({
          state: advanced.state,
          saveState: "dirty",
          offlineSummary: summarizeOffline(
            before,
            advanced.state,
            wallDurationMs,
            advanced.creditedMs,
            advanced.discardedMs,
            advanced.policyTrace,
          ),
          statusMessage: advanced.stoppedForDecision
            ? "Return progress stopped at a decision."
            : "Return progress applied from your saved plan.",
        });
        saveScheduler.markAcceptedCommand();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener(
        "pagehide",
        () =>
          document.removeEventListener("visibilitychange", onVisibilityChange),
        { once: true },
      );
    },
  };
}
