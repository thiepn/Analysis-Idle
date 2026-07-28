import { z } from "zod";
import type { GameContent } from "../../shared/contracts";
import {
  deserializeGameNumber,
  gameNumber,
  serializeGameNumber,
} from "../../engine/numbers/game-number";
import { collectInvariantViolations } from "../../engine/state/invariants";
import type { GameState } from "../../engine/state/game-state";
import { corruptionChecksum } from "./checksum";

export const SAVE_FORMAT = "analysis-idle-v2";
export const SAVE_SCHEMA_VERSION = 1;
export const MAX_IMPORT_BYTES = 250 * 1024;

export interface SaveEnvelope {
  format: typeof SAVE_FORMAT;
  schemaVersion: number;
  contentVersion: string;
  buildId: string;
  generation: number;
  savedAtMs: number;
  sessionId: string;
  state: Record<string, unknown>;
  migration: { from: number; to: number; applied: string[] };
  replayMetadata: { lastCommandSequence: number; eventDigest: string | null };
  checksum: string;
}

export type SaveValidationCode =
  | "VALID"
  | "CORRUPT_JSON"
  | "INVALID_SCHEMA"
  | "INVALID_CHECKSUM"
  | "FUTURE_SCHEMA"
  | "INCOMPATIBLE_APP"
  | "INVALID_STATE"
  | "PASSIVE_READER"
  | "OVERSIZED";
export type SaveValidationResult =
  | { valid: true; code: "VALID"; envelope: SaveEnvelope; state: GameState }
  | {
      valid: false;
      code: Exclude<SaveValidationCode, "VALID">;
      message: string;
    };

const envelopeSchema = z.object({
  format: z.string(),
  schemaVersion: z.number().int().nonnegative(),
  contentVersion: z.string().min(1),
  buildId: z.string().min(1),
  generation: z.number().int().nonnegative(),
  savedAtMs: z.number().finite().nonnegative(),
  sessionId: z.string().min(1),
  state: z.record(z.string(), z.unknown()),
  migration: z
    .object({
      from: z.number().int().nonnegative(),
      to: z.number().int().nonnegative(),
      applied: z.array(z.string()),
    })
    .optional(),
  replayMetadata: z
    .object({
      lastCommandSequence: z.number().int().nonnegative(),
      eventDigest: z.string().nullable(),
    })
    .optional(),
  checksum: z.string(),
});

function encodeState(state: GameState): Record<string, unknown> {
  const encoded = structuredClone(state) as unknown as Record<string, unknown>;
  encoded.resources = Object.fromEntries(
    Object.entries(state.resources).map(([key, value]) => [
      key,
      serializeGameNumber(value),
    ]),
  );
  encoded.resourceReserves = Object.fromEntries(
    Object.entries(state.resourceReserves).map(([key, value]) => [
      key,
      serializeGameNumber(value),
    ]),
  );
  encoded.activityProduction = Object.fromEntries(
    Object.entries(state.activityProduction).map(([key, ledger]) => [
      key,
      {
        ...ledger,
        segmentProduced: serializeGameNumber(ledger.segmentProduced),
        ratePerSecond: serializeGameNumber(ledger.ratePerSecond),
      },
    ]),
  );
  encoded.insight = serializeGameNumber(state.insight);
  encoded.insightSpent = serializeGameNumber(state.insightSpent);
  encoded.understanding = serializeGameNumber(state.understanding);
  encoded.projects = Object.fromEntries(
    Object.entries(state.projects).map(([key, project]) => [
      key,
      {
        ...project,
        progress: serializeGameNumber(project.progress),
        progressSegmentStart: serializeGameNumber(project.progressSegmentStart),
        progressRatePerSecond: serializeGameNumber(
          project.progressRatePerSecond,
        ),
        reservedPrecision: serializeGameNumber(project.reservedPrecision),
        reservedIntuition: serializeGameNumber(project.reservedIntuition),
      },
    ]),
  );
  return encoded;
}

