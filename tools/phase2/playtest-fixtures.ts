import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runSimulation } from "../simulator/core";
import { policyNames } from "../simulator/policies";
import { naturalNumbersContent } from "../../src/content";
import { envelope, reduceCommand } from "../../src/engine";
import { gameNumber } from "../../src/engine/numbers/game-number";
import { selectProjectProgress } from "../../src/engine/selectors";
import { createInitialState } from "../../src/engine/state/game-state";

const root = resolve(import.meta.dirname, "../..");
const dataDirectory = resolve(root, "reports/phase-2/data");
mkdirSync(dataDirectory, { recursive: true });

const policies = policyNames.map((name) => {
  const result = runSimulation({
    policy: name,
    horizonSeconds: 7_200,
    stopCondition: "publication",
  });
  return {
    name,
    publicationMinutes:
      result.publicationTimingMs === null
        ? null
        : result.publicationTimingMs / 60_000,
    completedProjects: result.finalState.records.completedProjects,
    publications: result.finalState.records.publications,
    rejectedCommands: result.rejectedActions.length,
    invariantViolations: result.invariantViolations,
    insightSpent: result.finalState.insightSpent,
    automationTraceEntries: result.automationTrace.length,
    idleAdvanceMinutes: result.idleAdvanceMs / 60_000,
    offlineAdvanceMinutes: result.offlineAdvanceMs / 60_000,
    deterministicHash: result.deterministicHash,
  };
});

const checkpoints = [
  { id: "first-5-minutes", seconds: 5 * 60 },
  { id: "first-15-minutes", seconds: 15 * 60 },
  { id: "first-30-minutes", seconds: 30 * 60 },
].map(({ id, seconds }) => {
  const result = runSimulation({
    policy: "balanced",
    horizonSeconds: seconds,
    stopCondition: "horizon",
  });
  return {
    id,
    elapsedMinutes: seconds / 60,
    completedProjects: result.finalState.records.completedProjects,
    upgrades: result.finalState.ownedUpgrades,
    milestones: result.finalState.reachedMilestones,
    resources: result.finalState.resources,
    understanding: result.finalState.understanding,
    nextDecision: result.finalState.diagnostics.unresolvedDecision,
  };
});

const personaSessions = [
  {
    persona: "idle-game veteran",
    method: "separated self-play audit",
    sessions: [
      "first 5 minutes",
      "first 30 minutes",
      "complete Publication run",
    ],
    observations: [
      "The objective card and ETA establish that waiting executes a plan.",
      "Queue and completion rules replace repeated revisits without choosing strategy.",
      "The dense project detail remains optional behind the Projects view.",
    ],
    risks: [
      "Approach value is downstream and may be undervalued by players optimizing ETA.",
    ],
  },
  {
    persona: "casual player",
    method: "separated self-play audit",
    sessions: ["first 5 minutes", "first 15 minutes", "first offline return"],
    observations: [
      "The opening labels its first confirmation as guided rather than strategic.",
      "Explore creates the first genuine allocation choice after the foundation project.",
      "Return progress is one summary with a direct next-decision action.",
    ],
    risks: ["Project requirement detail may still be dense on a first visit."],
  },
  {
    persona: "mathematics student",
    method: "separated self-play audit",
    sessions: ["first 30 minutes", "complete Publication run"],
    observations: [
      "Definitions, examples, lemmas and proof methods are distinguished.",
      "Well-Ordering has no false multiplication dependency.",
      "The capstone requires method-bearing implication edges, not a stock threshold.",
    ],
    risks: [
      "Exact source citations are repository references rather than in-app bibliography entries.",
    ],
  },
  {
    persona: "non-mathematics player",
    method: "separated self-play audit",
    sessions: ["first 5 minutes", "first 15 minutes"],
    observations: [
      "Gameplay explanations precede optional mathematics and deeper proof notes.",
      "No recall question or formal proof input gates progress.",
      "Technique is described as named learned methods rather than an abstract score.",
    ],
    risks: [
      "Terms such as implication and recursive definition still need external human comprehension testing.",
    ],
  },
  {
    persona: "mobile player",
    method: "responsive self-play audit",
    sessions: ["first 15 minutes", "first offline return"],
    observations: [
      "Bottom navigation and 44-pixel stepper controls support one-hand portrait play.",
      "Projects use a horizontal project strip and single-column detail.",
      "The Proof Map switches to the structured list below tablet width.",
    ],
    risks: [
      "Real iOS Safari and Android TalkBack devices were not available locally.",
    ],
  },
  {
    persona: "keyboard-only user",
    method: "automated plus separated self-play audit",
    sessions: ["first 15 minutes", "complete Publication run"],
    observations: [
      "Every critical action uses native controls with visible focus.",
      "Dialogs trap focus, support Escape and restore the invoking control.",
      "The Proof Map structured alternative is fully keyboard operable.",
    ],
    risks: ["Independent assistive-technology testing remains required."],
  },
];

