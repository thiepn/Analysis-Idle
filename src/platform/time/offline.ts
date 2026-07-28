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
  const creditedMs = result.state.logicalTimeMs - state.logicalTimeMs;
  const stopReason = result.state.diagnostics.unresolvedDecision;
  return {
    state: result.state,
    creditedMs,
    discardedMs: credit.discardedMs,
    stoppedForDecision: stopReason !== null,
    policyTrace: [
      stopReason
        ? `Stopped at deterministic boundary: ${stopReason}.`
        : safePolicy
          ? "Validated safe policy authorized routine continuation."
          : "No unresolved decision occurred.",
      `Credited ${creditedMs} of ${credit.creditedMs} available ms.`,
    ],
  };
}
