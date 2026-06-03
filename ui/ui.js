import { BUILDING_DEFINITIONS } from "../data/buildings.js";
import { ACHIEVEMENT_DEFINITIONS } from "../data/achievements.js";
import { CHAPTER_DEFINITIONS } from "../data/chapters.js";
import { UPGRADE_DEFINITIONS } from "../data/upgrades.js";
import { getAffordableBuildingPurchase, getBuildingCost } from "../systems/buildings.js";
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
import { getResearchIdsForFilter } from "../systems/research.js";
import { formatNumber } from "../utils/format.js";

const elements = {
  understandingCount: document.querySelector("#understanding-count"),
  understandingRate: document.querySelector("#understanding-rate"),
  currentChapter: document.querySelector("#current-chapter"),
  nextChapter: document.querySelector("#next-chapter"),
  chapterTheme: document.querySelector("#chapter-theme"),
  supremumRate: document.querySelector("#supremum-rate"),
  productionBreakdownList: document.querySelector("#production-breakdown-list"),
  progressionList: document.querySelector("#progression-list"),
  currentGoalContent: document.querySelector("#current-goal-content"),
  collapsiblePanels: document.querySelectorAll("[data-collapsible-panel]"),
  panelToggleButtons: document.querySelectorAll("[data-collapse-target]"),
  buildingsList: document.querySelector("#buildings-list"),
  studyWorkFlavor: document.querySelector("#study-work-flavor"),
  purchaseQuantityButtons: document.querySelectorAll("[data-purchase-quantity]"),
  upgradesList: document.querySelector("#upgrades-list"),
  researchFilterButtons: document.querySelectorAll("[data-research-filter]"),
  proofJournalList: document.querySelector("#proof-journal-list"),
  achievementsList: document.querySelector("#achievements-list"),
  saveButton: document.querySelector("#save-button"),
  saveStatus: document.querySelector("#save-status"),
};

const rowCache = {
  buildings: new Map(),
  upgrades: new Map(),
};

const upgradeGroupCache = new Map();
const buildingGroupCache = new Map();
let activeResearchFilter = "current";
let activePurchaseQuantity = 1;
const expandedRows = new Set();
const expandedBuildingGroups = {
  definitions: true,
  examples: true,
  exercises: true,
  proofAttempts: true,
  lemmas: true,
  theorems: true,
};
const expandedPanels = {
  currentGoal: false,
  progression: false,
  proofJournal: false,
};

export function bindUIEvents(handlers) {
  elements.buildingsList.addEventListener("click", (event) => {
    const groupToggle = event.target.closest("[data-building-group-toggle]");

    if (groupToggle) {
      const groupId = groupToggle.dataset.buildingGroupToggle;
      expandedBuildingGroups[groupId] = !expandedBuildingGroups[groupId];
      handlers.onRefresh();
      return;
    }

    const detailsButton = event.target.closest("[data-detail-key]");

    if (detailsButton) {
      toggleDetails(detailsButton.dataset.detailKey, handlers);
      return;
    }

    const button = event.target.closest("[data-building-id]");

    if (button) {
      handlers.onBuyBuilding(button.dataset.buildingId, activePurchaseQuantity);
    }
  });

  elements.upgradesList.addEventListener("click", (event) => {
    const detailsButton = event.target.closest("[data-detail-key]");

    if (detailsButton) {
      toggleDetails(detailsButton.dataset.detailKey, handlers);
      return;
    }

    const button = event.target.closest("[data-upgrade-id]");

    if (button) {
      handlers.onBuyUpgrade(button.dataset.upgradeId);
    }
  });

  elements.saveButton.addEventListener("click", handlers.onSave);

  for (const button of elements.panelToggleButtons) {
    button.addEventListener("click", () => {
      const panelId = button.dataset.collapseTarget;
      expandedPanels[panelId] = !expandedPanels[panelId];
      handlers.onRefresh();
    });
  }

  for (const button of elements.purchaseQuantityButtons) {
    button.addEventListener("click", () => {
      activePurchaseQuantity =
        button.dataset.purchaseQuantity === "max"
          ? "max"
          : Number(button.dataset.purchaseQuantity);
      handlers.onRefresh();
    });
  }

  for (const button of elements.researchFilterButtons) {
    button.addEventListener("click", () => {
      activeResearchFilter = button.dataset.researchFilter;
      handlers.onRefresh();
    });
  }
}

