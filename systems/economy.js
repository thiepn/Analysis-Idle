import { ACHIEVEMENT_DEFINITIONS } from "../data/achievements.js";
import { BUILDING_DEFINITIONS } from "../data/buildings.js";
import { CHAPTER_DEFINITIONS } from "../data/chapters.js";
import { UPGRADE_DEFINITIONS } from "../data/upgrades.js";

export function createInitialState() {
  const state = {
    resources: {
      understanding: 10,
    },
    buildings: createBuildingState(),
    upgrades: createUpgradeState(),
    achievements: createAchievementState(),
    progression: {
      highestUnderstanding: 10,
      totalUnderstandingEarned: 10,
      supremumUnderstandingPerSecond: 0,
      lastOfflineUnderstanding: 0,
      completedChapters: {},
    },
    prestige: {
      scientificRevolutions: 0,
      understandingMultiplier: 1,
    },
    stats: {
      understandingPerSecond: 0,
    },
    save: {
      version: 4,
      lastSavedAt: Date.now(),
    },
  };

  recalculateStats(state);
  return state;
}

export function addUnderstanding(state, amount) {
  state.resources.understanding += amount;
  state.progression.totalUnderstandingEarned += Math.max(0, amount);
  state.progression.highestUnderstanding = Math.max(
    state.progression.highestUnderstanding,
    state.resources.understanding,
  );
}

export function recalculateStats(state) {
  state.stats.understandingPerSecond = calculateUnderstandingPerSecond(state);
  state.progression.supremumUnderstandingPerSecond = Math.max(
    state.progression.supremumUnderstandingPerSecond ?? 0,
    state.stats.understandingPerSecond,
  );
  state.progression.highestUnderstanding = Math.max(
    state.progression.highestUnderstanding,
    state.resources.understanding,
  );
}

export function getBuildingProduction(state, buildingId) {
  const buildingDefinition = BUILDING_DEFINITIONS[buildingId];

  if (!buildingDefinition) {
    return 0;
  }

  return (
    buildingDefinition.baseProduction *
    getBuildingProductionMultiplier(state, buildingId) *
    getGlobalProductionMultiplier(state) *
    state.prestige.understandingMultiplier
  );
}

export function getBuildingProductionBreakdown(state) {
  return Object.entries(BUILDING_DEFINITIONS).map(([buildingId, buildingDefinition]) => {
    const owned = state.buildings[buildingId]?.owned ?? 0;
    const productionEach = getBuildingProduction(state, buildingId);

    return {
      id: buildingId,
      name: buildingDefinition.name,
      owned,
      productionEach,
      totalProduction: owned * productionEach,
    };
  });
}

export function getBuildingProductionDetails(state, buildingId) {
  const definition = BUILDING_DEFINITIONS[buildingId];
  const count = state.buildings[buildingId]?.owned ?? 0;
  const buildingMultiplier = getBuildingProductionMultiplier(state, buildingId);
  const globalMultiplier = getGlobalProductionMultiplier(state);
  const productionEach = getBuildingProduction(state, buildingId);

  return {
    baseProduction: definition.baseProduction,
    count,
    buildingMultiplier,
    globalMultiplier,
    totalMultiplier: buildingMultiplier * globalMultiplier * state.prestige.understandingMultiplier,
    productionEach,
    totalProduction: count * productionEach,
    boosts: getBuildingBoostDescriptions(state, buildingId),
  };
}

export function getBuildingImpactDescriptions(buildingId) {
  const impacts = [];

  for (const definition of Object.values(BUILDING_DEFINITIONS)) {
    for (const effect of definition.effects ?? []) {
      if (
        effect.type === "buildingSynergyProductionMultiplier" &&
        effect.source === buildingId
      ) {
        const targetName = BUILDING_DEFINITIONS[effect.target]?.name;
        impacts.push(`+${formatPercent(effect.valuePerOwned * 100)}% ${targetName} production`);
      }
    }
  }

  return impacts;
}

function calculateUnderstandingPerSecond(state) {
  return Object.keys(BUILDING_DEFINITIONS).reduce((total, buildingId) => {
    const building = state.buildings[buildingId];
    return total + (building?.owned ?? 0) * getBuildingProduction(state, buildingId);
  }, 0);
}

function getBuildingProductionMultiplier(state, buildingId) {
  const definitionMultiplier = Object.values(BUILDING_DEFINITIONS).reduce(
    (multiplier, sourceDefinition) => {
      return applyBuildingEffects(
        state,
        buildingId,
        multiplier,
        sourceDefinition.effects ?? [],
      );
    },
    1,
  );

  return Object.entries(UPGRADE_DEFINITIONS).reduce(
    (multiplier, [upgradeId, upgradeDefinition]) => {
      if (!state.upgrades[upgradeId]?.purchased) {
        return multiplier;
      }

      return applyBuildingEffects(state, buildingId, multiplier, upgradeDefinition.effects);
    },
    definitionMultiplier,
  ) * getAchievementBuildingProductionMultiplier(state, buildingId);
}

