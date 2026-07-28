import { createHash } from "node:crypto";
import type { GameContent } from "../../src/shared/contracts";
import {
  envelope,
  hasInformationCapability,
  hasAutomationCapability,
  reduceCommand,
  selectProjectDeficits,
  selectProjectProgress,
  selectPublicationReadiness,
  resolveResourceCap,
  createInitialState,
  collectInvariantViolations,
  createRng,
  drawUint32,
  type RngState,
  type GameState,
  type CommandEnvelope,
  type GameCommand,
  type GameEvent,
} from "../../src/engine";
import { naturalNumbersContent, naturalNumbersIds } from "../../src/content";
import {
  chooseAffordableUpgrade,
  chooseApproach,
  chooseProject,
  getPolicy,
  type PolicyName,
  type PolicyProfile,
} from "./policies";

export interface SimulationOptions {
  policy: PolicyName;
  horizonSeconds: number;
  seed: number;
  chunkSeconds: number | null;
  traceLevel: "summary" | "full";
  stopCondition: "horizon" | "publication";
  content: GameContent;
}

export interface CommandLogEntry {
  envelope: CommandEnvelope;
  accepted: boolean;
  rejectionCode: string | null;
}

export interface TimelineEntry {
  timeMs: number;
  precision: number;
  intuition: number;
  activeProject: string | null;
  completedProjects: number;
  upgrades: number;
}

