import type {
  ConditionDefinition,
  GameContent,
  ProjectId,
  ResourceId,
} from "../../shared/contracts";
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
  offlineInsight: { granted: number } | null,
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
  project.progressSegmentElapsedMs = 0;
  project.progressSegmentStart = project.progress;
  project.progressRatePerSecond = gameNumber(0);
  project.reservedPrecision = gameNumber(0);
  project.reservedIntuition = gameNumber(0);
  state.records.completedProjects += 1;
  if (!project.insightSpentThisRun)
    state.records.projectsCompletedWithoutInsight += 1;
  if (
    definition.techniqueRequirements.length > 0 &&
    definition.techniqueRequirements.every((artifactId) =>
      state.ownedArtifacts.includes(artifactId),
    )
  )
    state.records.exactDependencyCompletions += 1;
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
    state.techniqueRecords[artifactId] = {
      artifactId,
      sourceProjectId: projectId,
      approachId: project.approachId,
      outputKind: approach.outputKind,
      acquiredAtLogicalTimeMs: state.logicalTimeMs,
    };
  }
  const room = Math.max(0, content.configuration.insight.cap - state.insight);
  const offlineRoom = offlineInsight
    ? Math.max(0, 1 - offlineInsight.granted)
    : Number.POSITIVE_INFINITY;
  const amount = Math.min(room, definition.insightReward, offlineRoom);
  const overflow = definition.insightReward - amount;
  if (amount > 0) {
    state.insight = gnAdd(state.insight, gameNumber(amount));
    if (offlineInsight) offlineInsight.granted += amount;
  }
  if (definition.insightReward > 0)
    events.push({ type: "insightGained", amount, overflow });
  events.push({
    type: "projectCompleted",
    projectId,
    approachId: project.approachId,
    artifactIds: gained,
  });
  unlockProjects(state, content);
}

