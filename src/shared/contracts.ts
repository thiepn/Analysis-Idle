export type Brand<T, B extends string> = T & { readonly __brand: B };

export type ResourceId = Brand<string, "ResourceId">;
export type ActivityId = Brand<string, "ActivityId">;
export type ProjectId = Brand<string, "ProjectId">;
export type UpgradeId = Brand<string, "UpgradeId">;
export type MilestoneId = Brand<string, "MilestoneId">;
export type AchievementId = Brand<string, "AchievementId">;
export type ChapterId = Brand<string, "ChapterId">;
export type ApproachId = Brand<string, "ApproachId">;
export type TechniqueArtifactId = Brand<string, "TechniqueArtifactId">;
export type EffectId = Brand<string, "EffectId">;
export type AutomationRuleId = Brand<string, "AutomationRuleId">;
export type CapstoneEdgeId = Brand<string, "CapstoneEdgeId">;

export type ResetLayer =
  "session" | "chapter" | "publication" | "campaign" | "never";
export type PublicationBehavior = "reset" | "archive" | "retain" | "transform";
export type ContentStatus = "LOCKED" | "PROVISIONAL" | "DEFERRED" | "FINAL";

export interface AccessibleText {
  short: string;
  accessible: string;
}

export interface ContentMetadata extends AccessibleText {
  designSource: string;
  mathematicalSource: string;
  status: ContentStatus;
  balanceTestId: string;
}

export type ConditionDefinition =
  | { type: "constant"; value: boolean; text: AccessibleText }
  | { type: "all"; conditions: ConditionDefinition[]; text: AccessibleText }
  | { type: "any"; conditions: ConditionDefinition[]; text: AccessibleText }
  | { type: "not"; condition: ConditionDefinition; text: AccessibleText }
  | {
      type: "resourceAtLeast";
      resourceId: ResourceId;
      amount: number;
      text: AccessibleText;
    }
  | { type: "projectCompleted"; projectId: ProjectId; text: AccessibleText }
  | { type: "upgradeOwned"; upgradeId: UpgradeId; text: AccessibleText }
  | { type: "milestoneReached"; milestoneId: MilestoneId; text: AccessibleText }
  | {
      type: "achievementRecorded";
      achievementId: AchievementId;
      text: AccessibleText;
    }
  | {
      type: "chapterStatus";
      chapterId: ChapterId;
      status: ChapterRuntimeStatus;
      text: AccessibleText;
    }
  | { type: "attentionCapacityAtLeast"; amount: number; text: AccessibleText }
  | {
      type: "techniqueArtifactOwned";
      artifactId: TechniqueArtifactId;
      text: AccessibleText;
    }
  | { type: "understandingAtLeast"; amount: number; text: AccessibleText }
  | { type: "insightAtLeast"; amount: number; text: AccessibleText };

export type EffectOperation =
  | "flatAdd"
  | "groupAddPercent"
  | "namedMultiply"
  | "power"
  | "cap"
  | "capacityAdd"
  | "projectSpeed"
  | "automationUnlock"
  | "informationUnlock"
  | "publicationTransform";

export type EffectTarget =
  | { kind: "activityRate"; id: ActivityId }
  | { kind: "resourceCap"; id: ResourceId }
  | { kind: "attentionCapacity" }
  | { kind: "project"; id: ProjectId | "*" }
  | { kind: "automation"; capability: AutomationCapability }
  | { kind: "information"; capability: string }
  | { kind: "publication"; chapterId: ChapterId };

export interface EffectDefinition extends ContentMetadata {
  id: EffectId;
  source: { kind: "upgrade" | "milestone" | "artifact" | "method"; id: string };
  activation: ConditionDefinition;
  target: EffectTarget;
  operation: EffectOperation;
  magnitude: number;
  stackingGroup: string;
  priority: number;
  cap: number | null;
  resetLayer: ResetLayer;
  publicationBehavior: PublicationBehavior;
}

export interface ResourceDefinition extends ContentMetadata {
  id: ResourceId;
  unit: string;
  initialValue: number;
  cap: number;
  sourceActivityIds: ActivityId[];
  permittedSinks: string[];
  resetLayer: ResetLayer;
  publicationBehavior: PublicationBehavior;
  offlineBehavior: "produce" | "pause";
}

export interface ActivityDefinition extends ContentMetadata {
  id: ActivityId;
  resourceId: ResourceId;
  baseRatePerSecond: number;
  initiallyUnlocked: boolean;
  resetLayer: ResetLayer;
}

export interface ApproachDefinition extends ContentMetadata {
  id: ApproachId;
  precisionRequirementMultiplier: number;
  intuitionRequirementMultiplier: number;
  workMultiplier: number;
  outputKind: "lemma" | "reveal" | "template";
}

