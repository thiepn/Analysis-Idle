const notifications = document.querySelector("#notifications");
const milestoneBanner = document.querySelector("#milestone-banner");
const milestoneTitle = document.querySelector("#milestone-title");
const milestoneReward = document.querySelector("#milestone-reward");
const milestoneCopy = document.querySelector("#milestone-copy");
const completionModal = document.querySelector("#chapter-completion-modal");
const completionClose = document.querySelector("#chapter-completion-close");
const completionTitle = document.querySelector("#completion-title");
const completionCopy = document.querySelector("#completion-copy");
const completionConcepts = document.querySelector("#completion-concepts");
const completionReward = document.querySelector("#completion-reward");
const completionNext = document.querySelector("#completion-next");

completionClose.addEventListener("click", hideChapterCompletion);

export function showNotification(message, type = "") {
  const notification = document.createElement("div");
  notification.className = type ? `notification ${type}` : "notification";
  notification.textContent = message;

  notifications.append(notification);

  window.setTimeout(() => {
    notification.remove();
  }, 3000);
}

export function showMilestoneBanner(title, rewardText, copy = "") {
  milestoneTitle.textContent = title;
  milestoneReward.textContent = rewardText;
  milestoneCopy.textContent = copy;
  milestoneBanner.classList.remove("hidden");

  window.setTimeout(() => {
    milestoneBanner.classList.add("hidden");
  }, 7000);
}

export function showChapterCompletion(chapter, nextChapter, masteredConcepts) {
  completionTitle.textContent = chapter.name;
  completionCopy.textContent = chapter.completionBanner ?? "";
  completionReward.textContent = chapter.goal?.reward?.label ?? "Production strengthened.";
  completionNext.textContent = nextChapter
    ? `${nextChapter.name}: ${chapter.transitionToNext ?? nextChapter.description}`
    : "All planned chapters reached.";
  completionConcepts.innerHTML = masteredConcepts
    .slice(0, 6)
    .map((concept) => `<li>${concept}</li>`)
    .join("");
  completionModal.classList.remove("hidden");

  window.setTimeout(hideChapterCompletion, 12000);
}

function hideChapterCompletion() {
  completionModal.classList.add("hidden");
}