function toggleDetails(detailKey, handlers) {
  if (expandedRows.has(detailKey)) {
    expandedRows.delete(detailKey);
  } else {
    expandedRows.add(detailKey);
  }

  handlers.onRefresh();
}

export function updateUI(state, statusText = null) {
  elements.understandingCount.textContent = formatNumber(state.resources.understanding);
  elements.understandingRate.textContent = `${formatNumber(state.stats.understandingPerSecond)}/s`;
  elements.supremumRate.textContent = `${formatNumber(
    state.progression.supremumUnderstandingPerSecond,
  )}/s`;
  updateChapterDisplay(state);
  updateProductionBreakdown(state);
  updateCollapsiblePanels();
  updateCurrentGoal(state);
  updateProgressionRows(state);
  updatePurchaseQuantityButtons();
  updateBuildingRows(state);
  updateUpgradeRows(state);
  updateProofJournal(state);
  updateAchievementsPanel(state);

  if (statusText) {
    elements.saveStatus.textContent = statusText;
  }
}

function updateCollapsiblePanels() {
  for (const panel of elements.collapsiblePanels) {
    const panelId = panel.dataset.collapsiblePanel;
    const isExpanded = expandedPanels[panelId] ?? false;
    const toggle = panel.querySelector("[data-collapse-target]");

    panel.classList.toggle("collapsed", !isExpanded);

    if (toggle) {
      toggle.textContent = isExpanded ? "Hide" : "Show";
      toggle.setAttribute("aria-expanded", String(isExpanded));
    }
  }
}

function updateBuildingRows(state) {
  const currentChapter = getCurrentChapter(state);
  const groupedBuildings = getGroupedBuildingData(state);

  for (const [buildingId, buildingDefinition] of Object.entries(BUILDING_DEFINITIONS)) {
    const building = state.buildings[buildingId];
    const groupId = getBuildingGroupId(buildingDefinition, buildingId);
    const group = getOrCreateBuildingGroup(groupId, buildingDefinition.parentName ?? buildingDefinition.name);
    const row = getOrCreateRow("buildings", buildingId, group.list);
    const groupData = groupedBuildings.get(groupId);
    const isUnlocked = isBuildingUnlocked(state, buildingId);
    const cost = getBuildingCost(state, buildingId);
    const purchase = getAffordableBuildingPurchase(state, buildingId, activePurchaseQuantity);
    const displayCost = purchase.quantity > 0 ? purchase.totalCost : cost;
    const production = getBuildingProductionDetails(state, buildingId);
    const impacts = getBuildingImpactDescriptions(buildingId);
    const isCompactLocked = !isUnlocked && building.owned === 0;
    const detailKey = `building:${buildingId}`;
    const chapterAlias =
      currentChapter.studyWork?.[groupId] ?? buildingDefinition.parentName ?? buildingDefinition.name;
    const chapterRole =
      currentChapter.studyWorkDetails?.[groupId] ?? buildingDefinition.description;

    updateBuildingGroupHeading(group, groupData);

    row.container.classList.add("building-row");
    row.name.textContent = buildingDefinition.name;
    row.description.textContent = buildingDefinition.description;
    row.flavor.textContent = chapterAlias;
    row.summary.innerHTML = getBuildingSummaryHtml(
      building.owned,
      production.totalProduction,
      displayCost,
      purchase,
    );
    row.details.innerHTML = getBuildingDetailsHtml(
      buildingId,
      buildingDefinition,
      chapterRole,
      production,
      impacts,
      groupData,
    );
    row.lock.textContent = isUnlocked ? "" : getUnlockText(buildingDefinition.unlock);
    row.button.textContent = isUnlocked
      ? getBuildingButtonText(buildingDefinition, purchase, displayCost)
      : "Locked";
    row.button.dataset.buildingId = buildingId;
    row.button.disabled = !isUnlocked || purchase.quantity <= 0;
    row.detailsToggle.textContent = expandedRows.has(detailKey) ? "Hide Details" : "Details";
    row.detailsToggle.dataset.detailKey = detailKey;
    row.detailsToggle.hidden = false;
    row.details.hidden = !expandedRows.has(detailKey);
    row.container.hidden = false;
    row.container.classList.toggle("locked", !isUnlocked);
    row.container.classList.toggle("compact-locked", isCompactLocked);
    row.container.classList.toggle(
      "affordable",
      isUnlocked && purchase.quantity > 0,
    );
  }

  for (const [groupId, group] of buildingGroupCache) {
    const groupData = groupedBuildings.get(groupId);
    const isExpanded = expandedBuildingGroups[groupId] ?? false;

    group.container.hidden = !groupData;
    group.container.classList.toggle("collapsed", !isExpanded);
    group.list.hidden = !isExpanded;
    group.toggle.textContent = isExpanded ? "Hide" : "Show";
    group.toggle.setAttribute("aria-expanded", String(isExpanded));
  }
}

