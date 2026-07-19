import type { ConditionDefinition, GameContent } from "../../shared/contracts";
import type { GameState } from "../state/game-state";

export interface ConditionEvaluation {
  met: boolean;
  description: string;
  unmet: string[];
}

export function evaluateCondition(
  condition: ConditionDefinition,
  state: GameState,
  content: GameContent,
): ConditionEvaluation {
  const description = condition.text.accessible;
  let met = false;
  let unmet: string[] = [];
  switch (condition.type) {
    case "constant":
      met = condition.value;
      break;
    case "all": {
      const results = condition.conditions.map((child) =>
        evaluateCondition(child, state, content),
      );
      met = results.every((result) => result.met);
      unmet = results.flatMap((result) => result.unmet);
      break;
    }
    case "any": {
      const results = condition.conditions.map((child) =>
        evaluateCondition(child, state, content),
      );
      met = results.some((result) => result.met);
      if (!met) unmet = results.flatMap((result) => result.unmet);
      break;
    }
    case "not":
      met = !evaluateCondition(condition.condition, state, content).met;
      break;
    case "resourceAtLeast":
      met = (state.resources[condition.resourceId] ?? 0) >= condition.amount;
      break;
    case "projectCompleted":
      met = state.projects[condition.projectId]?.status === "completed";
      break;
    case "upgradeOwned":
      met = state.ownedUpgrades.includes(condition.upgradeId);
      break;
    case "milestoneReached":
      met = state.reachedMilestones.includes(condition.milestoneId);
      break;
    case "achievementRecorded":
      met = state.recordedAchievements.includes(condition.achievementId);
      break;
    case "chapterStatus":
      met = state.chapters[condition.chapterId] === condition.status;
      break;
    case "attentionCapacityAtLeast":
      met = state.attention.capacity >= condition.amount;
      break;
    case "techniqueArtifactOwned":
      met = state.ownedArtifacts.includes(condition.artifactId);
      break;
    case "understandingAtLeast":
      met = state.understanding >= condition.amount;
      break;
    case "insightAtLeast":
      met = state.insight >= condition.amount;
      break;
  }
  if (!met && unmet.length === 0) unmet = [description];
  return { met, description, unmet };
}

export function describeCondition(condition: ConditionDefinition): string {
  return condition.text.accessible;
}
