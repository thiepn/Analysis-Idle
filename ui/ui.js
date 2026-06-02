import { BUILDING_DEFINITIONS } from "../data/buildings.js";
import { CHAPTER_DEFINITIONS } from "../data/chapters.js";
import { UPGRADE_DEFINITIONS } from "../data/upgrades.js";
import { getBuildingCost } from "../systems/buildings.js";
import {
  getChapterAfter,
  getCurrentChapter,
  getCurrentChapterGoal,
  getNextChapter,
} from "../systems/chapters.js";
import {
  getBuildingImpactDescriptions,
  getBuildingProductionBreakdown,
  getBuildingProductionDetails,
} from "../systems/economy.js";
import {
  getUpcomingUnlocks,
  getUnlockText,
  isBuildingUnlocked,
  isUpgradeUnlocked,
} from "../systems/unlocks.js";

const elements = {
  understandingCount: document.querySelector("#understanding-count"),
  understandingRate: document.querySelector("#understanding-rate"),
  currentChapter: document.querySelector("#current-chapter"),
  nextChapter: document.querySelector("#next-chapter"),
  chapterTheme: document.querySelector("#chapter-theme"),
  supremumRate: document.querySelector("#supremum-rate"),
  productionBreakdownList: document.querySelector("#production-breakdown-list"),
  progressionList: document.querySelector("#progression-list"),
  buildingsList: document.querySelector("#buildings-list"),
  studyWorkFlavor: document.querySelector("#study-work-flavor"),
  upgradesList: document.querySelector("#upgrades-list"),
  saveButton: document.querySelector("#save-button"),
  saveStatus: document.querySelector("#save-status"),
};

const rowCache = {
  buildings: new Map(),
  upgrades: new Map(),
};

const upgradeGroupCache = new Map();

export function bindUIEvents(handlers) {
  elements.buildingsList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-building-id]");

    if (button) {
      handlers.onBuyBuilding(button.dataset.buildingId);
    }
  });

  elements.upgradesList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-upgrade-id]");

    if (button) {
      handlers.onBuyUpgrade(button.dataset.upgradeId);
    }
  });

  elements.saveButton.addEventListener("click", handlers.onSave);
}

export function updateUI(state, statusText = null) {
  elements.understandingCount.textContent = formatNumber(state.resources.understanding);
  elements.understandingRate.textContent = `${formatNumber(state.stats.understandingPerSecond)}/s`;
  elements.supremumRate.textContent = `${formatNumber(
    state.progression.supremumUnderstandingPerSecond,
  )}/s`;
  updateChapterDisplay(state);
  updateProductionBreakdown(state);
  updateProgressionRows(state);
  updateBuildingRows(state);
  updateUpgradeRows(state);

  if (statusText) {
    elements.saveStatus.textContent = statusText;
  }
}

function updateBuildingRows(state) {
  const currentChapter = getCurrentChapter(state);
  const firstLockedBuildingId = Object.keys(BUILDING_DEFINITIONS).find(
    (buildingId) => !isBuildingUnlocked(state, buildingId),
  );

  for (const [buildingId, buildingDefinition] of Object.entries(BUILDING_DEFINITIONS)) {
    const building = state.buildings[buildingId];
    const row = getOrCreateRow("buildings", buildingId, elements.buildingsList);
    const isUnlocked = isBuildingUnlocked(state, buildingId);
    const cost = getBuildingCost(state, buildingId);
    const production = getBuildingProductionDetails(state, buildingId);
    const impacts = getBuildingImpactDescriptions(buildingId);
    const isCompactLocked = !isUnlocked && building.owned === 0;

    row.name.textContent = buildingDefinition.name;
    row.description.textContent = buildingDefinition.description;
    row.flavor.textContent = currentChapter.studyWork?.[buildingId] ?? "";
    row.details.innerHTML = getBuildingDetailsHtml(production, impacts);
    row.lock.textContent = isUnlocked ? "" : getUnlockText(buildingDefinition.unlock);
    row.button.textContent = isUnlocked
      ? `${buildingDefinition.actionLabel} ${formatNumber(cost)}`
      : "Locked";
    row.button.dataset.buildingId = buildingId;
    row.button.disabled = !isUnlocked || state.resources.understanding < cost;
    row.details.hidden = isCompactLocked;
    row.container.hidden = isCompactLocked && buildingId !== firstLockedBuildingId;
    row.container.classList.toggle("locked", !isUnlocked);
    row.container.classList.toggle("compact-locked", isCompactLocked);
    row.container.classList.toggle(
      "affordable",
      isUnlocked && state.resources.understanding >= cost,
    );
  }
}

