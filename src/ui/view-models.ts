import { naturalNumbersContent } from "../content";
import {
  hasAutomationCapability,
  selectProjectDeficits,
  selectProjectProgress,
  selectPublicationReadiness,
  type GameState,
} from "../engine";
import type { ProjectId } from "../shared/contracts";
import { formatDuration, formatGameNumber } from "./format";

export type AppView =
  | "overview"
  | "study"
  | "projects"
  | "map"
  | "upgrades"
  | "automation"
  | "records"
  | "publication"
  | "settings";

const completed = (state: GameState, id: string) =>
  state.projects[id]?.status === "completed";
const owned = (state: GameState, id: string) =>
  state.ownedUpgrades.includes(id as never);

export interface DisclosureModel {
  begun: boolean;
  intuition: boolean;
  projects: boolean;
  approaches: boolean;
  technique: boolean;
  proofMap: boolean;
  upgrades: boolean;
  automation: boolean;
  insight: boolean;
  records: boolean;
  publication: boolean;
}

export function selectDisclosure(state: GameState): DisclosureModel {
  const zeroStarted =
    (state.projects["nn.project.zero_successor"]?.starts ?? 0) > 0;
  const peanoComplete = completed(state, "nn.project.peano_frame");
  const inductionStarted =
    (state.projects["nn.project.induction_walkthrough"]?.starts ?? 0) > 0 ||
    completed(state, "nn.project.induction_walkthrough");
  const capstoneStatus =
    state.projects["nn.project.equivalence_capstone"]?.status ?? "locked";
  return {
    begun: owned(state, "nn.info.rate_ledger"),
    intuition:
      owned(state, "nn.activity.explore") ||
      completed(state, "nn.project.zero_successor"),
    projects:
      zeroStarted ||
      (state.resources.PRECISION ?? 0) >= 10 ||
      completed(state, "nn.project.zero_successor"),
    approaches: inductionStarted,
    technique: inductionStarted,
    proofMap: peanoComplete,
    upgrades: peanoComplete,
    automation:
      hasAutomationCapability(state, naturalNumbersContent, "queue") ||
      hasAutomationCapability(
        state,
        naturalNumbersContent,
        "completionBehavior",
      ) ||
      hasAutomationCapability(state, naturalNumbersContent, "resourceReserve"),
    insight:
      state.insight > 0 ||
      owned(state, "nn.active.insight_notebook") ||
      completed(state, "nn.project.counterexample_lab"),
    records:
      state.reachedMilestones.length > 1 ||
      state.recordedAchievements.length > 0,
    publication:
      capstoneStatus === "available" ||
      capstoneStatus === "active" ||
      capstoneStatus === "completed" ||
      owned(state, "nn.compression.publication_index") ||
      state.chapters["nn.chapter.natural_numbers"] === "published",
  };
}

export interface ObjectiveModel {
  eyebrow: string;
  title: string;
  explanation: string;
  actionLabel: string | null;
  targetView: AppView;
  projectId: ProjectId | null;
}

function nextProject(state: GameState): ProjectId | null {
  const active = Object.values(state.projects).find(
    (project) => project.status === "active",
  );
  if (active) return active.id;
  return (
    naturalNumbersContent.projects.find((project) =>
      ["available", "paused", "queued"].includes(
        state.projects[project.id]?.status ?? "",
      ),
    )?.id ?? null
  );
}

