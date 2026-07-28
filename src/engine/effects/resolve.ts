import type {
  ActivityId,
  AutomationCapability,
  EffectDefinition,
  GameContent,
  ApproachId,
  ProjectDefinition,
  ProjectId,
  ResourceId,
} from "../../shared/contracts";
import { evaluateCondition } from "../conditions/evaluate";
import type { GameState } from "../state/game-state";

export interface EffectContribution {
  effectId: string;
  sourceId: string;
  operation: EffectDefinition["operation"];
  magnitude: number;
  applied: boolean;
  reason: string;
}

function sourceOwned(effect: EffectDefinition, state: GameState): boolean {
  if (effect.source.kind === "upgrade")
    return state.ownedUpgrades.includes(effect.source.id as never);
  if (effect.source.kind === "milestone")
    return state.reachedMilestones.includes(effect.source.id as never);
  if (effect.source.kind === "artifact" || effect.source.kind === "method")
    return state.ownedArtifacts.includes(effect.source.id as never);
  return false;
}

const ordinalCompare = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

export function activeEffects(
  state: GameState,
  content: GameContent,
): EffectDefinition[] {
  return [
    ...content.upgrades.flatMap((upgrade) => upgrade.effects),
    ...content.milestones.flatMap((milestone) => milestone.effects),
  ]
    .filter(
      (effect) =>
        sourceOwned(effect, state) &&
        evaluateCondition(effect.activation, state, content).met,
    )
    .sort(
      (left, right) =>
        left.priority - right.priority ||
        ordinalCompare(left.stackingGroup, right.stackingGroup) ||
        ordinalCompare(left.id, right.id),
    );
}

export function hasAutomationCapability(
  state: GameState,
  content: GameContent,
  capability: AutomationCapability,
): boolean {
  return activeEffects(state, content).some(
    (effect) =>
      effect.target.kind === "automation" &&
      effect.target.capability === capability &&
      effect.operation === "automationUnlock",
  );
}

export function hasInformationCapability(
  state: GameState,
  content: GameContent,
  capability: string,
): boolean {
  return activeEffects(state, content).some(
    (effect) =>
      effect.target.kind === "information" &&
      effect.target.capability === capability &&
      effect.operation === "informationUnlock",
  );
}

export function resolveActivityRate(
  activityId: ActivityId,
  state: GameState,
  content: GameContent,
): { rate: number; contributions: EffectContribution[] } {
  const activity = content.activities.find(
    (candidate) => candidate.id === activityId,
  );
  const unlockedByEffect = activeEffects(state, content).some(
    (effect) =>
      effect.target.kind === "information" &&
      effect.target.capability === `activity:${activityId}`,
  );
  if (!activity || (!state.activityEnabled[activityId] && !unlockedByEffect))
    return { rate: 0, contributions: [] };
  const allocation = state.attention.allocations[activityId] ?? 0;
  let rate =
    activity.baseRatePerSecond *
    allocation ** content.configuration.attention.activityExponent;
  const contributions: EffectContribution[] = [];
  const matching = activeEffects(state, content).filter(
    (effect) =>
      effect.target.kind === "activityRate" && effect.target.id === activityId,
  );
  const apply = (effect: EffectDefinition, before: number): void => {
    contributions.push({
      effectId: effect.id,
      sourceId: effect.source.id,
      operation: effect.operation,
      magnitude: effect.magnitude,
      applied: before !== rate,
      reason: "owned and active",
    });
  };

  for (const effect of matching.filter(
    (entry) => entry.operation === "flatAdd",
  )) {
    const before = rate;
    rate += effect.magnitude;
    apply(effect, before);
  }

  const grouped = new Map<string, EffectDefinition[]>();
  for (const effect of matching.filter(
    (entry) => entry.operation === "groupAddPercent",
  )) {
    const group = grouped.get(effect.stackingGroup) ?? [];
    group.push(effect);
    grouped.set(effect.stackingGroup, group);
  }
  for (const group of [...grouped.keys()].sort(ordinalCompare)) {
    const effects = grouped.get(group)!;
    const before = rate;
    rate *= 1 + effects.reduce((sum, effect) => sum + effect.magnitude, 0);
    effects.forEach((effect) => apply(effect, before));
  }

  for (const effect of matching.filter(
    (entry) => entry.operation === "namedMultiply",
  )) {
    const before = rate;
    rate *= effect.magnitude;
    apply(effect, before);
  }
  for (const effect of matching.filter(
    (entry) => entry.operation === "power",
  )) {
    const before = rate;
    rate **= effect.magnitude;
    apply(effect, before);
  }

  const insightMagnitude = Math.min(
    content.configuration.insight.ceiling,
    state.insightModifiers
      .filter(
        (modifier) => modifier.expiresAtLogicalTimeMs > state.logicalTimeMs,
      )
      .reduce((sum, modifier) => sum + modifier.magnitude, 0),
  );
  // Legacy Phase 1 saves can contain expiring modifiers, but Insight is no
  // longer permitted to hide an activity-rate bonus. Keep them inert until
  // they expire so old saves remain readable.
  void insightMagnitude;

  const caps = matching.flatMap((effect) => [
    ...(effect.operation === "cap" ? [effect.magnitude] : []),
    ...(effect.cap === null ? [] : [effect.cap]),
  ]);
  if (caps.length > 0) rate = Math.min(rate, ...caps);
  if (!Number.isFinite(rate) || rate < 0)
    throw new RangeError(`Resolved activity rate is invalid for ${activityId}`);
  return { rate, contributions };
}