function getGroupedBuildingData(state) {
  const groupedBuildings = new Map();

  for (const [buildingId, definition] of Object.entries(BUILDING_DEFINITIONS)) {
    const groupId = getBuildingGroupId(definition, buildingId);
    const building = state.buildings[buildingId] ?? { owned: 0 };
    const production = getBuildingProductionDetails(state, buildingId);
    const groupData =
      groupedBuildings.get(groupId) ??
      {
        id: groupId,
        name: definition.parentName ?? definition.name,
        owned: 0,
        totalProduction: 0,
        visibleCount: 0,
        topName: definition.name,
        topProduction: 0,
      };

    groupData.owned += building.owned;
    groupData.totalProduction += production.totalProduction;
    groupData.visibleCount += 1;

    if (production.totalProduction > groupData.topProduction) {
      groupData.topProduction = production.totalProduction;
      groupData.topName = definition.name;
    }

    groupedBuildings.set(groupId, groupData);
  }

  return groupedBuildings;
}

function getBuildingGroupId(buildingDefinition, buildingId) {
  return buildingDefinition.parentTier ?? buildingId;
}

function updateBuildingGroupHeading(group, groupData) {
  if (!groupData) {
    return;
  }

  group.owned.textContent = `Owned: ${formatNumber(groupData.owned)}`;
  group.production.textContent = `${formatNumber(groupData.totalProduction)}/s`;
  group.count.textContent = `Top: ${groupData.topName} ${getContributionPercent(
    groupData.topProduction,
    groupData.totalProduction,
  )}`;
}

function updatePurchaseQuantityButtons() {
  for (const button of elements.purchaseQuantityButtons) {
    const quantity =
      button.dataset.purchaseQuantity === "max"
        ? "max"
        : Number(button.dataset.purchaseQuantity);
    button.classList.toggle("active", quantity === activePurchaseQuantity);
  }
}

function updateUpgradeRows(state) {
  const visibleUpgradeIds = new Set(getResearchIdsForFilter(state, activeResearchFilter));
  const visibleRowsByChapter = new Map();
  let visibleRowCount = 0;

  for (const [upgradeId, upgradeDefinition] of Object.entries(UPGRADE_DEFINITIONS)) {
    const upgrade = state.upgrades[upgradeId];
    const group = getOrCreateUpgradeGroup(upgradeDefinition.chapterId);
    const row = getOrCreateRow("upgrades", upgradeId, group.list);
    const isUnlocked = isUpgradeUnlocked(state, upgradeId);
    const isVisible = visibleUpgradeIds.has(upgradeId);
    const detailKey = `upgrade:${upgradeId}`;

    const importanceTag = getResearchImportanceTag(upgradeId, upgradeDefinition);

    row.container.classList.add("upgrade-row");
    row.name.textContent = upgradeDefinition.name;
    row.description.textContent = upgradeDefinition.flavor ?? "";
    row.flavor.textContent = importanceTag;
    row.summary.innerHTML = getUpgradeSummaryHtml(upgradeDefinition);
    row.details.innerHTML = getUpgradeDetailsHtml(
      upgradeDefinition,
      upgrade,
      isUnlocked,
      importanceTag,
    );
    row.lock.textContent =
      isUnlocked || upgrade.purchased ? "" : getUnlockText(upgradeDefinition.unlock);
    row.button.textContent = getUpgradeButtonText(upgradeDefinition, upgrade, isUnlocked);
    row.button.dataset.upgradeId = upgradeId;
    row.button.disabled =
      !isUnlocked || upgrade.purchased || state.resources.understanding < upgradeDefinition.cost;
    row.detailsToggle.textContent = expandedRows.has(detailKey) ? "Hide Details" : "Details";
    row.detailsToggle.dataset.detailKey = detailKey;
    row.details.hidden = !expandedRows.has(detailKey);
    row.container.classList.toggle("locked", !isUnlocked);
    row.container.classList.toggle(
      "affordable",
      isUnlocked && !upgrade.purchased && state.resources.understanding >= upgradeDefinition.cost,
    );
    row.container.classList.toggle("purchased", upgrade.purchased);
    row.container.classList.toggle(
      "compact-research",
      upgrade.purchased && activeResearchFilter === "completed",
    );
    row.container.hidden = !isVisible;

    if (isVisible) {
      visibleRowsByChapter.set(upgradeDefinition.chapterId, true);
      visibleRowCount += 1;
    }
  }

  for (const [chapterId, group] of upgradeGroupCache) {
    group.container.hidden = !visibleRowsByChapter.get(chapterId);
  }

  updateResearchFilterButtons();
  updateResearchEmptyState(visibleRowCount);
}

