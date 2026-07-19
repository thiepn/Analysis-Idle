import type {
  AchievementId,
  ActivityId,
  ApproachId,
  AutomationCapability,
  AutomationRuleId,
  CapstoneEdgeId,
  ChapterId,
  ChapterRuntimeStatus,
  CompletionBehavior,
  GameContent,
  MilestoneId,
  ProjectId,
  ProjectRuntimeStatus,
  ResourceId,
  TechniqueArtifactId,
  UpgradeId,
} from "../../shared/contracts";
import { gameNumber, type GameNumber } from "../numbers/game-number";
import { createRng, type RngState } from "../rng/xoshiro";

export const ENGINE_SCHEMA_VERSION = 1;

export interface ProjectState {
  id: ProjectId;
  status: ProjectRuntimeStatus;
  approachId: ApproachId;
  progress: GameNumber;
  reservedPrecision: GameNumber;
  reservedIntuition: GameNumber;
  starts: number;
}

export interface AutomationTraceEntry {
  sequence: number;
  ruleId: AutomationRuleId;
  considered: boolean;
  condition: boolean;
  action: string;
  result: "accepted" | "rejected" | "skipped";
  stopReason: string;
}

export interface AutomationRuleState {
  id: AutomationRuleId;
  owner: string;
  enabled: boolean;
  trigger: "projectCompleted" | "offlineBoundary" | "resourceThreshold";
  condition: string;
  action: string;
  priority: number;
  failureBehavior: "continue" | "stop";
  resetLayer: "chapter" | "publication" | "campaign" | "never";
  publicationBehavior: "reset" | "archive" | "retain" | "transform";
}

export interface InsightModifierState {
  id: string;
  purpose: string;
  magnitude: number;
  expiresAtLogicalTimeMs: number;
}

export interface GameState {
  schemaVersion: number;
  contentVersion: string;
  sequence: number;
  logicalTimeMs: number;
  resources: Record<string, GameNumber>;
  attention: {
    capacity: number;
    allocations: Record<string, number>;
  };
  activityEnabled: Record<string, boolean>;
  activityProduction: Record<
    string,
    {
      segmentElapsedMs: number;
      segmentProduced: GameNumber;
      ratePerSecond: GameNumber;
    }
  >;
  projects: Record<string, ProjectState>;
  projectQueue: ProjectId[];
  completionBehavior: CompletionBehavior;
  resourceReserves: Record<string, GameNumber>;
  automationPriority: AutomationCapability[];
  automationRules: AutomationRuleState[];
  automationTrace: AutomationTraceEntry[];
  ownedUpgrades: UpgradeId[];
  ownedArtifacts: TechniqueArtifactId[];
  reachedMilestones: MilestoneId[];
  recordedAchievements: AchievementId[];
  understanding: GameNumber;
  insight: GameNumber;
  insightSpent: GameNumber;
  insightModifiers: InsightModifierState[];
  assembledCapstoneEdges: CapstoneEdgeId[];
  chapters: Record<string, ChapterRuntimeStatus>;
  masteryArtifacts: string[];
  settings: {
    reducedMotion: boolean;
    highContrast: boolean;
    notation: "plain" | "unicode";
  };
  rng: RngState;
  records: {
    totalActiveMs: number;
    totalOfflineCreditedMs: number;
    publications: number;
    completedProjects: number;
    clockAnomalies: number;
  };
  diagnostics: {
    lastRejectionCode: string | null;
    invariantViolations: string[];
    unresolvedDecision: string | null;
  };
}

function initiallyAvailable(
  content: GameContent,
  projectId: ProjectId,
): ProjectRuntimeStatus {
  const project = content.projects.find(
    (candidate) => candidate.id === projectId,
  );
  return project?.prerequisiteProjectIds.length === 0 ? "available" : "locked";
}

export function createInitialState(
  content: GameContent,
  seed = 12345,
): GameState {
  const resources: Record<string, GameNumber> = {};
  const reserves: Record<string, GameNumber> = {};
  for (const resource of content.resources) {
    resources[resource.id] = gameNumber(resource.initialValue);
    reserves[resource.id] = gameNumber(0);
  }

  const projects: Record<string, ProjectState> = {};
  for (const project of content.projects) {
    projects[project.id] = {
      id: project.id,
      status: initiallyAvailable(content, project.id),
      approachId: project.allowedApproachIds[0]!,
      progress: gameNumber(0),
      reservedPrecision: gameNumber(0),
      reservedIntuition: gameNumber(0),
      starts: 0,
    };
  }

  const chapters: Record<string, ChapterRuntimeStatus> = {};
  content.chapters.forEach((chapter, index) => {
    chapters[chapter.id] = index === 0 ? "active" : "locked";
  });

  return {
    schemaVersion: ENGINE_SCHEMA_VERSION,
    contentVersion: content.contentVersion,
    sequence: 0,
    logicalTimeMs: 0,
    resources,
    attention: {
      capacity: content.configuration.attention.startingCapacity,
      allocations: {},
    },
    activityEnabled: Object.fromEntries(
      content.activities.map((activity) => [
        activity.id,
        activity.initiallyUnlocked,
      ]),
    ),
    activityProduction: Object.fromEntries(
      content.activities.map((activity) => [
        activity.id,
        {
          segmentElapsedMs: 0,
          segmentProduced: gameNumber(0),
          ratePerSecond: gameNumber(0),
        },
      ]),
    ),
    projects,
    projectQueue: [],
    completionBehavior: "pause",
    resourceReserves: reserves,
    automationPriority: [
      "queue",
      "completionBehavior",
      "resourceReserve",
      "orderedPriority",
      "safeOfflinePolicy",
    ],
    automationRules: [],
    automationTrace: [],
    ownedUpgrades: [],
    ownedArtifacts: [],
    reachedMilestones: [],
    recordedAchievements: [],
    understanding: gameNumber(0),
    insight: gameNumber(0),
    insightSpent: gameNumber(0),
    insightModifiers: [],
    assembledCapstoneEdges: [],
    chapters,
    masteryArtifacts: [],
    settings: { reducedMotion: false, highContrast: false, notation: "plain" },
    rng: createRng(seed),
    records: {
      totalActiveMs: 0,
      totalOfflineCreditedMs: 0,
      publications: 0,
      completedProjects: 0,
      clockAnomalies: 0,
    },
    diagnostics: {
      lastRejectionCode: null,
      invariantViolations: [],
      unresolvedDecision: null,
    },
  };
}

export const cloneState = (state: GameState): GameState =>
  structuredClone(state);

export function activeProject(state: GameState): ProjectState | null {
  return (
    Object.values(state.projects).find(
      (project) => project.status === "active",
    ) ?? null
  );
}

export function resourceValue(state: GameState, id: ResourceId): GameNumber {
  return state.resources[id] ?? gameNumber(0);
}

export function attentionAllocation(state: GameState, id: ActivityId): number {
  return state.attention.allocations[id] ?? 0;
}

export function chapterStatus(
  state: GameState,
  id: ChapterId,
): ChapterRuntimeStatus {
  return state.chapters[id] ?? "locked";
}
