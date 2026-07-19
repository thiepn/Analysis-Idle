import type { ConditionDefinition, GameContent } from "../shared/contracts";
import { gameContentSchema } from "./schemas";

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  path: string;
  message: string;
}

export interface ContentValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  counts: Record<string, number>;
}

function conditionReferences(condition: ConditionDefinition): string[] {
  if (condition.type === "all" || condition.type === "any")
    return condition.conditions.flatMap(conditionReferences);
  if (condition.type === "not") return conditionReferences(condition.condition);
  if (condition.type === "projectCompleted") return [condition.projectId];
  if (condition.type === "upgradeOwned") return [condition.upgradeId];
  if (condition.type === "milestoneReached") return [condition.milestoneId];
  if (condition.type === "achievementRecorded")
    return [condition.achievementId];
  if (condition.type === "techniqueArtifactOwned")
    return [condition.artifactId];
  if (condition.type === "resourceAtLeast") return [condition.resourceId];
  if (condition.type === "chapterStatus") return [condition.chapterId];
  return [];
}

function findProjectCycle(content: GameContent): string[] {
  const graph = new Map(
    content.projects.map((project) => [
      project.id as string,
      project.prerequisiteProjectIds as string[],
    ]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];
  const visit = (node: string): boolean => {
    if (visiting.has(node)) {
      path.push(node);
      return true;
    }
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const dependency of graph.get(node) ?? [])
      if (visit(dependency)) {
        path.push(node);
        return true;
      }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  for (const node of graph.keys()) if (visit(node)) return path.reverse();
  return [];
}

export function validateContent(content: GameContent): ContentValidationResult {
  const issues: ValidationIssue[] = [];
  const parsed = gameContentSchema.safeParse(content);
  if (!parsed.success)
    parsed.error.issues.forEach((issue) =>
      issues.push({
        severity: "error",
        code: "SCHEMA",
        path: issue.path.join("."),
        message: issue.message,
      }),
    );
  const collections = [
    content.resources,
    content.activities,
    content.approaches,
    content.techniqueArtifacts,
    content.projects,
    content.upgrades,
    content.milestones,
    content.achievements,
    content.chapters,
  ];
  const ids = collections.flatMap((collection) =>
    collection.map((entry) => entry.id as string),
  );
  const known = new Set(ids);
  const duplicates = ids.filter((value, index) => ids.indexOf(value) !== index);
  duplicates.forEach((duplicate) =>
    issues.push({
      severity: "error",
      code: "DUPLICATE_ID",
      path: duplicate,
      message: "Stable ID must be globally unique",
    }),
  );
  if (
    content.resources
      .map((resource) => resource.id)
      .sort()
      .join(",") !== "INTUITION,PRECISION"
  )
    issues.push({
      severity: "error",
      code: "PRIMARY_STOCK_SET",
      path: "resources",
      message: "Precision and Intuition must be the only primary stocks",
    });
  for (const project of content.projects) {
    for (const reference of [
      ...project.prerequisiteProjectIds,
      ...project.techniqueRequirements,
      ...project.outputArtifactIds,
      project.chapterId,
    ])
      if (!known.has(reference))
        issues.push({
          severity: "error",
          code: "UNKNOWN_REFERENCE",
          path: project.id,
          message: `Unknown reference ${reference}`,
        });
  }
  for (const upgrade of content.upgrades)
    for (const reference of conditionReferences(upgrade.unlockCondition))
      if (!known.has(reference))
        issues.push({
          severity: "error",
          code: "UNKNOWN_CONDITION_REFERENCE",
          path: upgrade.id,
          message: `Unknown condition reference ${reference}`,
        });
  const cycle = findProjectCycle(content);
  if (cycle.length > 0)
    issues.push({
      severity: "error",
      code: "PROJECT_CYCLE",
      path: "projects",
      message: cycle.join(" -> "),
    });
  const allEffects = content.upgrades.flatMap((upgrade) => upgrade.effects);
  for (const effect of allEffects) {
    if (
      effect.source.kind === "upgrade" &&
      !content.upgrades.some((upgrade) => upgrade.id === effect.source.id)
    )
      issues.push({
        severity: "error",
        code: "UNOWNED_EFFECT_SOURCE",
        path: effect.id,
        message: "Effect source is not valid content",
      });
    if (!Number.isFinite(effect.magnitude))
      issues.push({
        severity: "error",
        code: "NON_FINITE_EFFECT",
        path: effect.id,
        message: "Effect magnitude must be finite",
      });
  }
  const counts: Record<string, number> = {
    resources: content.resources.length,
    activities: content.activities.length,
    approaches: content.approaches.length,
    techniqueArtifacts: content.techniqueArtifacts.length,
    projects: content.projects.length,
    upgrades: content.upgrades.length,
    milestones: content.milestones.length,
    achievements: content.achievements.length,
    chapters: content.chapters.length,
    effects: allEffects.length,
  };
  const expected: Record<string, number> = {
    projects: 12,
    upgrades: 15,
    milestones: 11,
    achievements: 10,
    approaches: 3,
  };
  for (const [key, count] of Object.entries(expected))
    if (counts[key] !== count)
      issues.push({
        severity: "error",
        code: "FIXTURE_COUNT",
        path: key,
        message: `Expected ${count}, received ${counts[key]}`,
      });
  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
    counts,
  };
}