function applyBuildingEffects(state, buildingId, multiplier, effects) {
  return effects.reduce((effectMultiplier, effect) => {
    if (effect.type === "buildingProductionMultiplier" && effect.target === buildingId) {
      return effectMultiplier * effect.value;
    }

    if (effect.type === "buildingSynergyProductionMultiplier" && effect.target === buildingId) {
      const sourceOwned = state.buildings[effect.source]?.owned ?? 0;
      return effectMultiplier * (1 + sourceOwned * effect.valuePerOwned);
    }

    return effectMultiplier;
  }, multiplier);
}

function getBuildingBoostDescriptions(state, buildingId) {
  const boosts = [];

  for (const definition of Object.values(BUILDING_DEFINITIONS)) {
    addBoostDescriptions(state, buildingId, definition.effects ?? [], boosts);
  }

  for (const [upgradeId, definition] of Object.entries(UPGRADE_DEFINITIONS)) {
    if (state.upgrades[upgradeId]?.purchased) {
      addBoostDescriptions(state, buildingId, definition.effects, boosts, definition.name);
    }
  }

  return boosts;
}

function addBoostDescriptions(state, buildingId, effects, boosts, sourceName = "") {
  for (const effect of effects) {
    if (effect.target !== buildingId) {
      continue;
    }

    if (effect.type === "buildingProductionMultiplier") {
      boosts.push(`${sourceName}: x${formatMultiplier(effect.value)}`);
    }

    if (effect.type === "buildingSynergyProductionMultiplier") {
      const sourceDefinition = BUILDING_DEFINITIONS[effect.source];
      const sourceOwned = state.buildings[effect.source]?.owned ?? 0;
      const percent = sourceOwned * effect.valuePerOwned * 100;

      if (percent > 0) {
        boosts.push(`From ${sourceDefinition.name}: +${formatPercent(percent)}%`);
      }
    }
  }
}

function formatMultiplier(value) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
}

function formatPercent(value) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

function getGlobalProductionMultiplier(state) {
  const upgradeMultiplier = Object.entries(UPGRADE_DEFINITIONS).reduce(
    (multiplier, [upgradeId, upgradeDefinition]) => {
      if (!state.upgrades[upgradeId]?.purchased) {
        return multiplier;
      }

      return applyGlobalEffects(multiplier, upgradeDefinition.effects);
    },
    1,
  );

  const chapterMultiplier = CHAPTER_DEFINITIONS.reduce((multiplier, chapterDefinition) => {
    if (!state.progression.completedChapters?.[chapterDefinition.id]) {
      return multiplier;
    }

    return applyGlobalEffects(multiplier, chapterDefinition.goal?.reward?.effects ?? []);
  }, upgradeMultiplier);

  return applyGlobalEffects(chapterMultiplier, getAchievementEffects(state));
}

function applyGlobalEffects(multiplier, effects) {
  return effects.reduce((effectMultiplier, effect) => {
    if (effect.type === "globalProductionMultiplier") {
      return effectMultiplier * effect.value;
    }

    return effectMultiplier;
  }, multiplier);
}

function getAchievementBuildingProductionMultiplier(state, buildingId) {
  return getAchievementEffects(state).reduce((multiplier, effect) => {
    if (effect.type === "buildingProductionMultiplier" && effect.target === buildingId) {
      return multiplier * effect.value;
    }

    return multiplier;
  }, 1);
}

function getAchievementEffects(state) {
  return Object.entries(ACHIEVEMENT_DEFINITIONS).flatMap(
    ([achievementId, achievementDefinition]) => {
      if (!state.achievements[achievementId]?.unlocked) {
        return [];
      }

      return achievementDefinition.reward?.effects ?? [];
    },
  );
}

function createBuildingState() {
  return Object.fromEntries(
    Object.keys(BUILDING_DEFINITIONS).map((buildingId) => [buildingId, { owned: 0 }]),
  );
}

function createUpgradeState() {
  return Object.fromEntries(
    Object.keys(UPGRADE_DEFINITIONS).map((upgradeId) => [upgradeId, { purchased: false }]),
  );
}

function createAchievementState() {
  return Object.fromEntries(
    Object.keys(ACHIEVEMENT_DEFINITIONS).map((achievementId) => [
      achievementId,
      {
        unlocked: false,
        unlockedAt: null,
      },
    ]),
  );
}
