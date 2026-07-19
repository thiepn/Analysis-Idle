import type { GameContent, ProjectId } from "../../shared/contracts";
import type { GameEvent } from "../events/types";
import {
  resolveActivityRate,
  resolveProjectSpeed,
  resolveResourceCap,
} from "../effects/resolve";
import { gameNumber, gnAdd, gnSubtract } from "../numbers/game-number";
import {
  activeProject,
  cloneState,
  type AutomationTraceEntry,
  type GameState,
} from "../state/game-state";

export interface OfflineCredit {
  requestedMs: number;
  creditedMs: number;
  discardedMs: number;
  fullEfficiencyMs: number;
  tailCreditedMs: number;
}

export function calculateOfflineCredit(
  durationMs: number,
  content: GameContent,
): OfflineCredit {
  const fullWindow =
    content.configuration.offline.fullEfficiencyHours * 3_600_000;
  const maximumWindow =
    content.configuration.offline.maximumCreditedHours * 3_600_000;
  const bounded = Math.min(durationMs, maximumWindow);
  const full = Math.min(bounded, fullWindow);
  const tailWall = Math.max(0, bounded - full);
  const tailCredited = tailWall * content.configuration.offline.tailEfficiency;
  return {
    requestedMs: durationMs,
    creditedMs: full + tailCredited,
    discardedMs: durationMs - bounded,
    fullEfficiencyMs: full,
    tailCreditedMs: tailCredited,
  };
}

function unlockProjects(state: GameState, content: GameContent): void {
  for (const definition of content.projects) {
    const project = state.projects[definition.id];
    if (!project || project.status !== "locked") continue;
    if (
      definition.prerequisiteProjectIds.every(
        (id) => state.projects[id]?.status === "completed",
      )
    )
      project.status = "available";
  }
}

function completeProject(
  state: GameState,
  projectId: ProjectId,
  content: GameContent,
  events: GameEvent[],
): void {
  const project = state.projects[projectId]!;
  const definition = content.projects.find(
    (candidate) => candidate.id === projectId,
  )!;
  project.status = "completed";
  const approach = content.approaches.find(
    (candidate) => candidate.id === project.approachId,
  )!;
  project.progress = gameNumber(
    definition.workRequired * approach.workMultiplier,
  );
  project.reservedPrecision = gameNumber(0);
  project.reservedIntuition = gameNumber(0);
  state.records.completedProjects += 1;
  state.understanding = gnAdd(
    state.understanding,
    gameNumber(definition.understandingReward),
  );
  const gained: typeof state.ownedArtifacts = [];
  for (const artifactId of definition.outputArtifactIds) {
    if (!state.ownedArtifacts.includes(artifactId)) {
      state.ownedArtifacts.push(artifactId);
      gained.push(artifactId);
    }
  }
  const room = Math.max(0, content.configuration.insight.cap - state.insight);
  const amount = Math.min(room, definition.insightReward);
  const overflow = definition.insightReward - amount;
  if (amount > 0) state.insight = gnAdd(state.insight, gameNumber(amount));
  if (definition.insightReward > 0)
    events.push({ type: "insightGained", amount, overflow });
  events.push({ type: "projectCompleted", projectId, artifactIds: gained });
  unlockProjects(state, content);
}

function startNextQueued(
  state: GameState,
  content: GameContent,
  trace: AutomationTraceEntry[],
): void {
  if (state.completionBehavior !== "startNextFunded") return;
  const nextId = state.projectQueue.shift();
  if (!nextId) return;
  const next = state.projects[nextId];
  const definition = content.projects.find(
    (candidate) => candidate.id === nextId,
  );
  const approach = definition
    ? content.approaches.find((candidate) => candidate.id === next?.approachId)
    : undefined;
  const precisionRequired =
    definition && approach
      ? definition.precisionRequirement *
        approach.precisionRequirementMultiplier
      : Number.POSITIVE_INFINITY;
  const intuitionRequired =
    definition && approach
      ? definition.intuitionRequirement *
        approach.intuitionRequirementMultiplier
      : Number.POSITIVE_INFINITY;
  const funded =
    definition !== undefined &&
    (state.resources.PRECISION ?? 0) -
      (state.resourceReserves.PRECISION ?? 0) >=
      precisionRequired &&
    (state.resources.INTUITION ?? 0) -
      (state.resourceReserves.INTUITION ?? 0) >=
      intuitionRequired;
  if (
    next &&
    definition &&
    funded &&
    (next.status === "queued" ||
      next.status === "available" ||
      next.status === "paused")
  ) {
    if (next.progress === 0) {
      next.reservedPrecision = gameNumber(precisionRequired);
      next.reservedIntuition = gameNumber(intuitionRequired);
      state.resources.PRECISION = gnSubtract(
        state.resources.PRECISION ?? gameNumber(0),
        next.reservedPrecision,
      );
      state.resources.INTUITION = gnSubtract(
        state.resources.INTUITION ?? gameNumber(0),
        next.reservedIntuition,
      );
    }
    next.status = "active";
    next.starts += 1;
    trace.push({
      sequence: state.sequence,
      ruleId: "builtin-completion" as never,
      considered: true,
      condition: true,
      action: `start ${nextId}`,
      result: "accepted",
      stopReason: "action selected",
    });
  } else {
    if (next)
      next.status = next.status === "queued" ? "available" : next.status;
    trace.push({
      sequence: state.sequence,
      ruleId: "builtin-completion" as never,
      considered: true,
      condition: false,
      action: `start ${nextId}`,
      result: "rejected",
      stopReason: "next project not funded or unavailable",
    });
  }
}

