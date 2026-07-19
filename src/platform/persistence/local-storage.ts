import type { GameContent } from "../../shared/contracts";
import type { GameState } from "../../engine/state/game-state";
import { exportSave, type SaveEnvelope, validateSaveText } from "./envelope";

export const SAVE_KEYS = {
  staging: "analysis-idle:v2:save:staging",
  current: "analysis-idle:v2:save:current",
  backups: [
    "analysis-idle:v2:save:backup:0",
    "analysis-idle:v2:save:backup:1",
    "analysis-idle:v2:save:backup:2",
  ],
  settings: "analysis-idle:v2:settings",
  lease: "analysis-idle:v2:writer-lease",
  legacy: "mathIdleSave",
} as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RotationResult {
  saved: boolean;
  generation: number;
  backupAppendFailed: boolean;
  message: string;
}

export interface BackupAppender {
  appendSave(envelope: SaveEnvelope): Promise<void>;
}

export async function saveWithRotation(
  storage: StorageLike,
  envelope: SaveEnvelope,
  content: GameContent,
  appender?: BackupAppender,
): Promise<RotationResult> {
  const serialized = exportSave(envelope);
  storage.setItem(SAVE_KEYS.staging, serialized);
  const staged = storage.getItem(SAVE_KEYS.staging);
  if (!staged || !validateSaveText(staged, content).valid)
    throw new Error("Staged save failed validation");
  for (let index = SAVE_KEYS.backups.length - 1; index > 0; index -= 1) {
    const previous = storage.getItem(SAVE_KEYS.backups[index - 1]!);
    if (previous !== null) storage.setItem(SAVE_KEYS.backups[index]!, previous);
  }
  const current = storage.getItem(SAVE_KEYS.current);
  if (current !== null) storage.setItem(SAVE_KEYS.backups[0], current);
  storage.setItem(SAVE_KEYS.current, staged);
  const promoted = storage.getItem(SAVE_KEYS.current);
  if (!promoted || !validateSaveText(promoted, content).valid)
    throw new Error("Promoted save failed validation");
  storage.removeItem(SAVE_KEYS.staging);
  let backupAppendFailed = false;
  if (appender) {
    try {
      await appender.appendSave(envelope);
    } catch {
      backupAppendFailed = true;
    }
  }
  return {
    saved: true,
    generation: envelope.generation,
    backupAppendFailed,
    message: backupAppendFailed
      ? "Current save confirmed; IndexedDB backup append failed"
      : "Current save and backup confirmed",
  };
}

export type LoadResult =
  | {
      status: "LOADED";
      state: GameState;
      envelope: SaveEnvelope;
      source: string;
      rejected: { source: string; code: string }[];
    }
  | {
      status: "LEGACY_V1_FOUND";
      rawLegacy: string;
      rejected: { source: string; code: string }[];
    }
  | {
      status: "NEW_STATE_REQUIRED";
      rejected: { source: string; code: string }[];
    };

export function loadBestSave(
  storage: StorageLike,
  content: GameContent,
  indexedDbCandidates: string[] = [],
): LoadResult {
  const candidates = [
    { source: "current", text: storage.getItem(SAVE_KEYS.current), rank: 0 },
    ...SAVE_KEYS.backups.map((key, index) => ({
      source: `fallback-${index}`,
      text: storage.getItem(key),
      rank: index + 1,
    })),
    ...indexedDbCandidates.map((text, index) => ({
      source: `indexeddb-${index}`,
      text,
      rank: 100 + index,
    })),
  ];
  const valid: {
    source: string;
    rank: number;
    result: Extract<ReturnType<typeof validateSaveText>, { valid: true }>;
  }[] = [];
  const rejected: { source: string; code: string }[] = [];
  for (const candidate of candidates) {
    if (candidate.text === null) continue;
    const result = validateSaveText(candidate.text, content);
    if (result.valid)
      valid.push({ source: candidate.source, rank: candidate.rank, result });
    else rejected.push({ source: candidate.source, code: result.code });
  }
  valid.sort(
    (left, right) =>
      right.result.envelope.generation - left.result.envelope.generation ||
      left.rank - right.rank,
  );
  const selected = valid[0];
  if (selected)
    return {
      status: "LOADED",
      state: selected.result.state,
      envelope: selected.result.envelope,
      source: selected.source,
      rejected,
    };
  const legacy = storage.getItem(SAVE_KEYS.legacy);
  if (legacy !== null)
    return { status: "LEGACY_V1_FOUND", rawLegacy: legacy, rejected };
  return { status: "NEW_STATE_REQUIRED", rejected };
}
