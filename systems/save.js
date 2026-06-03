import { addUnderstanding, createInitialState, recalculateStats } from "./economy.js";
import { BUILDING_DEFINITIONS } from "../data/buildings.js";

const SAVE_KEY = "mathIdleSave";
const CURRENT_SAVE_VERSION = 5;

export function saveGame(state) {
  state.save.version = CURRENT_SAVE_VERSION;
  state.save.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame(currentState) {
  const savedText = localStorage.getItem(SAVE_KEY);

  if (!savedText) {
    return {
      loaded: false,
      state: currentState,
      offlineUnderstanding: 0,
    };
  }

  try {
    const savedState = JSON.parse(savedText);
    const migratedState = migrateSave(savedState);
    const state = mergeWithDefaults(migratedState);
    const offlineUnderstanding = applyOfflineProgress(state);
    recalculateStats(state);

    return {
      loaded: true,
      state,
      offlineUnderstanding,
    };
  } catch (error) {
    console.warn("Save could not be loaded.", error);
    return {
      loaded: false,
      state: currentState,
      offlineUnderstanding: 0,
    };
  }
}

function mergeWithDefaults(savedState) {
  const defaultState = createInitialState();

  return {
    ...defaultState,
    ...savedState,
    resources: {
      ...defaultState.resources,
      ...savedState.resources,
    },
    buildings: {
      ...mergeBuildingProgress(defaultState.buildings, savedState.buildings),
    },
    upgrades: {
      ...mergeUpgradeProgress(defaultState.upgrades, savedState.upgrades),
    },
    achievements: {
      ...mergeAchievementProgress(defaultState.achievements, savedState.achievements),
    },
    progression: {
      ...defaultState.progression,
      highestUnderstanding: getHighestUnderstanding(savedState),
      totalUnderstandingEarned:
        savedState.progression?.totalUnderstandingEarned ??
        getHighestUnderstanding(savedState),
      supremumUnderstandingPerSecond:
        savedState.progression?.supremumUnderstandingPerSecond ??
        defaultState.progression.supremumUnderstandingPerSecond,
      lastOfflineUnderstanding:
        savedState.progression?.lastOfflineUnderstanding ??
        defaultState.progression.lastOfflineUnderstanding,
      completedChapters: {
        ...defaultState.progression.completedChapters,
        ...savedState.progression?.completedChapters,
      },
      milestones: {
        ...defaultState.progression.milestones,
        ...savedState.progression?.milestones,
      },
    },
    prestige: {
      scientificRevolutions:
        savedState.prestige?.scientificRevolutions ??
        defaultState.prestige.scientificRevolutions,
      understandingMultiplier:
        savedState.prestige?.understandingMultiplier ??
        savedState.prestige?.knowledgeMultiplier ??
        defaultState.prestige.understandingMultiplier,
    },
    stats: {
      ...defaultState.stats,
    },
    save: {
      version: CURRENT_SAVE_VERSION,
      lastSavedAt: savedState.save?.lastSavedAt ?? defaultState.save.lastSavedAt,
    },
  };
}

function migrateSave(savedState) {
  let migratedState = savedState;
  let savedVersion = migratedState.save?.version ?? 1;

  if (savedVersion < 2) {
    migratedState = migrateToVersion2(migratedState);
    savedVersion = 2;
  }

  if (savedVersion < 3) {
    migratedState = migrateToVersion3(migratedState);
    savedVersion = 3;
  }

  if (savedVersion < 4) {
    migratedState = migrateToVersion4(migratedState);
    savedVersion = 4;
  }

  if (savedVersion < 5) {
    migratedState = migrateToVersion5(migratedState);
  }

  return migratedState;
}

function migrateToVersion5(savedState) {
  return {
    ...savedState,
    buildings: distributeLegacyParentCounts(savedState.buildings ?? {}),
    save: {
      ...savedState.save,
      version: 5,
    },
  };
}

function distributeLegacyParentCounts(savedBuildings) {
  const distributedBuildings = {
    ...savedBuildings,
  };

  for (const group of getBuildingGroups()) {
    const defaultId = group[0];
    const defaultOwned = savedBuildings[defaultId]?.owned ?? 0;
    const siblingOwned = group
      .slice(1)
      .reduce((total, buildingId) => total + (savedBuildings[buildingId]?.owned ?? 0), 0);

    if (defaultOwned <= 1 || siblingOwned > 0) {
      continue;
    }

    const distributedCounts = distributeCount(defaultOwned, group.length);

    for (const [index, buildingId] of group.entries()) {
      distributedBuildings[buildingId] = {
        owned: distributedCounts[index],
      };
    }
  }

  return distributedBuildings;
}

function distributeCount(totalCount, groupSize) {
  const weights = [0.4, 0.25, 0.2, 0.15].slice(0, groupSize);
  const distributedCounts = weights.map((weight) => Math.floor(totalCount * weight));
  let remainingCount = totalCount - distributedCounts.reduce((total, count) => total + count, 0);
  let index = 0;

  while (remainingCount > 0) {
    distributedCounts[index % distributedCounts.length] += 1;
    remainingCount -= 1;
    index += 1;
  }

  return distributedCounts;
}

function getBuildingGroups() {
  const groups = new Map();

  for (const [buildingId, definition] of Object.entries(BUILDING_DEFINITIONS)) {
    const parentTier = definition.parentTier ?? buildingId;
    const group = groups.get(parentTier) ?? [];
    group.push(buildingId);
    groups.set(parentTier, group);
  }

  return [...groups.values()];
}

function migrateToVersion4(savedState) {
  return {
    ...savedState,
    buildings: {
      definitions: {
        owned: savedState.buildings?.definitions?.owned ?? savedState.buildings?.school?.owned ?? 0,
      },
      examples: {
        owned: savedState.buildings?.examples?.owned ?? savedState.buildings?.library?.owned ?? 0,
      },
      exercises: {
        owned: savedState.buildings?.exercises?.owned ?? savedState.buildings?.academy?.owned ?? 0,
      },
    },
    save: {
      ...savedState.save,
      version: 4,
    },
  };
}

function migrateToVersion2(savedState) {
  return {
    ...savedState,
    buildings: extractBuildingProgress(savedState.buildings),
    upgrades: extractUpgradeProgress(savedState.upgrades),
    progression: {
      ...savedState.progression,
      highestKnowledge: getHighestLegacyKnowledge(savedState),
    },
    stats: {},
    save: {
      ...savedState.save,
      version: 2,
    },
  };
}

function migrateToVersion3(savedState) {
  return {
    ...savedState,
    resources: {
      understanding: savedState.resources?.understanding ?? savedState.resources?.knowledge ?? 10,
    },
    upgrades: migrateLegacyUpgrades(savedState.upgrades),
    achievements: savedState.achievements ?? {},
    prestige: {
      scientificRevolutions: savedState.prestige?.scientificRevolutions ?? 0,
      understandingMultiplier:
        savedState.prestige?.understandingMultiplier ??
        savedState.prestige?.knowledgeMultiplier ??
        1,
    },
    progression: {
      highestUnderstanding: getHighestUnderstanding(savedState),
      completedChapters: {
        ...savedState.progression?.completedChapters,
        ...migrateLegacyCompletedEras(savedState.progression?.completedEras),
      },
    },
    stats: {},
    save: {
      ...savedState.save,
      version: 3,
    },
  };
}

function mergeBuildingProgress(defaultCollection, savedCollection = {}) {
  const mergedCollection = {};

  for (const [contentId, defaultContent] of Object.entries(defaultCollection)) {
    mergedCollection[contentId] = {
      ...defaultContent,
      owned: savedCollection?.[contentId]?.owned ?? defaultContent.owned,
    };
  }

  return mergedCollection;
}

function mergeUpgradeProgress(defaultCollection, savedCollection = {}) {
  const mergedCollection = {};

  for (const [contentId, defaultContent] of Object.entries(defaultCollection)) {
    mergedCollection[contentId] = {
      ...defaultContent,
      purchased: savedCollection?.[contentId]?.purchased ?? defaultContent.purchased,
    };
  }

  return mergedCollection;
}

function mergeAchievementProgress(defaultCollection, savedCollection = {}) {
  const mergedCollection = {};

  for (const [achievementId, defaultAchievement] of Object.entries(defaultCollection)) {
    mergedCollection[achievementId] = {
      ...defaultAchievement,
      ...savedCollection?.[achievementId],
    };
  }

  return mergedCollection;
}

function extractBuildingProgress(savedBuildings = {}) {
  const buildingProgress = {};

  for (const [buildingId, building] of Object.entries(savedBuildings)) {
    buildingProgress[buildingId] = {
      owned: building.owned ?? 0,
    };
  }

  return buildingProgress;
}

function extractUpgradeProgress(savedUpgrades = {}) {
  const upgradeProgress = {};

  for (const [upgradeId, upgrade] of Object.entries(savedUpgrades)) {
    upgradeProgress[upgradeId] = {
      purchased: upgrade.purchased ?? false,
    };
  }

  return upgradeProgress;
}

function migrateLegacyUpgrades(savedUpgrades = {}) {
  return {
    peanoAxioms: {
      purchased: savedUpgrades.peanoAxioms?.purchased ?? savedUpgrades.arithmetic?.purchased ?? false,
    },
    mathematicalInduction: {
      purchased:
        savedUpgrades.mathematicalInduction?.purchased ??
        savedUpgrades.writtenNumerals?.purchased ??
        false,
    },
    divisibility: {
      purchased: savedUpgrades.divisibility?.purchased ?? savedUpgrades.geometry?.purchased ?? false,
    },
    primeNumbers: {
      purchased:
        savedUpgrades.primeNumbers?.purchased ??
        savedUpgrades.scholarlyTraditions?.purchased ??
        false,
    },
  };
}

function migrateLegacyCompletedEras(completedEras = {}) {
  const completedChapters = {};

  if (completedEras.countingAge) {
    completedChapters.naturalNumbers = true;
  }

  if (completedEras.arithmeticAge) {
    completedChapters.integers = true;
  }

  if (completedEras.geometryAge) {
    completedChapters.rationalNumbers = true;
  }

  return completedChapters;
}

function getHighestUnderstanding(savedState) {
  return Math.max(
    savedState.progression?.highestUnderstanding ?? 0,
    savedState.progression?.highestKnowledge ?? 0,
    savedState.stats?.highestKnowledge ?? 0,
    savedState.resources?.understanding ?? 0,
    savedState.resources?.knowledge ?? 0,
    10,
  );
}

function getHighestLegacyKnowledge(savedState) {
  return Math.max(
    savedState.progression?.highestKnowledge ?? 0,
    savedState.stats?.highestKnowledge ?? 0,
    savedState.resources?.knowledge ?? 0,
    10,
  );
}

function applyOfflineProgress(state) {
  recalculateStats(state);

  const now = Date.now();
  const elapsedSeconds = Math.max(0, (now - state.save.lastSavedAt) / 1000);
  const offlineUnderstanding = state.stats.understandingPerSecond * elapsedSeconds;

  addUnderstanding(state, offlineUnderstanding);
  state.progression.lastOfflineUnderstanding = offlineUnderstanding;
  state.save.lastSavedAt = now;

  return offlineUnderstanding;
}
