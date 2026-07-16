export const MODEL_VERSION = "phase0-design-lab/1.0.0";

export function integerAllocations(total: number, lanes: number): number[][] {
  if (!Number.isInteger(total) || total < 0) throw new Error("total must be a non-negative integer");
  if (!Number.isInteger(lanes) || lanes < 1) throw new Error("lanes must be a positive integer");

  const output: number[][] = [];
  const visit = (remaining: number, prefix: number[]): void => {
    if (prefix.length === lanes - 1) {
      output.push([...prefix, remaining]);
      return;
    }
    for (let value = 0; value <= remaining; value += 1) visit(remaining - value, [...prefix, value]);
  };
  visit(total, []);
  return output;
}

export function allocationOutput(allocation: number[], exponent: number, weights: number[]): number {
  if (!(exponent > 0 && exponent <= 1)) throw new Error("exponent must be in (0, 1]");
  if (allocation.length !== weights.length || allocation.length === 0) throw new Error("shape mismatch");
  if (allocation.some((value) => !Number.isFinite(value) || value < 0)) throw new Error("invalid allocation");
  if (weights.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error("invalid weight");
  return allocation.reduce((sum, value, index) => sum + weights[index]! * value ** exponent, 0);
}

export function bestAllocation(total: number, exponent: number, weights: number[]): { allocation: number[]; output: number } {
  const ranked = integerAllocations(total, weights.length)
    .map((allocation) => ({ allocation, output: allocationOutput(allocation, exponent, weights) }))
    .sort((a, b) => b.output - a.output || a.allocation.join(",").localeCompare(b.allocation.join(",")));
  const winner = ranked[0];
  if (!winner || !Number.isFinite(winner.output)) throw new Error("no finite policy");
  return winner;
}

export function attentionExperiment() {
  const capacities = [3, 4, 5, 6, 8];
  const exponents = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1];
  const scenarios = [
    { id: "balanced", weights: [1, 1] },
    { id: "precision-goal", weights: [1.35, 0.85] },
    { id: "intuition-goal", weights: [0.85, 1.35] },
    { id: "project-prep", weights: [1.15, 1.1] },
  ];
  const discrete = capacities.flatMap((capacity) =>
    exponents.map((exponent) => {
      const winners = scenarios.map((scenario) => ({
        scenario: scenario.id,
        ...bestAllocation(capacity, exponent, scenario.weights),
      }));
      return {
        capacity,
        exponent,
        policyCount: integerAllocations(capacity, 2).length,
        allInWins: winners.filter((winner) => Math.max(...winner.allocation) === capacity).length,
        meanActiveLanes: mean(winners.map((winner) => winner.allocation.filter((value) => value > 0).length)),
        winners,
      };
    }),
  );
  return {
    discrete,
    controlComparison: [
      control("slider", 3, 8, 7, 5, 4),
      control("plus-minus", 5, 2, 2, 9, 8),
      control("drag-tokens", 4, 5, 8, 4, 6),
      control("presets", 2, 1, 1, 8, 9),
      control("priority-cards", 3, 2, 2, 8, 8),
      control("tap-to-assign", 4, 1, 2, 8, 9),
    ],
    selection: {
      representation: "discrete whole Attention with tap/plus-minus and presets",
      capacity: "start at 3; unlock a fourth in Natural Numbers; do not use 6 as a default",
      exponent: 0.8,
      exponentStatus: "PROVISIONAL",
      reason: "Four slots preserve five legible two-lane policies; exponent 0.80 avoids all-in dominance in tested project contexts while retaining visible specialization gaps.",
    },
  };
}

function control(id: string, actions: number, precisionBurden: number, touchBurden: number, keyboard: number, screenReader: number) {
  return { id, actions, precisionBurden, touchBurden, keyboardFeasibility: keyboard, screenReaderFeasibility: screenReader };
}

type CoreCandidate = {
  id: string;
  name: string;
  metrics: Record<string, number>;
  scores: Record<string, number>;
  failureMode: string;
};

