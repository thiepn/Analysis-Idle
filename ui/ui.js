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
let activeResearchFilter = "available";
let activePurchaseQuantity = 1;
const expandedRows = new Set();

export function bindUIEvents(handlers) {
  elements.buildingsList.addEventListener("click", (event) => {
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
    const purchase = getAffordableBuildingPurchase(state, buildingId, activePurchaseQuantity);
    const displayCost = purchase.quantity > 0 ? purchase.totalCost : cost;
    const production = getBuildingProductionDetails(state, buildingId);
    const impacts = getBuildingImpactDescriptions(buildingId);
    const isCompactLocked = !isUnlocked && building.owned === 0;
    const detailKey = `building:${buildingId}`;
    const chapterAlias = currentChapter.studyWork?.[buildingId] ?? buildingDefinition.name;

    row.container.classList.add("building-row");
    row.name.textContent = buildingDefinition.name;
    row.description.textContent = buildingDefinition.description;
    row.flavor.textContent = chapterAlias;
    row.summary.innerHTML = getBuildingSummaryHtml(
      building.owned,
      production.totalProduction,
      displayCost,
      purchase.quantity,
    );
    row.details.innerHTML = getBuildingDetailsHtml(buildingDefinition, production, impacts);
    row.lock.textContent = isUnlocked ? "" : getUnlockText(buildingDefinition.unlock);
    row.button.textContent = isUnlocked
      ? getBuildingButtonText(buildingDefinition, purchase, displayCost)
      : "Locked";
    row.button.dataset.buildingId = buildingId;
    row.button.disabled = !isUnlocked || purchase.quantity <= 0;
    row.detailsToggle.textContent = expandedRows.has(detailKey) ? "Hide Details" : "Details";
    row.detailsToggle.dataset.detailKey = detailKey;
    row.detailsToggle.hidden = isCompactLocked;
    row.details.hidden = isCompactLocked || !expandedRows.has(detailKey);
    row.container.hidden = isCompactLocked && buildingId !== firstLockedBuildingId;
    row.container.classList.toggle("locked", !isUnlocked);
    row.container.classList.toggle("compact-locked", isCompactLocked);
    row.container.classList.toggle(
      "affordable",
      isUnlocked && purchase.quantity > 0,
    );
  }
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
  const currentChapter = getCurrentChapter(state);
  const currentChapterIndex = getChapterIndex(currentChapter.id);
  const visibleRowsByChapter = new Map();
  let visibleRowCount = 0;
  let futurePreviewCount = 0;

  for (const [upgradeId, upgradeDefinition] of Object.entries(UPGRADE_DEFINITIONS)) {
    const upgrade = state.upgrades[upgradeId];
    const group = getOrCreateUpgradeGroup(upgradeDefinition.chapterId);
    const row = getOrCreateRow("upgrades", upgradeId, group.list);
    const isUnlocked = isUpgradeUnlocked(state, upgradeId);
    const isReached = getChapterIndex(upgradeDefinition.chapterId) <= currentChapterIndex;
    let isVisible = shouldShowUpgrade(
      upgradeDefinition,
      upgrade,
      isUnlocked,
      isReached,
      currentChapter,
    );
    const isFuturePreview = activeResearchFilter === "future" && isVisible;
    const detailKey = `upgrade:${upgradeId}`;

    if (isFuturePreview) {
      isVisible = futurePreviewCount < 8;
      futurePreviewCount += 1;
    }

    row.container.classList.add("upgrade-row");
    row.name.textContent = upgradeDefinition.name;
    row.description.textContent = upgradeDefinition.description;
    row.flavor.textContent = getChapterName(upgradeDefinition.chapterId);
    row.summary.innerHTML = getUpgradeSummaryHtml(upgradeDefinition);
    row.details.innerHTML = `
      <span>${upgradeDefinition.flavor ?? ""}</span>
      <span>${upgrade.purchased ? "Status: researched" : "Status: not researched"}</span>
    `;
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
      upgrade.purchased && activeResearchFilter === "current",
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

function shouldShowUpgrade(upgradeDefinition, upgrade, isUnlocked, isReached, currentChapter) {
  if (activeResearchFilter === "available") {
    return isReached && isUnlocked && !upgrade.purchased;
  }

  if (activeResearchFilter === "current") {
    return upgradeDefinition.chapterId === currentChapter.id;
  }

  if (activeResearchFilter === "completed") {
    return upgrade.purchased;
  }

  if (activeResearchFilter === "future") {
    return !upgrade.purchased && (!isReached || !isUnlocked);
  }

  return true;
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
  if (activeResearchFilter === "available") {
    return "No available research yet. Keep building Understanding.";
  }

  if (activeResearchFilter === "completed") {
    return "No completed research yet.";
  }

  if (activeResearchFilter === "future") {
    return "No future research is hidden right now.";
  }

  return "No research is visible for this chapter yet.";
}

function getUpgradeSummaryHtml(upgradeDefinition) {
  return `
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
    return `${getBuildingName(effect.target)} produce x${formatMultiplier(
      effect.value,
    )} Understanding.`;
  }

  if (effect.type === "globalProductionMultiplier") {
    return `All Study Work produces x${formatMultiplier(effect.value)} Understanding.`;
  }

  if (effect.type === "buildingSynergyProductionMultiplier") {
    return `${getBuildingName(effect.target)} gain +${formatPercent(
      effect.valuePerOwned * 100,
    )}% production per ${getBuildingName(effect.source)} owned.`;
  }

  if (effect.type === "buildingCostMultiplier") {
    return `${getBuildingName(effect.target)} costs ${formatPercent(
      (1 - effect.value) * 100,
    )}% less.`;
  }

  return "Unlocks future study.";
}

function getBuildingName(buildingId) {
  return BUILDING_DEFINITIONS[buildingId]?.name ?? "Study Work";
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
        <p class="muted">${condition ? condition.label : chapterGoal.reward}</p>
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
          <p class="small-text">${condition.label}</p>
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
    ["Chapters Complete", `${completedChapters} / 4`],
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

function getBuildingSummaryHtml(owned, totalProduction, displayCost, quantity) {
  const quantityText = quantity > 0 ? `Buy ${quantity}` : "Cannot afford";

  return `
    <span>Owned: ${formatNumber(owned)}</span>
    <span>Produces: ${formatNumber(totalProduction)}/s</span>
    <span>${quantityText}: ${formatNumber(displayCost)}</span>
  `;
}

function getBuildingButtonText(buildingDefinition, purchase, displayCost) {
  if (purchase.quantity <= 0) {
    return `${buildingDefinition.actionLabel} ${formatNumber(displayCost)}`;
  }

  return `${buildingDefinition.actionLabel} x${purchase.quantity} - ${formatNumber(displayCost)}`;
}

function getBuildingDetailsHtml(buildingDefinition, production, impacts) {
  const boosts = production.boosts.length > 0 ? production.boosts.join(" | ") : "No active synergy yet";
  const impactText =
    impacts.length > 0 ? `<span>Per owned: ${impacts.join(" | ")}</span>` : "";

  return `
    <span>${buildingDefinition.description}</span>
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

function formatNumber(value) {
  if (value < 1000) {
    return value.toFixed(value >= 10 ? 0 : 1);
  }

  return Math.floor(value).toLocaleString();
}

function formatMultiplier(value) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
}

function formatPercent(value) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}
