import type {
  ActivityId,
  ApproachId,
  AutomationCapability,
  ChapterId,
  CompletionBehavior,
  ProjectId,
  ResourceId,
  UpgradeId,
} from "../../shared/contracts";
import type { GameEvent } from "../events/types";
import type { GameState } from "../state/game-state";

export type CommandSource =
  "ui" | "simulator" | "automation" | "offline" | "replay" | "test";

export type GameCommand =
  | {
      type: "advanceTime";
      payload: { durationMs: number; offline: boolean; safePolicy: boolean };
    }
  | {
      type: "setAttention";
      payload: { activityId: ActivityId; allocation: number };
    }
  | { type: "startProject"; payload: { projectId: ProjectId } }
  | { type: "pauseProject"; payload: { projectId: ProjectId } }
  | { type: "cancelProject"; payload: { projectId: ProjectId } }
  | {
      type: "switchProjectApproach";
      payload: { projectId: ProjectId; approachId: ApproachId };
    }
  | { type: "queueProject"; payload: { projectId: ProjectId } }
  | { type: "purchaseUpgrade"; payload: { upgradeId: UpgradeId } }
  | { type: "setCompletionBehavior"; payload: { behavior: CompletionBehavior } }
  | {
      type: "setResourceReserve";
      payload: { resourceId: ResourceId; amount: number };
    }
  | {
      type: "setAutomationPriority";
      payload: { priorities: AutomationCapability[] };
    }
  | { type: "spendInsight"; payload: { amount: number; purpose: string } }
  | {
      type: "assembleCapstoneEdge";
      payload: { chapterId: ChapterId; edgeId: string };
    }
  | { type: "publishChapter"; payload: { chapterId: ChapterId } }
  | {
      type: "changeSetting";
      payload: {
        setting: "reducedMotion" | "highContrast" | "notation";
        value: boolean | string;
      };
    }
  | { type: "saveRequested"; payload: Record<string, never> }
  | { type: "loadRequested"; payload: Record<string, never> }
  | { type: "importRequested"; payload: { data: string } }
  | { type: "exportRequested"; payload: Record<string, never> };

export interface CommandEnvelope<T extends GameCommand = GameCommand> {
  id: string;
  sequence: number;
  logicalTimestampMs: number;
  source: CommandSource;
  correlationId: string | null;
  command: T;
}

export type CommandRejectionCode =
  | "UNKNOWN_COMMAND"
  | "UNKNOWN_ID"
  | "INVALID_AMOUNT"
  | "INSUFFICIENT_RESOURCE"
  | "ATTENTION_CAPACITY_EXCEEDED"
  | "INVALID_PROJECT_STATE"
  | "PREREQUISITE_MISSING"
  | "APPROACH_UNAVAILABLE"
  | "INSIGHT_INSUFFICIENT"
  | "QUEUE_FULL"
  | "PUBLICATION_UNAVAILABLE"
  | "UNSUPPORTED_FUTURE_FEATURE"
  | "INVALID_SETTINGS_VALUE"
  | "STALE_COMMAND_SEQUENCE";

export interface CommandRejection {
  code: CommandRejectionCode;
  message: string;
  details: Record<string, string | number | boolean>;
}

export type CommandResult =
  | { accepted: true; state: GameState; events: GameEvent[] }
  | { accepted: false; state: GameState; reason: CommandRejection; events: [] };

export function envelope<T extends GameCommand>(
  command: T,
  sequence: number,
  source: CommandSource = "test",
): CommandEnvelope<T> {
  return {
    id: `${source}-${sequence}-${command.type}`,
    sequence,
    logicalTimestampMs: sequence,
    source,
    correlationId: null,
    command,
  };
}