const coreCandidates: CoreCandidate[] = [
  core("A", "Discrete Attention Allocation", [7, 10, 6, 5, 12, 72, 24, 4, 18, 4, 3, 4], [8, 7, 7, 8, 7, 7], "allocation becomes a solved split"),
  core("B", "Continuous Percentage Allocation", [8, 18, 15, 7, 8, 66, 38, 7, 9, 7, 8, 7], [6, 4, 7, 6, 5, 6], "slider maintenance overwhelms project choice"),
  core("C", "Priority and Reserve System", [6, 7, 3, 6, 16, 84, 12, 5, 15, 6, 4, 7], [7, 8, 8, 7, 8, 5], "rules hide causality from new players"),
  core("D", "Proof Dependency Network", [9, 12, 2, 9, 20, 76, 8, 6, 24, 8, 6, 8], [8, 7, 6, 8, 10, 5], "dependency graph becomes homework"),
  core("E", "Research Project Management", [8, 8, 2, 6, 18, 82, 10, 6, 20, 6, 3, 5], [8, 8, 9, 8, 8, 8], "long queues reduce moment-to-moment agency"),
  core("F", "Attention + Projects + Dependency Hybrid", [10, 11, 4, 7, 12, 80, 9, 7, 21, 7, 4, 6], [9, 8, 9, 9, 10, 8], "too many layers appear before context exists"),
];

function core(id: string, name: string, raw: number[], scores: number[], failureMode: string): CoreCandidate {
  const rawKeys = ["meaningfulDecisions", "actions", "reallocations", "relevantVariables", "maxIdleMinutes", "automaticPercent", "repeatedPercent", "viablePolicies", "policySpreadPercent", "stateSpaceBand", "mobileBurden", "explanationBurden"];
  const scoreKeys = ["decisionQuality", "lowMicromanagement", "automation", "mobile", "mathematicalIntegration", "scopeControl"];
  return {
    id,
    name,
    metrics: Object.fromEntries(rawKeys.map((key, index) => [key, raw[index]!])),
    scores: Object.fromEntries(scoreKeys.map((key, index) => [key, scores[index]!])),
    failureMode,
  };
}

export function coreLoopExperiment() {
  const weights = { decisionQuality: 0.25, lowMicromanagement: 0.2, automation: 0.15, mobile: 0.15, mathematicalIntegration: 0.15, scopeControl: 0.1 };
  const variants = [
    weights,
    { ...weights, mobile: 0.25, decisionQuality: 0.15 },
    { ...weights, scopeControl: 0.2, mathematicalIntegration: 0.05 },
    { ...weights, mathematicalIntegration: 0.25, lowMicromanagement: 0.1 },
    { ...weights, lowMicromanagement: 0.3, automation: 0.05 },
  ];
  const rankings = variants.map((variant, index) => ({
    variant: index,
    weights: variant,
    ranking: rank(coreCandidates, variant),
  }));
  return {
    candidates: coreCandidates,
    criteria: "Scores are 0-10 heuristic judgments anchored to the raw first-30-minute workload estimates; they are not fun measurements.",
    rankings,
    selected: "F",
    sensitivity: { winnerChanges: new Set(rankings.map((item) => item.ranking[0]!.id)).size - 1, testedWeightSets: variants.length },
  };
}