function decodeState(encoded: Record<string, unknown>): GameState {
  const decoded = structuredClone(encoded) as unknown as GameState;
  const resources = encoded.resources as Record<string, string>;
  const reserves = encoded.resourceReserves as Record<string, string>;
  decoded.resources = Object.fromEntries(
    Object.entries(resources).map(([key, value]) => [
      key,
      deserializeGameNumber(value),
    ]),
  );
  decoded.resourceReserves = Object.fromEntries(
    Object.entries(reserves).map(([key, value]) => [
      key,
      deserializeGameNumber(value),
    ]),
  );
  decoded.activityProduction = Object.fromEntries(
    Object.entries(
      encoded.activityProduction as Record<string, Record<string, unknown>>,
    ).map(([key, ledger]) => [
      key,
      {
        ...ledger,
        segmentProduced: deserializeGameNumber(
          ledger.segmentProduced as string,
        ),
        ratePerSecond: deserializeGameNumber(ledger.ratePerSecond as string),
      },
    ]),
  ) as GameState["activityProduction"];
  decoded.insight = deserializeGameNumber(encoded.insight as string);
  decoded.insightSpent = deserializeGameNumber(encoded.insightSpent as string);
  decoded.understanding = deserializeGameNumber(
    encoded.understanding as string,
  );
  decoded.techniqueRecords =
    encoded.techniqueRecords && typeof encoded.techniqueRecords === "object"
      ? (encoded.techniqueRecords as GameState["techniqueRecords"])
      : {};
  decoded.projects = Object.fromEntries(
    Object.entries(
      encoded.projects as Record<string, Record<string, unknown>>,
    ).map(([key, project]) => [
      key,
      {
        ...project,
        progress: deserializeGameNumber(project.progress as string),
        progressSegmentElapsedMs:
          typeof project.progressSegmentElapsedMs === "number"
            ? project.progressSegmentElapsedMs
            : 0,
        progressSegmentStart:
          typeof project.progressSegmentStart === "string"
            ? deserializeGameNumber(project.progressSegmentStart)
            : deserializeGameNumber(project.progress as string),
        progressRatePerSecond:
          typeof project.progressRatePerSecond === "string"
            ? deserializeGameNumber(project.progressRatePerSecond)
            : gameNumber(0),
        approachesSeen: Array.isArray(project.approachesSeen)
          ? project.approachesSeen
          : [],
        insightSpentThisRun:
          typeof project.insightSpentThisRun === "boolean"
            ? project.insightSpentThisRun
            : false,
        reservedPrecision: deserializeGameNumber(
          project.reservedPrecision as string,
        ),
        reservedIntuition: deserializeGameNumber(
          project.reservedIntuition as string,
        ),
      },
    ]),
  ) as GameState["projects"];
  decoded.records = {
    ...decoded.records,
    approachComparisons: decoded.records.approachComparisons ?? 0,
    exactDependencyCompletions: decoded.records.exactDependencyCompletions ?? 0,
    projectsCompletedWithoutInsight:
      decoded.records.projectsCompletedWithoutInsight ?? 0,
    offlineQueuedCompletions: decoded.records.offlineQueuedCompletions ?? 0,
    validCapstones: decoded.records.validCapstones ?? 0,
  };
  decoded.settings = {
    reducedMotion: decoded.settings?.reducedMotion ?? false,
    highContrast: decoded.settings?.highContrast ?? false,
    notation: decoded.settings?.notation ?? "plain",
    textScale: decoded.settings?.textScale ?? "standard",
    announcementVerbosity:
      decoded.settings?.announcementVerbosity ?? "essential",
    confirmations: decoded.settings?.confirmations ?? true,
  };
  return decoded;
}

function unsigned(
  envelope: Omit<SaveEnvelope, "checksum"> | SaveEnvelope,
): Omit<SaveEnvelope, "checksum"> {
  const payload: Partial<SaveEnvelope> = { ...envelope };
  delete payload.checksum;
  return payload as Omit<SaveEnvelope, "checksum">;
}