function getUpgradeDetailsHtml(upgradeDefinition, upgrade, isUnlocked, importanceTag) {
  const unlockText = getUnlockText(upgradeDefinition.unlock);

  return `
      <span>Chapter: ${getChapterName(upgradeDefinition.chapterId)}</span>
      <span>Tag: ${importanceTag}</span>
      <span>Cost: ${formatNumber(upgradeDefinition.cost)} Understanding</span>
      <span>${upgradeDefinition.description}</span>
      ${getEffectListHtml(upgradeDefinition.effects)}
      ${!isUnlocked && !upgrade.purchased && unlockText ? `<span>${unlockText}</span>` : ""}
      <span>${upgrade.purchased ? "Status: researched" : "Status: not researched"}</span>
    `;
}

function updateResearchFilterButtons() {
  for (const button of elements.researchFilterButtons) {
    button.classList.toggle("active", button.dataset.researchFilter === activeResearchFilter);
  }
}

function updateResearchEmptyState(visibleRowCount) {
  let emptyState = elements.upgradesList.querySelector("[data-research-empty]");

  if (!emptyState) {
    emptyState = document.createElement("p");
    emptyState.className = "research-empty";
    emptyState.dataset.researchEmpty = "true";
    elements.upgradesList.append(emptyState);
  }

  emptyState.textContent = getResearchEmptyText();
  emptyState.hidden = visibleRowCount > 0;
}

function getResearchEmptyText() {
  if (activeResearchFilter === "completed") {
    return "No completed research yet.";
  }

  return "No current research is visible yet. Keep building Understanding to reveal the next concept.";
}

function getUpgradeSummaryHtml(upgradeDefinition) {
  return `
    <span>Chapter: ${getChapterName(upgradeDefinition.chapterId)}</span>
    <span>Cost: ${formatNumber(upgradeDefinition.cost)}</span>
    ${getEffectListHtml(upgradeDefinition.effects)}
  `;
}

function getEffectListHtml(effects = []) {
  if (effects.length === 0) {
    return "<span>Effect: unlocks future study.</span>";
  }

  return effects.map((effect) => `<span>Effect: ${getEffectDescription(effect)}</span>`).join("");
}

function getEffectDescription(effect) {
  if (effect.type === "buildingProductionMultiplier") {
    return `${getBuildingName(effect.target)} x${formatMultiplier(effect.value)}`;
  }

  if (effect.type === "parentGroupProductionMultiplier") {
    return `${getParentGroupName(effect.targetParent)} x${formatMultiplier(effect.value)}`;
  }

  if (effect.type === "globalProductionMultiplier") {
    return `All production x${formatMultiplier(effect.value)}`;
  }

  if (effect.type === "buildingSynergyProductionMultiplier") {
    return `${getBuildingName(effect.target)} +${formatPercent(
      effect.valuePerOwned * 100,
    )}% per ${getBuildingName(effect.source)}`;
  }

  if (effect.type === "buildingCostMultiplier") {
    return `${getBuildingName(effect.target)} cost -${formatPercent(
      (1 - effect.value) * 100,
    )}%`;
  }

  if (effect.type === "parentGroupCostMultiplier") {
    return `${getParentGroupName(effect.targetParent)} cost -${formatPercent(
      (1 - effect.value) * 100,
    )}%`;
  }

  if (effect.type === "parentTierSynergyProductionMultiplier") {
    return `${getParentGroupName(effect.targetParent)} +${formatPercent(
      effect.valuePerOwned * 100,
    )}% per ${getParentGroupName(effect.sourceParent)}`;
  }

  return "Unlocks future study.";
}

