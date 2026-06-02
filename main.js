import { BUILDING_DEFINITIONS } from "./data/buildings.js";
import { UPGRADE_DEFINITIONS } from "./data/upgrades.js";
import { evaluateAchievements } from "./systems/achievements.js";
import { buyBuilding } from "./systems/buildings.js";
import { completeAvailableChapters, getChapterAfter } from "./systems/chapters.js";
import { addUnderstanding, createInitialState, recalculateStats } from "./systems/economy.js";
import { buyUpgrade } from "./systems/upgrades.js";
import { loadGame, saveGame } from "./systems/save.js";
import { getUnlockedContent } from "./systems/unlocks.js";
import { updateUI, bindUIEvents } from "./ui/ui.js";
import {
  showChapterCompletion,
  showMilestoneBanner,
  showNotification,
} from "./ui/notifications.js";

const AUTOSAVE_INTERVAL_MS = 10000;

const game = {
  state: createInitialState(),
  lastFrameTime: performance.now(),
  lastAutosaveTime: performance.now(),
};

const loadResult = loadGame(game.state);
if (loadResult.loaded) {
  game.state = loadResult.state;
  if (loadResult.offlineUnderstanding > 0) {
    showNotification(
      `Offline progress: +${formatWhole(loadResult.offlineUnderstanding)} Understanding`,
    );
  }
  completeAvailableChapters(game.state);
  evaluateAchievements(game.state);
  saveGame(game.state);
}

if (evaluateAchievements(game.state).length > 0) {
  recalculateStats(game.state);
}

let knownUnlockedIds = new Set(getUnlockedContent(game.state).map((content) => content.id));

bindUIEvents({
  onBuyBuilding: (buildingId, quantity) => {
    const purchase = buyBuilding(game.state, buildingId, quantity);

    if (purchase) {
      showNotification(getBuildingPurchaseMessage(buildingId, purchase.quantity));
      announceNewUnlocks();
      announceChapterCompletions();
      announceAchievements();
      updateUI(game.state);
    }
  },
  onBuyUpgrade: (upgradeId) => {
    if (buyUpgrade(game.state, upgradeId)) {
      showNotification(`Researched ${UPGRADE_DEFINITIONS[upgradeId].name}.`);
      announceNewUnlocks();
      announceChapterCompletions();
      announceAchievements();
      updateUI(game.state);
    }
  },
  onSave: () => {
    saveGame(game.state);
    updateUI(game.state, "Saved.");
    showNotification("Game saved.");
  },
  onRefresh: () => {
    updateUI(game.state);
  },
});

function gameLoop(currentTime) {
  const deltaSeconds = (currentTime - game.lastFrameTime) / 1000;
  game.lastFrameTime = currentTime;

  addUnderstanding(game.state, game.state.stats.understandingPerSecond * deltaSeconds);
  announceNewUnlocks();
  announceChapterCompletions();
  announceAchievements();

  if (currentTime - game.lastAutosaveTime >= AUTOSAVE_INTERVAL_MS) {
    saveGame(game.state);
    game.lastAutosaveTime = currentTime;
    updateUI(game.state, "Autosaved.");
  } else {
    updateUI(game.state);
  }

  requestAnimationFrame(gameLoop);
}

function announceChapterCompletions() {
  const completedChapters = completeAvailableChapters(game.state);

  for (const chapter of completedChapters) {
    const rewardText = chapter.goal.reward.label;
    showNotification(`Completed ${chapter.name}: ${rewardText}`, "milestone");
    showMilestoneBanner(chapter.name, rewardText, chapter.completionBanner);
    showChapterCompletion(chapter, getNextChapterForCompletion(chapter), getMasteredConcepts(chapter));
  }
}

function announceAchievements() {
  const newAchievements = evaluateAchievements(game.state);

  if (newAchievements.length > 0) {
    recalculateStats(game.state);
  }

  for (const achievement of newAchievements) {
    showNotification(`Achievement: ${achievement.name}`, "milestone");
  }
}

function announceNewUnlocks() {
  const unlockedContent = getUnlockedContent(game.state);

  for (const content of unlockedContent) {
    if (!knownUnlockedIds.has(content.id)) {
      showNotification(`Unlocked ${content.category}: ${content.name}`);
    }
  }

  knownUnlockedIds = new Set(unlockedContent.map((content) => content.id));
}

function formatWhole(value) {
  return Math.floor(value).toLocaleString();
}

function getBuildingPurchaseMessage(buildingId, quantity) {
  const definition = BUILDING_DEFINITIONS[buildingId];

  if (quantity === 1) {
    return definition.purchaseMessage;
  }

  return `${definition.purchaseMessage} x${quantity}`;
}

function getNextChapterForCompletion(chapter) {
  return getChapterAfter(chapter.id);
}

function getMasteredConcepts(chapter) {
  return Object.values(UPGRADE_DEFINITIONS)
    .filter((definition) => definition.chapterId === chapter.id)
    .map((definition) => definition.name);
}

updateUI(game.state);
requestAnimationFrame(gameLoop);