const values = policies
  .map((policy) => policy.publicationMinutes)
  .filter((value): value is number => value !== null)
  .sort((left, right) => left - right);
const median =
  values.length % 2 === 0
    ? (values[values.length / 2 - 1]! + values[values.length / 2]!) / 2
    : values[Math.floor(values.length / 2)]!;
const interventionFixture = (amount: 1 | 2) => {
  const state = createInitialState(naturalNumbersContent);
  state.insight = gameNumber(amount);
  state.ownedUpgrades.push("nn.active.insight_notebook" as never);
  state.projects["nn.project.zero_successor"]!.status = "active";
  const baselineSeconds = selectProjectProgress(
    state,
    naturalNumbersContent,
    "nn.project.zero_successor" as never,
  ).etaSeconds!;
  const result = reduceCommand(
    state,
    envelope(
      {
        type: "spendInsight",
        payload: { amount, purpose: "traceStep" },
      },
      1,
      "simulator",
    ),
    naturalNumbersContent,
  );
  if (!result.accepted)
    throw new Error(`Active fixture rejected: ${result.reason.message}`);
  const activeSeconds = selectProjectProgress(
    result.state,
    naturalNumbersContent,
    "nn.project.zero_successor" as never,
  ).etaSeconds!;
  return {
    amount,
    baselineSeconds,
    activeSeconds,
    advantage: (baselineSeconds - activeSeconds) / baselineSeconds,
  };
};
const activeInterventionFixtures = [
  interventionFixture(1),
  interventionFixture(2),
];
const activePublication = runSimulation({
  policy: "activeOptimizer",
  horizonSeconds: 7_200,
  stopCondition: "publication",
});
const noInsightContent = structuredClone(naturalNumbersContent);
noInsightContent.configuration.insight.modifierPerInsight = 0;
const waitingPublication = runSimulation({
  policy: "activeOptimizer",
  horizonSeconds: 7_200,
  stopCondition: "publication",
  content: noInsightContent,
});
if (
  activePublication.publicationTimingMs === null ||
  waitingPublication.publicationTimingMs === null
)
  throw new Error("Paired active-advantage simulations must both publish");
const sustainedActiveAdvantage =
  (waitingPublication.publicationTimingMs -
    activePublication.publicationTimingMs) /
  waitingPublication.publicationTimingMs;
const sustainedActiveFixture = {
  method:
    "Paired full-Publication activeOptimizer runs with identical seed and policy; baseline sets only modifierPerInsight to zero while retaining the same accepted Insight commands.",
  activePublicationMs: activePublication.publicationTimingMs,
  waitingPublicationMs: waitingPublication.publicationTimingMs,
  activeInsightSpent: activePublication.finalState.insightSpent,
  baselineInsightSpent: waitingPublication.finalState.insightSpent,
  advantage: sustainedActiveAdvantage,
  theoreticalSingleInterventionCeiling:
    naturalNumbersContent.configuration.insight.ceiling,
};

const output = {
  schemaVersion: 1,
  method:
    "Deterministic policy fixtures plus clearly separated self-play personas; no independent human participants were available.",
  limitations: [
    "Self-play does not establish comprehension, fun, frustration, fatigue or retention.",
    "Mobile and keyboard personas are structured audits, not independent participants.",
    "No personal data or telemetry was collected.",
  ],
  checkpoints,
  policies,
  activeInterventionFixtures,
  sustainedActiveFixture,
  personaSessions,
  summary: {
    policyCount: policies.length,
    policiesPublished: policies.filter((policy) => policy.publications === 1)
      .length,
    publicationMedianMinutes: median,
    publicationMinMinutes: Math.min(...values),
    publicationMaxMinutes: Math.max(...values),
    activeAdvantageTypical: sustainedActiveAdvantage,
    activeAdvantageMaximum: naturalNumbersContent.configuration.insight.ceiling,
    rejectedCommands: policies.reduce(
      (sum, policy) => sum + policy.rejectedCommands,
      0,
    ),
    invariantViolations: policies.flatMap(
      (policy) => policy.invariantViolations,
    ),
  },
};

writeFileSync(
  resolve(dataDirectory, "playtest-results.json"),
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(
  `Phase 2 playtest fixtures: ${output.summary.policiesPublished}/${policies.length} policies published; median ${median.toFixed(2)} minutes.`,
);
