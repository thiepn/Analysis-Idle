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
  SAVE_KEYS,
  type SaveValidationResult,
} from "../platform/persistence";

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
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const update = (patch: Partial<StoreSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    notify();
  };

  const dispatch = (command: GameCommand): CommandResult => {
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
    } else {
      update({
        lastResult: result,
        statusMessage: `${result.reason.code}: ${result.reason.message}`,
      });
    }
    return result;
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch,
    async save() {
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
        );
        generation = result.generation;
        update({ statusMessage: result.message });
      } catch (error) {
        update({
          statusMessage: `SAVE_FAILED: ${error instanceof Error ? error.message : "Unknown save error"}`,
        });
      }
    },
    load() {
      const result = loadBestSave(localStorage, naturalNumbersContent);
      if (result.status === "LOADED") {
        generation = result.envelope.generation;
        update({
          state: result.state,
          statusMessage: `Loaded generation ${generation} from ${result.source}.`,
        });
      } else if (result.status === "LEGACY_V1_FOUND")
        update({
          statusMessage: "LEGACY_V1_FOUND: legacy data remains untouched.",
        });
      else
        update({
          statusMessage: "No valid v2 save found; current new state retained.",
        });
    },
    export() {
      const candidate = localStorage.getItem(SAVE_KEYS.current);
      const text =
        candidate ??
        exportSave(
          createSaveEnvelope(snapshot.state, {
            generation,
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
      if (result.valid) {
        const previous = localStorage.getItem(SAVE_KEYS.current);
        try {
          if (previous !== null)
            localStorage.setItem(SAVE_KEYS.backups[0], previous);
          localStorage.setItem(SAVE_KEYS.current, exportSave(result.envelope));
          generation = result.envelope.generation;
          update({
            state: result.state,
            statusMessage: `Imported validated generation ${generation}.`,
          });
        } catch (error) {
          if (previous !== null)
            localStorage.setItem(SAVE_KEYS.current, previous);
          update({
            statusMessage: `IMPORT_ROLLED_BACK: ${error instanceof Error ? error.message : "Storage failure"}`,
          });
        }
      } else update({ statusMessage: `${result.code}: ${result.message}` });
      return result;
    },
  };
}
