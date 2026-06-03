import { CHAPTER_DEFINITIONS } from "../data/chapters.js";
import { UPGRADE_DEFINITIONS } from "../data/upgrades.js";
import { getChapterAfter, getCurrentChapter } from "./chapters.js";
import { isUpgradeUnlocked } from "./unlocks.js";

export function getResearchIdsForFilter(state, filter) {
  if (filter === "completed") {
    return Object.keys(UPGRADE_DEFINITIONS).filter(
      (upgradeId) => state.upgrades[upgradeId]?.purchased,
    );
  }

  return getCurrentResearchIds(state);
}

function getCurrentResearchIds(state) {
  const currentChapter = getCurrentChapter(state);
  const nextChapter = getChapterAfter(currentChapter.id);
  const currentChapterIndex = getChapterIndex(currentChapter.id);
  const currentIds = Object.entries(UPGRADE_DEFINITIONS)
    .filter(([upgradeId]) => !state.upgrades[upgradeId]?.purchased)
    .filter(([upgradeId, definition]) => {
      const chapterIndex = getChapterIndex(definition.chapterId);
      const isReachedChapter = chapterIndex <= currentChapterIndex;
      const isCurrentChapter = definition.chapterId === currentChapter.id;
      const isNextChapter = nextChapter?.implemented && definition.chapterId === nextChapter.id;

      return isUpgradeUnlocked(state, upgradeId) || isReachedChapter || isCurrentChapter || isNextChapter;
    })
    .map(([upgradeId]) => upgradeId);

  if (currentIds.length > 0) {
    return currentIds;
  }

  return Object.keys(UPGRADE_DEFINITIONS).filter(
    (upgradeId) => !state.upgrades[upgradeId]?.purchased,
  );
}

function getChapterIndex(chapterId) {
  return CHAPTER_DEFINITIONS.findIndex((chapter) => chapter.id === chapterId);
}
