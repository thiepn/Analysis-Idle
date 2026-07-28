import type { GameContent } from "../../shared/contracts";
import type {
  CommandEnvelope,
  CommandRejectionCode,
  CommandResult,
  GameCommand,
} from "../commands/types";
import { evaluateCondition } from "../conditions/evaluate";
import {
  hasAutomationCapability,
  hasInformationCapability,
  resolveProjectRequirements,
  resolveResourceCap,
} from "../effects/resolve";
import type { GameEvent } from "../events/types";
import { gameNumber, gnAdd, gnSubtract } from "../numbers/game-number";
import {
  selectProjectAvailability,
  selectPublicationReadiness,
} from "../selectors";
import { activeProject, cloneState, type GameState } from "../state/game-state";
import { collectInvariantViolations } from "../state/invariants";
import { refreshRecords } from "../state/records";
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
      const { durationMs, offline, safePolicy } = command.payload;
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
        safePolicy,
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
      if (
        !next.activityEnabled[activityId] &&
        !hasInformationCapability(next, content, `activity:${activityId}`)
      )
        return reject(
          state,
          "PREREQUISITE_MISSING",
          "Activity is not unlocked",
          { activityId },
        );
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
      if (next.chapters[definition.chapterId] !== "active")
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Projects can only start in an active chapter",
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
      const requirements = resolveProjectRequirements(
        definition,
        runtime.approachId,
        next,
        content,
      );
      const alreadyReserved =
        runtime.reservedPrecision > 0 || runtime.reservedIntuition > 0;
      if (runtime.progress === 0 && !alreadyReserved) {
        const precision = next.resources.PRECISION ?? gameNumber(0);
        const intuition = next.resources.INTUITION ?? gameNumber(0);
        const precisionReserve =
          next.resourceReserves.PRECISION ?? gameNumber(0);
        const intuitionReserve =
          next.resourceReserves.INTUITION ?? gameNumber(0);
        if (
          precision - precisionReserve < requirements.precision ||
          intuition - intuitionReserve < requirements.intuition
        )
          return reject(
            state,
            "INSUFFICIENT_RESOURCE",
            "Project requirements exceed spendable resources",
          );
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
      if (!runtime.approachesSeen.includes(runtime.approachId))
        runtime.approachesSeen.push(runtime.approachId);
      if (runtime.progress === 0 && !alreadyReserved)
        runtime.insightSpentThisRun = false;
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
      runtime.progressSegmentElapsedMs = 0;
      runtime.progressSegmentStart = gameNumber(0);
      runtime.progressRatePerSecond = gameNumber(0);
      runtime.insightSpentThisRun = false;
      next.resources.PRECISION = gameNumber(
        Math.min(
          resolveResourceCap("PRECISION" as never, next, content),
          gnAdd(
            next.resources.PRECISION ?? gameNumber(0),
            runtime.reservedPrecision,
          ),
        ),
      );
      next.resources.INTUITION = gameNumber(
        Math.min(
          resolveResourceCap("INTUITION" as never, next, content),
          gnAdd(
            next.resources.INTUITION ?? gameNumber(0),
            runtime.reservedIntuition,
          ),
        ),
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
        const comparedBefore = runtime.approachesSeen.length >= 2;
        if (!runtime.approachesSeen.includes(runtime.approachId))
          runtime.approachesSeen.push(runtime.approachId);
        if (!runtime.approachesSeen.includes(command.payload.approachId))
          runtime.approachesSeen.push(command.payload.approachId);
        if (!comparedBefore && runtime.approachesSeen.length >= 2)
          next.records.approachComparisons += 1;
        const oldRequired = resolveProjectRequirements(
          definition,
          runtime.approachId,
          next,
          content,
        ).work;
        const newRequired = resolveProjectRequirements(
          definition,
          command.payload.approachId,
          next,
          content,
        ).work;
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
        runtime.progressSegmentElapsedMs = 0;
        runtime.progressSegmentStart = runtime.progress;
        runtime.progressRatePerSecond = gameNumber(0);
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
      if (!hasAutomationCapability(next, content, "queue"))
        return reject(
          state,
          "PREREQUISITE_MISSING",
          "Queue automation is not unlocked",
        );
      const runtime = next.projects[command.payload.projectId];
      if (!runtime) return reject(state, "UNKNOWN_ID", "Unknown project");
      const definition = content.projects.find(
        (project) => project.id === runtime.id,
      )!;
      if (next.chapters[definition.chapterId] !== "active")
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Projects can only be queued in an active chapter",
        );
      if (
        next.projectQueue.length >=
        content.configuration.automation.queueCapacity
      )
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
      if (!hasAutomationCapability(next, content, "completionBehavior"))
        return reject(
          state,
          "PREREQUISITE_MISSING",
          "Completion behavior automation is not unlocked",
        );
      if (
        command.payload.behavior !== "pause" &&
        command.payload.behavior !== "startNextFunded"
      )
        return reject(state, "INVALID_AMOUNT", "Unknown completion behavior");
      next.completionBehavior = command.payload.behavior;
      break;
    case "setResourceReserve": {
      if (!hasAutomationCapability(next, content, "resourceReserve"))
        return reject(
          state,
          "PREREQUISITE_MISSING",
          "Resource reserve automation is not unlocked",
        );
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
      if (!hasAutomationCapability(next, content, "orderedPriority"))
        return reject(
          state,
          "UNSUPPORTED_FUTURE_FEATURE",
          "Ordered automation priorities are not unlocked in Phase 1 content",
        );
      const capabilities = new Set([
        "queue",
        "completionBehavior",
        "resourceReserve",
        "orderedPriority",
        "safeOfflinePolicy",
      ]);
      if (command.payload.priorities.some((entry) => !capabilities.has(entry)))
        return reject(
          state,
          "INVALID_AMOUNT",
          "Automation priorities contain an unknown capability",
        );
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
      if (!hasInformationCapability(next, content, "insightActions"))
        return reject(
          state,
          "PREREQUISITE_MISSING",
          "Insight interventions are not unlocked",
        );
      if (!Number.isSafeInteger(amount) || amount <= 0)
        return reject(
          state,
          "INVALID_AMOUNT",
          "Insight spend must be a positive whole charge count",
        );
      if (
        purpose !== "strengthenBaseCase" &&
        purpose !== "traceStep" &&
        purpose !== "testCounterexample" &&
        purpose !== "revealDownstream"
      )
        return reject(state, "INVALID_AMOUNT", "Unknown Insight intervention");
      if (next.insight < amount)
        return reject(state, "INSIGHT_INSUFFICIENT", "Insufficient Insight");
      if (purpose === "revealDownstream" && amount !== 1)
        return reject(
          state,
          "INVALID_AMOUNT",
          "A downstream reveal uses exactly one Insight charge",
        );
      const project = activeProject(next);
      if (!project)
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "A project must be active for this Insight intervention",
        );
      if (project.insightSpentThisRun)
        return reject(
          state,
          "INVALID_PROJECT_STATE",
          "Only one Insight intervention is allowed per project run",
        );
      if (
        amount * content.configuration.insight.modifierPerInsight >
        content.configuration.insight.ceiling
      )
        return reject(
          state,
          "INVALID_AMOUNT",
          "Insight intervention exceeds the configured active advantage ceiling",
        );
      next.insight = gnSubtract(next.insight, gameNumber(amount));
      next.insightSpent = gnAdd(next.insightSpent, gameNumber(amount));
      {
        project.insightSpentThisRun = true;
        if (purpose === "revealDownstream") {
          if (!next.insightReveals.includes(project.id))
            next.insightReveals.push(project.id);
        } else {
          const definition = content.projects.find(
            (candidate) => candidate.id === project.id,
          )!;
          const required = resolveProjectRequirements(
            definition,
            project.approachId,
            next,
            content,
          ).work;
          const fraction = Math.min(
            content.configuration.insight.ceiling,
            amount * content.configuration.insight.modifierPerInsight,
          );
          project.progress = gameNumber(
            Math.min(
              required,
              project.progress + (required - project.progress) * fraction,
            ),
          );
          project.progressSegmentElapsedMs = 0;
          project.progressSegmentStart = project.progress;
          project.progressRatePerSecond = gameNumber(0);
        }
      }
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
      if (next.chapters[chapter!.id] !== "active")
        return reject(state, "INVALID_PROJECT_STATE", "Chapter is not active");
      if (!hasInformationCapability(next, content, "capstoneEdges"))
        return reject(
          state,
          "PREREQUISITE_MISSING",
          "Capstone mapping is not unlocked",
        );
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
      if (
        chapter!.capstoneEdges.every((candidate) =>
          next.assembledCapstoneEdges.includes(candidate.id),
        )
      )
        next.records.validCapstones += 1;
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
      next.insightModifiers = [];
      next.insightReveals = [];
      next.projectQueue = [];
      for (const resourceId of chapter.publication.resetResourceIds)
        next.resourceReserves[resourceId] = gameNumber(0);
      // Completed project records, Technique acquisitions, and capstone edges
      // are the chapter's read-only Publication archive.
      next.ownedUpgrades = next.ownedUpgrades.filter((upgradeId) => {
        const upgrade = content.upgrades.find(
          (entry) => entry.id === upgradeId,
        );
        return upgrade?.publicationBehavior !== "reset";
      });
      if (
        !next.masteryArtifacts.includes(chapter.publication.masteryArtifactId)
      )
        next.masteryArtifacts.push(chapter.publication.masteryArtifactId);
      const resetResources = new Set(chapter.publication.resetResourceIds);
      for (const activity of content.activities) {
        if (resetResources.has(activity.resourceId)) {
          next.activityEnabled[activity.id] = false;
          next.activityProduction[activity.id] = {
            segmentElapsedMs: 0,
            segmentProduced: gameNumber(0),
            ratePerSecond: gameNumber(0),
          };
        }
      }
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
        (setting === "reducedMotion" ||
          setting === "highContrast" ||
          setting === "compactLayout" ||
          setting === "confirmations") &&
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
      if (
        setting === "updateRate" &&
        value !== "standard" &&
        value !== "reduced"
      )
        return reject(
          state,
          "INVALID_SETTINGS_VALUE",
          "Update rate must be standard or reduced",
        );
      if (
        setting === "animationIntensity" &&
        !["full", "subtle", "none"].includes(value as string)
      )
        return reject(
          state,
          "INVALID_SETTINGS_VALUE",
          "Animation intensity must be full, subtle, or none",
        );
      if (
        setting === "numberFormat" &&
        value !== "standard" &&
        value !== "compact"
      )
        return reject(
          state,
          "INVALID_SETTINGS_VALUE",
          "Number format must be standard or compact",
        );
      if (
        setting === "offlineSummaryDetail" &&
        value !== "summary" &&
        value !== "detailed"
      )
        return reject(
          state,
          "INVALID_SETTINGS_VALUE",
          "Offline summary detail must be summary or detailed",
        );
      if (
        setting === "mathExplanationDepth" &&
        value !== "guided" &&
        value !== "expanded"
      )
        return reject(
          state,
          "INVALID_SETTINGS_VALUE",
          "Mathematical explanation depth must be guided or expanded",
        );
      if (setting === "textScale" && value !== "standard" && value !== "large")
        return reject(
          state,
          "INVALID_SETTINGS_VALUE",
          "Text scale must be standard or large",
        );
      if (
        setting === "announcementVerbosity" &&
        value !== "essential" &&
        value !== "all"
      )
        return reject(
          state,
          "INVALID_SETTINGS_VALUE",
          "Announcement verbosity must be essential or all",
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
