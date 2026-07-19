import type {
  ApproachId,
  GameContent,
  ProjectId,
} from "../../../src/shared/contracts";
import {
  selectAvailableUpgrades,
  selectProjectAvailability,
} from "../../../src/engine/selectors";
import type { GameState } from "../../../src/engine/state/game-state";

export const policyNames = [
  "cheapestAvailable",
  "immediatePayback",
  "futureValue",
  "nearestMilestone",
  "balanced",
  "formalSpecialist",
  "exploratorySpecialist",
  "constructiveSpecialist",
  "hybrid",
  "activeOptimizer",
  "mostlyIdle",
  "weakButPlausible",
  "randomReasonable",
  "longOffline",
  "ignoreOneSystem",
] as const;

export type PolicyName = (typeof policyNames)[number];

export interface PolicyProfile {
  name: PolicyName;
  precisionAttention: number;
  intuitionAttention: number;
  approach: "FORMAL" | "EXPLORATORY" | "CONSTRUCTIVE" | "ROTATE";
  buyOptionalUpgrades: boolean;
  useOfflineAdvance: boolean;
  preferredChunkSeconds: number;
}

const profiles: Record<PolicyName, Omit<PolicyProfile, "name">> = {
  cheapestAvailable: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "ROTATE",
    buyOptionalUpgrades: true,
    useOfflineAdvance: false,
    preferredChunkSeconds: 30,
  },
  immediatePayback: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "FORMAL",
    buyOptionalUpgrades: true,
    useOfflineAdvance: false,
    preferredChunkSeconds: 20,
  },
  futureValue: {
    precisionAttention: 1,
    intuitionAttention: 2,
    approach: "CONSTRUCTIVE",
    buyOptionalUpgrades: true,
    useOfflineAdvance: false,
    preferredChunkSeconds: 30,
  },
  nearestMilestone: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "ROTATE",
    buyOptionalUpgrades: false,
    useOfflineAdvance: false,
    preferredChunkSeconds: 15,
  },
  balanced: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "ROTATE",
    buyOptionalUpgrades: true,
    useOfflineAdvance: false,
    preferredChunkSeconds: 30,
  },
  formalSpecialist: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "FORMAL",
    buyOptionalUpgrades: true,
    useOfflineAdvance: false,
    preferredChunkSeconds: 30,
  },
  exploratorySpecialist: {
    precisionAttention: 1,
    intuitionAttention: 2,
    approach: "EXPLORATORY",
    buyOptionalUpgrades: true,
    useOfflineAdvance: false,
    preferredChunkSeconds: 30,
  },
  constructiveSpecialist: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "CONSTRUCTIVE",
    buyOptionalUpgrades: true,
    useOfflineAdvance: false,
    preferredChunkSeconds: 30,
  },
  hybrid: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "ROTATE",
    buyOptionalUpgrades: true,
    useOfflineAdvance: false,
    preferredChunkSeconds: 45,
  },
  activeOptimizer: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "FORMAL",
    buyOptionalUpgrades: true,
    useOfflineAdvance: false,
    preferredChunkSeconds: 5,
  },
  mostlyIdle: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "CONSTRUCTIVE",
    buyOptionalUpgrades: false,
    useOfflineAdvance: true,
    preferredChunkSeconds: 300,
  },
  weakButPlausible: {
    precisionAttention: 1,
    intuitionAttention: 1,
    approach: "ROTATE",
    buyOptionalUpgrades: false,
    useOfflineAdvance: false,
    preferredChunkSeconds: 60,
  },
  randomReasonable: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "ROTATE",
    buyOptionalUpgrades: true,
    useOfflineAdvance: false,
    preferredChunkSeconds: 37,
  },
  longOffline: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "ROTATE",
    buyOptionalUpgrades: true,
    useOfflineAdvance: true,
    preferredChunkSeconds: 600,
  },
  ignoreOneSystem: {
    precisionAttention: 2,
    intuitionAttention: 1,
    approach: "EXPLORATORY",
    buyOptionalUpgrades: false,
    useOfflineAdvance: false,
    preferredChunkSeconds: 60,
  },
};

export function getPolicy(name: string): PolicyProfile {
  if (!policyNames.includes(name as PolicyName))
    throw new Error(`Unknown policy: ${name}`);
  return { name: name as PolicyName, ...profiles[name as PolicyName] };
}

export function chooseApproach(
  profile: PolicyProfile,
  state: GameState,
  content: GameContent,
  projectId: ProjectId,
): ApproachId {
  const project = content.projects.find(
    (candidate) => candidate.id === projectId,
  )!;
  if (profile.approach !== "ROTATE")
    return (
      content.approaches.find((approach) => approach.id === profile.approach)
        ?.id ?? project.allowedApproachIds[0]!
    );
  const index =
    (state.records.completedProjects +
      (profile.name === "randomReasonable" ? state.rng.words[0] : 0)) %
    project.allowedApproachIds.length;
  return project.allowedApproachIds[index]!;
}

export function chooseProject(
  profile: PolicyProfile,
  state: GameState,
  content: GameContent,
): ProjectId | null {
  const available = content.projects.filter((project) => {
    const runtime = state.projects[project.id];
    return (
      runtime &&
      runtime.status !== "completed" &&
      runtime.status !== "active" &&
      selectProjectAvailability(state, content, project.id).available
    );
  });
  if (available.length === 0) return null;
  if (profile.name === "cheapestAvailable")
    return [...available].sort(
      (left, right) =>
        left.precisionRequirement +
          left.intuitionRequirement -
          right.precisionRequirement -
          right.intuitionRequirement || left.id.localeCompare(right.id),
    )[0]!.id;
  if (profile.name === "nearestMilestone")
    return [...available].sort(
      (left, right) =>
        left.workRequired - right.workRequired ||
        left.id.localeCompare(right.id),
    )[0]!.id;
  if (profile.name === "randomReasonable")
    return available[state.rng.words[1] % available.length]!.id;
  return available[0]!.id;
}

export function chooseAffordableUpgrade(
  profile: PolicyProfile,
  state: GameState,
  content: GameContent,
) {
  const available = selectAvailableUpgrades(state, content).filter((upgrade) =>
    Object.entries(upgrade.cost).every(
      ([resourceId, amount]) =>
        (state.resources[resourceId] ?? 0) -
          (state.resourceReserves[resourceId] ?? 0) >=
        amount,
    ),
  );
  const filtered = profile.buyOptionalUpgrades
    ? available
    : available.filter(
        (upgrade) =>
          upgrade.cost["PRECISION" as never] === 0 &&
          upgrade.cost["INTUITION" as never] === 0,
      );
  return (
    [...filtered].sort(
      (left, right) =>
        left.tier - right.tier || left.id.localeCompare(right.id),
    )[0] ?? null
  );
}
