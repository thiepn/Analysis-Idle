import { addUnderstanding, createInitialState, recalculateStats } from "./economy.js";

const SAVE_KEY = "mathIdleSave";
const CURRENT_SAVE_VERSION = 4;

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
      supremumUnderstandingPerSecond:
        savedState.progression?.supremumUnderstandingPerSecond ??
        defaultState.progression.supremumUnderstandingPerSecond,
      completedChapters: {
        ...defaultState.progression.completedChapters,
        ...savedState.progression?.completedChapters,
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
  }

  return migratedState;
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
  state.save.lastSavedAt = now;

  return offlineUnderstanding;
}
