import { BUILDING_DEFINITIONS } from "../data/buildings.js";
import { CHAPTER_DEFINITIONS } from "../data/chapters.js";
import { UPGRADE_DEFINITIONS } from "../data/upgrades.js";

export function isBuildingUnlocked(state, buildingId) {
  return isUnlocked(state, BUILDING_DEFINITIONS[buildingId]?.unlock);
}

export function isUpgradeUnlocked(state, upgradeId) {
  return isUnlocked(state, UPGRADE_DEFINITIONS[upgradeId]?.unlock);
}

export function getUnlockText(unlock) {
  if (!unlock) {
    return "";
  }

  if (unlock.type === "buildingOwned") {
    const buildingName = BUILDING_DEFINITIONS[unlock.buildingId]?.name ?? "required building";
    return `Unlocks after owning ${unlock.amount} ${buildingName}.`;
  }

  if (unlock.type === "understandingReached") {
    return `Unlocks after reaching ${unlock.amount} Understanding.`;
  }

  if (unlock.type === "upgradePurchased") {
    const upgradeName = UPGRADE_DEFINITIONS[unlock.upgradeId]?.name ?? "required concept";
    return `Unlocks after studying ${upgradeName}.`;
  }

  if (unlock.type === "chapterUnlocked") {
    const chapterName =
      CHAPTER_DEFINITIONS.find((chapter) => chapter.id === unlock.chapterId)?.name ??
      "required chapter";
    return `Unlocks in ${chapterName}.`;
  }

  return "Locked.";
}

export function getUpcomingUnlocks(state) {
  return [
    ...getLockedBuildings(state),
    ...getLockedUpgrades(state),
    ...getLockedChapters(state),
  ].filter((unlock) => unlock.amount > 0);
}

export function getUnlockedContent(state) {
  return [
    ...getUnlockedBuildings(state),
    ...getUnlockedUpgrades(state),
    ...getUnlockedChapters(state),
  ];
}

function isUnlocked(state, unlock) {
  if (!unlock) {
    return true;
  }

  if (unlock.type === "buildingOwned") {
    return (state.buildings[unlock.buildingId]?.owned ?? 0) >= unlock.amount;
  }

  if (unlock.type === "understandingReached") {
    return getHighestUnderstanding(state) >= unlock.amount;
  }

  if (unlock.type === "upgradePurchased") {
    return state.upgrades[unlock.upgradeId]?.purchased ?? false;
  }

  if (unlock.type === "chapterUnlocked") {
    const chapter = CHAPTER_DEFINITIONS.find((definition) => definition.id === unlock.chapterId);
    return chapter ? isUnlocked(state, chapter.unlock) : false;
  }

  return false;
}

function getLockedBuildings(state) {
  return Object.entries(BUILDING_DEFINITIONS)
    .filter(([buildingId]) => !isBuildingUnlocked(state, buildingId))
    .map(([buildingId, buildingDefinition]) => {
      return {
        category: "Building",
        name: buildingDefinition.name,
        description: getUnlockText(buildingDefinition.unlock),
        ...getUnlockProgress(state, buildingDefinition.unlock),
      };
    })
    .slice(0, 1);
}

function getLockedUpgrades(state) {
  return Object.entries(UPGRADE_DEFINITIONS)
    .filter(([upgradeId]) => !state.upgrades[upgradeId]?.purchased)
    .filter(([upgradeId]) => !isUpgradeUnlocked(state, upgradeId))
    .map(([upgradeId, upgradeDefinition]) => {
      return {
        category: "Research",
        name: upgradeDefinition.name,
        description: getUnlockText(upgradeDefinition.unlock),
        ...getUnlockProgress(state, upgradeDefinition.unlock),
      };
    });
}

function getLockedChapters(state) {
  return CHAPTER_DEFINITIONS.filter((chapter) => chapter.implemented)
    .filter((chapter) => !isUnlocked(state, chapter.unlock))
    .map((chapter) => {
      return {
        category: "Chapter",
        name: chapter.name,
        description: getUnlockText(chapter.unlock),
        ...getUnlockProgress(state, chapter.unlock),
      };
    });
}

function getUnlockedBuildings(state) {
  return Object.entries(BUILDING_DEFINITIONS)
    .filter(([, buildingDefinition]) => buildingDefinition.unlock)
    .filter(([buildingId]) => isBuildingUnlocked(state, buildingId))
    .map(([buildingId, buildingDefinition]) => ({
      id: `building:${buildingId}`,
      name: buildingDefinition.name,
      category: "Building",
    }));
}

function getUnlockedUpgrades(state) {
  return Object.entries(UPGRADE_DEFINITIONS)
    .filter(([, upgradeDefinition]) => upgradeDefinition.unlock)
    .filter(
      ([upgradeId]) => isUpgradeUnlocked(state, upgradeId) || state.upgrades[upgradeId]?.purchased,
    )
    .map(([upgradeId, upgradeDefinition]) => ({
      id: `upgrade:${upgradeId}`,
      name: upgradeDefinition.name,
      category: "Research",
    }));
}

function getUnlockedChapters(state) {
  return CHAPTER_DEFINITIONS.filter((chapter) => chapter.implemented)
    .filter((chapter) => chapter.unlock.amount > 0)
    .filter((chapter) => isUnlocked(state, chapter.unlock))
    .map((chapter) => ({
      id: `chapter:${chapter.id}`,
      name: chapter.name,
      category: "Chapter",
    }));
}

function getUnlockProgress(state, unlock) {
  if (unlock.type === "buildingOwned") {
    return {
      current: state.buildings[unlock.buildingId]?.owned ?? 0,
      amount: unlock.amount,
    };
  }

  if (unlock.type === "understandingReached") {
    return {
      current: getHighestUnderstanding(state),
      amount: unlock.amount,
    };
  }

  if (unlock.type === "upgradePurchased") {
    return {
      current: state.upgrades[unlock.upgradeId]?.purchased ? 1 : 0,
      amount: 1,
    };
  }

  if (unlock.type === "chapterUnlocked") {
    const chapter = CHAPTER_DEFINITIONS.find((definition) => definition.id === unlock.chapterId);
    return chapter ? getUnlockProgress(state, chapter.unlock) : { current: 0, amount: 1 };
  }

  return {
    current: 0,
    amount: 1,
  };
}

function getHighestUnderstanding(state) {
  return state.progression?.highestUnderstanding ?? state.resources.understanding;
}
