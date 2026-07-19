import { z } from "zod";

const accessibleSchema = z.object({
  short: z.string().min(1),
  accessible: z.string().min(1),
});
const metadataShape = {
  short: z.string().min(1),
  accessible: z.string().min(1),
  designSource: z.string().min(1),
  mathematicalSource: z.string().min(1),
  status: z.enum(["LOCKED", "PROVISIONAL", "DEFERRED", "FINAL"]),
  balanceTestId: z.string().min(1),
};
export const conditionSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("constant"),
      value: z.boolean(),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("all"),
      conditions: z.array(conditionSchema),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("any"),
      conditions: z.array(conditionSchema),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("not"),
      condition: conditionSchema,
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("resourceAtLeast"),
      resourceId: z.string(),
      amount: z.number().finite().nonnegative(),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("projectCompleted"),
      projectId: z.string(),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("upgradeOwned"),
      upgradeId: z.string(),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("milestoneReached"),
      milestoneId: z.string(),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("achievementRecorded"),
      achievementId: z.string(),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("chapterStatus"),
      chapterId: z.string(),
      status: z.string(),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("attentionCapacityAtLeast"),
      amount: z.number().finite().nonnegative(),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("techniqueArtifactOwned"),
      artifactId: z.string(),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("understandingAtLeast"),
      amount: z.number().finite().nonnegative(),
      text: accessibleSchema,
    }),
    z.object({
      type: z.literal("insightAtLeast"),
      amount: z.number().finite().nonnegative(),
      text: accessibleSchema,
    }),
  ]),
);

const finiteNonnegative = z.number().finite().nonnegative();
const idMetadata = z
  .object({ id: z.string().min(1), ...metadataShape })
  .passthrough();

export const gameContentSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    contentVersion: z.string().min(1),
    configuration: z.object({
      attention: z.object({
        startingCapacity: z.number().int().nonnegative(),
        maximumCapacity: z.number().int().positive(),
        activityExponent: z.number().positive().max(1),
      }),
      insight: z.object({
        cap: finiteNonnegative,
        sustainedTargetMin: finiteNonnegative,
        sustainedTargetMax: finiteNonnegative,
        ceiling: finiteNonnegative,
      }),
      offline: z.object({
        fullEfficiencyHours: finiteNonnegative,
        tailEfficiency: z.number().min(0).max(1),
        maximumCreditedHours: finiteNonnegative,
      }),
      pacing: z.object({
        firstPublicationMinMinutes: finiteNonnegative,
        firstPublicationMaxMinutes: finiteNonnegative,
        campaignMinHours: finiteNonnegative,
        campaignMaxHours: finiteNonnegative,
      }),
      projects: z.object({
        approachSwitchPreservation: z.number().min(0.9).max(1),
        baseSpeedPerSecond: z.number().positive(),
      }),
    }),
    resources: z.array(idMetadata),
    activities: z.array(idMetadata),
    approaches: z.array(idMetadata),
    techniqueArtifacts: z.array(idMetadata),
    projects: z.array(idMetadata),
    upgrades: z.array(idMetadata),
    milestones: z.array(idMetadata),
    achievements: z.array(idMetadata),
    chapters: z.array(idMetadata),
  })
  .strict();
