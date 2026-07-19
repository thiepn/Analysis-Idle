import type { GameContent } from "../../shared/contracts";
import { envelope } from "../../engine/commands/types";
import { reduceCommand } from "../../engine/reducer/reduce";
import type { GameState } from "../../engine/state/game-state";
import { calculateOfflineCredit } from "../../engine/time/advance";

export interface OfflineAdvanceResult {
  state: GameState;
  creditedMs: number;
  discardedMs: number;
  stoppedForDecision: boolean;
  policyTrace: string[];
}

export function advanceOffline(
  state: GameState,
  content: GameContent,
  wallDurationMs: number,
  safePolicy: boolean,
): OfflineAdvanceResult {
  const credit = calculateOfflineCredit(wallDurationMs, content);
  const unresolved =
    Object.values(state.projects).some(
      (project) => project.status === "active",
    ) &&
    state.completionBehavior === "pause" &&
    !safePolicy;
  if (unresolved)
    return {
      state,
      creditedMs: 0,
      discardedMs: credit.discardedMs,
      stoppedForDecision: true,
      policyTrace: [
        "Stopped before a project-completion choice; no policy was authorized.",
      ],
    };
  const result = reduceCommand(
    state,
    envelope(
      {
        type: "advanceTime",
        payload: { durationMs: wallDurationMs, offline: true, safePolicy },
      },
      state.sequence + 1,
      "offline",
    ),
    content,
  );
  if (!result.accepted) throw new Error(result.reason.message);
  return {
    state: result.state,
    creditedMs: credit.creditedMs,
    discardedMs: credit.discardedMs,
    stoppedForDecision: false,
    policyTrace: [
      safePolicy
        ? "Validated safe policy authorized routine continuation."
        : "No unresolved decision occurred.",
      `Credited ${credit.creditedMs} ms.`,
    ],
  };
}
