import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runSimulation } from "../core";
import { policyNames } from "../policies";

const results = policyNames.map((policy) =>
  runSimulation({
    policy,
    horizonSeconds: 10_800,
    stopCondition: "publication",
  }),
);
const balanced = results.find(
  (result) => result.options.policy === "balanced",
)!;
const attentionExponents = [0.65, 0.7, 0.75, 0.8, 0.85, 0.9].map(
  (exponent) => ({
    exponent,
    one: 1 ** exponent,
    two: 2 ** exponent,
    three: 3 ** exponent,
    marginalSecond: 2 ** exponent - 1,
    marginalThird: 3 ** exponent - 2 ** exponent,
  }),
);
const data = {
  generatedBy: "npm run balance:report",
  heuristicDisclaimer:
    "These deterministic heuristics test reachability and dominance risks; they do not prove fun.",
  policies: results.map((result) => ({
    ...result.policySummary,
    publicationTimingMs: result.publicationTimingMs,
    hash: result.deterministicHash,
  })),
  attentionExponents,
  dedicatedProjectSlot: {
    selected: true,
    linear: true,
    competingComparator: {
      modeled: "Phase 0 evidence retained",
      productionEnabled: false,
    },
  },
  criticalGates: {
    balancedPublication: balanced.finalState.records.publications === 1,
    requiredResourcesLive:
      balanced.resourceTimeline.some((entry) => entry.precision > 50) &&
      balanced.resourceTimeline.some((entry) => entry.intuition > 20),
    allPoliciesDeterministic: results.every(
      (result) =>
        result.deterministicHash ===
        runSimulation({
          policy: result.options.policy,
          horizonSeconds: 10_800,
          stopCondition: "publication",
        }).deterministicHash,
    ),
    noInvariantViolations: results.every(
      (result) => result.invariantViolations.length === 0,
    ),
  },
};
const directory = resolve("reports/phase-1/data");
await mkdir(directory, { recursive: true });
await writeFile(
  resolve(directory, "balance-and-policy.json"),
  `${JSON.stringify(data, null, 2)}\n`,
  "utf8",
);
await writeFile(
  resolve(directory, "attention-model.json"),
  `${JSON.stringify({ attentionExponents, configuredExponent: 0.8 }, null, 2)}\n`,
  "utf8",
);
process.stdout.write(`${JSON.stringify(data.criticalGates)}\n`);
if (Object.values(data.criticalGates).some((value) => !value))
  process.exitCode = 1;
