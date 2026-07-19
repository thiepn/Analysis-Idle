import type {
  AchievementId,
  ActivityId,
  CapstoneEdgeId,
  ChapterId,
  MilestoneId,
  ProjectId,
  ResourceId,
  TechniqueArtifactId,
  UpgradeId,
} from "../../shared/contracts";

export type GameEvent =
  | { type: "timeAdvanced"; durationMs: number; offline: boolean }
  | { type: "attentionChanged"; activityId: ActivityId; allocation: number }
  | {
      type: "resourceChanged";
      resourceId: ResourceId;
      amount: number;
      reason: string;
    }
  | { type: "projectStarted"; projectId: ProjectId }
  | { type: "projectPaused"; projectId: ProjectId }
  | { type: "projectCancelled"; projectId: ProjectId }
  | { type: "projectQueued"; projectId: ProjectId }
  | {
      type: "projectApproachSwitched";
      projectId: ProjectId;
      preservedFraction: number;
    }
  | {
      type: "projectCompleted";
      projectId: ProjectId;
      artifactIds: TechniqueArtifactId[];
    }
  | { type: "upgradePurchased"; upgradeId: UpgradeId }
  | { type: "milestoneReached"; milestoneId: MilestoneId }
  | { type: "achievementRecorded"; achievementId: AchievementId }
  | { type: "insightSpent"; amount: number; purpose: string }
  | { type: "insightModifierExpired"; modifierId: string }
  | { type: "insightGained"; amount: number; overflow: number }
  | { type: "capstoneEdgeAssembled"; edgeId: CapstoneEdgeId }
  | {
      type: "chapterPublished";
      chapterId: ChapterId;
      masteryArtifactId: string;
    }
  | { type: "settingChanged"; setting: string; value: boolean | string }
  | {
      type: "persistenceRequested";
      operation: "save" | "load" | "import" | "export";
      data: string | null;
    };
