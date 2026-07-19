import type {
  ActivityId,
  EffectDefinition,
  GameContent,
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
  if (effect.source.kind === "artifact")
    return state.ownedArtifacts.includes(effect.source.id as never);
  return true;
}

export function activeEffects(
  state: GameState,
  content: GameContent,
): EffectDefinition[] {
  return content.upgrades
    .flatMap((upgrade) => upgrade.effects)
    .filter(
      (effect) =>
        sourceOwned(effect, state) &&
        evaluateCondition(effect.activation, state, content).met,
    )
    .sort(
      (left, right) =>
        left.priority - right.priority ||
        left.stackingGroup.localeCompare(right.stackingGroup) ||
        left.id.localeCompare(right.id),
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
  for (const effect of activeEffects(state, content)) {
    if (
      effect.target.kind !== "activityRate" ||
      effect.target.id !== activityId
    )
      continue;
    const before = rate;
    if (effect.operation === "flatAdd") rate += effect.magnitude;
    else if (effect.operation === "groupAddPercent")
      rate *= 1 + effect.magnitude;
    else if (effect.operation === "namedMultiply") rate *= effect.magnitude;
    else if (effect.operation === "power") rate = rate ** effect.magnitude;
    if (effect.cap !== null) rate = Math.min(rate, effect.cap);
    contributions.push({
      effectId: effect.id,
      sourceId: effect.source.id,
      operation: effect.operation,
      magnitude: effect.magnitude,
      applied: before !== rate,
      reason: "owned and active",
    });
  }
  const insightMagnitude = Math.min(
    content.configuration.insight.ceiling,
    state.insightModifiers
      .filter(
        (modifier) => modifier.expiresAtLogicalTimeMs > state.logicalTimeMs,
      )
      .reduce((sum, modifier) => sum + modifier.magnitude, 0),
  );
  if (insightMagnitude > 0) {
    rate *= 1 + insightMagnitude;
    contributions.push({
      effectId: "insight.active",
      sourceId: "Insight",
      operation: "groupAddPercent",
      magnitude: insightMagnitude,
      applied: true,
      reason: "bounded active modifier",
    });
  }
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