function getResearchImportanceTag(upgradeId, upgradeDefinition) {
  const name = upgradeDefinition.name.toLowerCase();

  if (
    name.includes("theorem") ||
    upgradeId === "wellOrderingPrinciple" ||
    upgradeId === "irrationalitySqrt2" ||
    upgradeId === "nestedIntervals" ||
    upgradeId === "squeezeTheorem" ||
    upgradeId === "sequentialCharacterization" ||
    upgradeId === "epsilonDeltaDefinition"
  ) {
    return "CAPSTONE";
  }

  if (upgradeDefinition.unlock?.type === "chapterUnlocked") {
    return "CORE";
  }

  if (
    upgradeDefinition.effects.some(
      (effect) => effect.type === "globalProductionMultiplier" || effect.value >= 1.35,
    )
  ) {
    return "IMPORTANT";
  }

  if (upgradeDefinition.effects.some((effect) => effect.type === "buildingCostMultiplier")) {
    return "UTILITY";
  }

  return "OPTIONAL";
}

function getBuildingName(buildingId) {
  const definition = BUILDING_DEFINITIONS[buildingId];
  return definition?.parentName ?? definition?.name ?? "Study Work";
}

function getParentGroupName(parentTier) {
  const definition = Object.values(BUILDING_DEFINITIONS).find(
    (buildingDefinition) => buildingDefinition.parentTier === parentTier,
  );

  return definition?.parentName ?? "Study Work";
}

