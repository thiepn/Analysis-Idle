import { CHAPTER_DEFINITIONS } from "../data/chapters.js";

export function evaluateMilestones(state) {
  const newlyCompletedMilestones = [];
  state.progression.milestones ??= {};

  for (const chapter of CHAPTER_DEFINITIONS) {
    for (const milestone of chapter.progressMilestones ?? []) {
      const milestoneId = `${chapter.id}:${milestone.id}`;

      if (
        state.progression.milestones?.[milestoneId] ||
        !isConditionComplete(state, milestone.condition)
      ) {
        continue;
      }

      state.progression.milestones[milestoneId] = true;
      newlyCompletedMilestones.push({
        ...milestone,
        chapter,
      });
    }
  }

  return newlyCompletedMilestones;
}

function isConditionComplete(state, condition) {
  if (condition.type === "upgradePurchased") {
    return state.upgrades[condition.upgradeId]?.purchased ?? false;
  }

  if (condition.type === "allUpgradesPurchased") {
    return condition.upgradeIds.every((upgradeId) => state.upgrades[upgradeId]?.purchased);
  }

  if (condition.type === "understandingReached") {
    return state.progression.highestUnderstanding >= condition.amount;
  }

  if (condition.type === "buildingOwned") {
    return (state.buildings[condition.buildingId]?.owned ?? 0) >= condition.amount;
  }

  if (condition.type === "chapterCompleted") {
    return state.progression.completedChapters?.[condition.chapterId] ?? false;
  }

  return false;
}