function rank(candidates: CoreCandidate[], weights: Record<string, number>) {
  return candidates
    .map((candidate) => ({
      id: candidate.id,
      weightedScore: round(Object.entries(weights).reduce((total, [key, weight]) => total + candidate.scores[key]! * weight, 0), 3),
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore || a.id.localeCompare(b.id));
}

export function resourceExperiment() {
  const weights = { distinctness: 0.3, decisionValue: 0.25, lowBurden: 0.2, lowLoopRisk: 0.15, extensibility: 0.1 };
  const models = [
    resource(1, [9, 3, 10, 10, 4], "Understanding only", "No real allocation or project-input trade-off."),
    resource(2, [9, 9, 8, 8, 8], "Precision + Intuition", "Projects must prevent a fixed optimal production ratio."),
    resource(3, [7, 8, 6, 6, 9], "Precision + Intuition + Technique", "Technique duplicates project efficiency unless given awkward sinks."),
    resource(4, [6, 8, 4, 4, 9], "Precision + Intuition + Technique + Proof Components", "Conversion graph and explanation cost dominate the first chapter."),
  ].map((model) => ({ ...model, weightedScore: round(score(model.scores, weights), 3) }))
    .sort((a, b) => b.weightedScore - a.weightedScore || a.count - b.count);
  return {
    models,
    selection: {
      primaryStocks: ["Precision", "Intuition"],
      nonPrimaryMeters: ["Attention (capacity)", "Understanding (non-spendable mastery)", "Insight (stored active charges)", "Mastery (published chapter record)"],
      rejectedPrimaryStocks: ["Technique", "Proof Components", "Axioms"],
    },
  };
}

function resource(count: number, values: number[], identity: string, risk: string) {
  const keys = ["distinctness", "decisionValue", "lowBurden", "lowLoopRisk", "extensibility"];
  return { count, identity, risk, scores: Object.fromEntries(keys.map((key, index) => [key, values[index]!])) };
}

export function branchExperiment() {
  const weights = { behavioralDifference: 0.35, reversibility: 0.2, universalAutomation: 0.2, lowTrapRisk: 0.15, scopeControl: 0.1 };
  const models = [
    branch("A", "Rigor / Intuition / Automation", [6, 5, 2, 4, 6], "Automation branch withholds quality of life."),
    branch("B", "Rigor / Intuition / Practice", [7, 6, 10, 6, 6], "Risk of player-type sorting rather than situational choice."),
    branch("C", "Formal / Experimental / Computational", [9, 6, 10, 7, 5], "Computational content may not fit every chapter."),
    branch("D", "Depth / Breadth / Efficiency", [5, 7, 10, 7, 7], "Tends to collapse into multipliers."),
    branch("E", "Temporary project approaches", [9, 10, 10, 10, 9], "Approach identity may feel less persistent."),
  ].map((model) => ({ ...model, weightedScore: round(score(model.scores, weights), 3) }))
    .sort((a, b) => b.weightedScore - a.weightedScore || a.id.localeCompare(b.id));
  return {
    models,
    selected: "E",
    approaches: [
      { id: "formal", behavior: "Expose proof obligations; completed obligations become reusable lemmas." },
      { id: "exploratory", behavior: "Reveal examples/counterexamples early; revise requirements before committing work." },
      { id: "constructive", behavior: "Convert prepared examples into deterministic project steps and explicit artifacts." },
    ],
    respec: "Free before start; mid-project switch preserves inputs and at least 90% completed work (PROVISIONAL loss ceiling).",
  };
}

function branch(id: string, name: string, values: number[], risk: string) {
  const keys = ["behavioralDifference", "reversibility", "universalAutomation", "lowTrapRisk", "scopeControl"];
  return { id, name, risk, scores: Object.fromEntries(keys.map((key, index) => [key, values[index]!])) };
}

export function activeIdleExperiment() {
  const bands = [5, 10, 15, 20, 25, 35, 50, 100].map((percent) => {
    const usefulness = Math.min(10, 4 + percent / 3);
    const idleViability = Math.max(0, 10 - Math.max(0, percent - 15) / 5);
    const lowBurden = Math.max(0, 10 - percent / 12);
    const lowFrustration = Math.max(0, 10 - Math.max(0, percent - 10) / 7);
    return { percent, score: round(0.3 * usefulness + 0.3 * idleViability + 0.2 * lowBurden + 0.2 * lowFrustration, 3) };
  });
  return {
    bands,
    selectedBand: "10-15% sustained advantage (PROVISIONAL; hard ceiling 20%)",
    mechanic: "Deterministic stored Insight charges, cap 3; no random or timed clicks.",
    offline: "Accrue at most one charge from completed offline events, never above cap.",
  };
}

export type OfflineEvent = { at: number; type: "projectComplete" | "resourceCap" | "upgradeAffordable"; configured: boolean };

export function simulateOffline(elapsedHours: number, events: OfflineEvent[], safePolicy: boolean) {
  if (!Number.isFinite(elapsedHours) || elapsedHours < 0) throw new Error("invalid elapsed time");
  if (events.some((event) => event.at < 0 || event.at > elapsedHours)) throw new Error("impossible event state");
  const ordered = [...events].sort((a, b) => a.at - b.at || a.type.localeCompare(b.type));
  const blocking = ordered.find((event) => !event.configured && !safePolicy);
  const credited = Math.min(elapsedHours, 12) + Math.max(0, Math.min(elapsedHours, 72) - 12) * 0.25;
  return {
    simulatedHours: round(Math.min(blocking?.at ?? elapsedHours, elapsedHours), 3),
    effectiveProductionHours: round(Math.min(credited, blocking?.at ?? credited), 3),
    stoppedAt: blocking?.type ?? null,
    policy: safePolicy ? "configured-safe-policy" : "stop-at-unresolved-decision",
  };
}

export function offlineExperiment() {
  const models = [
    offline("full-hard-cap", [6, 9, 6, 7, 8]),
    offline("full-then-diminishing", [8, 8, 7, 7, 8]),
    offline("stored-time", [6, 6, 8, 6, 6]),
    offline("until-decision", [9, 5, 9, 9, 8]),
    offline("safe-policy", [8, 9, 8, 7, 7]),
    offline("until-decision-then-safe-policy", [10, 9, 9, 8, 9]),
    offline("project-only", [5, 7, 8, 7, 8]),
    offline("bounded-event-driven", [9, 8, 9, 8, 8]),
  ];
  return {
    models: models.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)),
    selected: "progress until unresolved decision, then configured safe policy; bounded event-driven stepping",
    provisionalWindows: { fullEfficiencyHours: 12, diminishingUntilHours: 72, diminishingEfficiency: 0.25 },
    examples: [
      simulateOffline(6, [{ at: 2, type: "projectComplete", configured: false }], false),
      simulateOffline(24, [{ at: 2, type: "projectComplete", configured: true }], true),
    ],
  };
}

