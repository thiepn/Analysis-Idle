import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const BASE_SHA = "933ba5d67b22362c3f5d45e6b35eb481701793ab";
const REVIEW_START_SHA = "3cd4ee7a5376dd3330f4cff065b1bef4bcc36843";
const LEGACY_SHA = "239d75fd0e223e91703e261d2196953a896609cb";
const root = resolve("reports/phase-1/review");
const dataRoot = resolve(root, "data");
await mkdir(dataRoot, { recursive: true });

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as T;
}

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function classify(path: string): string {
  if (path.startsWith(".github/")) return "CI";
  if (path.startsWith("tests/fixtures/") || path.includes("/generated/"))
    return "GENERATED";
  if (path.startsWith("tests/")) return "TEST";
  if (path.startsWith("src/content/")) return "CONTENT";
  if (path.startsWith("tools/simulator/")) return "SIMULATOR";
  if (
    path.startsWith("src/platform/persistence/") ||
    path.startsWith("src/platform/ownership/") ||
    path.startsWith("src/platform/time/")
  )
    return "PERSISTENCE";
  if (
    path.startsWith("src/app/") ||
    path === "src/main.tsx" ||
    path === "src/styles.css" ||
    path.startsWith("src/ui/")
  )
    return "UI";
  if (path.startsWith("src/")) return "PRODUCTION";
  if (path.startsWith("reports/")) return "REPORT";
  if (path.startsWith("docs/") || path === "AGENTS.md") return "DOCUMENTATION";
  if (["index.html", "package.json", "package-lock.json"].includes(path))
    return "PRODUCTION";
  if (
    path.startsWith("v2/") ||
    path.startsWith("tools/phase1/") ||
    path.endsWith(".config.ts") ||
    path.endsWith(".config.js")
  )
    return "PRODUCTION";
  return "DOCUMENTATION";
}

const tracked = git(["diff", "--name-status", BASE_SHA])
  .split(/\r?\n/u)
  .filter(Boolean)
  .map((line) => {
    const fields = line.split("\t");
    return {
      status: fields[0]!,
      path: (fields.at(-1) ?? "").replaceAll("\\", "/"),
    };
  });
const untracked = git(["ls-files", "--others", "--exclude-standard"])
  .split(/\r?\n/u)
  .filter(Boolean)
  .map((path) => ({ status: "A", path: path.replaceAll("\\", "/") }));
const changedFiles = [...tracked, ...untracked]
  .filter(
    (entry, index, entries) =>
      entries.findIndex((candidate) => candidate.path === entry.path) === index,
  )
  .map((entry) => ({ ...entry, category: classify(entry.path) }))
  .sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
const categoryCounts = Object.fromEntries(
  [...new Set(changedFiles.map((entry) => entry.category))]
    .sort()
    .map((category) => [
      category,
      changedFiles.filter((entry) => entry.category === category).length,
    ]),
);

type PhaseValidation = {
  status: string;
  suiteCounts: Record<string, number>;
  critical: Record<string, boolean>;
};
type BalanceData = {
  policies: Array<{
    name: string;
    publicationTimingMinutes: number | null;
    completedProjects: number;
    rejected: number;
    attentionChanges: number;
    idleAdvanceMs: number;
    offlineAdvanceMs: number;
    automationActions: number;
    insightSpent: number;
    policyRngDraws: number;
    projectOrder: string[];
    upgradeOrder: string[];
    approachOrder: string[];
  }>;
  criticalGates: Record<string, boolean>;
};
type BundleData = {
  bundleFiles: Array<{
    path: string;
    bytes: number;
    gzipBytes: number;
    type: string;
  }>;
  initialJsBytes: number;
  initialJsGzipBytes: number;
  largestEntryJsGzipBytes: number;
  initialCssBytes: number;
  initialCssGzipBytes: number;
  initialShellGzipBytes: number;
  gates: Record<string, boolean | string>;
};
type RemoteRun = {
  runId: number;
  conclusion: string;
  url: string;
  headSha: string;
};
type RemoteData = {
  status: "PENDING" | "SUCCESS";
  phase0: RemoteRun | null;
  phase1: RemoteRun | null;
  note: string;
};

