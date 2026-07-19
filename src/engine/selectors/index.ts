import type {
  ApproachId,
  GameContent,
  ProjectId,
  ResourceId,
  TechniqueArtifactId,
  UpgradeId,
} from "../../shared/contracts";
import { evaluateCondition } from "../conditions/evaluate";
import {
  activeEffects,
  resolveActivityRate,
  resolveProjectSpeed,
} from "../effects/resolve";
import type { GameState } from "../state/game-state";

export const selectAttention = (state: GameState) => {
  const allocated = Object.values(state.attention.allocations).reduce(
    (sum, value) => sum + value,
    0,
  );
  return {
    capacity: state.attention.capacity,
    allocated,
    available: state.attention.capacity - allocated,
  };
};

export const selectResource = (
  state: GameState,
  content: GameContent,
  resourceId: ResourceId,
) => ({
  total: state.resources[resourceId] ?? 0,
  rate: content.activities
    .filter((activity) => activity.resourceId === resourceId)
    .reduce(
      (sum, activity) =>
        sum + resolveActivityRate(activity.id, state, content).rate,
      0,
    ),
});

export function selectProjectAvailability(
  state: GameState,
  content: GameContent,
  projectId: ProjectId,
) {
  const definition = content.projects.find(
    (candidate) => candidate.id === projectId,
  );
  if (!definition) return { available: false, reasons: ["Unknown project"] };
  const reasons: string[] = [];
  for (const prerequisite of definition.prerequisiteProjectIds) {
    if (state.projects[prerequisite]?.status !== "completed")
      reasons.push(`Complete ${prerequisite}`);
  }
  for (const artifact of definition.techniqueRequirements) {
    if (!state.ownedArtifacts.includes(artifact))
      reasons.push(`Own Technique artifact ${artifact}`);
  }
  return { available: reasons.length === 0, reasons };
}

export function selectProjectDeficits(
  state: GameState,
  content: GameContent,
  projectId: ProjectId,
  approachId?: ApproachId,
) {
  const definition = content.projects.find(
    (candidate) => candidate.id === projectId,
  );
  if (!definition)
    return {
      PRECISION: Number.POSITIVE_INFINITY,
      INTUITION: Number.POSITIVE_INFINITY,
    };
  const selected =
    approachId ??
    state.projects[projectId]?.approachId ??
    definition.allowedApproachIds[0]!;
  const approach = content.approaches.find(
    (candidate) => candidate.id === selected,
  )!;
  return {
    PRECISION: Math.max(
      0,
      definition.precisionRequirement *
        approach.precisionRequirementMultiplier -
        (state.resources.PRECISION ?? 0),
    ),
    INTUITION: Math.max(
      0,
      definition.intuitionRequirement *
        approach.intuitionRequirementMultiplier -
        (state.resources.INTUITION ?? 0),
    ),
  };
}

export function selectProjectProgress(
  state: GameState,
  content: GameContent,
  projectId: ProjectId,
) {
  const runtime = state.projects[projectId];
  const definition = content.projects.find(
    (candidate) => candidate.id === projectId,
  );
  if (!runtime || !definition)
    return { fraction: 0, etaSeconds: null, progress: 0, required: 0 };
  const speed = resolveProjectSpeed(projectId, state, content);
  const approach = content.approaches.find(
    (candidate) => candidate.id === runtime.approachId,
  )!;
  const required = definition.workRequired * approach.workMultiplier;
  return {
    fraction: required === 0 ? 1 : runtime.progress / required,
    etaSeconds:
      runtime.status === "active" && speed > 0
        ? (required - runtime.progress) / speed
        : null,
    progress: runtime.progress,
    required,
  };
}

