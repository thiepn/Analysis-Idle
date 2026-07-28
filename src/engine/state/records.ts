import type { GameContent } from "../../shared/contracts";
import { evaluateCondition } from "../conditions/evaluate";
import type { GameEvent } from "../events/types";
import type { GameState } from "./game-state";

export function refreshRecords(
  state: GameState,
  content: GameContent,
  events: GameEvent[],
): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const milestone of content.milestones) {
      if (
        !state.reachedMilestones.includes(milestone.id) &&
        evaluateCondition(milestone.condition, state, content).met
      ) {
        state.reachedMilestones.push(milestone.id);
        events.push({ type: "milestoneReached", milestoneId: milestone.id });
        changed = true;
      }
    }
    for (const achievement of content.achievements) {
      if (
        !state.recordedAchievements.includes(achievement.id) &&
        evaluateCondition(achievement.condition, state, content).met
      ) {
        state.recordedAchievements.push(achievement.id);
        events.push({
          type: "achievementRecorded",
          achievementId: achievement.id,
        });
        changed = true;
      }
    }
  }
}