export type TechniqueArtifactKind =
  "exerciseRecord" | "preparedStep" | "proofTemplate" | "reusableMethod";

export interface TechniqueArtifactDefinition extends ContentMetadata {
  id: TechniqueArtifactId;
  kind: TechniqueArtifactKind;
  sourceProjectId: ProjectId;
  compatibleProjectIds: ProjectId[];
  prerequisites: ConditionDefinition;
  resetLayer: ResetLayer;
  publicationBehavior: PublicationBehavior;
  removalBehavior: "disableMatching" | "removeLocal" | "archive";
}

export interface ProjectDefinition extends ContentMetadata {
  id: ProjectId;
  chapterId: ChapterId;
  prerequisiteProjectIds: ProjectId[];
  precisionRequirement: number;
  intuitionRequirement: number;
  techniqueRequirements: TechniqueArtifactId[];
  workRequired: number;
  allowedApproachIds: ApproachId[];
  outputArtifactIds: TechniqueArtifactId[];
  understandingReward: number;
  insightReward: number;
  resetLayer: ResetLayer;
  publicationBehavior: PublicationBehavior;
}

export type UpgradeCategory =
  | "information"
  | "milestone"
  | "routine"
  | "automation"
  | "keystone"
  | "active"
  | "capacity"
  | "capstone"
  | "compression";

export interface UpgradeDefinition extends ContentMetadata {
  id: UpgradeId;
  category: UpgradeCategory;
  tier: number;
  cost: Record<ResourceId, number>;
  unlockCondition: ConditionDefinition;
  effects: EffectDefinition[];
  resetLayer: ResetLayer;
  publicationBehavior: PublicationBehavior;
  strategicPurpose: string;
}

export interface MilestoneDefinition extends ContentMetadata {
  id: MilestoneId;
  condition: ConditionDefinition;
  resetLayer: ResetLayer;
  publicationBehavior: PublicationBehavior;
}

export type AchievementRewardClass =
  "badgeHistory" | "nonPowerRecords" | "nonPowerInformation" | "nonPowerAccess";

export interface AchievementDefinition extends ContentMetadata {
  id: AchievementId;
  condition: ConditionDefinition;
  rewardClass: AchievementRewardClass;
  resetLayer: ResetLayer;
  publicationBehavior: PublicationBehavior;
}

export interface CapstoneEdgeDefinition extends ContentMetadata {
  id: CapstoneEdgeId;
  requiredArtifactId: TechniqueArtifactId;
}

export interface PublicationDefinition extends ContentMetadata {
  chapterId: ChapterId;
  requiredProjectIds: ProjectId[];
  requiredCapstoneEdgeIds: CapstoneEdgeId[];
  masteryArtifactId: string;
  resetResourceIds: ResourceId[];
  retainedArtifactIds: TechniqueArtifactId[];
}

export interface ChapterDefinition extends ContentMetadata {
  id: ChapterId;
  projectIds: ProjectId[];
  capstoneEdges: CapstoneEdgeDefinition[];
  publication: PublicationDefinition;
}

export interface ProvisionalConfiguration {
  attention: {
    startingCapacity: number;
    maximumCapacity: number;
    activityExponent: number;
  };
  insight: {
    cap: number;
    sustainedTargetMin: number;
    sustainedTargetMax: number;
    ceiling: number;
  };
  offline: {
    fullEfficiencyHours: number;
    tailEfficiency: number;
    maximumCreditedHours: number;
  };
  pacing: {
    firstPublicationMinMinutes: number;
    firstPublicationMaxMinutes: number;
    campaignMinHours: number;
    campaignMaxHours: number;
  };
  projects: { approachSwitchPreservation: number; baseSpeedPerSecond: number };
}

export interface GameContent {
  schemaVersion: number;
  contentVersion: string;
  configuration: ProvisionalConfiguration;
  resources: ResourceDefinition[];
  activities: ActivityDefinition[];
  approaches: ApproachDefinition[];
  techniqueArtifacts: TechniqueArtifactDefinition[];
  projects: ProjectDefinition[];
  upgrades: UpgradeDefinition[];
  milestones: MilestoneDefinition[];
  achievements: AchievementDefinition[];
  chapters: ChapterDefinition[];
}

export type ProjectRuntimeStatus =
  | "locked"
  | "available"
  | "queued"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";
export type ChapterRuntimeStatus =
  "locked" | "active" | "publicationReady" | "published" | "archived";
export type CompletionBehavior = "pause" | "startNextFunded";
export type AutomationCapability =
  | "queue"
  | "completionBehavior"
  | "resourceReserve"
  | "orderedPriority"
  | "safeOfflinePolicy";

export const id = <T extends string>(value: string): Brand<string, T> =>
  value as Brand<string, T>;