export function selectCurrentObjective(state: GameState): ObjectiveModel {
  if (!owned(state, "nn.info.rate_ledger"))
    return {
      eyebrow: "Guided beginning",
      title: "Begin with zero",
      explanation:
        "Confirm the convention used in this chapter. This is orientation, not a strategic choice.",
      actionLabel: "Use zero as the beginning",
      targetView: "overview",
      projectId: null,
    };

  if (!completed(state, "nn.project.zero_successor")) {
    const projectId = "nn.project.zero_successor" as ProjectId;
    const runtime = state.projects[projectId]!;
    const deficits = selectProjectDeficits(
      state,
      naturalNumbersContent,
      projectId,
    );
    const progress = selectProjectProgress(
      state,
      naturalNumbersContent,
      projectId,
    );
    if (runtime.status === "active")
      return {
        eyebrow: "In progress",
        title: "Establish zero and successor",
        explanation: `${formatDuration(progress.etaSeconds)} remain. Attention keeps producing Precision while the dedicated project slot works.`,
        actionLabel: "Review the project",
        targetView: "projects",
        projectId,
      };
    if (deficits.PRECISION > 0)
      return {
        eyebrow: "Prepare",
        title: "Gather enough Precision",
        explanation: `${formatGameNumber(deficits.PRECISION)} more Precision will fund Zero and Successor. Production is passive; no repeated clicking is needed.`,
        actionLabel: "Review study plan",
        targetView: "study",
        projectId,
      };
    return {
      eyebrow: "Ready",
      title: "Start Zero and Successor",
      explanation:
        "The project reserves its inputs, then advances in a dedicated work slot.",
      actionLabel: "Review the project",
      targetView: "projects",
      projectId,
    };
  }

  if (!owned(state, "nn.activity.explore"))
    return {
      eyebrow: "New possibility",
      title: "Open Explore",
      explanation:
        "Intuition creates the first genuine Attention trade-off: concentrate on one activity or prepare both resources.",
      actionLabel: "Open the study plan",
      targetView: "study",
      projectId: null,
    };

  const chapter = naturalNumbersContent.chapters[0]!;
  if (state.chapters[chapter.id] === "published")
    return {
      eyebrow: "Chapter published",
      title: "Natural Numbers archived",
      explanation:
        "Your validated methods and proof history are preserved. The next chapter is intentionally not active in this Phase 2 slice.",
      actionLabel: "Review the published archive",
      targetView: "records",
      projectId: null,
    };
  const readiness = selectPublicationReadiness(
    state,
    naturalNumbersContent,
    chapter.id,
  );
  if (readiness.ready)
    return {
      eyebrow: "Transformation ready",
      title: "Publish the foundations",
      explanation:
        "Review exactly what resets, what remains, and which methods become reusable before confirming.",
      actionLabel: "Review Publication",
      targetView: "publication",
      projectId: null,
    };

  const projectId = nextProject(state);
  if (projectId) {
    const definition = naturalNumbersContent.projects.find(
      (project) => project.id === projectId,
    )!;
    const runtime = state.projects[projectId]!;
    const progress = selectProjectProgress(
      state,
      naturalNumbersContent,
      projectId,
    );
    return {
      eyebrow:
        runtime.status === "active"
          ? "Current project"
          : runtime.status === "queued"
            ? "Planned next"
            : "Next decision",
      title: definition.short,
      explanation:
        runtime.status === "active"
          ? `${formatDuration(progress.etaSeconds)} remain at the current project speed.`
          : "Inspect its resource vector, method, output, and downstream value before committing.",
      actionLabel: "Open project",
      targetView: "projects",
      projectId,
    };
  }

  return {
    eyebrow: "Plan",
    title: "Review the proof network",
    explanation:
      "A prerequisite, method artifact, or capstone edge is waiting for a decision.",
    actionLabel: "Open Proof Map",
    targetView: "map",
    projectId: null,
  };
}

export function availableViews(disclosure: DisclosureModel): AppView[] {
  return [
    "overview",
    ...(disclosure.begun ? (["study"] as const) : []),
    ...(disclosure.projects ? (["projects"] as const) : []),
    ...(disclosure.proofMap ? (["map"] as const) : []),
    ...(disclosure.upgrades ? (["upgrades"] as const) : []),
    ...(disclosure.automation ? (["automation"] as const) : []),
    ...(disclosure.records ? (["records"] as const) : []),
    ...(disclosure.publication ? (["publication"] as const) : []),
  ];
}
