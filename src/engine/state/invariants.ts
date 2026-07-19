import type { GameContent } from "../../shared/contracts";
import { validateRngState } from "../rng/xoshiro";
import { ENGINE_SCHEMA_VERSION, type GameState } from "./game-state";

export function collectInvariantViolations(
  state: GameState,
  content: GameContent,
): string[] {
  const violations: string[] = [];
  if (state.schemaVersion !== ENGINE_SCHEMA_VERSION)
    violations.push("save schema version is unsupported");
  if (!Number.isSafeInteger(state.sequence) || state.sequence < 0)
    violations.push("sequence must be a non-negative safe integer");
  if (!Number.isFinite(state.logicalTimeMs) || state.logicalTimeMs < 0)
    violations.push("logical time must be finite and non-negative");
  for (const [id, value] of Object.entries(state.resources)) {
    if (!Number.isFinite(value) || value < 0)
      violations.push(`resource ${id} must be finite and non-negative`);
  }
  if (
    !Number.isInteger(state.attention.capacity) ||
    state.attention.capacity < 0 ||
    state.attention.capacity > content.configuration.attention.maximumCapacity
  ) {
    violations.push("attention capacity outside configured bounds");
  }
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
  for (const [id, ledger] of Object.entries(state.activityProduction)) {
    if (
      ![
        ledger.segmentElapsedMs,
        ledger.segmentProduced,
        ledger.ratePerSecond,
      ].every((value) => Number.isFinite(value) && value >= 0)
    )
      violations.push(`activity ${id} has an invalid production ledger`);
  }
  if (allocated > state.attention.capacity)
    violations.push("attention allocation exceeds capacity");
  if (
    Object.values(state.projects).filter(
      (project) => project.status === "active",
    ).length > 1
  )
    violations.push("dedicated project slot has multiple active projects");
  for (const project of Object.values(state.projects)) {
    const definition = content.projects.find(
      (candidate) => candidate.id === project.id,
    );
    if (!definition) violations.push(`project ${project.id} is not defined`);
    else if (!definition.allowedApproachIds.includes(project.approachId))
      violations.push(`project ${project.id} selected an undefined approach`);
    if (!Number.isFinite(project.progress) || project.progress < 0)
      violations.push(`project ${project.id} has invalid progress`);
    if (
      ![project.reservedPrecision, project.reservedIntuition].every(
        (value) => Number.isFinite(value) && value >= 0,
      )
    )
      violations.push(`project ${project.id} has invalid reserved inputs`);
  }
  if (
    !Number.isFinite(state.insight) ||
    state.insight < 0 ||
    state.insight > content.configuration.insight.cap
  )
    violations.push("Insight outside configured bounds");
  if (!Number.isFinite(state.understanding) || state.understanding < 0)
    violations.push(
      "Understanding must be finite, non-negative, and monotonic",
    );
  if (new Set(state.projectQueue).size !== state.projectQueue.length)
    violations.push("project queue contains duplicates");
  for (const projectId of state.projectQueue) {
    if (!state.projects[projectId])
      violations.push(`queue references unknown project ${projectId}`);
    else if (state.projects[projectId].status !== "queued")
      violations.push(`queued project ${projectId} has inconsistent status`);
  }
  for (const upgradeId of state.ownedUpgrades)
    if (!content.upgrades.some((upgrade) => upgrade.id === upgradeId))
      violations.push(`owned upgrade ${upgradeId} is undefined`);
  for (const milestoneId of state.reachedMilestones)
    if (!content.milestones.some((milestone) => milestone.id === milestoneId))
      violations.push(`milestone ${milestoneId} is undefined`);
  for (const achievementId of state.recordedAchievements)
    if (
      !content.achievements.some(
        (achievement) => achievement.id === achievementId,
      )
    )
      violations.push(`achievement ${achievementId} is undefined`);
  for (const artifactId of state.ownedArtifacts)
    if (
      !content.techniqueArtifacts.some((artifact) => artifact.id === artifactId)
    )
      violations.push(`Technique artifact ${artifactId} is undefined`);
  for (const [chapterId, status] of Object.entries(state.chapters)) {
    const chapter = content.chapters.find(
      (candidate) => candidate.id === chapterId,
    );
    if (!chapter) violations.push(`chapter ${chapterId} is undefined`);
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