function startNextQueued(
  state: GameState,
  content: GameContent,
  trace: AutomationTraceEntry[],
  events: GameEvent[],
): boolean {
  if (state.completionBehavior !== "startNextFunded") return false;
  const nextId = state.projectQueue.shift();
  if (!nextId) {
    trace.push({
      sequence: state.sequence + 1,
      ruleId: "builtin-completion" as never,
      considered: true,
      condition: false,
      action: "start queued project",
      result: "rejected",
      stopReason: "project queue is empty",
    });
    return false;
  }
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
  const alreadyReserved =
    next !== undefined &&
    (next.reservedPrecision > 0 || next.reservedIntuition > 0);
  const funded =
    definition !== undefined &&
    (alreadyReserved ||
      ((state.resources.PRECISION ?? 0) -
        (state.resourceReserves.PRECISION ?? 0) >=
        precisionRequired &&
        (state.resources.INTUITION ?? 0) -
          (state.resourceReserves.INTUITION ?? 0) >=
          intuitionRequired));
  if (
    next &&
    definition &&
    funded &&
    (next.status === "queued" ||
      next.status === "available" ||
      next.status === "paused")
  ) {
    if (!alreadyReserved) {
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
    if (!next.approachesSeen.includes(next.approachId))
      next.approachesSeen.push(next.approachId);
    if (!alreadyReserved) next.insightSpentThisRun = false;
    next.starts += 1;
    events.push({ type: "projectStarted", projectId: next.id });
    trace.push({
      sequence: state.sequence + 1,
      ruleId: "builtin-completion" as never,
      considered: true,
      condition: true,
      action: `start ${nextId}`,
      result: "accepted",
      stopReason: "action selected",
    });
    return true;
  } else {
    if (next)
      next.status = next.status === "queued" ? "available" : next.status;
    trace.push({
      sequence: state.sequence + 1,
      ruleId: "builtin-completion" as never,
      considered: true,
      condition: false,
      action: `start ${nextId}`,
      result: "rejected",
      stopReason: "next project not funded or unavailable",
    });
    return false;
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

function resourceThresholds(condition: ConditionDefinition): Array<{
  resourceId: ResourceId;
  amount: number;
}> {
  if (condition.type === "resourceAtLeast")
    return [{ resourceId: condition.resourceId, amount: condition.amount }];
  if (condition.type === "all" || condition.type === "any")
    return condition.conditions.flatMap(resourceThresholds);
  if (condition.type === "not") return resourceThresholds(condition.condition);
  return [];
}

function currentResourceRates(
  state: GameState,
  content: GameContent,
): Map<ResourceId, number> {
  const rates = new Map<ResourceId, number>();
  for (const activity of content.activities) {
    const rate = resolveActivityRate(activity.id, state, content).rate;
    rates.set(
      activity.resourceId,
      (rates.get(activity.resourceId) ?? 0) + rate,
    );
  }
  return rates;
}

function nextResourceBoundary(
  state: GameState,
  content: GameContent,
): { seconds: number; kind: "cap" | "threshold" } | null {
  const rates = currentResourceRates(state, content);
  const candidates: Array<{ seconds: number; kind: "cap" | "threshold" }> = [];
  for (const resource of content.resources) {
    const rate = rates.get(resource.id) ?? 0;
    if (rate <= 0) continue;
    const current = state.resources[resource.id] ?? 0;
    const cap = resolveResourceCap(resource.id, state, content);
    if (current >= cap) candidates.push({ seconds: 0, kind: "cap" });
    else candidates.push({ seconds: (cap - current) / rate, kind: "cap" });
  }
  const conditions = [
    ...content.techniqueArtifacts.map((entry) => entry.prerequisites),
    ...content.upgrades.flatMap((entry) => [
      entry.unlockCondition,
      ...entry.effects.map((effect) => effect.activation),
    ]),
    ...content.milestones.flatMap((entry) => [
      entry.condition,
      ...entry.effects.map((effect) => effect.activation),
    ]),
    ...content.achievements.map((entry) => entry.condition),
  ];
  for (const condition of conditions) {
    for (const threshold of resourceThresholds(condition)) {
      const current = state.resources[threshold.resourceId] ?? 0;
      const rate = rates.get(threshold.resourceId) ?? 0;
      if (rate > 0 && current < threshold.amount)
        candidates.push({
          seconds: (threshold.amount - current) / rate,
          kind: "threshold",
        });
    }
  }
  return (
    candidates
      .filter((entry) => Number.isFinite(entry.seconds) && entry.seconds >= 0)
      .sort(
        (left, right) =>
          left.seconds - right.seconds || (left.kind === "threshold" ? -1 : 1),
      )[0] ?? null
  );
}

function publicationIsReady(state: GameState, content: GameContent): boolean {
  return content.chapters.some(
    (chapter) =>
      state.chapters[chapter.id] !== "published" &&
      chapter.publication.requiredProjectIds.every(
        (id) => state.projects[id]?.status === "completed",
      ) &&
      chapter.publication.requiredCapstoneEdgeIds.every((id) =>
        state.assembledCapstoneEdges.includes(id),
      ),
  );
}

export interface AdvanceResult {
  state: GameState;
  events: GameEvent[];
  boundaries: number;
  advancedMs: number;
  stoppedForDecision: boolean;
  stopReason: string | null;
  policyTrace: string[];
}

export function advanceDeterministicTime(
  state: GameState,
  content: GameContent,
  durationMs: number,
  offline: boolean,
  safePolicy = false,
): AdvanceResult {
  const next = cloneState(state);
  const events: GameEvent[] = [];
  let remainingSeconds = durationMs / 1000;
  const requestedSeconds = remainingSeconds;
  let boundaries = 0;
  let stoppedForDecision = false;
  let stopReason: string | null = null;
  const policyTrace: string[] = [];
  const offlineInsight = offline ? { granted: 0 } : null;
  while (remainingSeconds > 0) {
    if (boundaries >= 1_000)
      throw new Error("Time advancement boundary safeguard exceeded");
    const project = activeProject(next);
    let step = remainingSeconds;
    let resourceBoundaryKind: "cap" | "threshold" | null = null;
    const resourceBoundary = nextResourceBoundary(next, content);
    if (
      resourceBoundary &&
      (resourceBoundary.kind === "threshold" || offline)
    ) {
      if (
        offline &&
        resourceBoundary.kind === "cap" &&
        resourceBoundary.seconds <= 1e-12
      ) {
        stoppedForDecision = true;
        stopReason = "resourceCap";
        policyTrace.push(
          "Stopped at a resource cap; no reroute policy is configured.",
        );
        break;
      }
      if (resourceBoundary.seconds < step) {
        step = resourceBoundary.seconds;
        resourceBoundaryKind = resourceBoundary.kind;
      } else if (Math.abs(resourceBoundary.seconds - step) <= 1e-12) {
        resourceBoundaryKind = resourceBoundary.kind;
      }
    }
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
      const speed = gameNumber(resolveProjectSpeed(project.id, next, content));
      if (project.progressRatePerSecond !== speed) {
        project.progressSegmentElapsedMs = 0;
        project.progressSegmentStart = project.progress;
        project.progressRatePerSecond = speed;
      }
      project.progressSegmentElapsedMs += step * 1000;
      const progress = Math.min(
        workRequired,
        project.progressSegmentStart +
          project.progressRatePerSecond *
            (project.progressSegmentElapsedMs / 1000),
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
        completeProject(next, completed.id, content, events, offlineInsight);
        if (offline) {
          if (publicationIsReady(next, content)) {
            stoppedForDecision = true;
            stopReason = "publicationReady";
            policyTrace.push("Stopped when Publication became available.");
          } else if (
            !safePolicy ||
            next.completionBehavior !== "startNextFunded"
          ) {
            stoppedForDecision = true;
            stopReason = "projectCompletion";
            policyTrace.push(
              safePolicy
                ? "Stopped at project completion because the saved behavior is pause."
                : "Stopped at project completion; continuation was not authorized.",
            );
          } else {
            const queuedStarted = startNextQueued(
              next,
              content,
              next.automationTrace,
              events,
            );
            if (queuedStarted) next.records.offlineQueuedCompletions += 1;
            if (!activeProject(next)) {
              stoppedForDecision = true;
              stopReason = "automationFailure";
              policyTrace.push(
                "Stopped because the configured next-project action could not start.",
              );
            } else {
              policyTrace.push(
                "Authorized safe policy started the next funded project.",
              );
            }
          }
        } else {
          startNextQueued(next, content, next.automationTrace, events);
        }
      }
    }
    if (offline && resourceBoundaryKind === "cap" && !stoppedForDecision) {
      stoppedForDecision = true;
      stopReason = "resourceCap";
      policyTrace.push(
        "Stopped at a resource cap; no reroute policy is configured.",
      );
    }
    if (stoppedForDecision) break;
  }
  const advancedMs = gameNumber((requestedSeconds - remainingSeconds) * 1000);
  if (offline) next.records.totalOfflineCreditedMs += advancedMs;
  else next.records.totalActiveMs += advancedMs;
  next.diagnostics.unresolvedDecision = stopReason;
  events.push({ type: "timeAdvanced", durationMs: advancedMs, offline });
  return {
    state: next,
    events,
    boundaries,
    advancedMs,
    stoppedForDecision,
    stopReason,
    policyTrace,
  };
}