export function createSaveEnvelope(
  state: GameState,
  options: {
    generation: number;
    savedAtMs: number;
    sessionId: string;
    buildId: string;
    eventDigest?: string | null;
  },
): SaveEnvelope {
  const payload: Omit<SaveEnvelope, "checksum"> = {
    format: SAVE_FORMAT,
    schemaVersion: SAVE_SCHEMA_VERSION,
    contentVersion: state.contentVersion,
    buildId: options.buildId,
    generation: options.generation,
    savedAtMs: options.savedAtMs,
    sessionId: options.sessionId,
    state: encodeState(state),
    migration: {
      from: SAVE_SCHEMA_VERSION,
      to: SAVE_SCHEMA_VERSION,
      applied: [],
    },
    replayMetadata: {
      lastCommandSequence: state.sequence,
      eventDigest: options.eventDigest ?? null,
    },
  };
  return { ...payload, checksum: corruptionChecksum(payload) };
}

function migrate(candidate: SaveEnvelope): SaveEnvelope {
  if (candidate.schemaVersion !== 0) return candidate;
  const migratedPayload: Omit<SaveEnvelope, "checksum"> = {
    ...unsigned(candidate),
    schemaVersion: 1,
    migration: { from: 0, to: 1, applied: ["v0-to-v1-envelope-metadata"] },
    replayMetadata: candidate.replayMetadata ?? {
      lastCommandSequence:
        typeof candidate.state.sequence === "number" &&
        Number.isSafeInteger(candidate.state.sequence)
          ? candidate.state.sequence
          : 0,
      eventDigest: null,
    },
  };
  return { ...migratedPayload, checksum: corruptionChecksum(migratedPayload) };
}

export function validateSaveText(
  text: string,
  content: GameContent,
): SaveValidationResult {
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES)
    return {
      valid: false,
      code: "OVERSIZED",
      message: "Save exceeds the import size limit",
    };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return {
      valid: false,
      code: "CORRUPT_JSON",
      message: "Save is not valid JSON",
    };
  }
  const parsed = envelopeSchema.safeParse(value);
  if (!parsed.success)
    return {
      valid: false,
      code: "INVALID_SCHEMA",
      message: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  if (parsed.data.format !== SAVE_FORMAT)
    return {
      valid: false,
      code: "INCOMPATIBLE_APP",
      message: "Save belongs to another application",
    };
  if (parsed.data.schemaVersion > SAVE_SCHEMA_VERSION)
    return {
      valid: false,
      code: "FUTURE_SCHEMA",
      message: "Save was created by a future schema version",
    };
  const candidate = parsed.data as SaveEnvelope;
  if (
    candidate.schemaVersion > 0 &&
    (!candidate.migration || !candidate.replayMetadata)
  )
    return {
      valid: false,
      code: "INVALID_SCHEMA",
      message: "Current save metadata is incomplete",
    };
  if (corruptionChecksum(unsigned(candidate)) !== candidate.checksum)
    return {
      valid: false,
      code: "INVALID_CHECKSUM",
      message: "Save checksum does not match its payload",
    };
  const migrated = migrate(candidate);
  try {
    const state = decodeState(migrated.state);
    const violations = collectInvariantViolations(state, content);
    if (violations.length > 0)
      return {
        valid: false,
        code: "INVALID_STATE",
        message: violations.join("; "),
      };
    return { valid: true, code: "VALID", envelope: migrated, state };
  } catch (error) {
    return {
      valid: false,
      code: "INVALID_STATE",
      message: error instanceof Error ? error.message : "State decoding failed",
    };
  }
}

export const exportSave = (envelope: SaveEnvelope): string =>
  `${JSON.stringify(envelope, null, 2)}\n`;

export function previewImport(
  text: string,
  content: GameContent,
): SaveValidationResult & {
  preview?: { generation: number; savedAtMs: number; contentVersion: string };
} {
  const result = validateSaveText(text, content);
  return result.valid
    ? {
        ...result,
        preview: {
          generation: result.envelope.generation,
          savedAtMs: result.envelope.savedAtMs,
          contentVersion: result.envelope.contentVersion,
        },
      }
    : result;
}
