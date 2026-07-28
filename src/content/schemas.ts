import { z } from "zod";

const nonempty = z.string().min(1);
const finiteNonnegative = z.number().finite().nonnegative();
const finitePositive = z.number().finite().positive();

const accessibleSchema = z
  .object({ short: nonempty, accessible: nonempty })
  .strict();
const metadataShape = {
  short: nonempty,
  accessible: nonempty,
  designSource: nonempty,
  mathematicalSource: nonempty,
  status: z.enum(["LOCKED", "PROVISIONAL", "DEFERRED", "FINAL"]),
  balanceTestId: nonempty,
};
const resetLayerSchema = z.enum([
  "session",
  "chapter",
  "publication",
  "campaign",
  "never",
]);
const publicationBehaviorSchema = z.enum([
  "reset",
  "archive",
  "retain",
  "transform",
]);
const chapterStatusSchema = z.enum([
  "locked",
  "active",
  "publicationReady",
  "published",
  "archived",
]);

export const conditionSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion("type", [
    z
      .object({
        type: z.literal("constant"),
        value: z.boolean(),
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("all"),
        conditions: z.array(conditionSchema),
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("any"),
        conditions: z.array(conditionSchema),
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("not"),
        condition: conditionSchema,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("resourceAtLeast"),
        resourceId: nonempty,
        amount: finiteNonnegative,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("projectCompleted"),
        projectId: nonempty,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("projectStarted"),
        projectId: nonempty,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("upgradeOwned"),
        upgradeId: nonempty,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("milestoneReached"),
        milestoneId: nonempty,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("achievementRecorded"),
        achievementId: nonempty,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("chapterStatus"),
        chapterId: nonempty,
        status: chapterStatusSchema,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("attentionCapacityAtLeast"),
        amount: finiteNonnegative,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("techniqueArtifactOwned"),
        artifactId: nonempty,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("understandingAtLeast"),
        amount: finiteNonnegative,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("insightAtLeast"),
        amount: finiteNonnegative,
        text: accessibleSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal("recordAtLeast"),
        record: z.enum([
          "approachComparisons",
          "exactDependencyCompletions",
          "projectsCompletedWithoutInsight",
          "offlineQueuedCompletions",
          "validCapstones",
        ]),
        amount: finiteNonnegative,
        text: accessibleSchema,
      })
      .strict(),
  ]),
);

const sourceSchema = z
  .object({
    kind: z.enum(["upgrade", "milestone", "artifact", "method"]),
    id: nonempty,
  })
  .strict();
const automationCapabilitySchema = z.enum([
  "queue",
  "completionBehavior",
  "resourceReserve",
  "orderedPriority",
  "safeOfflinePolicy",
]);
const effectTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("activityRate"), id: nonempty }).strict(),
  z.object({ kind: z.literal("resourceCap"), id: nonempty }).strict(),
  z.object({ kind: z.literal("attentionCapacity") }).strict(),
  z.object({ kind: z.literal("project"), id: nonempty }).strict(),
  z
    .object({
      kind: z.literal("automation"),
      capability: automationCapabilitySchema,
    })
    .strict(),
  z.object({ kind: z.literal("information"), capability: nonempty }).strict(),
  z.object({ kind: z.literal("publication"), chapterId: nonempty }).strict(),
]);
const effectSchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    source: sourceSchema,
    activation: conditionSchema,
    target: effectTargetSchema,
    operation: z.enum([
      "flatAdd",
      "groupAddPercent",
      "namedMultiply",
      "power",
      "cap",
      "capacityAdd",
      "projectSpeed",
      "automationUnlock",
      "informationUnlock",
      "publicationTransform",
    ]),
    magnitude: z.number().finite(),
    stackingGroup: nonempty,
    priority: z.number().int(),
    cap: z.number().finite().nonnegative().nullable(),
    resetLayer: resetLayerSchema,
    publicationBehavior: publicationBehaviorSchema,
  })
  .strict();

const resourceSchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    unit: nonempty,
    initialValue: finiteNonnegative,
    cap: finitePositive,
    sourceActivityIds: z.array(nonempty),
    permittedSinks: z.array(nonempty),
    resetLayer: resetLayerSchema,
    publicationBehavior: publicationBehaviorSchema,
    offlineBehavior: z.enum(["produce", "pause"]),
  })
  .strict();
const activitySchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    resourceId: nonempty,
    baseRatePerSecond: finiteNonnegative,
    initiallyUnlocked: z.boolean(),
    resetLayer: resetLayerSchema,
  })
  .strict();
const approachSchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    precisionRequirementMultiplier: finitePositive,
    intuitionRequirementMultiplier: finitePositive,
    workMultiplier: finitePositive,
    outputKind: z.enum(["lemma", "reveal", "template"]),
  })
  .strict();
const techniqueArtifactSchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    kind: z.enum([
      "exerciseRecord",
      "preparedStep",
      "proofTemplate",
      "reusableMethod",
    ]),
    sourceProjectId: nonempty,
    compatibleProjectIds: z.array(nonempty),
    prerequisites: conditionSchema,
    resetLayer: resetLayerSchema,
    publicationBehavior: publicationBehaviorSchema,
    removalBehavior: z.enum(["disableMatching", "removeLocal", "archive"]),
  })
  .strict();
const projectSchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    chapterId: nonempty,
    prerequisiteProjectIds: z.array(nonempty),
    precisionRequirement: finiteNonnegative,
    intuitionRequirement: finiteNonnegative,
    techniqueRequirements: z.array(nonempty),
    workRequired: finitePositive,
    allowedApproachIds: z.array(nonempty).min(1),
    outputArtifactIds: z.array(nonempty),
    understandingReward: finiteNonnegative,
    insightReward: finiteNonnegative,
    resetLayer: resetLayerSchema,
    publicationBehavior: publicationBehaviorSchema,
  })
  .strict();
const upgradeSchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    category: z.enum([
      "information",
      "milestone",
      "routine",
      "automation",
      "keystone",
      "active",
      "capacity",
      "capstone",
      "compression",
    ]),
    tier: z.number().int().nonnegative(),
    cost: z.record(z.string(), finiteNonnegative),
    unlockCondition: conditionSchema,
    effects: z.array(effectSchema),
    resetLayer: resetLayerSchema,
    publicationBehavior: publicationBehaviorSchema,
    strategicPurpose: nonempty,
  })
  .strict();
const milestoneSchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    condition: conditionSchema,
    effects: z.array(effectSchema),
    resetLayer: resetLayerSchema,
    publicationBehavior: publicationBehaviorSchema,
  })
  .strict();
const achievementSchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    condition: conditionSchema,
    rewardClass: z.enum([
      "badgeHistory",
      "nonPowerRecords",
      "nonPowerInformation",
      "nonPowerAccess",
    ]),
    resetLayer: resetLayerSchema,
    publicationBehavior: publicationBehaviorSchema,
  })
  .strict();
const capstoneEdgeSchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    requiredArtifactId: nonempty,
    fromConcept: nonempty,
    toConcept: nonempty,
    relationship: z.literal("implication"),
  })
  .strict();
const publicationSchema = z
  .object({
    chapterId: nonempty,
    ...metadataShape,
    requiredProjectIds: z.array(nonempty),
    requiredCapstoneEdgeIds: z.array(nonempty),
    masteryArtifactId: nonempty,
    resetResourceIds: z.array(nonempty),
    retainedArtifactIds: z.array(nonempty),
  })
  .strict();
const chapterSchema = z
  .object({
    id: nonempty,
    ...metadataShape,
    projectIds: z.array(nonempty),
    capstoneEdges: z.array(capstoneEdgeSchema),
    publication: publicationSchema,
  })
  .strict();

const configurationSchema = z
  .object({
    attention: z
      .object({
        startingCapacity: z.number().int().nonnegative(),
        maximumCapacity: z.number().int().positive(),
        activityExponent: finitePositive.max(1),
      })
      .strict(),
    insight: z
      .object({
        cap: finiteNonnegative,
        sustainedTargetMin: finiteNonnegative,
        sustainedTargetMax: finiteNonnegative,
        ceiling: finiteNonnegative,
        modifierPerInsight: finiteNonnegative,
        modifierDurationSeconds: finitePositive,
      })
      .strict(),
    automation: z
      .object({ queueCapacity: z.number().int().positive() })
      .strict(),
    offline: z
      .object({
        fullEfficiencyHours: finiteNonnegative,
        tailEfficiency: z.number().finite().min(0).max(1),
        maximumCreditedHours: finiteNonnegative,
      })
      .strict(),
    pacing: z
      .object({
        firstPublicationMinMinutes: finiteNonnegative,
        firstPublicationMaxMinutes: finiteNonnegative,
        campaignMinHours: finiteNonnegative,
        campaignMaxHours: finiteNonnegative,
      })
      .strict(),
    projects: z
      .object({
        approachSwitchPreservation: z.number().finite().min(0.9).max(1),
        baseSpeedPerSecond: finitePositive,
      })
      .strict(),
  })
  .strict()
  .superRefine((configuration, context) => {
    if (
      configuration.attention.startingCapacity >
      configuration.attention.maximumCapacity
    )
      context.addIssue({
        code: "custom",
        path: ["attention", "startingCapacity"],
        message: "Starting Attention cannot exceed maximum capacity",
      });
    if (
      configuration.insight.sustainedTargetMin >
      configuration.insight.sustainedTargetMax
    )
      context.addIssue({
        code: "custom",
        path: ["insight", "sustainedTargetMin"],
        message: "Insight target minimum cannot exceed maximum",
      });
    if (
      configuration.insight.sustainedTargetMax > configuration.insight.ceiling
    )
      context.addIssue({
        code: "custom",
        path: ["insight", "sustainedTargetMax"],
        message: "Normal Insight target cannot exceed the hard ceiling",
      });
    if (
      configuration.offline.fullEfficiencyHours >
      configuration.offline.maximumCreditedHours
    )
      context.addIssue({
        code: "custom",
        path: ["offline", "fullEfficiencyHours"],
        message: "Full-efficiency window cannot exceed maximum credit",
      });
    if (
      configuration.pacing.firstPublicationMinMinutes >
      configuration.pacing.firstPublicationMaxMinutes
    )
      context.addIssue({
        code: "custom",
        path: ["pacing", "firstPublicationMinMinutes"],
        message: "Publication minimum cannot exceed maximum",
      });
    if (
      configuration.pacing.campaignMinHours >
      configuration.pacing.campaignMaxHours
    )
      context.addIssue({
        code: "custom",
        path: ["pacing", "campaignMinHours"],
        message: "Campaign minimum cannot exceed maximum",
      });
  });

export const gameContentSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    contentVersion: nonempty,
    configuration: configurationSchema,
    resources: z.array(resourceSchema),
    activities: z.array(activitySchema),
    approaches: z.array(approachSchema),
    techniqueArtifacts: z.array(techniqueArtifactSchema),
    projects: z.array(projectSchema),
    upgrades: z.array(upgradeSchema),
    milestones: z.array(milestoneSchema),
    achievements: z.array(achievementSchema),
    chapters: z.array(chapterSchema),
  })
  .strict();