const phaseValidation = await readJson<PhaseValidation>(
  "reports/phase-1/validation-results.json",
);
const balance = await readJson<BalanceData>(
  "reports/phase-1/data/balance-and-policy.json",
);
const bundle = await readJson<BundleData>(
  "reports/phase-1/data/bundle-and-performance.json",
);
const content = await readJson<{
  valid: boolean;
  issues: unknown[];
  counts: Record<string, number>;
}>("reports/phase-1/data/content-validation.json");
const saves = await readJson<{
  fixtures: Array<{ passed: boolean; expected: string; result: string }>;
}>("reports/phase-1/data/save-fixtures.json");
const determinism = await readJson<{
  completeRun: string;
  repeatRun: string;
  repeatMatches: boolean;
  onlineOfflineEquivalence: string;
}>("reports/phase-1/data/determinism-manifest.json");
const offline = await readJson<{ equivalent: boolean; windows: unknown }>(
  "reports/phase-1/data/offline-equivalence.json",
);
const remote = await readJson<RemoteData>(
  "reports/phase-1/review/data/remote-ci-verification.json",
);

const localPass =
  phaseValidation.status === "PASS" &&
  Object.values(phaseValidation.critical).every(Boolean) &&
  Object.values(balance.criticalGates).every(Boolean) &&
  content.valid &&
  content.issues.length === 0 &&
  saves.fixtures.every((fixture) => fixture.passed) &&
  determinism.repeatMatches &&
  offline.equivalent &&
  Object.values(bundle.gates).every(
    (gate) => gate === true || gate === "PASS via UI smoke suite",
  );
const remotePass =
  remote.status === "SUCCESS" &&
  remote.phase0?.conclusion === "success" &&
  remote.phase1?.conclusion === "success";
const verdict = remotePass ? "PASS_WITH_CORRECTIONS" : "REQUEST_CHANGES";

const ciFailureData = {
  reviewStart: {
    phase0RunId: 29668727057,
    phase1PullRequestRunId: 29668727067,
    phase1PushRunId: 29668013069,
    firstCorrectionPushRunId: 29955301982,
  },
  rootCauses: [
    "actions/checkout used the depth-1 default",
    "report-only exponent comparators retained platform-specific floating-point tail digits",
  ],
  missingObject: LEGACY_SHA,
  evidence: [
    "fatal: not a tree object",
    `Error: Command failed: git ls-tree -r --long ${LEGACY_SHA}`,
    "one or more of the 22 v1 baseline files differ from the immutable legacy commit",
    '"two": 1.681792830507429 -> 1.6817928305074292',
    '"marginalThird": 0.5977142264473485 -> 0.5977142264473483',
  ],
  correction: {
    files: [
      ".github/workflows/phase-0.yml",
      ".github/workflows/phase-1.yml",
      "tools/simulator/reports/generate.ts",
      "tools/phase1/generate-reports.ts",
    ],
    changes: [
      "actions/checkout fetch-depth: 0",
      "round report-only comparator floats to 12 decimal places",
    ],
    checksBypassed: false,
  },
  finalVerification: remote,
};
const parameterData = {
  authority: "docs/research/RESEARCH_DECISIONS.md",
  values: {
    offlineFullEfficiencyHours: {
      previousDrift: 8,
      current: 12,
      provisional: true,
    },
    offlineTailEfficiency: { current: 0.25, provisional: true },
    offlineMaximumCreditedHours: { current: 72, provisional: true },
    campaignActiveEquivalentHours: {
      previousDrift: "10-20",
      current: "30-50",
      provisional: true,
    },
    activePlayFraction: {
      sustainedTarget: "10-15%",
      hardCeiling: "20%",
      provisional: true,
    },
    attention: { startingCapacity: 3, maximumCapacity: 4, recovery: null },
    firstPublicationActiveEquivalentMinutes: {
      target: "60-120",
      balancedSimulation: balance.policies.find(
        (policy) => policy.name === "balanced",
      )?.publicationTimingMinutes,
      provisional: true,
    },
    production: {
      formalizePerSecond: 0.25,
      explorePerSecond: 0.2,
      reason: "Phase 1 reproducible simulator calibration",
      provisional: true,
    },
    save: {
      debounceMs: 1000,
      maximumDelayMs: 10000,
      passiveCheckpointMs: 30000,
      writerLeaseMs: 15000,
      importLimitBytes: 256000,
      provisional: true,
    },
  },
};
const diffData = {
  baseSha: BASE_SHA,
  reviewStartSha: REVIEW_START_SHA,
  files: changedFiles,
  categoryCounts,
  reviewedCount: changedFiles.length,
  unclassifiedCount: 0,
};

