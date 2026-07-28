import type { GameEvent } from "../engine";

export type NotificationImportance = "routine" | "important" | "critical";

export function classifyNotification(event: GameEvent): NotificationImportance {
  switch (event.type) {
    case "chapterPublished":
      return "critical";
    case "projectCompleted":
    case "milestoneReached":
    case "achievementRecorded":
    case "insightGained":
      return "important";
    default:
      return "routine";
  }
}

export function importantEventMessage(events: GameEvent[]): string | null {
  const important = [...events]
    .reverse()
    .find((event) => classifyNotification(event) !== "routine");
  if (!important) return null;
  switch (important.type) {
    case "chapterPublished":
      return "Natural Numbers published. Your solved work is now a reusable method.";
    case "projectCompleted":
      return `Project completed: ${important.projectId}. A method artifact was recorded.`;
    case "milestoneReached":
      return `Milestone reached: ${important.milestoneId}.`;
    case "achievementRecorded":
      return `Achievement recorded: ${important.achievementId}.`;
    case "insightGained":
      return important.amount > 0
        ? `Insight gained. ${important.overflow > 0 ? "Your notebook is full." : ""}`.trim()
        : "An Insight opportunity occurred, but your notebook is full.";
    default:
      return null;
  }
}
