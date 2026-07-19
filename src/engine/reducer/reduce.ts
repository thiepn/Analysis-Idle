import type { GameContent, ProjectDefinition } from "../../shared/contracts";
import type {
  CommandEnvelope,
  CommandRejectionCode,
  CommandResult,
  GameCommand,
} from "../commands/types";
import { evaluateCondition } from "../conditions/evaluate";
import type { GameEvent } from "../events/types";
import { gameNumber, gnAdd, gnSubtract } from "../numbers/game-number";
import {
  selectProjectAvailability,
  selectPublicationReadiness,
} from "../selectors";
import { activeProject, cloneState, type GameState } from "../state/game-state";
import { collectInvariantViolations } from "../state/invariants";
import {
  advanceDeterministicTime,
  calculateOfflineCredit,
} from "../time/advance";

const reject = (
  state: GameState,
  code: CommandRejectionCode,
  message: string,
  details: Record<string, string | number | boolean> = {},
): CommandResult => ({
  accepted: false,
  state,
  reason: { code, message, details },
  events: [],
});

function approachAdjustedRequirements(
  definition: ProjectDefinition,
  content: GameContent,
  approachId: string,
) {
  const approach = content.approaches.find(
    (candidate) => candidate.id === approachId,
  )!;
  return {
    precision:
      definition.precisionRequirement * approach.precisionRequirementMultiplier,
    intuition:
      definition.intuitionRequirement * approach.intuitionRequirementMultiplier,
  };
}

function refreshRecords(
  next: GameState,
  content: GameContent,
  events: GameEvent[],
): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const milestone of content.milestones) {
      if (
        !next.reachedMilestones.includes(milestone.id) &&
        evaluateCondition(milestone.condition, next, content).met
      ) {
        next.reachedMilestones.push(milestone.id);
        events.push({ type: "milestoneReached", milestoneId: milestone.id });
        changed = true;
      }
    }
    for (const achievement of content.achievements) {
      if (
        !next.recordedAchievements.includes(achievement.id) &&
        evaluateCondition(achievement.condition, next, content).met
      ) {
        next.recordedAchievements.push(achievement.id);
        events.push({
          type: "achievementRecorded",
          achievementId: achievement.id,
        });
        changed = true;
      }
    }
  }
}

function accept(
  original: GameState,
  next: GameState,
  content: GameContent,
  events: GameEvent[],
  sequence: number,
): CommandResult {
  next.sequence = sequence;
  next.diagnostics.lastRejectionCode = null;
  refreshRecords(next, content, events);
  const violations = collectInvariantViolations(next, content);
  if (violations.length > 0)
    return reject(
      original,
      "INVALID_AMOUNT",
      "Transition violated state invariants",
      { violations: violations.join("; ") },
    );
  next.diagnostics.invariantViolations = [];
  return { accepted: true, state: next, events };
}