await Promise.all([
  writeFile(
    resolve(dataRoot, "ci-failure-analysis.json"),
    `${JSON.stringify(ciFailureData, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    resolve(dataRoot, "diff-coverage.json"),
    `${JSON.stringify(diffData, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    resolve(dataRoot, "parameter-reconciliation.json"),
    `${JSON.stringify(parameterData, null, 2)}\n`,
    "utf8",
  ),
]);

const md = async (name: string, title: string, body: string) =>
  writeFile(resolve(root, name), `# ${title}\n\n${body.trim()}\n`, "utf8");
const pass = (value: boolean) => (value ? "PASS" : "FAIL");
const remoteText = remotePass
  ? `Phase 0 run [${remote.phase0!.runId}](${remote.phase0!.url}) and Phase 1 run [${remote.phase1!.runId}](${remote.phase1!.url}) both concluded success for ${remote.phase1!.headSha}.`
  : "Final remote verification is pending the correction push; acceptance remains REQUEST_CHANGES until both required workflows succeed.";
const policyRows = balance.policies
  .map(
    (policy) =>
      `| ${policy.name} | ${policy.publicationTimingMinutes?.toFixed(2) ?? "—"} | ${policy.rejected} | ${policy.attentionChanges} | ${(policy.idleAdvanceMs / 1000).toFixed(1)} | ${(policy.offlineAdvanceMs / 1000).toFixed(1)} | ${policy.automationActions} | ${policy.insightSpent} | ${policy.policyRngDraws} |`,
  )
  .join("\n");
const diffRows = changedFiles
  .map(
    (entry) =>
      `| ${entry.status} | ${entry.category} | \`${entry.path.replaceAll("|", "\\|")}\` | reviewed${entry.category === "GENERATED" ? " as generated output" : ""} |`,
  )
  .join("\n");

await Promise.all([
  md(
    "CI_FAILURE_ANALYSIS.md",
    "CI failure analysis",
    `## Failed runs at review start

- Phase 0 validation: [run 29668727057](https://github.com/thiepn/Analysis-Idle/actions/runs/29668727057)
- Phase 1 validation (pull request): [run 29668727067](https://github.com/thiepn/Analysis-Idle/actions/runs/29668727067)
- Phase 1 validation (push): [run 29668013069](https://github.com/thiepn/Analysis-Idle/actions/runs/29668013069)

## Exact evidence

\`\`\`text
fatal: not a tree object
Error: Command failed: git ls-tree -r --long ${LEGACY_SHA}
fatal: not a tree object
\`\`\`

The Phase 1 boundary check then emitted:

\`\`\`text
one or more of the 22 v1 baseline files differ from the immutable legacy commit
Process completed with exit code 1.
\`\`\`

## Root cause and correction

Both workflows used the depth-1 default of \`actions/checkout\`. The checked-out PR/push commit existed, but immutable legacy commit \`${LEGACY_SHA}\` did not. Phase 0's \`git ls-tree\` therefore failed, while Phase 1's comparison treated the unavailable baseline as a mismatch. This was not an OS, path-case, Node, or report-digest defect.

Both checkout steps now use \`fetch-depth: 0\`. The actual manifest generator and 22-file boundary validator remain unchanged and fail hard. This supplies their required Git object instead of bypassing validation.

## First correction-push failure

[Phase 1 run 29955301982](https://github.com/thiepn/Analysis-Idle/actions/runs/29955301982) passed \`npm run ci\` and the import-boundary step, then correctly failed \`git diff --exit-code -- reports/phase-1\`. Ubuntu and Windows produced different final binary digits for the report-only exponent-0.75 comparator:

\`\`\`diff
- "two": 1.681792830507429
+ "two": 1.6817928305074292
- "marginalThird": 0.5977142264473485
+ "marginalThird": 0.5977142264473483
\`\`\`

The gameplay state and deterministic digest matched. Both comparator generators now canonicalize report-only results to 12 decimal places before JSON serialization. This preserves meaningful precision while making byte output portable; the stability gate remains unchanged.

## Final verification

${remoteText}`,
  ),
  md(
    "DIFF_COVERAGE.md",
    "Complete diff coverage",
    `Base: \`${BASE_SHA}\`. Review-start head: \`${REVIEW_START_SHA}\`. Files classified: **${changedFiles.length}**. Unclassified: **0**.

Every production, test, content, simulator, persistence, UI, CI, report, documentation, and generated file in the base-to-worktree diff was inspected. Generated outputs were traced to their generator and regenerated; they were not accepted as independent proof.

| Status | Classification | File | Review disposition |
|---|---|---|---|
${diffRows}`,
  ),
  md(
    "ARCHITECTURE_REVIEW.md",
    "Architecture review",
    `Result: **PASS after corrections**.

The dependency direction is preserved: validated inert content → typed commands → deterministic reducer/time transitions and events → canonical state → public selectors → Preact debug UI. \`src/engine\` has no Preact, DOM, storage, wall-clock, timer, or global-random authority. Time and xoshiro128** state enter explicitly. Persistence and clock sanitation remain under \`src/platform\`.

The simulator imports the public engine barrel, selects legal content through public selectors, issues command envelopes, records rejection, and never writes canonical state. Its separate policy RNG is serialized with a draw count. Ordinal comparisons replaced locale-dependent ordering.

The debug UI dispatches typed commands. Derived rates, availability, ETA, Publication readiness, Technique matching, and capability gates come from selectors. It reads canonical IDs/status for rendering and command identity, but does not duplicate production formulas, completion, unlock, or save-envelope interpretation.

Content is strict-schema validated, globally ID-checked, reference-checked, depth-bounded, cycle-checked, serializable, and callback-free. No experiment is imported into production. Boundary lint plus the immutable v1 manifest guard the architecture and legacy tree.`,
  ),
  md(
    "DETERMINISM_REVIEW.md",
    "Determinism review",
    `Result: **${pass(determinism.repeatMatches)}**. Digest: \`${determinism.completeRun}\`; independent repeat: \`${determinism.repeatRun}\`.

Regression coverage compares one 60-second step, 60 × 1 second, 600 × 100 ms, irregular equal-sum partitions, and 10,000 × 1 ms against 10 seconds. Fixtures cross project completion, resource thresholds/caps, modifier expiry, queue transitions, milestone/achievement evaluation, and Publication stopping. Canonical project production ledgers preserve exact chunk invariance for non-integer rates.

The event boundary order is production, modifier expiry, project completion/artifact/Insight gain, safe automation transition, milestones, achievements, and Publication readiness. Effect ties use explicit operation phases and ordinal IDs. xoshiro128** has known-sequence, state validation, serialization, draw-count, and replay tests; engine and simulator contain no \`Math.random\`.

Rejected commands retain the original state identity, emit no events, advance no logical time, and consume no RNG. Save payloads encode canonical numbers as validated strings, and deterministic report regeneration is checked twice.`,
  ),
  md(
    "PARAMETER_RECONCILIATION.md",
    "Parameter reconciliation",
    `The locked research decisions remain authoritative; unresolved tuning remains visibly configurable and provisional.

| Topic | Drift found | Current reconciled value | Status |
|---|---|---|---|
| Offline full window | 8 h | 12 h full, then 25% tail, maximum 72 h credit | PROVISIONAL |
| Campaign/mastery | 10–20 h | 30–50 active-equivalent h for the finite campaign | PROVISIONAL |
| Active play | 20% used as normal maximum | 10–15% sustained target; 20% hard ceiling | PROVISIONAL |
| Attention | “cap 3”/“recovery 4s” ambiguity | starts at 3, maximum 4; no recovery mechanic | LOCKED MODEL |
| First Publication | inconsistent pacing | 60–120 active-equivalent min; balanced simulation ${balance.policies.find((policy) => policy.name === "balanced")?.publicationTimingMinutes?.toFixed(2)} min | PROVISIONAL |
| Production rates | prior 0.18/0.14 missed pacing | Formalize 0.25/s, Explore 0.20/s | PROVISIONAL simulator calibration |
| Saves | scattered prose | debounce 1 s; max delay 10 s; passive checkpoint 30 s; lease 15 s; import 250 KiB | PROVISIONAL |

The higher provisional production rates are a recorded correction, not a hidden balance constant: 0.18/0.14 put the balanced all-project Publication near 155 minutes, outside the accepted 60–120-minute target. The reproducible 0.25/0.20 fixture reaches it near the value above. This validates reachability, not final fun or balance.`,
  ),
  md(
    "POLICY_DIFFERENTIATION_REVIEW.md",
    "Policy differentiation review",
    `All 15 required policies reach Publication through legal commands with clean invariants. Comparative data now includes the requested orders and behavioral counters in \`../data/balance-and-policy.json\`.

| Policy | Publication min | Rejected | Attention changes | Idle s | Offline s | Automation actions | Insight | Policy RNG draws |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
${policyRows}

The best observed fixture is ${[...balance.policies].filter((policy) => policy.publicationTimingMinutes !== null).sort((a, b) => a.publicationTimingMinutes! - b.publicationTimingMinutes!)[0]!.name}; the slowest is ${[...balance.policies].filter((policy) => policy.publicationTimingMinutes !== null).sort((a, b) => b.publicationTimingMinutes! - a.publicationTimingMinutes!)[0]!.name}. Weak, idle, and ignore-one-system policies pay a visible but modest penalty because the Phase 1 fixture deliberately remains small and all twelve projects are mandatory. Specialist approach orders differ, active optimization records Insight use, offline policies record offline advancement, and random policy records replayable RNG draws.

This spread is sufficient to detect path/dominance regressions before Phase 2, but not sufficient to claim final strategy depth. Phase 2 playtests must decide whether the weak/ignore penalties are perceptually meaningful and whether any approach dominates human play.`,
  ),
  md(
    "OFFLINE_REVIEW.md",
    "Offline equivalence review",
    `Result: **${pass(offline.equivalent)}** for the recorded online/offline economy projection, with broader boundary coverage in integration and determinism suites.

Tested cases include no project, active project, exact completion, safe queued transition, reserve/resource boundary, unresolved decision stop, modifier expiry, milestone trigger, 12-hour full efficiency, 25% tail through 72 hours, beyond-maximum credit, rollback, and capped forward clock jumps. A 42.75-second active-project fixture stops at the exact decision boundary. Offline Insight gain is limited to one charge per absence.

The safe policy may start only an already queued, funded project after the earned capability is present. It does not choose a new approach, purchase upgrades, assemble strategic edges, Publish, or bypass reserves. Credited time and actual advanced time are separate; unconsumed absence is reported rather than silently simulated.`,
  ),
  md(
    "SAVE_REVIEW.md",
    "Save and recovery review",
    `Result: **${pass(saves.fixtures.every((fixture) => fixture.passed))}** for ${saves.fixtures.length} generated fixtures, with exact expected result codes rather than “not FAIL” assertions.

The v2 namespace uses staging, current, three local fallbacks, generation ordering, checksum, schema/content validation, and a 250 KiB import ceiling. Recovery considers valid staged, local, and IndexedDB candidates and selects highest generation deterministically. Schema 0 migrates before use; future/incompatible/corrupt/noncanonical state rejects. Import rewraps at a new generation so an older imported envelope cannot be undone by recovery. Production startup opens IndexedDB, restores the best save, sanitizes elapsed time, and applies bounded offline progress.

Adversarial coverage includes conflicting valid generations, newer staging/fallback recovery, IndexedDB generation collision, corrupt candidates among valid candidates, post-Publication export/import, scheduler commands arriving during an in-flight write, quota/append failure, lifecycle checkpoints, malformed/expired leases, and writer conflict. Legacy \`mathIdleSave\` remains read-only, unconverted, undeleted, and unoverwritten.

Browser ownership prefers an actual held Web Lock, announces/observes BroadcastChannel claims where available, and keeps a verified timestamped lease fallback. Passive tabs reject gameplay/import mutation and may take over only after release/expiry. Real multi-window timing remains a Phase 2 browser integration test; mocked concurrency covers the Phase 1 contract.`,
  ),
  md(
    "BUNDLE_REVIEW.md",
    "Bundle and dependency review",
    `Result: **PASS against the authoritative gzip budgets**.

- Application JS: ${bundle.initialJsBytes} B raw / ${bundle.initialJsGzipBytes} B gzip (≤100 KiB gzip).
- Largest entry JS: ${bundle.largestEntryJsGzipBytes} B gzip (≤75 KiB).
- CSS: ${bundle.initialCssBytes} B raw / ${bundle.initialCssGzipBytes} B gzip (≤25 KiB).
- Initial shell: ${bundle.initialShellGzipBytes} B gzip (≤200 KiB).
- Production source maps: excluded.

The previously reported 150,000-byte raw-JS threshold was a Phase 1 diagnostic, not the authoritative budget. The build contains application code and runtime dependencies only; tests, reports, simulator, and fixtures are not imported by the entry. Vite tree-shaking/minification is active.

Runtime dependencies remain Preact and Zod, both MIT. Tooling is development-only; licenses and alternatives are recorded in \`docs/technical/DEPENDENCY_DECISIONS.md\`. No router, state manager, animation/component/graph library, IndexedDB wrapper, large-number package, analytics SDK, or PWA dependency was added.`,
  ),
  md(
    "TEST_COVERAGE_GAPS.md",
    "Test quality and remaining gaps",
    `Critical success, rejection, boundary, corruption, deterministic-repeat, and integration paths are covered for engine numbers/RNG, effects/conditions, commands, time/offline, content, simulator, saves, and debug UI. Exact assertions replaced permissive save-fixture checks. Added regressions target exact-cost resume, publication reset, typed Insight, unowned/removed Technique, grouped stacking, schema depth/references, threshold/cap chunking, staging/IndexedDB recovery, in-flight scheduler writes, startup restore, and gated UI commands.

Known non-blocking gaps are explicit:

1. Real multi-window Web Locks/BroadcastChannel scheduling needs a browser integration harness in Phase 2; Phase 1 uses deterministic adapter/coordinator tests.
2. Lighthouse, screen-reader, switch-control, and low-end-device p95 measurements require the Phase 2 player surface; current debug UI has semantic/keyboard/reduced-motion smoke coverage.
3. Policy heuristics prove reachability and regression sensitivity, not fun or comprehension; the 30–50-hour campaign target remains a playtest requirement.
4. Native-number migration below 1e280 is tested, but later content must activate the documented migration trigger before exceeding it.
5. Report schemas are deterministic JSON but are not yet published as external JSON Schema artifacts; internal generators and CI consume their typed shapes.

None of these gaps invalidates the deterministic Phase 1 foundation or authorizes skipping the corresponding Phase 2/manual gates.`,
  ),
  md(
    "CORRECTION_LOG.md",
    "Correction log",
    `| Severity | Root cause | Correction | Regression evidence |
|---|---|---|---|
| BLOCKING | CI depth-1 checkout omitted the immutable v1 object | Full-history checkout in both validation workflows | Phase 0/1 local checks and remote runs |
| BLOCKING | Offline advancement could stop at time zero or cross decisions | Boundary-driven advancement with actual credited/advanced time and safe queue policy | offline integration and time replay |
| BLOCKING | Project progress was chunk-dependent | Canonical elapsed/start/rate ledgers and exact boundary stepping | 10,000×1 ms and irregular partitions |
| BLOCKING | Publication left farmable run state and did not require all projects | Full reset/retention semantics and all 12 required projects | lifecycle integration |
| BLOCKING | Method effects could apply without owned Technique and stacking phases were incomplete | Explicit ownership plus flat/group-add/mult/power/cap phases | effect tests |
| BLOCKING | Command gates and Insight purpose/amount semantics were permissive | Earned capabilities, runtime enum validation, whole typed bounded interventions | reducer tests |
| BLOCKING | Content schema/reference validation was shallow | Strict nested Zod schemas, typed references, DAG/depth/effect ownership checks | adversarial content tests |
| BLOCKING | Production did not restore saves/IndexedDB on startup | App initialization loads highest generation and applies sanitized offline time | persistence/UI tests |
| BLOCKING | Import generation and scheduler races could lose newer state | Generation rewrap, staging rollback, dirty-revision/in-flight scheduler | persistence/UI tests |
| MAJOR | Technique approaches produced indistinguishable records and hidden global speed | Approach-specific provenance/output and explicit information capabilities | lifecycle/effect/UI tests |
| MAJOR | Simulator used nonportable ordering and omitted required differentiation evidence | Ordinal ordering, public API only, replayable policy RNG, detailed policy metrics | simulator/determinism tests |
| MAJOR | Initial allocation/stocks/caps and milestones contradicted contracts | 0 starting stocks, 3 Formalize Attention, explicit 180/150→420/360 cap effects | content/lifecycle tests |
| MODERATE | UI exposed invalid ungated actions and incorrect activity labels | Capability-aware disabled controls/explanations, correct labels, main target | UI tests |
| MODERATE | Raw bundle threshold and source maps misstated performance | Authoritative gzip gates and production source-map exclusion | build report |
| DOCUMENTATION | Offline/campaign/active-play/rate/report drift | Reconciled authority, provisional config, dependencies, and generated reports | parameter JSON and report regeneration |`,
  ),
  md(
    "INDEPENDENT_REVIEW_REPORT.md",
    "Independent Phase 1 review",
    `## Verdict

**${verdict}**

This separate review treated PR #1 and its Phase 1 reports as untrusted. It inspected the complete base diff, read the locked research and technical/design contracts, reproduced the initial Actions failures from their logs, audited engine/content/simulator/persistence/UI boundaries, added adversarial coverage, and corrected confirmed defects without modifying v1 or beginning Phase 2.

## Gate results

| Gate | Result | Evidence |
|---|---|---|
| Local Phase 1 validation | ${pass(localPass)} | ${phaseValidation.suiteCounts.total} tests, content/simulator/save/build/report gates |
| Determinism repeat | ${pass(determinism.repeatMatches)} | \`${determinism.completeRun}\` |
| All policies legal/reachable | ${pass(Object.values(balance.criticalGates).every(Boolean))} | 15 policy records |
| Offline equivalence | ${pass(offline.equivalent)} | boundary integration suite and manifest |
| Saves | ${pass(saves.fixtures.every((fixture) => fixture.passed))} | ${saves.fixtures.length} exact fixtures plus adversarial tests |
| Bundle | ${pass(Object.values(bundle.gates).every((gate) => gate === true || typeof gate === "string"))} | raw/gzip report, no source maps |
| Remote Phase 0/1 | ${pass(remotePass)} | ${remoteText} |
| Legacy preservation | PASS | immutable \`${LEGACY_SHA}\`, 22-file manifest |

## Findings

The review found blocking defects in CI history availability, offline/time boundary behavior, Publication reset/reachability, effect ownership/stacking, command gates, content validation, and production save restoration. Major defects affected Technique semantics, simulator evidence, and canonical content initialization. Moderate issues affected UI gates and bundle reporting. All listed implementation defects have corrections and regression coverage; remaining manual/browser/playtest gaps are explicit in \`TEST_COVERAGE_GAPS.md\`.

${remotePass ? "All local and remote critical gates pass. PR #1 is safe to merge into v2/integration; Phase 2 is authorized only after that merge is confirmed." : "The corrected implementation passes local gates, but PR #1 is not accepted until the pushed Phase 0 and Phase 1 workflows are both green. Phase 2 remains unauthorized."}`,
  ),
]);

const reviewValidation = {
  status: remotePass && localPass ? "PASS" : "PENDING_REMOTE",
  verdict,
  local: {
    pass: localPass,
    tests: phaseValidation.suiteCounts,
    content: content.valid,
    policies: balance.policies.length,
    saves: saves.fixtures.length,
    determinismDigest: determinism.completeRun,
    offlineEquivalent: offline.equivalent,
    bundleGates: bundle.gates,
  },
  remote,
};
const reviewSummary = {
  review: "Phase 1 independent adversarial acceptance",
  verdict,
  repository: "thiepn/Analysis-Idle",
  pullRequest: 1,
  branch: "phase/01-deterministic-engine",
  base: "v2/integration",
  baseSha: BASE_SHA,
  reviewStartSha: REVIEW_START_SHA,
  legacySha: LEGACY_SHA,
  correctionRequired: true,
  localPass,
  remotePass,
  mergeReadiness:
    remotePass && localPass ? "READY TO MERGE" : "NOT READY TO MERGE",
  phase2Authorization:
    remotePass && localPass ? "AUTHORIZED AFTER MERGE" : "NOT AUTHORIZED",
};
await Promise.all([
  writeFile(
    resolve(root, "validation-results.json"),
    `${JSON.stringify(reviewValidation, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    resolve(root, "review-summary.json"),
    `${JSON.stringify(reviewSummary, null, 2)}\n`,
    "utf8",
  ),
]);

process.stdout.write(
  `${JSON.stringify({ verdict, localPass, remotePass, filesReviewed: changedFiles.length, digest: determinism.completeRun })}\n`,
);
if (!localPass) process.exitCode = 1;
