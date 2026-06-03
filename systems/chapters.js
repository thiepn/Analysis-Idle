import { CHAPTER_DEFINITIONS } from "../data/chapters.js";
import { recalculateStats } from "./economy.js";

export function getCurrentChapter(state) {
  const implementedChapters = getImplementedChapters();

  return implementedChapters.reduce((currentChapter, chapter) => {
    if (isUnlockComplete(state, chapter.unlock)) {
      return chapter;
    }

    return currentChapter;
  }, implementedChapters[0]);
}

export function getNextChapter(state) {
  const currentChapter = getCurrentChapter(state);
  return getChapterAfter(currentChapter.id);
}

export function getChapterAfter(chapterId) {
  const currentIndex = CHAPTER_DEFINITIONS.findIndex((chapter) => chapter.id === chapterId);
  return CHAPTER_DEFINITIONS[currentIndex + 1] ?? null;
}

export function getCurrentChapterGoal(state) {
  const currentChapter = getCurrentChapter(state);
  return getChapterGoalProgress(state, currentChapter);
}

export function completeAvailableChapters(state) {
  const completedChapters = [];

  for (const chapter of getImplementedChapters()) {
    if (
      state.progression.completedChapters?.[chapter.id] ||
      !isChapterGoalComplete(state, chapter)
    ) {
      continue;
    }

    state.progression.completedChapters[chapter.id] = true;
    completedChapters.push(chapter);
  }

  if (completedChapters.length > 0) {
    recalculateStats(state);
  }

  return completedChapters;
}

export function getChapterGoalProgress(state, chapter) {
  const conditions = chapter.goal?.conditions ?? [];
  const completedConditions = conditions.filter((condition) =>
    isConditionComplete(state, condition),
  );

  return {
    chapter,
    objective: chapter.goal?.objective ?? "",
    reward: chapter.goal?.reward?.label ?? "",
    isComplete: state.progression.completedChapters?.[chapter.id] ?? false,
    completedCount: completedConditions.length,
    totalCount: conditions.length,
    conditions: conditions.map((condition) => ({
      ...condition,
      current: getConditionCurrentValue(state, condition),
      amount: condition.amount ?? 1,
      isComplete: isConditionComplete(state, condition),
    })),
  };
}

function getImplementedChapters() {
  return CHAPTER_DEFINITIONS.filter((chapter) => chapter.implemented);
}

function isChapterGoalComplete(state, chapter) {
  if (!isUnlockComplete(state, chapter.unlock)) {
    return false;
  }

  return chapter.goal.conditions.every((condition) => isConditionComplete(state, condition));
}

function isConditionComplete(state, condition) {
  if (condition.type === "understandingReached") {
    return state.progression.highestUnderstanding >= condition.amount;
  }

  if (condition.type === "buildingOwned") {
    return (state.buildings[condition.buildingId]?.owned ?? 0) >= condition.amount;
  }

  if (condition.type === "upgradePurchased") {
    return state.upgrades[condition.upgradeId]?.purchased ?? false;
  }

  if (condition.type === "chapterCompleted") {
    return state.progression.completedChapters?.[condition.chapterId] ?? false;
  }

  return false;
}

function getConditionCurrentValue(state, condition) {
  if (condition.type === "understandingReached") {
    return state.progression.highestUnderstanding;
  }

  if (condition.type === "buildingOwned") {
    return state.buildings[condition.buildingId]?.owned ?? 0;
  }

  if (condition.type === "upgradePurchased") {
    return state.upgrades[condition.upgradeId]?.purchased ? 1 : 0;
  }

  if (condition.type === "chapterCompleted") {
    return state.progression.completedChapters?.[condition.chapterId] ? 1 : 0;
  }

  return 0;
}

function isUnlockComplete(state, unlock) {
  if (!unlock) {
    return true;
  }

  if (unlock.type === "understandingReached") {
    return state.progression.highestUnderstanding >= unlock.amount;
  }

  if (unlock.type === "chapterCompleted") {
    return state.progression.completedChapters?.[unlock.chapterId] ?? false;
  }

  return isConditionComplete(state, unlock);
}
