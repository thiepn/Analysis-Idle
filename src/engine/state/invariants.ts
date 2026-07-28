import type { GameContent } from "../../shared/contracts";
import { validateRngState } from "../rng/xoshiro";
import { ENGINE_SCHEMA_VERSION, type GameState } from "./game-state";

const unique = (values: readonly unknown[]): boolean =>
  new Set(values).size === values.length;

export function collectInvariantViolations(
  state: GameState,
  content: GameContent,
): string[] {
  const violations: string[] = [];
  if (state.schemaVersion !== ENGINE_SCHEMA_VERSION)
    violations.push("save schema version is unsupported");
  if (state.contentVersion !== content.contentVersion)
    violations.push("content version is incompatible with the active content");
  if (!Number.isSafeInteger(state.sequence) || state.sequence < 0)
    violations.push("sequence must be a non-negative safe integer");
  if (!Number.isFinite(state.logicalTimeMs) || state.logicalTimeMs < 0)
    violations.push("logical time must be finite and non-negative");

  const resourceIds = new Set(
    content.resources.map((entry) => entry.id as string),
  );
  for (const [id, value] of Object.entries(state.resources)) {
    if (!resourceIds.has(id)) violations.push(`resource ${id} is not defined`);
    if (!Number.isFinite(value) || value < 0)
      violations.push(`resource ${id} must be finite and non-negative`);
  }
  for (const resource of content.resources) {
    if (!(resource.id in state.resources))
      violations.push(`required resource ${resource.id} is missing`);
    const reserve = state.resourceReserves[resource.id];
    if (reserve === undefined || !Number.isFinite(reserve) || reserve < 0)
      violations.push(
        `resource reserve ${resource.id} must be finite and non-negative`,
      );
  }
  for (const id of Object.keys(state.resourceReserves))
    if (!resourceIds.has(id))
      violations.push(`resource reserve ${id} is not defined`);

  if (
    !Number.isInteger(state.attention.capacity) ||
    state.attention.capacity < 0 ||
    state.attention.capacity > content.configuration.attention.maximumCapacity
  )
    violations.push("attention capacity outside configured bounds");
  const allocated = Object.values(state.attention.allocations).reduce(
    (sum, value) => sum + value,
    0,
  );
  if (
    Object.values(state.attention.allocations).some(
      (value) => !Number.isInteger(value) || value < 0,
    )
  )
    violations.push("attention allocations must be non-negative integers");
  if (allocated > state.attention.capacity)
    violations.push("attention allocation exceeds capacity");

  const activityIds = new Set(
    content.activities.map((entry) => entry.id as string),
  );
  for (const activity of content.activities) {
    if (!(activity.id in state.activityEnabled))
      violations.push(`activity flag ${activity.id} is missing`);
    if (!(activity.id in state.activityProduction))
      violations.push(`activity ledger ${activity.id} is missing`);
  }
  for (const [id, enabled] of Object.entries(state.activityEnabled)) {
    if (!activityIds.has(id))
      violations.push(`activity flag ${id} is not defined`);
    if (typeof enabled !== "boolean")
      violations.push(`activity flag ${id} must be boolean`);
  }
  for (const [id, ledger] of Object.entries(state.activityProduction)) {
    if (!activityIds.has(id))
      violations.push(`activity ledger ${id} is not defined`);
    if (
      ![
        ledger.segmentElapsedMs,
        ledger.segmentProduced,
        ledger.ratePerSecond,
      ].every((value) => Number.isFinite(value) && value >= 0)
    )
      violations.push(`activity ${id} has an invalid production ledger`);
  }

  if (
    Object.values(state.projects).filter(
      (project) => project.status === "active",
    ).length > 1
  )
    violations.push("dedicated project slot has multiple active projects");
  const projectIds = new Set(
    content.projects.map((entry) => entry.id as string),
  );
  for (const definition of content.projects)
    if (!(definition.id in state.projects))
      violations.push(`required project ${definition.id} is missing`);
  for (const [key, project] of Object.entries(state.projects)) {
    const definition = content.projects.find(
      (candidate) => candidate.id === project.id,
    );
    if (!projectIds.has(key) || !definition)
      violations.push(`project ${project.id} is not defined`);
    else if (!definition.allowedApproachIds.includes(project.approachId))
      violations.push(`project ${project.id} selected an undefined approach`);
    if (!Number.isFinite(project.progress) || project.progress < 0)
      violations.push(`project ${project.id} has invalid progress`);
    if (
      ![
        project.progressSegmentElapsedMs,
        project.progressSegmentStart,
        project.progressRatePerSecond,
      ].every((value) => Number.isFinite(value) && value >= 0)
    )
      violations.push(`project ${project.id} has an invalid progress ledger`);
    if (!Number.isSafeInteger(project.starts) || project.starts < 0)
      violations.push(`project ${project.id} has an invalid start count`);
    if (
      !unique(project.approachesSeen) ||
      project.approachesSeen.some(
        (approachId) =>
          !content.approaches.some((approach) => approach.id === approachId),
      )
    )
      violations.push(`project ${project.id} has invalid approach history`);
    if (typeof project.insightSpentThisRun !== "boolean")
      violations.push(`project ${project.id} has an invalid Insight-use flag`);
    if (
      ![
        "locked",
        "available",
        "queued",
        "active",
        "paused",
        "completed",
        "cancelled",
      ].includes(project.status)
    )
      violations.push(`project ${project.id} has an invalid status`);
    if (
      ![project.reservedPrecision, project.reservedIntuition].every(
        (value) => Number.isFinite(value) && value >= 0,
      )
    )
      violations.push(`project ${project.id} has invalid reserved inputs`);
  }

  if (
    !Number.isSafeInteger(state.insight) ||
    state.insight < 0 ||
    state.insight > content.configuration.insight.cap ||
    !Number.isSafeInteger(state.insightSpent) ||
    state.insightSpent < 0
  )
    violations.push("Insight values must be bounded whole charge counts");
  if (
    !unique(state.insightReveals ?? []) ||
    (state.insightReveals ?? []).some((projectId) => !state.projects[projectId])
  )
    violations.push("Insight reveals must reference unique known projects");
  if (!Number.isFinite(state.understanding) || state.understanding < 0)
    violations.push(
      "Understanding must be finite, non-negative, and monotonic",
    );
  if (
    state.completionBehavior !== "pause" &&
    state.completionBehavior !== "startNextFunded"
  )
    violations.push("completion behavior is invalid");
  if (
    typeof state.settings?.reducedMotion !== "boolean" ||
    !["full", "subtle", "none"].includes(state.settings?.animationIntensity) ||
    typeof state.settings?.highContrast !== "boolean" ||
    typeof state.settings?.compactLayout !== "boolean" ||
    typeof state.settings?.confirmations !== "boolean" ||
    !["plain", "unicode"].includes(state.settings?.notation) ||
    !["standard", "reduced"].includes(state.settings?.updateRate) ||
    !["standard", "compact"].includes(state.settings?.numberFormat) ||
    !["standard", "large"].includes(state.settings?.textScale) ||
    !["essential", "all"].includes(state.settings?.announcementVerbosity) ||
    !["summary", "detailed"].includes(state.settings?.offlineSummaryDetail) ||
    !["guided", "expanded"].includes(state.settings?.mathExplanationDepth)
  )
    violations.push("settings contain invalid values");

  if (!unique(state.projectQueue))
    violations.push("project queue contains duplicates");
  if (
    state.projectQueue.length > content.configuration.automation.queueCapacity
  )
    violations.push("project queue exceeds configured capacity");
  for (const projectId of state.projectQueue) {
    if (!state.projects[projectId])
      violations.push(`queue references unknown project ${projectId}`);
    else if (state.projects[projectId].status !== "queued")
      violations.push(`queued project ${projectId} has inconsistent status`);
  }
  const automationCapabilities = new Set([
    "queue",
    "completionBehavior",
    "resourceReserve",
    "orderedPriority",
    "safeOfflinePolicy",
  ]);
  if (
    !unique(state.automationPriority) ||
    state.automationPriority.some((entry) => !automationCapabilities.has(entry))
  )
    violations.push(
      "automation priority contains duplicates or unknown capabilities",
    );

  if (!unique(state.ownedUpgrades))
    violations.push("owned upgrades contain duplicates");
  for (const id of state.ownedUpgrades)
    if (!content.upgrades.some((entry) => entry.id === id))
      violations.push(`owned upgrade ${id} is undefined`);
  if (!unique(state.reachedMilestones))
    violations.push("milestones contain duplicates");
  for (const id of state.reachedMilestones)
    if (!content.milestones.some((entry) => entry.id === id))
      violations.push(`milestone ${id} is undefined`);
  if (!unique(state.recordedAchievements))
    violations.push("achievements contain duplicates");
  for (const id of state.recordedAchievements)
    if (!content.achievements.some((entry) => entry.id === id))
      violations.push(`achievement ${id} is undefined`);
  if (!unique(state.ownedArtifacts))
    violations.push("Technique artifacts contain duplicates");
  for (const id of state.ownedArtifacts)
    if (!content.techniqueArtifacts.some((entry) => entry.id === id))
      violations.push(`Technique artifact ${id} is undefined`);
  for (const [artifactId, record] of Object.entries(state.techniqueRecords)) {
    const artifact = content.techniqueArtifacts.find(
      (entry) => entry.id === artifactId,
    );
    const approach = content.approaches.find(
      (entry) => entry.id === record.approachId,
    );
    if (!artifact || !state.ownedArtifacts.includes(artifact.id))
      violations.push(`Technique record ${artifactId} lacks owned content`);
    else if (record.sourceProjectId !== artifact.sourceProjectId)
      violations.push(
        `Technique record ${artifactId} has the wrong source project`,
      );
    if (!approach || approach.outputKind !== record.outputKind)
      violations.push(
        `Technique record ${artifactId} has an invalid approach output`,
      );
    if (
      !Number.isFinite(record.acquiredAtLogicalTimeMs) ||
      record.acquiredAtLogicalTimeMs < 0
    )
      violations.push(
        `Technique record ${artifactId} has invalid acquisition time`,
      );
  }

  const edgeIds = new Set(
    content.chapters.flatMap((chapter) =>
      chapter.capstoneEdges.map((edge) => edge.id as string),
    ),
  );
  if (!unique(state.assembledCapstoneEdges))
    violations.push("assembled capstone edges contain duplicates");
  for (const id of state.assembledCapstoneEdges)
    if (!edgeIds.has(id)) violations.push(`capstone edge ${id} is undefined`);

  for (const chapter of content.chapters)
    if (!(chapter.id in state.chapters))
      violations.push(`required chapter ${chapter.id} is missing`);
  for (const [chapterId, status] of Object.entries(state.chapters)) {
    const chapter = content.chapters.find(
      (candidate) => candidate.id === chapterId,
    );
    if (!chapter) violations.push(`chapter ${chapterId} is undefined`);
    else if (
      ![
        "locked",
        "active",
        "publicationReady",
        "published",
        "archived",
      ].includes(status)
    )
      violations.push(`chapter ${chapterId} has an invalid status`);
    else if (
      status === "published" &&
      !state.masteryArtifacts.includes(chapter.publication.masteryArtifactId)
    )
      violations.push(
        `published chapter ${chapterId} lacks its Mastery artifact`,
      );
  }

  for (const modifier of state.insightModifiers)
    if (
      !Number.isFinite(modifier.magnitude) ||
      modifier.magnitude <= 0 ||
      modifier.magnitude > content.configuration.insight.ceiling ||
      !Number.isFinite(modifier.expiresAtLogicalTimeMs) ||
      modifier.expiresAtLogicalTimeMs <= state.logicalTimeMs
    )
      violations.push(`Insight modifier ${modifier.id} is invalid or expired`);
  for (const [key, value] of Object.entries(state.records)) {
    const elapsed = key === "totalActiveMs" || key === "totalOfflineCreditedMs";
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      (!elapsed && !Number.isSafeInteger(value))
    )
      violations.push("records must contain finite non-negative counters");
  }
  try {
    validateRngState(state.rng);
  } catch {
    violations.push("RNG state is invalid");
  }
  return violations;
}

export function assertInvariants(state: GameState, content: GameContent): void {
  const violations = collectInvariantViolations(state, content);
  if (violations.length > 0)
    throw new Error(`GameState invariant violation: ${violations.join("; ")}`);
}