function offline(id: string, values: number[]) {
  return { id, score: round(0.25 * values[0]! + 0.2 * values[1]! + 0.2 * values[2]! + 0.2 * values[3]! + 0.15 * values[4]!, 3) };
}

export function pacingExperiment() {
  const events = [
    ["first interaction", 5, 15], ["passive production", 15, 30], ["meaningful choice", 60, 180],
    ["second resource", 180, 420], ["first project", 300, 600], ["first upgrade", 480, 900],
    ["first milestone", 720, 1200], ["first automation", 1200, 2100], ["first Insight", 1500, 2400],
    ["first approach choice", 2100, 3600], ["capstone", 5400, 8400], ["Publication", 7200, 10800],
  ].map(([event, earliestSeconds, latestSeconds]) => ({ event, earliestSeconds, latestSeconds }));
  return {
    events,
    firstChapter: "120-180 minutes active-equivalent across 1-3 sessions (PROVISIONAL)",
    campaign: "30-50 active-equivalent hours across 4-8 weeks (PROVISIONAL)",
    deadIntervalGates: { actionableDecisionMinutes: 12, visibleProgressSeconds: 30, systemRevealMinutes: 25 },
  };
}

export function prestigeExperiment() {
  const options = ["after Natural Numbers", "after Integers", "after Rational Numbers", "after Real Numbers", "after Sequences", "after campaign", "no global prestige", "framework shift without full reset"];
  return {
    options: options.map((option, index) => ({
      option,
      evidenceScore: index < 5 ? 2 : index === 7 ? 6 : 5,
      publicationOverlapRisk: index < 6 ? 9 - index : index === 6 ? 2 : 4,
    })),
    decision: "DEFERRED UNTIL MULTI-CHAPTER PROTOTYPE",
    reason: "No reset purpose is proven that Publication, Mastery, challenges, or a non-reset framework shift cannot serve.",
    extensionPoint: "Canonical state reserves nullable prestige metadata; Phase 1 implements no prestige command or formula.",
  };
}

export function frontendExperiment() {
  const weights = { clarity: 0.2, updateModel: 0.15, bundle: 0.1, testability: 0.15, accessibility: 0.1, composition: 0.15, maintainability: 0.15 };
  const candidates = [
    frontend("plain TypeScript DOM", [6, 5, 10, 6, 8, 5, 5]),
    frontend("TypeScript + Preact", [9, 9, 8, 9, 9, 9, 9]),
    frontend("TypeScript + React", [9, 9, 6, 9, 9, 10, 9]),
  ].map((candidate) => ({ ...candidate, weightedScore: round(score(candidate.scores, weights), 3) }))
    .sort((a, b) => b.weightedScore - a.weightedScore || a.id.localeCompare(b.id));
  return { candidates, selected: "TypeScript + Preact + Vite", engineBoundary: "framework-free engine and validated content; UI subscribes through selectors" };
}

function frontend(id: string, values: number[]) {
  const keys = ["clarity", "updateModel", "bundle", "testability", "accessibility", "composition", "maintainability"];
  return { id, scores: Object.fromEntries(keys.map((key, index) => [key, values[index]!])) };
}

export function numericalExperiment() {
  const ranges = [
    { scope: "Natural Numbers", exponent: 12 },
    { scope: "first four chapters", exponent: 90 },
    { scope: "initial campaign", exponent: 220 },
    { scope: "postgame envelope", exponent: 400 },
  ];
  return {
    ranges: ranges.map((range) => ({ ...range, nativeFinite: range.exponent <= 308, integerPrecisionExact: range.exponent <= 15 })),
    selected: "native number behind a Numerical adapter for Phase 1; prohibit direct UI/content arithmetic",
    migrationGate: "Adopt a large-number implementation before any reachable value exceeds 1e280 or precision-sensitive integer logic exceeds 2^53-1.",
  };
}

function score(values: Record<string, number>, weights: Record<string, number>) {
  return Object.entries(weights).reduce((total, [key, weight]) => total + values[key]! * weight, 0);
}

function mean(values: number[]) {
  return round(values.reduce((sum, value) => sum + value, 0) / values.length, 3);
}

function round(value: number, decimals: number) {
  const power = 10 ** decimals;
  return Math.round(value * power) / power;
}
