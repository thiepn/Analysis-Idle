import { ACHIEVEMENT_DEFINITIONS } from "../data/achievements.js";

export function evaluateAchievements(state) {
  const newlyUnlocked = [];

  for (const [achievementId, achievementDefinition] of Object.entries(
    ACHIEVEMENT_DEFINITIONS,
  )) {
    const achievement = state.achievements[achievementId];

    if (achievement.unlocked || !isConditionComplete(state, achievementDefinition.condition)) {
      continue;
    }

    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    newlyUnlocked.push(achievementDefinition);
  }

  return newlyUnlocked;
}

function isConditionComplete(state, condition) {
  if (condition.type === "buildingOwned") {
    return (state.buildings[condition.buildingId]?.owned ?? 0) >= condition.amount;
  }

  if (condition.type === "totalBuildingsOwned") {
    return (
      Object.values(state.buildings).reduce((total, building) => total + building.owned, 0) >=
      condition.amount
    );
  }

  if (condition.type === "understandingReached") {
    return state.progression.highestUnderstanding >= condition.amount;
  }

  if (condition.type === "chapterCompleted") {
    return state.progression.completedChapters?.[condition.chapterId] ?? false;
  }

  if (condition.type === "upgradePurchased") {
    return state.upgrades[condition.upgradeId]?.purchased ?? false;
  }

  if (condition.type === "allUpgradesPurchased") {
    return condition.upgradeIds.every((upgradeId) => state.upgrades[upgradeId]?.purchased);
  }

  if (condition.type === "productionReached") {
    return state.stats.understandingPerSecond >= condition.amount;
  }

  if (condition.type === "prestigeReached") {
    return state.prestige.scientificRevolutions >= condition.amount;
  }

  return false;
}
