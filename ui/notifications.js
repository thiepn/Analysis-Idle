const notifications = document.querySelector("#notifications");
const milestoneBanner = document.querySelector("#milestone-banner");
const milestoneTitle = document.querySelector("#milestone-title");
const milestoneReward = document.querySelector("#milestone-reward");
const milestoneCopy = document.querySelector("#milestone-copy");

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