export function resolveResourceCap(
  resourceId: ResourceId,
  state: GameState,
  content: GameContent,
): number {
  const base =
    content.resources.find((resource) => resource.id === resourceId)?.cap ?? 0;
  return activeEffects(state, content).reduce((cap, effect) => {
    if (effect.target.kind !== "resourceCap" || effect.target.id !== resourceId)
      return cap;
    if (effect.operation === "cap") return Math.max(cap, effect.magnitude);
    if (effect.operation === "flatAdd") return cap + effect.magnitude;
    return cap;
  }, base);
}

export function resolveProjectSpeed(
  projectId: ProjectId,
  state: GameState,
  content: GameContent,
): number {
  let speed = content.configuration.projects.baseSpeedPerSecond;
  for (const effect of activeEffects(state, content)) {
    if (
      effect.target.kind === "project" &&
      (effect.target.id === projectId || effect.target.id === "*") &&
      effect.operation === "projectSpeed"
    ) {
      speed *= effect.magnitude;
    }
  }
  return speed;
}

export function resolveProjectRequirements(
  definition: ProjectDefinition,
  approachId: ApproachId,
  state: GameState,
  content: GameContent,
): { precision: number; intuition: number; work: number } {
  const approach = content.approaches.find(
    (candidate) => candidate.id === approachId,
  );
  if (!approach) throw new Error(`Unknown approach ${approachId}`);
  const outputKinds = new Set(
    content.techniqueArtifacts
      .filter(
        (artifact) =>
          state.ownedArtifacts.includes(artifact.id) &&
          artifact.compatibleProjectIds.includes(definition.id),
      )
      .map((artifact) => state.techniqueRecords[artifact.id]?.outputKind)
      .filter(
        (kind): kind is "lemma" | "reveal" | "template" => kind !== undefined,
      ),
  );
  const bonuses = content.configuration.projects.techniqueOutputBonuses;
  return {
    precision:
      definition.precisionRequirement *
      approach.precisionRequirementMultiplier *
      (outputKinds.has("lemma") ? 1 - bonuses.lemmaPrecisionDiscount : 1),
    intuition:
      definition.intuitionRequirement *
      approach.intuitionRequirementMultiplier *
      (outputKinds.has("reveal") ? 1 - bonuses.revealIntuitionDiscount : 1),
    work:
      definition.workRequired *
      approach.workMultiplier *
      (outputKinds.has("template") ? 1 - bonuses.templateWorkDiscount : 1),
  };
}