function updateUpgradeRows(state) {
  const currentChapter = getCurrentChapter(state);
  const currentChapterIndex = getChapterIndex(currentChapter.id);

  for (const [upgradeId, upgradeDefinition] of Object.entries(UPGRADE_DEFINITIONS)) {
    const upgrade = state.upgrades[upgradeId];
    const group = getOrCreateUpgradeGroup(upgradeDefinition.chapterId);
    const row = getOrCreateRow("upgrades", upgradeId, group.list);
    const isUnlocked = isUpgradeUnlocked(state, upgradeId);
    const isVisible = getChapterIndex(upgradeDefinition.chapterId) <= currentChapterIndex;

    row.name.textContent = upgradeDefinition.name;
    row.description.textContent = upgradeDefinition.description;
    row.flavor.textContent = upgradeDefinition.flavor ?? "";
    row.details.textContent = upgrade.purchased ? "Researched" : "Not researched";
    row.lock.textContent =
      isUnlocked || upgrade.purchased ? "" : getUnlockText(upgradeDefinition.unlock);
    row.button.textContent = getUpgradeButtonText(upgradeDefinition, upgrade, isUnlocked);
    row.button.dataset.upgradeId = upgradeId;
    row.button.disabled =
      !isUnlocked || upgrade.purchased || state.resources.understanding < upgradeDefinition.cost;
    row.container.classList.toggle("locked", !isUnlocked);
    row.container.classList.toggle(
      "affordable",
      isUnlocked && !upgrade.purchased && state.resources.understanding >= upgradeDefinition.cost,
    );
    row.container.classList.toggle("purchased", upgrade.purchased);
    row.container.hidden = !isVisible;
  }

  for (const [chapterId, group] of upgradeGroupCache) {
    group.container.hidden = getChapterIndex(chapterId) > currentChapterIndex;
  }
}

function updateProgressionRows(state) {
  const chapterGoal = getCurrentChapterGoal(state);
  const upcomingUnlocks = getUpcomingUnlocks(state)
    .sort((firstUnlock, secondUnlock) => {
      const firstProgress = firstUnlock.current / firstUnlock.amount;
      const secondProgress = secondUnlock.current / secondUnlock.amount;
      return secondProgress - firstProgress;
    })
    .slice(0, 4);

  const chapterGoalHtml = getChapterGoalHtml(chapterGoal);
  const unlocksHtml =
    upcomingUnlocks.length === 0
      ? '<p class="progression-empty">All current discoveries are visible.</p>'
      : getUnlockCardsHtml(upcomingUnlocks);

  elements.progressionList.innerHTML = chapterGoalHtml + unlocksHtml;
}

function getChapterGoalHtml(chapterGoal) {
  const nextChapter = getChapterAfter(chapterGoal.chapter.id);
  const progressText = chapterGoal.isComplete
    ? "Complete"
    : `${chapterGoal.completedCount} / ${chapterGoal.totalCount}`;
  const conditionsHtml = chapterGoal.conditions
    .map((condition) => {
      return `
        <article class="goal-item ${condition.isComplete ? "complete" : ""}">
          <p class="small-text">${condition.label}</p>
          <p class="muted">${formatNumber(condition.current)} / ${formatNumber(
            condition.amount,
          )}</p>
        </article>
      `;
    })
    .join("");

  return `
    <article class="chapter-goal-card">
      <div class="chapter-goal-header">
        <div>
          <p class="label">Chapter Objective</p>
          <h3>${chapterGoal.chapter.name}</h3>
          <p class="muted">${chapterGoal.objective}</p>
          ${getChapterMilestonesHtml(chapterGoal.chapter)}
          <p class="chapter-reward">${chapterGoal.reward}</p>
          ${getChapterTransitionHtml(chapterGoal.chapter, nextChapter)}
        </div>
        <p class="small-text">${progressText}</p>
      </div>
      <div class="goal-list">${conditionsHtml}</div>
    </article>
  `;
}

function getChapterMilestonesHtml(chapter) {
  const milestones = chapter.milestones ?? [];

  if (milestones.length === 0) {
    return "";
  }

  return `<p class="chapter-milestones"><strong>Milestones:</strong> ${milestones.join(" · ")}</p>`;
}

function getChapterTransitionHtml(currentChapter, nextChapter) {
  if (!nextChapter || !currentChapter.transitionToNext) {
    return "";
  }

  return `
    <div class="chapter-transition">
      <p class="label">Next: ${nextChapter.name}</p>
      <p>${currentChapter.transitionToNext}</p>
    </div>
  `;
}

function getUnlockCardsHtml(upcomingUnlocks) {
  return upcomingUnlocks
    .map((unlock) => {
      const progressPercent = Math.min(100, (unlock.current / unlock.amount) * 100);

      return `
        <article class="progression-item">
          <div>
            <p class="small-text">${unlock.category}</p>
            <h3>${unlock.name}</h3>
            <p class="muted">${unlock.description}</p>
          </div>
          <div class="progress-meter" aria-label="${unlock.name} progress">
            <span style="width: ${progressPercent}%"></span>
          </div>
          <p class="small-text">${formatNumber(unlock.current)} / ${formatNumber(
            unlock.amount,
          )}</p>
        </article>
      `;
    })
    .join("");
}