function getChapterName(chapterId) {
  return (
    CHAPTER_DEFINITIONS.find((chapter) => chapter.id === chapterId)?.name ?? "Research"
  );
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

function updateCurrentGoal(state) {
  const chapterGoal = getCurrentChapterGoal(state);
  const nextUnlock = getUpcomingUnlocks(state)
    .sort((firstUnlock, secondUnlock) => {
      const firstProgress = firstUnlock.current / firstUnlock.amount;
      const secondProgress = secondUnlock.current / secondUnlock.amount;
      return secondProgress - firstProgress;
    })[0];
  const nextAvailableConcept = Object.entries(UPGRADE_DEFINITIONS).find(
    ([upgradeId, definition]) =>
      isUpgradeUnlocked(state, upgradeId) &&
      !state.upgrades[upgradeId].purchased &&
      getChapterIndex(definition.chapterId) <= getChapterIndex(chapterGoal.chapter.id),
  );
  const condition = chapterGoal.conditions.find((goalCondition) => !goalCondition.isComplete);
  const progressPercent = condition
    ? Math.min(100, (condition.current / condition.amount) * 100)
    : 100;

  elements.currentGoalContent.innerHTML = `
    <article class="current-goal-card">
      <div>
        <p class="label">Work Toward</p>
        <h3>${chapterGoal.isComplete ? `Prepare for ${getNextChapterText(getChapterAfter(chapterGoal.chapter.id))}` : chapterGoal.chapter.name}</h3>
        <p class="muted">${condition ? getConditionLabel(condition) : chapterGoal.reward}</p>
      </div>
      <div class="progress-meter" aria-label="Current goal progress">
        <span style="width: ${progressPercent}%"></span>
      </div>
      <p class="small-text">${condition ? getConditionProgressText(condition) : "Complete"}</p>
      <p class="current-goal-next">${getNextConceptText(nextAvailableConcept, nextUnlock)}</p>
    </article>
  `;
}

function getNextConceptText(nextAvailableConcept, nextUnlock) {
  if (nextAvailableConcept) {
    const [, definition] = nextAvailableConcept;
    return `Next concept: ${definition.name}. ${definition.description}`;
  }

  if (nextUnlock) {
    return `Next unlock: ${nextUnlock.name}. ${nextUnlock.description}`;
  }

  return "All visible goals are complete.";
}

function getChapterGoalHtml(chapterGoal) {
  const nextChapter = getChapterAfter(chapterGoal.chapter.id);
  const progressText = chapterGoal.isComplete
    ? "Complete"
    : `${chapterGoal.completedCount} of ${chapterGoal.totalCount} requirements`;
  const conditionsHtml = chapterGoal.conditions
    .map((condition) => {
      return `
        <article class="goal-item ${condition.isComplete ? "complete" : ""}">
          <p class="small-text">${getConditionLabel(condition)}</p>
          <p class="muted">${getConditionProgressText(condition)}</p>
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

  return `<p class="chapter-milestones"><strong>Milestones:</strong> ${milestones.join(" / ")}</p>`;
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

function getConditionLabel(condition) {
  if (condition.type === "understandingReached") {
    return `Reach ${formatNumber(condition.amount)} Understanding`;
  }

  if (condition.type === "buildingOwned") {
    return `Own ${formatNumber(condition.amount)} ${getBuildingName(condition.buildingId)}`;
  }

  return condition.label;
}

function getConditionProgressText(condition) {
  if (condition.type === "understandingReached") {
    return `Understanding: ${formatNumber(condition.current)} / ${formatNumber(
      condition.amount,
    )}`;
  }

  if (condition.type === "buildingOwned") {
    return `Owned: ${formatNumber(condition.current)} / ${formatNumber(condition.amount)}`;
  }

  if (condition.type === "upgradePurchased") {
    return condition.isComplete ? "Concept: complete" : "Concept: required";
  }

  return condition.isComplete ? "Complete" : "In progress";
}

function getUnlockProgressText(unlock) {
  if (unlock.amount === 1) {
    return unlock.current >= 1 ? "Requirement met" : "Requirement not met";
  }

  return `${formatNumber(unlock.current)} / ${formatNumber(unlock.amount)}`;
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
          <p class="small-text">${getUnlockProgressText(unlock)}</p>
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

function updateProofJournal(state) {
  const completedChapters = Object.values(state.progression.completedChapters).filter(Boolean).length;
  const researchedConcepts = Object.values(state.upgrades).filter((upgrade) => upgrade.purchased).length;
  const unlockedAchievements = Object.values(state.achievements).filter(
    (achievement) => achievement.unlocked,
  ).length;
  const totalStudyWork = Object.values(state.buildings).reduce(
    (total, building) => total + building.owned,
    0,
  );

  const stats = [
    ["Total Understanding", formatNumber(state.progression.totalUnderstandingEarned)],
    ["Current Rate", `${formatNumber(state.stats.understandingPerSecond)}/s`],
    ["Highest Rate", `${formatNumber(state.progression.supremumUnderstandingPerSecond)}/s`],
    ["Chapters Complete", `${completedChapters} / ${getImplementedChapterCount()}`],
    ["Concepts Researched", `${researchedConcepts} / ${Object.keys(UPGRADE_DEFINITIONS).length}`],
    ["Achievements", `${unlockedAchievements} / ${Object.keys(ACHIEVEMENT_DEFINITIONS).length}`],
    ["Study Work Owned", formatNumber(totalStudyWork)],
    ["Last Offline Gain", formatNumber(state.progression.lastOfflineUnderstanding ?? 0)],
  ];

  elements.proofJournalList.innerHTML = stats
    .map(([label, value]) => {
      return `
        <article class="stat-item">
          <p class="label">${label}</p>
          <p>${value}</p>
        </article>
      `;
    })
    .join("");
}

function updateAchievementsPanel(state) {
  const groupedAchievements = getGroupedAchievements();

  elements.achievementsList.innerHTML = Object.entries(groupedAchievements)
    .map(([category, achievements]) => {
      const achievementCards = achievements
        .map(([achievementId, achievementDefinition]) => {
          const achievement = state.achievements[achievementId];
          const isUnlocked = achievement?.unlocked ?? false;

          return `
            <article class="achievement-item ${isUnlocked ? "unlocked" : "locked"}">
              <div>
                <h3>${achievementDefinition.name}</h3>
                <p class="muted">${achievementDefinition.description}</p>
                <p class="small-text">${getAchievementRequirementText(
                  achievementDefinition.condition,
                )}</p>
                <p class="achievement-reward">Reward: ${
                  achievementDefinition.reward?.label ?? "Recorded in the Proof Journal."
                }</p>
              </div>
              <p class="achievement-status">${isUnlocked ? "Unlocked" : "Locked"}</p>
            </article>
          `;
        })
        .join("");

      return `
        <section class="achievement-group">
          <div class="achievement-group-heading">
            <p class="label">${category}</p>
          </div>
          ${achievementCards}
        </section>
      `;
    })
    .join("");
}

function getGroupedAchievements() {
  const categoryOrder = [
    "foundations",
    "numberSystems",
    "understandingMilestone",
    "buildingMilestone",
    "sequences",
    "limits",
    "chapterCompletion",
    "research",
    "optimization",
    "hidden",
  ];
  const groups = {};

  for (const category of categoryOrder) {
    const achievements = Object.entries(ACHIEVEMENT_DEFINITIONS).filter(
      ([, achievementDefinition]) => achievementDefinition.category === category,
    );

    if (achievements.length > 0) {
      groups[getAchievementCategoryLabel(category)] = achievements;
    }
  }

  return groups;
}

function getAchievementCategoryLabel(category) {
  const labels = {
    foundations: "Foundations",
    numberSystems: "Number Systems",
    understandingMilestone: "Understanding Milestones",
    buildingMilestone: "Study Work",
    sequences: "Sequences",
    limits: "Limits",
    chapterCompletion: "Chapter Completion",
    research: "Research",
    optimization: "Optimization",
    hidden: "Hidden",
  };

  return labels[category] ?? "Other";
}

function getAchievementRequirementText(condition) {
  if (condition.type === "buildingOwned") {
    return `Requirement: own ${condition.amount} ${getBuildingName(condition.buildingId)}.`;
  }

  if (condition.type === "totalBuildingsOwned") {
    return `Requirement: own ${condition.amount} total Study Work.`;
  }

  if (condition.type === "understandingReached") {
    return `Requirement: reach ${formatNumber(condition.amount)} Understanding.`;
  }

  if (condition.type === "chapterCompleted") {
    return `Requirement: complete ${getChapterName(condition.chapterId)}.`;
  }

  if (condition.type === "upgradePurchased") {
    return `Requirement: research ${UPGRADE_DEFINITIONS[condition.upgradeId]?.name ?? "a concept"}.`;
  }

  if (condition.type === "allUpgradesPurchased") {
    return `Requirement: research ${condition.upgradeIds.length} linked concepts.`;
  }

  return "Requirement: keep progressing.";
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

  return `${nextChapter.name}: ${getUnlockText(nextChapter.unlock)}`;
}

function getImplementedChapterCount() {
  return CHAPTER_DEFINITIONS.filter((chapter) => chapter.implemented).length;
}

function updateProductionBreakdown(state) {
  const activeProduction = getGroupedProductionBreakdown(state);

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

function getGroupedProductionBreakdown(state) {
  const groups = new Map();

  for (const building of getBuildingProductionBreakdown(state)) {
    if (building.owned <= 0) {
      continue;
    }

    const definition = BUILDING_DEFINITIONS[building.id];
    const groupId = getBuildingGroupId(definition, building.id);
    const group =
      groups.get(groupId) ??
      {
        name: definition.parentName ?? definition.name,
        owned: 0,
        totalProduction: 0,
      };

    group.owned += building.owned;
    group.totalProduction += building.totalProduction;
    groups.set(groupId, group);
  }

  return [...groups.values()];
}

function getBuildingSummaryHtml(owned, totalProduction, displayCost, purchase) {
  const quantityText = purchase.quantity > 0 ? `Cost x${purchase.quantity}` : "Next cost";

  return `
    <span>Count: ${formatNumber(owned)}</span>
    <span>Produces: ${formatNumber(totalProduction)}/s</span>
    <span>${quantityText}: ${formatNumber(displayCost)} Understanding</span>
  `;
}

function getBuildingButtonText(buildingDefinition, purchase, displayCost) {
  if (purchase.quantity <= 0) {
    return `${buildingDefinition.actionLabel} ${formatNumber(displayCost)}`;
  }

  return `${buildingDefinition.actionLabel} x${purchase.quantity}`;
}

function getBuildingDetailsHtml(
  buildingId,
  buildingDefinition,
  roleDescription,
  production,
  impacts,
  groupData,
) {
  const boosts = production.boosts.length > 0 ? production.boosts.join(" | ") : "No active synergy yet";
  const impactText =
    impacts.length > 0 ? `<span>Per owned: ${impacts.join(" | ")}</span>` : "";
  const contribution = getContributionPercent(production.totalProduction, groupData.totalProduction);

  return `
    <span>Parent group: ${buildingDefinition.parentName ?? buildingDefinition.name}</span>
    <span>Role: ${getVariantRole(buildingId)}</span>
    <span>${roleDescription}</span>
    <span>Base: ${formatNumber(production.baseProduction)}/s</span>
    <span>Count: ${production.count}</span>
    <span>Multiplier: x${formatNumber(production.totalMultiplier)}</span>
    <span>Total: ${formatNumber(production.totalProduction)}/s</span>
    <span>Group share: ${contribution}</span>
    <span>${boosts}</span>
    ${impactText}
  `;
}

function getContributionPercent(value, total) {
  if (total <= 0) {
    return "0%";
  }

  return `${((value / total) * 100).toFixed(1)}%`;
}

function getVariantRole(buildingId) {
  const roles = {
    definitions: "Stable baseline for precise language.",
    notationPractice: "Low-cost support that makes symbolic work easier.",
    conceptMaps: "Synergy-focused connector between ideas.",
    assumptionLists: "Higher-cost support for proof and lemma work.",
    examples: "Baseline intuition builder.",
    counterexamples: "Support variant for proof caution and theorem testing.",
    visualExamples: "Exercise and limit intuition support.",
    edgeCases: "Later-analysis support for boundary behavior.",
    exercises: "Baseline practice engine.",
    challengeProblems: "Higher-output practice at a higher cost.",
    computationDrills: "Volume producer for routine manipulation.",
    proofExercises: "Bridge from exercises into proof attempts.",
    proofAttempts: "Baseline proof production.",
    contradictionDrafts: "Lemma and theorem support through contradiction.",
    inductionDrafts: "Early proof-pattern support.",
    epsilonProofDrafts: "Limits-focused proof support.",
    lemmas: "Baseline structural support.",
    boundingLemmas: "Sequence and limit control support.",
    convergenceLemmas: "Sequences/Limits structural producer.",
    structuralLemmas: "Broad theorem support.",
    theorems: "Baseline capstone production.",
    capstoneTheorems: "Expensive chapter-level capstones.",
    synthesisTheorems: "Cross-chapter theorem support.",
    generalizationTheorems: "Late scaling and generalization support.",
  };

  return roles[buildingId] ?? "Study Work variant.";
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

function getOrCreateBuildingGroup(groupId, groupName) {
  const cachedGroup = buildingGroupCache.get(groupId);

  if (cachedGroup) {
    return cachedGroup;
  }

  const container = document.createElement("section");
  container.className = "building-group";
  container.innerHTML = `
    <div class="building-group-heading">
      <div>
        <p class="label">Study Tier</p>
        <h3>${groupName}</h3>
      </div>
      <div class="building-group-summary">
        <span data-field="group-owned">Owned: 0</span>
        <span data-field="group-production">0/s</span>
        <span data-field="group-count">0 visible</span>
        <button class="panel-toggle" type="button" data-building-group-toggle="${groupId}">
          Show
        </button>
      </div>
    </div>
    <div class="shop-list" data-field="building-group-list"></div>
  `;

  const group = {
    container,
    list: container.querySelector('[data-field="building-group-list"]'),
    owned: container.querySelector('[data-field="group-owned"]'),
    production: container.querySelector('[data-field="group-production"]'),
    count: container.querySelector('[data-field="group-count"]'),
    toggle: container.querySelector("[data-building-group-toggle]"),
  };

  elements.buildingsList.append(container);
  buildingGroupCache.set(groupId, group);
  return group;
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
      <div class="shop-row-title">
        <h3 data-field="name"></h3>
        <span class="row-tag" data-field="flavor"></span>
      </div>
      <p class="muted" data-field="description"></p>
      <div class="compact-meta" data-field="summary"></div>
      <button class="details-button" type="button" data-field="details-toggle">Details</button>
      <div class="small-text details-panel" data-field="details"></div>
      <p class="lock-text" data-field="lock"></p>
    </div>
    <button class="primary-button" type="button" data-field="action-button"></button>
  `;

  return {
    container,
    name: container.querySelector('[data-field="name"]'),
    description: container.querySelector('[data-field="description"]'),
    flavor: container.querySelector('[data-field="flavor"]'),
    summary: container.querySelector('[data-field="summary"]'),
    detailsToggle: container.querySelector('[data-field="details-toggle"]'),
    details: container.querySelector('[data-field="details"]'),
    lock: container.querySelector('[data-field="lock"]'),
    button: container.querySelector('[data-field="action-button"]'),
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

function formatMultiplier(value) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
}

function formatPercent(value) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}