export function selectApproachComparison(
  state: GameState,
  content: GameContent,
  projectId: ProjectId,
) {
  const definition = content.projects.find(
    (candidate) => candidate.id === projectId,
  );
  return (definition?.allowedApproachIds ?? []).map((approachId) => {
    const approach = content.approaches.find(
      (candidate) => candidate.id === approachId,
    )!;
    return {
      approachId,
      precisionRequirement:
        (definition?.precisionRequirement ?? 0) *
        approach.precisionRequirementMultiplier,
      intuitionRequirement:
        (definition?.intuitionRequirement ?? 0) *
        approach.intuitionRequirementMultiplier,
      workRequired: (definition?.workRequired ?? 0) * approach.workMultiplier,
    };
  });
}

export function selectArtifactCompatibility(
  content: GameContent,
  artifactId: TechniqueArtifactId,
  projectId: ProjectId,
): boolean {
  return (
    content.techniqueArtifacts
      .find((artifact) => artifact.id === artifactId)
      ?.compatibleProjectIds.includes(projectId) ?? false
  );
}

export const selectAvailableUpgrades = (
  state: GameState,
  content: GameContent,
) =>
  content.upgrades.filter(
    (upgrade) =>
      !state.ownedUpgrades.includes(upgrade.id) &&
      evaluateCondition(upgrade.unlockCondition, state, content).met,
  );

export function selectUpgradePreview(
  state: GameState,
  content: GameContent,
  upgradeId: UpgradeId,
) {
  const upgrade = content.upgrades.find(
    (candidate) => candidate.id === upgradeId,
  );
  return (
    upgrade?.effects.map((effect) => ({
      id: effect.id,
      operation: effect.operation,
      magnitude: effect.magnitude,
      target: effect.target,
    })) ?? []
  );
}

export const selectMilestoneProgress = (
  state: GameState,
  content: GameContent,
) =>
  content.milestones.map((milestone) => ({
    id: milestone.id,
    reached: state.reachedMilestones.includes(milestone.id),
    evaluation: evaluateCondition(milestone.condition, state, content),
  }));

export const selectAchievementStatus = (
  state: GameState,
  content: GameContent,
) =>
  content.achievements.map((achievement) => ({
    id: achievement.id,
    recorded: state.recordedAchievements.includes(achievement.id),
    evaluation: evaluateCondition(achievement.condition, state, content),
  }));

export const selectInsight = (state: GameState, content: GameContent) => ({
  value: state.insight,
  cap: content.configuration.insight.cap,
  spent: state.insightSpent,
});
export const selectAutomationTrace = (state: GameState) =>
  state.automationTrace;

export function selectCapstone(
  state: GameState,
  content: GameContent,
  chapterId: string,
) {
  const chapter = content.chapters.find(
    (candidate) => candidate.id === chapterId,
  );
  const edges =
    chapter?.capstoneEdges.map((edge) => ({
      id: edge.id,
      assembled: state.assembledCapstoneEdges.includes(edge.id),
      artifactOwned: state.ownedArtifacts.includes(edge.requiredArtifactId),
    })) ?? [];
  return {
    edges,
    complete: edges.length > 0 && edges.every((edge) => edge.assembled),
  };
}

export function selectPublicationReadiness(
  state: GameState,
  content: GameContent,
  chapterId: string,
) {
  const chapter = content.chapters.find(
    (candidate) => candidate.id === chapterId,
  );
  if (!chapter) return { ready: false, missing: ["Unknown chapter"] };
  const missing = [
    ...chapter.publication.requiredProjectIds
      .filter((id) => state.projects[id]?.status !== "completed")
      .map((id) => `Complete ${id}`),
    ...chapter.publication.requiredCapstoneEdgeIds
      .filter((id) => !state.assembledCapstoneEdges.includes(id))
      .map((id) => `Assemble ${id}`),
  ];
  return {
    ready: missing.length === 0 && state.chapters[chapter.id] !== "published",
    missing,
  };
}

export const selectEffectDecomposition = (
  state: GameState,
  content: GameContent,
) => activeEffects(state, content);
export const selectDiagnostics = (state: GameState) => state.diagnostics;