export function reduceCommand(
  state: GameState,
  envelope: CommandEnvelope,
  content: GameContent,
): CommandResult {
  if (envelope.sequence !== state.sequence + 1)
    return reject(
      state,
      "STALE_COMMAND_SEQUENCE",
      "Command sequence must be exactly the next sequence",
      { expected: state.sequence + 1, received: envelope.sequence },
    );
  const command = envelope.command;
  const next = cloneState(state);
  const events: GameEvent[] = [];

  switch (command.type) {
    case "advanceTime": {
      const { durationMs, offline } = command.payload;
      if (!Number.isFinite(durationMs) || durationMs < 0)
        return reject(
          state,
          "INVALID_AMOUNT",
          "Duration must be finite and non-negative",
        );
      const credited = offline
        ? calculateOfflineCredit(durationMs, content).creditedMs
        : durationMs;
      const advanced = advanceDeterministicTime(
        next,
        content,
        credited,
        offline,
      );
      return accept(
        state,
        advanced.state,
        content,
        advanced.events,
        envelope.sequence,
      );
    }
    case "setAttention": {
      const { activityId, allocation } = command.payload;
      if (!content.activities.some((activity) => activity.id === activityId))
        return reject(state, "UNKNOWN_ID", "Unknown activity", { activityId });
      if (!Number.isInteger(allocation) || allocation < 0)
        return reject(
          state,
          "INVALID_AMOUNT",
          "Attention allocation must be a non-negative integer",
        );
      const other = Object.entries(next.attention.allocations).reduce(
        (sum, [id, value]) => sum + (id === activityId ? 0 : value),
        0,
      );
      if (other + allocation > next.attention.capacity)
        return reject(
          state,
          "ATTENTION_CAPACITY_EXCEEDED",
          "Attention allocation exceeds capacity",
        );
      next.attention.allocations[activityId] = allocation;
      events.push({ type: "attentionChanged", activityId, allocation });
      break;
    }
    case "startProject": {
      const definition = content.projects.find(
        (project) => project.id === command.payload.projectId,
      );
      const runtime = next.projects[command.payload.projectId];
      if (!definition || !runtime)
        return reject(state, "UNKNOWN_ID", "Unknown project", {
          projectId: command.payload.projectId,
        });
      if (activeProject(next))
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Dedicated project slot is occupied",
        );
      if (
        !(["available", "paused", "cancelled"] as const).includes(
          runtime.status as never,
        )
      )
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Project cannot start from its current state",
          { status: runtime.status },
        );
      const availability = selectProjectAvailability(
        next,
        content,
        definition.id,
      );
      if (!availability.available)
        return reject(
          state,
          "PREREQUISITE_MISSING",
          "Project prerequisites are not met",
          { missing: availability.reasons.join(", ") },
        );
      const requirements = approachAdjustedRequirements(
        definition,
        content,
        runtime.approachId,
      );
      const precision = next.resources.PRECISION ?? gameNumber(0);
      const intuition = next.resources.INTUITION ?? gameNumber(0);
      const precisionReserve = next.resourceReserves.PRECISION ?? gameNumber(0);
      const intuitionReserve = next.resourceReserves.INTUITION ?? gameNumber(0);
      if (
        precision - precisionReserve < requirements.precision ||
        intuition - intuitionReserve < requirements.intuition
      )
        return reject(
          state,
          "INSUFFICIENT_RESOURCE",
          "Project requirements exceed spendable resources",
        );
      if (runtime.progress === 0) {
        next.resources.PRECISION = gnSubtract(
          precision,
          gameNumber(requirements.precision),
        );
        next.resources.INTUITION = gnSubtract(
          intuition,
          gameNumber(requirements.intuition),
        );
        runtime.reservedPrecision = gameNumber(requirements.precision);
        runtime.reservedIntuition = gameNumber(requirements.intuition);
      }
      runtime.status = "active";
      runtime.starts += 1;
      next.projectQueue = next.projectQueue.filter((id) => id !== runtime.id);
      events.push({ type: "projectStarted", projectId: runtime.id });
      break;
    }
    case "pauseProject": {
      const runtime = next.projects[command.payload.projectId];
      if (!runtime) return reject(state, "UNKNOWN_ID", "Unknown project");
      if (runtime.status !== "active")
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Only an active project can be paused",
        );
      runtime.status = "paused";
      events.push({ type: "projectPaused", projectId: runtime.id });
      break;
    }
    case "cancelProject": {
      const runtime = next.projects[command.payload.projectId];
      if (!runtime) return reject(state, "UNKNOWN_ID", "Unknown project");
      if (!(
        runtime.status === "active" ||
        runtime.status === "paused" ||
        runtime.status === "queued"
      ))
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Project cannot be cancelled from its current state",
        );
      runtime.status = "cancelled";
      runtime.progress = gameNumber(0);
      next.resources.PRECISION = gnAdd(
        next.resources.PRECISION ?? gameNumber(0),
        runtime.reservedPrecision,
      );
      next.resources.INTUITION = gnAdd(
        next.resources.INTUITION ?? gameNumber(0),
        runtime.reservedIntuition,
      );
      runtime.reservedPrecision = gameNumber(0);
      runtime.reservedIntuition = gameNumber(0);
      next.projectQueue = next.projectQueue.filter((id) => id !== runtime.id);
      events.push({ type: "projectCancelled", projectId: runtime.id });
      break;
    }
    case "switchProjectApproach": {
      const runtime = next.projects[command.payload.projectId];
      const definition = content.projects.find(
        (project) => project.id === command.payload.projectId,
      );
      if (!runtime || !definition)
        return reject(state, "UNKNOWN_ID", "Unknown project");
      if (!definition.allowedApproachIds.includes(command.payload.approachId))
        return reject(
          state,
          "APPROACH_UNAVAILABLE",
          "Approach is not available for this project",
        );
      if (runtime.status === "completed")
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Completed projects cannot switch approach",
        );
      if (runtime.approachId !== command.payload.approachId) {
        const oldApproach = content.approaches.find(
          (candidate) => candidate.id === runtime.approachId,
        )!;
        const newApproach = content.approaches.find(
          (candidate) => candidate.id === command.payload.approachId,
        )!;
        const oldRequired =
          definition.workRequired * oldApproach.workMultiplier;
        const newRequired =
          definition.workRequired * newApproach.workMultiplier;
        const completedFraction =
          oldRequired === 0 ? 0 : runtime.progress / oldRequired;
        runtime.progress = gameNumber(
          Math.min(
            newRequired,
            completedFraction *
              newRequired *
              content.configuration.projects.approachSwitchPreservation,
          ),
        );
        runtime.approachId = command.payload.approachId;
        events.push({
          type: "projectApproachSwitched",
          projectId: runtime.id,
          preservedFraction:
            content.configuration.projects.approachSwitchPreservation,
        });
      }
      break;
    }
    case "queueProject": {
      const runtime = next.projects[command.payload.projectId];
      if (!runtime) return reject(state, "UNKNOWN_ID", "Unknown project");
      if (next.projectQueue.length >= 10)
        return reject(state, "QUEUE_FULL", "Project queue capacity reached");
      if (!(
        runtime.status === "available" ||
        runtime.status === "paused" ||
        runtime.status === "cancelled"
      ))
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Project cannot be queued from its current state",
        );
      if (!next.projectQueue.includes(runtime.id))
        next.projectQueue.push(runtime.id);
      runtime.status = "queued";
      events.push({ type: "projectQueued", projectId: runtime.id });
      break;
    }
    case "purchaseUpgrade": {
      const upgrade = content.upgrades.find(
        (candidate) => candidate.id === command.payload.upgradeId,
      );
      if (!upgrade) return reject(state, "UNKNOWN_ID", "Unknown upgrade");
      if (next.ownedUpgrades.includes(upgrade.id))
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Upgrade is already owned",
        );
      if (!evaluateCondition(upgrade.unlockCondition, next, content).met)
        return reject(state, "PREREQUISITE_MISSING", "Upgrade is locked");
      for (const [resourceId, amount] of Object.entries(upgrade.cost)) {
        const value = next.resources[resourceId] ?? gameNumber(0);
        const reserve = next.resourceReserves[resourceId] ?? gameNumber(0);
        if (value - reserve < amount)
          return reject(
            state,
            "INSUFFICIENT_RESOURCE",
            "Upgrade cost exceeds spendable resources",
            { resourceId, amount },
          );
      }
      for (const [resourceId, amount] of Object.entries(upgrade.cost))
        next.resources[resourceId] = gnSubtract(
          next.resources[resourceId]!,
          gameNumber(amount),
        );
      next.ownedUpgrades.push(upgrade.id);
      for (const effect of upgrade.effects) {
        if (
          effect.target.kind === "attentionCapacity" &&
          effect.operation === "capacityAdd"
        )
          next.attention.capacity = Math.min(
            content.configuration.attention.maximumCapacity,
            next.attention.capacity + effect.magnitude,
          );
      }
      events.push({ type: "upgradePurchased", upgradeId: upgrade.id });
      break;
    }
    case "setCompletionBehavior":
      next.completionBehavior = command.payload.behavior;
      break;
    case "setResourceReserve": {
      const { resourceId, amount } = command.payload;
      if (!(resourceId in next.resources))
        return reject(state, "UNKNOWN_ID", "Unknown resource");
      if (!Number.isFinite(amount) || amount < 0)
        return reject(
          state,
          "INVALID_AMOUNT",
          "Reserve must be finite and non-negative",
        );
      next.resourceReserves[resourceId] = gameNumber(amount);
      break;
    }
    case "setAutomationPriority": {
      if (
        new Set(command.payload.priorities).size !==
        command.payload.priorities.length
      )
        return reject(
          state,
          "INVALID_AMOUNT",
          "Automation priorities cannot contain duplicates",
        );
      next.automationPriority = [...command.payload.priorities];
      break;
    }
    case "spendInsight": {
      const { amount, purpose } = command.payload;
      if (!Number.isFinite(amount) || amount <= 0)
        return reject(
          state,
          "INVALID_AMOUNT",
          "Insight spend must be finite and positive",
        );
      if (next.insight < amount)
        return reject(state, "INSIGHT_INSUFFICIENT", "Insufficient Insight");
      next.insight = gnSubtract(next.insight, gameNumber(amount));
      next.insightSpent = gnAdd(next.insightSpent, gameNumber(amount));
      events.push({ type: "insightSpent", amount, purpose });
      break;
    }
    case "assembleCapstoneEdge": {
      const chapter = content.chapters.find(
        (candidate) => candidate.id === command.payload.chapterId,
      );
      const edge = chapter?.capstoneEdges.find(
        (candidate) => candidate.id === command.payload.edgeId,
      );
      if (!edge) return reject(state, "UNKNOWN_ID", "Unknown capstone edge");
      if (next.assembledCapstoneEdges.includes(edge.id))
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Capstone edge already assembled",
        );
      if (!next.ownedArtifacts.includes(edge.requiredArtifactId))
        return reject(
          state,
          "PREREQUISITE_MISSING",
          "Required Technique artifact is not owned",
        );
      next.assembledCapstoneEdges.push(edge.id);
      events.push({ type: "capstoneEdgeAssembled", edgeId: edge.id });
      break;
    }
    case "publishChapter": {
      const chapter = content.chapters.find(
        (candidate) => candidate.id === command.payload.chapterId,
      );
      if (!chapter) return reject(state, "UNKNOWN_ID", "Unknown chapter");
      const readiness = selectPublicationReadiness(next, content, chapter.id);
      if (!readiness.ready)
        return reject(
          state,
          "PUBLICATION_UNAVAILABLE",
          "Chapter is not ready for Publication",
          { missing: readiness.missing.join(", ") },
        );
      next.chapters[chapter.id] = "published";
      for (const resourceId of chapter.publication.resetResourceIds)
        next.resources[resourceId] = gameNumber(0);
      next.attention.allocations = {};
      next.projectQueue = [];
      for (const projectId of chapter.projectIds) {
        const project = next.projects[projectId];
        if (project && project.status !== "completed") {
          project.status = "cancelled";
          project.progress = gameNumber(0);
        }
      }
      next.ownedArtifacts = next.ownedArtifacts.filter(
        (artifact) =>
          chapter.publication.retainedArtifactIds.includes(artifact) ||
          !chapter.projectIds.includes(
            content.techniqueArtifacts.find(
              (candidate) => candidate.id === artifact,
            )?.sourceProjectId ?? ("" as never),
          ),
      );
      if (
        !next.masteryArtifacts.includes(chapter.publication.masteryArtifactId)
      )
        next.masteryArtifacts.push(chapter.publication.masteryArtifactId);
      next.records.publications += 1;
      events.push({
        type: "chapterPublished",
        chapterId: chapter.id,
        masteryArtifactId: chapter.publication.masteryArtifactId,
      });
      break;
    }
    case "changeSetting": {
      const { setting, value } = command.payload;
      if (
        (setting === "reducedMotion" || setting === "highContrast") &&
        typeof value !== "boolean"
      )
        return reject(
          state,
          "INVALID_SETTINGS_VALUE",
          "Boolean setting requires a boolean value",
        );
      if (setting === "notation" && value !== "plain" && value !== "unicode")
        return reject(
          state,
          "INVALID_SETTINGS_VALUE",
          "Notation must be plain or unicode",
        );
      Object.assign(next.settings, { [setting]: value });
      events.push({ type: "settingChanged", setting, value });
      break;
    }
    case "saveRequested":
    case "loadRequested":
    case "exportRequested":
    case "importRequested": {
      const operation = command.type.replace("Requested", "") as
        "save" | "load" | "import" | "export";
      const data =
        command.type === "importRequested" ? command.payload.data : null;
      events.push({ type: "persistenceRequested", operation, data });
      break;
    }
    default:
      return reject(state, "UNKNOWN_COMMAND", "Unknown command type", {
        type: (command as GameCommand).type,
      });
  }
  return accept(state, next, content, events, envelope.sequence);
}