function addResourceProduction(
  state: GameState,
  content: GameContent,
  seconds: number,
  events: GameEvent[],
): void {
  for (const activity of content.activities) {
    const { rate } = resolveActivityRate(activity.id, state, content);
    if (rate <= 0) continue;
    const ledger = state.activityProduction[activity.id]!;
    const canonicalRate = gameNumber(rate);
    if (ledger.ratePerSecond !== canonicalRate) {
      ledger.ratePerSecond = canonicalRate;
      ledger.segmentElapsedMs = 0;
      ledger.segmentProduced = gameNumber(0);
    }
    ledger.segmentElapsedMs += seconds * 1000;
    const segmentTotal = gameNumber(
      ledger.ratePerSecond * (ledger.segmentElapsedMs / 1000),
    );
    const produced = segmentTotal - ledger.segmentProduced;
    ledger.segmentProduced = segmentTotal;
    const current = state.resources[activity.resourceId] ?? gameNumber(0);
    const cap = resolveResourceCap(activity.resourceId, state, content);
    const next = Math.min(cap, current + produced);
    const amount = next - current;
    state.resources[activity.resourceId] = gameNumber(next);
    if (amount > 0)
      events.push({
        type: "resourceChanged",
        resourceId: activity.resourceId,
        amount,
        reason: "activity production",
      });
  }
}

export interface AdvanceResult {
  state: GameState;
  events: GameEvent[];
  boundaries: number;
}

export function advanceDeterministicTime(
  state: GameState,
  content: GameContent,
  durationMs: number,
  offline: boolean,
): AdvanceResult {
  const next = cloneState(state);
  const events: GameEvent[] = [];
  let remainingSeconds = durationMs / 1000;
  let boundaries = 0;
  while (remainingSeconds > 0) {
    if (boundaries >= 1_000)
      throw new Error("Time advancement boundary safeguard exceeded");
    const project = activeProject(next);
    let step = remainingSeconds;
    const nextModifierExpiry = next.insightModifiers
      .filter(
        (modifier) => modifier.expiresAtLogicalTimeMs > next.logicalTimeMs,
      )
      .map(
        (modifier) =>
          (modifier.expiresAtLogicalTimeMs - next.logicalTimeMs) / 1000,
      )
      .sort((left, right) => left - right)[0];
    if (nextModifierExpiry !== undefined)
      step = Math.min(step, nextModifierExpiry);
    if (project) {
      const definition = content.projects.find(
        (candidate) => candidate.id === project.id,
      )!;
      const approach = content.approaches.find(
        (candidate) => candidate.id === project.approachId,
      )!;
      const workRequired = definition.workRequired * approach.workMultiplier;
      const speed = resolveProjectSpeed(project.id, next, content);
      const untilCompletion =
        speed > 0
          ? (workRequired - project.progress) / speed
          : Number.POSITIVE_INFINITY;
      step = Math.min(step, Math.max(0, untilCompletion));
    }
    if (step <= 1e-12) step = Math.min(remainingSeconds, 1e-9);
    addResourceProduction(next, content, step, events);
    if (project) {
      const definition = content.projects.find(
        (candidate) => candidate.id === project.id,
      )!;
      const approach = content.approaches.find(
        (candidate) => candidate.id === project.approachId,
      )!;
      const workRequired = definition.workRequired * approach.workMultiplier;
      const progress = Math.min(
        workRequired,
        project.progress +
          resolveProjectSpeed(project.id, next, content) * step,
      );
      project.progress = gameNumber(progress);
    }
    remainingSeconds = Math.max(0, remainingSeconds - step);
    next.logicalTimeMs += step * 1000;
    const expired = next.insightModifiers.filter(
      (modifier) => modifier.expiresAtLogicalTimeMs <= next.logicalTimeMs,
    );
    next.insightModifiers = next.insightModifiers.filter(
      (modifier) => modifier.expiresAtLogicalTimeMs > next.logicalTimeMs,
    );
    for (const modifier of expired)
      events.push({ type: "insightModifierExpired", modifierId: modifier.id });
    boundaries += 1;
    const completed = activeProject(next);
    if (completed) {
      const definition = content.projects.find(
        (candidate) => candidate.id === completed.id,
      )!;
      const approach = content.approaches.find(
        (candidate) => candidate.id === completed.approachId,
      )!;
      if (
        completed.progress >=
        definition.workRequired * approach.workMultiplier
      ) {
        completeProject(next, completed.id, content, events);
        startNextQueued(next, content, next.automationTrace);
      }
    }
  }
  if (offline) next.records.totalOfflineCreditedMs += durationMs;
  else next.records.totalActiveMs += durationMs;
  events.push({ type: "timeAdvanced", durationMs, offline });
  return { state: next, events, boundaries };
}