export interface SimulationResult {
  options: Omit<SimulationOptions, "content"> & { contentVersion: string };
  finalState: GameState;
  eventLog: GameEvent[];
  commandLog: CommandLogEntry[];
  resourceTimeline: TimelineEntry[];
  projectTimeline: GameEvent[];
  upgradeTimeline: GameEvent[];
  milestoneTimeline: GameEvent[];
  achievementTimeline: GameEvent[];
  automationTrace: GameState["automationTrace"];
  policyRng: RngState;
  publicationTimingMs: number | null;
  idleAdvanceMs: number;
  offlineAdvanceMs: number;
  rejectedActions: CommandLogEntry[];
  invariantViolations: string[];
  policySummary: {
    name: PolicyName;
    commands: number;
    accepted: number;
    rejected: number;
    completedProjects: number;
    publications: number;
  };
  deterministicHash: string;
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

export const deterministicHash = (value: unknown): string =>
  createHash("sha256").update(stableStringify(value)).digest("hex");

function timeline(state: GameState): TimelineEntry {
  return {
    timeMs: state.logicalTimeMs,
    precision: state.resources.PRECISION ?? 0,
    intuition: state.resources.INTUITION ?? 0,
    activeProject:
      Object.values(state.projects).find(
        (project) => project.status === "active",
      )?.id ?? null,
    completedProjects: state.records.completedProjects,
    upgrades: state.ownedUpgrades.length,
  };
}

export function runSimulation(
  partial: Partial<SimulationOptions> = {},
): SimulationResult {
  const content = partial.content ?? naturalNumbersContent;
  const options: SimulationOptions = {
    policy: partial.policy ?? "balanced",
    horizonSeconds: partial.horizonSeconds ?? 7_200,
    seed: partial.seed ?? 12_345,
    chunkSeconds: partial.chunkSeconds ?? null,
    traceLevel: partial.traceLevel ?? "summary",
    stopCondition: partial.stopCondition ?? "publication",
    content,
  };
  const profile = getPolicy(options.policy);
  let state = createInitialState(content, options.seed);
  let policyRng = createRng(options.seed ^ 0x9e3779b9);
  const policyWord = (): number => {
    if (profile.name !== "randomReasonable") return 0;
    const draw = drawUint32(policyRng);
    policyRng = draw.state;
    return draw.value;
  };
  const eventLog: GameEvent[] = [];
  const commandLog: CommandLogEntry[] = [];
  const resourceTimeline: TimelineEntry[] = [timeline(state)];
  let idleAdvanceMs = 0;
  let offlineAdvanceMs = 0;
  let actionGuard = 0;

  const dispatch = (command: GameCommand): boolean => {
    const wasIdle = !Object.values(state.projects).some(
      (project) => project.status === "active",
    );
    const wrapped = envelope(command, state.sequence + 1, "simulator");
    const result = reduceCommand(state, wrapped, content);
    commandLog.push({
      envelope: wrapped,
      accepted: result.accepted,
      rejectionCode: result.accepted ? null : result.reason.code,
    });
    if (result.accepted) {
      if (command.type === "advanceTime") {
        if (wasIdle) idleAdvanceMs += command.payload.durationMs;
        if (command.payload.offline)
          offlineAdvanceMs += command.payload.durationMs;
      }
      state = result.state;
      eventLog.push(...result.events);
      if (options.traceLevel === "full" || command.type !== "advanceTime")
        resourceTimeline.push(timeline(state));
      return true;
    }
    return false;
  };

  while (
    state.logicalTimeMs < options.horizonSeconds * 1000 &&
    actionGuard < 20_000
  ) {
    actionGuard += 1;
    if (
      state.records.publications > 0 &&
      options.stopCondition === "publication"
    )
      break;
    const exploreUnlocked =
      state.activityEnabled[naturalNumbersIds.EXPLORE] ||
      hasInformationCapability(
        state,
        content,
        `activity:${naturalNumbersIds.EXPLORE}`,
      );
    const precisionCapped =
      (state.resources.PRECISION ?? 0) >=
      resolveResourceCap(naturalNumbersIds.PRECISION, state, content);
    const intuitionCapped =
      (state.resources.INTUITION ?? 0) >=
      resolveResourceCap(naturalNumbersIds.INTUITION, state, content);
    const desiredPrecision = precisionCapped
      ? 0
      : exploreUnlocked && intuitionCapped
        ? state.attention.capacity
        : exploreUnlocked
          ? profile.precisionAttention
          : content.configuration.attention.startingCapacity;
    const desiredIntuition = intuitionCapped
      ? 0
      : exploreUnlocked && precisionCapped
        ? state.attention.capacity
        : exploreUnlocked
          ? profile.intuitionAttention
          : 0;
    const currentPrecision =
      state.attention.allocations[naturalNumbersIds.FORMALIZE] ?? 0;
    const currentIntuition =
      state.attention.allocations[naturalNumbersIds.EXPLORE] ?? 0;
    if (currentPrecision > desiredPrecision) {
      dispatch({
        type: "setAttention",
        payload: {
          activityId: naturalNumbersIds.FORMALIZE,
          allocation: desiredPrecision,
        },
      });
      continue;
    }
    if (exploreUnlocked && currentIntuition > desiredIntuition) {
      dispatch({
        type: "setAttention",
        payload: {
          activityId: naturalNumbersIds.EXPLORE,
          allocation: desiredIntuition,
        },
      });
      continue;
    }
    if (currentPrecision < desiredPrecision) {
      dispatch({
        type: "setAttention",
        payload: {
          activityId: naturalNumbersIds.FORMALIZE,
          allocation: desiredPrecision,
        },
      });
      continue;
    }
    if (exploreUnlocked && currentIntuition < desiredIntuition) {
      dispatch({
        type: "setAttention",
        payload: {
          activityId: naturalNumbersIds.EXPLORE,
          allocation: desiredIntuition,
        },
      });
      continue;
    }
    const active = Object.values(state.projects).find(
      (project) => project.status === "active",
    );
    if (
      hasAutomationCapability(state, content, "completionBehavior") &&
      state.completionBehavior !== "startNextFunded"
    ) {
      dispatch({
        type: "setCompletionBehavior",
        payload: { behavior: "startNextFunded" },
      });
      continue;
    }
    if (active) {
      if (
        profile.name === "activeOptimizer" &&
        state.insight >= 1 &&
        !active.insightSpentThisRun &&
        hasInformationCapability(state, content, "insightActions")
      ) {
        dispatch({
          type: "spendInsight",
          payload: { amount: 1, purpose: "traceStep" },
        });
        continue;
      }
      if (
        hasAutomationCapability(state, content, "queue") &&
        hasAutomationCapability(state, content, "completionBehavior") &&
        state.completionBehavior === "startNextFunded" &&
        state.projectQueue.length === 0
      ) {
        const queued = chooseProject(profile, state, content, policyWord());
        const deficits = queued
          ? selectProjectDeficits(state, content, queued)
          : null;
        if (
          queued &&
          queued !== active.id &&
          deficits?.PRECISION === 0 &&
          deficits.INTUITION === 0
        ) {
          dispatch({ type: "queueProject", payload: { projectId: queued } });
          continue;
        }
      }
      const progress = selectProjectProgress(state, content, active.id);
      const preferred = options.chunkSeconds ?? profile.preferredChunkSeconds;
      const seconds = Math.min(
        preferred,
        progress.etaSeconds ?? preferred,
        options.horizonSeconds - state.logicalTimeMs / 1000,
      );
      dispatch({
        type: "advanceTime",
        payload: {
          durationMs: Math.max(0, seconds) * 1000,
          offline: profile.useOfflineAdvance,
          safePolicy: profile.useOfflineAdvance,
        },
      });
      continue;
    }

    const upgrade = chooseAffordableUpgrade(profile, state, content);
    if (upgrade) {
      dispatch({ type: "purchaseUpgrade", payload: { upgradeId: upgrade.id } });
      continue;
    }

    const chapter = content.chapters[0]!;
    const edge = hasInformationCapability(state, content, "capstoneEdges")
      ? chapter.capstoneEdges.find(
          (candidate) =>
            state.ownedArtifacts.includes(candidate.requiredArtifactId) &&
            !state.assembledCapstoneEdges.includes(candidate.id),
        )
      : undefined;
    if (edge) {
      dispatch({
        type: "assembleCapstoneEdge",
        payload: { chapterId: chapter.id, edgeId: edge.id },
      });
      continue;
    }
    if (selectPublicationReadiness(state, content, chapter.id).ready) {
      dispatch({ type: "publishChapter", payload: { chapterId: chapter.id } });
      continue;
    }

    const projectId = chooseProject(profile, state, content, policyWord());
    if (projectId) {
      const approach = chooseApproach(
        profile,
        state,
        content,
        projectId,
        policyWord(),
      );
      const runtime = state.projects[projectId]!;
      if (runtime.approachId !== approach)
        dispatch({
          type: "switchProjectApproach",
          payload: { projectId, approachId: approach },
        });
      const deficits = selectProjectDeficits(
        state,
        content,
        projectId,
        approach,
      );
      if (deficits.PRECISION === 0 && deficits.INTUITION === 0)
        if (dispatch({ type: "startProject", payload: { projectId } }))
          continue;
    }

    const seconds = Math.min(
      options.chunkSeconds ?? profile.preferredChunkSeconds,
      options.horizonSeconds - state.logicalTimeMs / 1000,
    );
    if (seconds <= 0) break;
    dispatch({
      type: "advanceTime",
      payload: {
        durationMs: seconds * 1000,
        offline: profile.useOfflineAdvance,
        safePolicy: profile.useOfflineAdvance,
      },
    });
  }

  const projectTimeline = eventLog.filter((event) =>
    event.type.startsWith("project"),
  );
  const upgradeTimeline = eventLog.filter(
    (event) => event.type === "upgradePurchased",
  );
  const milestoneTimeline = eventLog.filter(
    (event) => event.type === "milestoneReached",
  );
  const achievementTimeline = eventLog.filter(
    (event) => event.type === "achievementRecorded",
  );
  const publication = eventLog.find(
    (event) => event.type === "chapterPublished",
  );
  const invariantViolations = collectInvariantViolations(state, content);
  const digestInput = {
    options: { ...options, content: content.contentVersion },
    finalState: state,
    eventLog,
    commandLog,
    resourceTimeline,
    policyRng,
    idleAdvanceMs,
    offlineAdvanceMs,
  };
  const resultWithoutHash = {
    options: {
      policy: options.policy,
      horizonSeconds: options.horizonSeconds,
      seed: options.seed,
      chunkSeconds: options.chunkSeconds,
      traceLevel: options.traceLevel,
      stopCondition: options.stopCondition,
      contentVersion: content.contentVersion,
    },
    finalState: state,
    eventLog,
    commandLog,
    resourceTimeline,
    projectTimeline,
    upgradeTimeline,
    milestoneTimeline,
    achievementTimeline,
    automationTrace: state.automationTrace,
    policyRng,
    publicationTimingMs: publication ? state.logicalTimeMs : null,
    idleAdvanceMs,
    offlineAdvanceMs,
    rejectedActions: commandLog.filter((entry) => !entry.accepted),
    invariantViolations,
    policySummary: {
      name: options.policy,
      commands: commandLog.length,
      accepted: commandLog.filter((entry) => entry.accepted).length,
      rejected: commandLog.filter((entry) => !entry.accepted).length,
      completedProjects: state.records.completedProjects,
      publications: state.records.publications,
    },
  };
  return {
    ...resultWithoutHash,
    deterministicHash: deterministicHash(digestInput),
  };
}

export function timelineCsv(result: SimulationResult): string {
  const rows = result.resourceTimeline.map((entry) =>
    [
      entry.timeMs,
      entry.precision,
      entry.intuition,
      entry.activeProject ?? "",
      entry.completedProjects,
      entry.upgrades,
    ].join(","),
  );
  return (
    [
      "timeMs,precision,intuition,activeProject,completedProjects,upgrades",
      ...rows,
    ].join("\n") + "\n"
  );
}

export function profileFor(name: PolicyName): PolicyProfile {
  return getPolicy(name);
}
