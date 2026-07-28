import type {
  ConditionDefinition,
  EffectDefinition,
  GameContent,
} from "../shared/contracts";
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

type ReferenceKind =
  | "resource"
  | "activity"
  | "project"
  | "upgrade"
  | "milestone"
  | "achievement"
  | "artifact"
  | "chapter";

function visitCondition(
  condition: ConditionDefinition,
  path: string,
  references: Array<{ kind: ReferenceKind; id: string; path: string }>,
  issues: ValidationIssue[],
  depth = 0,
): void {
  if (depth > 64) {
    issues.push({
      severity: "error",
      code: "CONDITION_DEPTH",
      path,
      message: "Condition nesting exceeds the supported depth of 64",
    });
    return;
  }
  if (condition.type === "all" || condition.type === "any") {
    condition.conditions.forEach((child, index) =>
      visitCondition(
        child,
        `${path}.conditions.${index}`,
        references,
        issues,
        depth + 1,
      ),
    );
    return;
  }
  if (condition.type === "not") {
    visitCondition(
      condition.condition,
      `${path}.condition`,
      references,
      issues,
      depth + 1,
    );
    return;
  }
  if (condition.type === "resourceAtLeast")
    references.push({ kind: "resource", id: condition.resourceId, path });
  else if (
    condition.type === "projectCompleted" ||
    condition.type === "projectStarted"
  )
    references.push({ kind: "project", id: condition.projectId, path });
  else if (condition.type === "upgradeOwned")
    references.push({ kind: "upgrade", id: condition.upgradeId, path });
  else if (condition.type === "milestoneReached")
    references.push({ kind: "milestone", id: condition.milestoneId, path });
  else if (condition.type === "achievementRecorded")
    references.push({ kind: "achievement", id: condition.achievementId, path });
  else if (condition.type === "techniqueArtifactOwned")
    references.push({ kind: "artifact", id: condition.artifactId, path });
  else if (condition.type === "chapterStatus")
    references.push({ kind: "chapter", id: condition.chapterId, path });
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
    for (const dependency of graph.get(node) ?? []) {
      if (visit(dependency)) {
        path.push(node);
        return true;
      }
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  for (const node of graph.keys()) if (visit(node)) return path.reverse();
  return [];
}

function expectedOperations(effect: EffectDefinition): string[] {
  switch (effect.target.kind) {
    case "activityRate":
      return ["flatAdd", "groupAddPercent", "namedMultiply", "power", "cap"];
    case "resourceCap":
      return ["flatAdd", "cap"];
    case "attentionCapacity":
      return ["capacityAdd"];
    case "project":
      return ["projectSpeed"];
    case "automation":
      return ["automationUnlock"];
    case "information":
      return ["informationUnlock"];
    case "publication":
      return ["publicationTransform"];
  }
}

function emptyCounts(value: unknown): Record<string, number> {
  const object =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const length = (key: string) =>
    Array.isArray(object[key]) ? object[key].length : 0;
  return {
    resources: length("resources"),
    activities: length("activities"),
    approaches: length("approaches"),
    techniqueArtifacts: length("techniqueArtifacts"),
    projects: length("projects"),
    upgrades: length("upgrades"),
    milestones: length("milestones"),
    achievements: length("achievements"),
    chapters: length("chapters"),
    effects: 0,
  };
}

export function validateContent(value: unknown): ContentValidationResult {
  const issues: ValidationIssue[] = [];
  let parsed: ReturnType<typeof gameContentSchema.safeParse>;
  try {
    parsed = gameContentSchema.safeParse(value);
  } catch (error) {
    return {
      valid: false,
      issues: [
        {
          severity: "error",
          code: "SCHEMA",
          path: "content",
          message:
            error instanceof Error
              ? error.message
              : "Content schema evaluation failed",
        },
      ],
      counts: emptyCounts(value),
    };
  }
  if (!parsed.success) {
    parsed.error.issues.forEach((issue) =>
      issues.push({
        severity: "error",
        code: "SCHEMA",
        path: issue.path.join("."),
        message: issue.message,
      }),
    );
    return { valid: false, issues, counts: emptyCounts(value) };
  }

  const content = parsed.data as GameContent;
  const effects = [
    ...content.upgrades.flatMap((upgrade) => upgrade.effects),
    ...content.milestones.flatMap((milestone) => milestone.effects),
  ];
  const capstoneEdges = content.chapters.flatMap(
    (chapter) => chapter.capstoneEdges,
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
    effects,
    capstoneEdges,
  ];
  const ids = collections.flatMap((collection) =>
    collection.map((entry) => entry.id as string),
  );
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id))
      issues.push({
        severity: "error",
        code: "DUPLICATE_ID",
        path: id,
        message: "Stable ID must be globally unique",
      });
    seen.add(id);
  }

  const sets: Record<ReferenceKind, Set<string>> = {
    resource: new Set(content.resources.map((entry) => entry.id as string)),
    activity: new Set(content.activities.map((entry) => entry.id as string)),
    project: new Set(content.projects.map((entry) => entry.id as string)),
    upgrade: new Set(content.upgrades.map((entry) => entry.id as string)),
    milestone: new Set(content.milestones.map((entry) => entry.id as string)),
    achievement: new Set(
      content.achievements.map((entry) => entry.id as string),
    ),
    artifact: new Set(
      content.techniqueArtifacts.map((entry) => entry.id as string),
    ),
    chapter: new Set(content.chapters.map((entry) => entry.id as string)),
  };
  const references: Array<{ kind: ReferenceKind; id: string; path: string }> =
    [];
  const reference = (kind: ReferenceKind, id: string, path: string) =>
    references.push({ kind, id, path });

  if ([...sets.resource].sort().join(",") !== "INTUITION,PRECISION")
    issues.push({
      severity: "error",
      code: "PRIMARY_STOCK_SET",
      path: "resources",
      message: "Precision and Intuition must be the only primary stocks",
    });

  content.resources.forEach((resource, index) =>
    resource.sourceActivityIds.forEach((id) =>
      reference("activity", id, `resources.${index}.sourceActivityIds`),
    ),
  );
  content.activities.forEach((activity, index) =>
    reference(
      "resource",
      activity.resourceId,
      `activities.${index}.resourceId`,
    ),
  );
  content.techniqueArtifacts.forEach((artifact, index) => {
    reference(
      "project",
      artifact.sourceProjectId,
      `techniqueArtifacts.${index}.sourceProjectId`,
    );
    artifact.compatibleProjectIds.forEach((id) =>
      reference(
        "project",
        id,
        `techniqueArtifacts.${index}.compatibleProjectIds`,
      ),
    );
    visitCondition(
      artifact.prerequisites,
      `techniqueArtifacts.${index}.prerequisites`,
      references,
      issues,
    );
  });
  content.projects.forEach((project, index) => {
    reference("chapter", project.chapterId, `projects.${index}.chapterId`);
    project.prerequisiteProjectIds.forEach((id) =>
      reference("project", id, `projects.${index}.prerequisiteProjectIds`),
    );
    project.techniqueRequirements.forEach((id) =>
      reference("artifact", id, `projects.${index}.techniqueRequirements`),
    );
    project.outputArtifactIds.forEach((id) =>
      reference("artifact", id, `projects.${index}.outputArtifactIds`),
    );
    project.allowedApproachIds.forEach((id) => {
      if (!content.approaches.some((approach) => approach.id === id))
        issues.push({
          severity: "error",
          code: "UNKNOWN_REFERENCE",
          path: `projects.${index}.allowedApproachIds`,
          message: `Unknown approach reference ${id}`,
        });
    });
  });
  content.upgrades.forEach((upgrade, index) => {
    visitCondition(
      upgrade.unlockCondition,
      `upgrades.${index}.unlockCondition`,
      references,
      issues,
    );
    Object.keys(upgrade.cost).forEach((id) =>
      reference("resource", id, `upgrades.${index}.cost`),
    );
    upgrade.effects.forEach((effect, effectIndex) => {
      const path = `upgrades.${index}.effects.${effectIndex}`;
      visitCondition(
        effect.activation,
        `${path}.activation`,
        references,
        issues,
      );
      const sourceKind =
        effect.source.kind === "method" ? "artifact" : effect.source.kind;
      reference(sourceKind, effect.source.id, `${path}.source`);
      if (effect.source.kind === "upgrade" && effect.source.id !== upgrade.id)
        issues.push({
          severity: "error",
          code: "EFFECT_OWNER_MISMATCH",
          path: `${path}.source`,
          message: "An upgrade effect must name its owning upgrade",
        });
      if (effect.target.kind === "activityRate")
        reference("activity", effect.target.id, `${path}.target`);
      if (effect.target.kind === "resourceCap")
        reference("resource", effect.target.id, `${path}.target`);
      if (effect.target.kind === "project" && effect.target.id !== "*")
        reference("project", effect.target.id, `${path}.target`);
      if (effect.target.kind === "publication")
        reference("chapter", effect.target.chapterId, `${path}.target`);
      if (!expectedOperations(effect).includes(effect.operation))
        issues.push({
          severity: "error",
          code: "EFFECT_TARGET_OPERATION",
          path,
          message: `${effect.operation} is incompatible with ${effect.target.kind}`,
        });
      if (effect.target.kind === "project" && effect.target.id === "*")
        issues.push({
          severity: "error",
          code: "GLOBAL_PROJECT_SPEED",
          path,
          message: "Global wildcard project-speed effects are forbidden",
        });
    });
  });
  content.milestones.forEach((entry, index) => {
    visitCondition(
      entry.condition,
      `milestones.${index}.condition`,
      references,
      issues,
    );
    entry.effects.forEach((effect, effectIndex) => {
      const path = `milestones.${index}.effects.${effectIndex}`;
      visitCondition(
        effect.activation,
        `${path}.activation`,
        references,
        issues,
      );
      const sourceKind =
        effect.source.kind === "method" ? "artifact" : effect.source.kind;
      reference(sourceKind, effect.source.id, `${path}.source`);
      if (effect.source.kind !== "milestone" || effect.source.id !== entry.id)
        issues.push({
          severity: "error",
          code: "EFFECT_OWNER_MISMATCH",
          path: `${path}.source`,
          message: "A milestone effect must name its owning milestone",
        });
      if (effect.target.kind === "activityRate")
        reference("activity", effect.target.id, `${path}.target`);
      if (effect.target.kind === "resourceCap")
        reference("resource", effect.target.id, `${path}.target`);
      if (effect.target.kind === "project" && effect.target.id !== "*")
        reference("project", effect.target.id, `${path}.target`);
      if (effect.target.kind === "publication")
        reference("chapter", effect.target.chapterId, `${path}.target`);
      if (!expectedOperations(effect).includes(effect.operation))
        issues.push({
          severity: "error",
          code: "EFFECT_TARGET_OPERATION",
          path,
          message: `${effect.operation} is incompatible with ${effect.target.kind}`,
        });
      if (effect.target.kind === "project" && effect.target.id === "*")
        issues.push({
          severity: "error",
          code: "GLOBAL_PROJECT_SPEED",
          path,
          message: "Global wildcard project-speed effects are forbidden",
        });
    });
  });
  content.achievements.forEach((entry, index) =>
    visitCondition(
      entry.condition,
      `achievements.${index}.condition`,
      references,
      issues,
    ),
  );
  content.chapters.forEach((chapter, index) => {
    chapter.projectIds.forEach((id) =>
      reference("project", id, `chapters.${index}.projectIds`),
    );
    chapter.capstoneEdges.forEach((edge, edgeIndex) =>
      reference(
        "artifact",
        edge.requiredArtifactId,
        `chapters.${index}.capstoneEdges.${edgeIndex}`,
      ),
    );
    const publication = chapter.publication;
    if (publication.chapterId !== chapter.id)
      issues.push({
        severity: "error",
        code: "PUBLICATION_CHAPTER_MISMATCH",
        path: `chapters.${index}.publication.chapterId`,
        message: "Publication chapter ID must match its owner",
      });
    publication.requiredProjectIds.forEach((id) =>
      reference(
        "project",
        id,
        `chapters.${index}.publication.requiredProjectIds`,
      ),
    );
    publication.resetResourceIds.forEach((id) =>
      reference(
        "resource",
        id,
        `chapters.${index}.publication.resetResourceIds`,
      ),
    );
    publication.retainedArtifactIds.forEach((id) =>
      reference(
        "artifact",
        id,
        `chapters.${index}.publication.retainedArtifactIds`,
      ),
    );
    const edgeIds = new Set(
      chapter.capstoneEdges.map((edge) => edge.id as string),
    );
    publication.requiredCapstoneEdgeIds.forEach((id) => {
      if (!edgeIds.has(id))
        issues.push({
          severity: "error",
          code: "UNKNOWN_REFERENCE",
          path: `chapters.${index}.publication.requiredCapstoneEdgeIds`,
          message: `Unknown capstone edge reference ${id}`,
        });
    });
  });

  for (const item of references) {
    if (!sets[item.kind].has(item.id))
      issues.push({
        severity: "error",
        code: "UNKNOWN_REFERENCE",
        path: item.path,
        message: `Unknown ${item.kind} reference ${item.id}`,
      });
  }

  const cycle = findProjectCycle(content);
  if (cycle.length > 0)
    issues.push({
      severity: "error",
      code: "PROJECT_CYCLE",
      path: "projects",
      message: cycle.join(" -> "),
    });

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
    effects: effects.length,
  };
  const expected: Record<string, number> = {
    projects: 12,
    upgrades: 15,
    milestones: 11,
    achievements: 10,
    approaches: 3,
  };
  for (const [key, count] of Object.entries(expected)) {
    if (counts[key] !== count)
      issues.push({
        severity: "error",
        code: "FIXTURE_COUNT",
        path: key,
        message: `Expected ${count}, received ${counts[key]}`,
      });
  }
  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
    counts,
  };
}