function updateChapterDisplay(state) {
  const currentChapter = getCurrentChapter(state);
  const nextChapter = getNextChapter(state);

  elements.currentChapter.textContent = currentChapter.name;
  elements.chapterTheme.textContent = currentChapter.theme ?? "";
  elements.studyWorkFlavor.textContent = getStudyWorkFlavor(currentChapter);
  elements.nextChapter.textContent = getNextChapterText(nextChapter);
}

function getStudyWorkFlavor(chapter) {
  const studyWork = chapter.studyWork;

  if (!studyWork) {
    return "Definitions establish precision. Examples build intuition. Exercises turn both into deeper practice.";
  }

  return `Current focus grows from ${studyWork.definitions} toward ${studyWork.theorems}.`;
}

function getNextChapterText(nextChapter) {
  if (!nextChapter) {
    return "All planned chapters reached.";
  }

  if (!nextChapter.implemented) {
    return `${nextChapter.name}: future chapter`;
  }

  return `${nextChapter.name} at ${formatNumber(nextChapter.unlock.amount)} Understanding`;
}

function updateProductionBreakdown(state) {
  const activeProduction = getBuildingProductionBreakdown(state).filter(
    (building) => building.owned > 0,
  );

  if (activeProduction.length === 0) {
    elements.productionBreakdownList.innerHTML =
      '<span class="breakdown-item">No active production yet.</span>';
    return;
  }

  elements.productionBreakdownList.innerHTML = activeProduction
    .map((building) => {
      return `<span class="breakdown-item">${building.name}: ${formatNumber(
        building.totalProduction,
      )}/s</span>`;
    })
    .join("");
}

function getBuildingDetailsHtml(production, impacts) {
  const boosts = production.boosts.length > 0 ? production.boosts.join(" | ") : "No active synergy yet";
  const impactText =
    impacts.length > 0 ? `<span>Per owned: ${impacts.join(" | ")}</span>` : "";

  return `
    <span>Base: ${formatNumber(production.baseProduction)}/s</span>
    <span>Count: ${production.count}</span>
    <span>Multiplier: x${formatNumber(production.totalMultiplier)}</span>
    <span>Total: ${formatNumber(production.totalProduction)}/s</span>
    <span>${boosts}</span>
    ${impactText}
  `;
}

function getOrCreateRow(type, itemId, parentElement) {
  const cachedRow = rowCache[type].get(itemId);

  if (cachedRow) {
    return cachedRow;
  }

  const row = createShopRow();
  parentElement.append(row.container);
  rowCache[type].set(itemId, row);
  return row;
}

function getOrCreateUpgradeGroup(chapterId) {
  const cachedGroup = upgradeGroupCache.get(chapterId);

  if (cachedGroup) {
    return cachedGroup;
  }

  const chapter = CHAPTER_DEFINITIONS.find((definition) => definition.id === chapterId);
  const container = document.createElement("section");
  container.className = "upgrade-group";
  container.innerHTML = `
    <div class="upgrade-group-heading">
      <p class="label">Chapter Research</p>
      <h3>${chapter?.name ?? "Concepts"}</h3>
    </div>
    <div class="shop-list" data-field="upgrade-group-list"></div>
  `;

  const group = {
    container,
    list: container.querySelector('[data-field="upgrade-group-list"]'),
  };

  elements.upgradesList.append(container);
  upgradeGroupCache.set(chapterId, group);
  return group;
}

function getChapterIndex(chapterId) {
  return CHAPTER_DEFINITIONS.findIndex((chapter) => chapter.id === chapterId);
}

function createShopRow() {
  const container = document.createElement("article");
  container.className = "shop-row";
  container.innerHTML = `
    <div>
      <h3 data-field="name"></h3>
      <p class="muted" data-field="description"></p>
      <p class="flavor-text" data-field="flavor"></p>
      <p class="small-text" data-field="details"></p>
      <p class="lock-text" data-field="lock"></p>
    </div>
    <button class="primary-button" type="button"></button>
  `;

  return {
    container,
    name: container.querySelector('[data-field="name"]'),
    description: container.querySelector('[data-field="description"]'),
    flavor: container.querySelector('[data-field="flavor"]'),
    details: container.querySelector('[data-field="details"]'),
    lock: container.querySelector('[data-field="lock"]'),
    button: container.querySelector("button"),
  };
}

function getUpgradeButtonText(upgradeDefinition, upgrade, isUnlocked) {
  if (upgrade.purchased) {
    return "Researched";
  }

  if (!isUnlocked) {
    return "Locked";
  }

  return `Research ${formatNumber(upgradeDefinition.cost)}`;
}

function formatNumber(value) {
  if (value < 1000) {
    return value.toFixed(value >= 10 ? 0 : 1);
  }

  return Math.floor(value).toLocaleString();
}
