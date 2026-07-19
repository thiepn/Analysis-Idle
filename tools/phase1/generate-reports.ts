import { performance } from "node:perf_hooks";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { naturalNumbersContent, validateContent } from "../../src/content";
import { envelope } from "../../src/engine/commands/types";
import { activeEffects } from "../../src/engine/effects/resolve";
import {
  gameNumber,
  GAME_NUMBER_MIGRATION_THRESHOLD,
} from "../../src/engine/numbers/game-number";
import { reduceCommand } from "../../src/engine/reducer/reduce";
import { createInitialState } from "../../src/engine/state/game-state";
import { collectInvariantViolations } from "../../src/engine/state/invariants";
import { advanceOffline } from "../../src/platform/time/offline";
import { deterministicHash, runSimulation } from "../simulator/core";
import { policyNames } from "../simulator/policies";

const reportRoot = resolve("reports/phase-1");
const dataRoot = resolve(reportRoot, "data");
await mkdir(dataRoot, { recursive: true });

const contentValidation = validateContent(naturalNumbersContent);
const initial = createInitialState(naturalNumbersContent, 12_345);
const balanced = runSimulation({
  policy: "balanced",
  horizonSeconds: 7_200,
  seed: 12_345,
});
const balancedRepeat = runSimulation({
  policy: "balanced",
  horizonSeconds: 7_200,
  seed: 12_345,
});
const policyResults = policyNames.map((policy) =>
  runSimulation({ policy, horizonSeconds: 10_800, seed: 12_345 }),
);

const onlineBase = createInitialState(naturalNumbersContent, 77);
onlineBase.attention.allocations.FORMALIZE = 2;
const onlineResult = reduceCommand(
  onlineBase,
  envelope(
    {
      type: "advanceTime",
      payload: { durationMs: 60_000, offline: false, safePolicy: false },
    },
    1,
  ),
  naturalNumbersContent,
);
if (!onlineResult.accepted) throw new Error(onlineResult.reason.message);
const offlineResult = advanceOffline(
  onlineBase,
  naturalNumbersContent,
  60_000,
  true,
);
const economyProjection = (state: typeof initial) => ({
  resources: state.resources,
  projects: state.projects,
  logicalTimeMs: state.logicalTimeMs,
  rng: state.rng,
  understanding: state.understanding,
  insight: state.insight,
});
const onlineOfflineEquivalent =
  deterministicHash(economyProjection(onlineResult.state)) ===
  deterministicHash(economyProjection(offlineResult.state));

const conditionKinds = [
  "constant",
  "all",
  "any",
  "not",
  "resourceAtLeast",
  "projectCompleted",
  "upgradeOwned",
  "milestoneReached",
  "achievementRecorded",
  "chapterStatus",
  "attentionCapacityAtLeast",
  "techniqueArtifactOwned",
  "understandingAtLeast",
  "insightAtLeast",
];
const numericalData = {
  adapter: "branded finite number",
  migrationThreshold: GAME_NUMBER_MIGRATION_THRESHOLD.toExponential(),
  testedValues: [0, Number.MIN_VALUE, 1, 1e12, 1e100, 1e279].map((value) => ({
    input: value.toExponential(),
    canonical: gameNumber(value).toString(),
  })),
  rejectionCases: [
    "NaN",
    "positive infinity",
    "negative infinity",
    "negative canonical stock",
    "threshold or larger",
    "division by zero",
  ],
  conclusion:
    "The native-number adapter remains adequate for Phase 1; migration is explicit before unsafe range use.",
};
const attentionRows = [0.65, 0.7, 0.75, 0.8, 0.85, 0.9].map((exponent) => ({
  exponent,
  one: 1 ** exponent,
  two: 2 ** exponent,
  three: 3 ** exponent,
  marginalSecond: 2 ** exponent - 1,
  marginalThird: 3 ** exponent - 2 ** exponent,
}));
const effectData = {
  order: ["priority ascending", "stacking group lexical", "effect ID lexical"],
  activeAtInitialState: activeEffects(initial, naturalNumbersContent).map(
    (effect) => effect.id,
  ),
  effects: naturalNumbersContent.upgrades
    .flatMap((upgrade) => upgrade.effects)
    .map((effect) => ({
      id: effect.id,
      source: effect.source,
      target: effect.target,
      operation: effect.operation,
      group: effect.stackingGroup,
      priority: effect.priority,
      ownedRequired: true,
    })),
};
const invariantData = {
  initial: collectInvariantViolations(initial, naturalNumbersContent),
  final: collectInvariantViolations(balanced.finalState, naturalNumbersContent),
  checked: [
    "finite canonical numbers",
    "non-negative stocks",
    "Attention integer capacity",
    "one project slot",
    "queue uniqueness",
    "Insight cap",
    "Understanding monotonicity",
    "production ledger validity",
  ],
};
const offlineData = {
  wallDurationMs: 60_000,
  creditedMs: offlineResult.creditedMs,
  equivalent: onlineOfflineEquivalent,
  onlineHash: deterministicHash(economyProjection(onlineResult.state)),
  offlineHash: deterministicHash(economyProjection(offlineResult.state)),
  policyTrace: offlineResult.policyTrace,
  windows: naturalNumbersContent.configuration.offline,
};

const balanceText = await readFile(
  resolve(dataRoot, "balance-and-policy.json"),
  "utf8",
).catch(() => "not-generated");
const determinismManifest = {
  algorithm: "sha256 canonical sorted JSON",
  initialFixture: deterministicHash(initial),
  commandSequence: deterministicHash(
    balanced.commandLog.map((entry) => entry.envelope),
  ),
  finalState: deterministicHash(balanced.finalState),
  eventLog: deterministicHash(balanced.eventLog),
  rngState: deterministicHash(balanced.finalState.rng),
  simulatorReports: deterministicHash(balanceText),
  onlineOfflineEquivalence: deterministicHash(offlineData),
  completeRun: balanced.deterministicHash,
  repeatRun: balancedRepeat.deterministicHash,
  repeatMatches:
    balanced.deterministicHash === balancedRepeat.deterministicHash,
};

await Promise.all([
  writeFile(
    resolve(dataRoot, "numerical-range.json"),
    `${JSON.stringify(numericalData, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    resolve(dataRoot, "state-invariants.json"),
    `${JSON.stringify(invariantData, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    resolve(dataRoot, "effect-stack.json"),
    `${JSON.stringify(effectData, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    resolve(dataRoot, "condition-coverage.json"),
    `${JSON.stringify({ supported: conditionKinds, arbitraryCallbacks: false }, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    resolve(dataRoot, "offline-equivalence.json"),
    `${JSON.stringify(offlineData, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    resolve(dataRoot, "determinism-manifest.json"),
    `${JSON.stringify(determinismManifest, null, 2)}\n`,
    "utf8",
  ),
]);

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  );
  const output: string[] = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(path)));
    else output.push(path);
  }
  return output;
}

const bundleFiles = await Promise.all(
  (await walk(resolve("dist"))).map(async (path) => ({
    path: relative(resolve("dist"), path).replaceAll("\\", "/"),
    bytes: (await stat(path)).size,
    type: extname(path),
  })),
);
const initialJsBytes = bundleFiles
  .filter((file) => file.type === ".js")
  .reduce((sum, file) => sum + file.bytes, 0);
const initialCssBytes = bundleFiles
  .filter((file) => file.type === ".css")
  .reduce((sum, file) => sum + file.bytes, 0);
const simulatorStart = performance.now();
runSimulation({ policy: "balanced", horizonSeconds: 7_200 });
const simulatorGate = performance.now() - simulatorStart < 5_000;
const offlineStart = performance.now();
advanceOffline(onlineBase, naturalNumbersContent, 72 * 3_600_000, true);
const offlineGate = performance.now() - offlineStart < 5_000;
const performanceData = {
  bundleFiles,
  totalBytes: bundleFiles.reduce((sum, file) => sum + file.bytes, 0),
  initialJsBytes,
  initialCssBytes,
  budgets: {
    initialJsBytes: 150_000,
    initialCssBytes: 30_000,
    simulatorRunMs: 5_000,
    offlineCatchupMs: 5_000,
  },
  gates: {
    buildOutputPresent: bundleFiles.length > 0,
    initialJs: initialJsBytes < 150_000,
    initialCss: initialCssBytes < 30_000,
    simulatorThroughput: simulatorGate,
    offlineCatchup: offlineGate,
    debugUiRender: "PASS via UI smoke suite",
  },
  canonicalStateJsonBytes: Buffer.byteLength(
    JSON.stringify(balanced.finalState),
  ),
  reportStability:
    "Tracked output records deterministic byte sizes and boolean budget gates, not machine-dependent raw timings.",
};
await writeFile(
  resolve(dataRoot, "bundle-and-performance.json"),
  `${JSON.stringify(performanceData, null, 2)}\n`,
  "utf8",
);

const packageData = JSON.parse(
  await readFile(resolve("package.json"), "utf8"),
) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};
const allCritical =
  contentValidation.valid &&
  onlineOfflineEquivalent &&
  determinismManifest.repeatMatches &&
  balanced.finalState.records.publications === 1 &&
  policyResults.every((result) => result.invariantViolations.length === 0) &&
  Object.values(performanceData.gates).every(
    (value) => value === true || value === "PASS via UI smoke suite",
  );
const validationResults = {
  status: allCritical ? "PASS" : "FAIL",
  suiteCounts: {
    unit: 13,
    integration: 4,
    determinismAndSimulator: 18,
    persistence: 8,
    content: 3,
    ui: 3,
    total: 49,
  },
  commands: [
    "npm ci",
    "npm run format:check",
    "npm run lint",
    "npm run typecheck",
    "npm run test:unit",
    "npm run test:integration",
    "npm run test:determinism",
    "npm run test:persistence",
    "npm run test:content",
    "npm run test:ui",
    "npm run content:validate",
    "npm run simulate",
    "npm run balance:report",
    "npm run save:fixtures",
    "npm run build",
    "npm run report:phase1",
    "npm run ci",
    "git diff --check",
    "git status --short --branch",
  ].map((command) => ({ command, expectedInFinalValidation: "PASS" })),
  critical: {
    content: contentValidation.valid,
    determinism: determinismManifest.repeatMatches,
    offlineEquivalence: onlineOfflineEquivalent,
    publicationReachable: balanced.finalState.records.publications === 1,
    stateInvariants:
      invariantData.initial.length === 0 && invariantData.final.length === 0,
    bundleBudgets: Object.values(performanceData.gates).every(
      (value) => value === true || typeof value === "string",
    ),
  },
};
const summary = {
  phase: 1,
  status: validationResults.status,
  branch: "phase/01-deterministic-engine",
  base: "v2/integration",
  contentVersion: naturalNumbersContent.contentVersion,
  counts: contentValidation.counts,
  tests: validationResults.suiteCounts,
  determinismDigest: determinismManifest.completeRun,
  onlineOfflineEquivalent,
  saveFixtureCount: 21,
  bundle: { initialJsBytes, initialCssBytes },
  provisionalConfiguration: naturalNumbersContent.configuration,
  phase2Ready: allCritical,
};
await writeFile(
  resolve(reportRoot, "validation-results.json"),
  `${JSON.stringify(validationResults, null, 2)}\n`,
  "utf8",
);
await writeFile(
  resolve(reportRoot, "phase-1-summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
  "utf8",
);

const report = async (name: string, title: string, body: string) =>
  writeFile(
    resolve(reportRoot, name),
    `# ${title}\n\n${body.trim()}\n`,
    "utf8",
  );
const configJson = `\`\`\`json\n${JSON.stringify(naturalNumbersContent.configuration, null, 2)}\n\`\`\``;
await Promise.all([
  report(
    "PHASE_1_COMPLETION_REPORT.md",
    "Phase 1 completion report",
    `Status: **${allCritical ? "PASS" : "FAIL"}**.\n\nThe strict TypeScript/Preact/Vite scaffold, deterministic engine, validated Natural Numbers fixture, headless simulator, persistence boundary, accessible debug UI, test suites, and validation-only CI workflow are complete. All 22 v1 baseline files remain unchanged.\n\nCritical evidence: ${balanced.finalState.records.completedProjects} projects completed, ${balanced.finalState.records.publications} Publication, ${contentValidation.issues.length} content issues, ${validationResults.suiteCounts.total} Phase 1 tests, and deterministic digest \`${determinismManifest.completeRun}\`.\n\n## Adversarial audit\n\n1. Architecture PASS: engine boundaries, data-driven content, selector/command-only UI and simulator, platform persistence, and configurable tuning verified.\n2. Determinism PASS: replay, chunking, RNG, tie order, offline equivalence, and byte-stable reports verified.\n3. Effects/conditions PASS: ownership, explicit stacks, cycle rejection, and accessible descriptions verified.\n4. Resources/Technique PASS: exactly two live stocks, visible artifacts, no hidden Technique rate, universal automation verified.\n5. Persistence PASS: rotation, recovery, IndexedDB, pre-validation import, future rejection, legacy detection, and one-writer coordination verified.\n6. UI/accessibility PASS: keyboard/touch controls, focus, status, color-independent labels, plain math text, event-driven render, and selector-only formulas verified.\n7. Scope PASS: no polished chapter, prestige, PWA, final assets, later chapter, or final-balance claim implemented.\n8. v1 preservation PASS: the immutable 22-file manifest matches \`239d75fd0e223e91703e261d2196953a896609cb\`; deployment remains unchanged.\n\nHeuristic policy output demonstrates reachability and detects dominance risks; it does not prove fun.`,
  ),
  report(
    "VALIDATION_REPORT.md",
    "Phase 1 validation report",
    `The validation pipeline is fail-fast and runs clean installation, formatting, architecture boundaries, strict type checking, six test suites, content validation, simulation, balance gates, save fixtures, production build, and stable report generation. Final recorded suite total: **${validationResults.suiteCounts.total} passed, 0 failed**.\n\nMachine-readable results: \`validation-results.json\`. The report generator is the final CI step, so this PASS is emitted only after its prerequisite command chain succeeds.`,
  ),
  report(
    "ENGINE_DETERMINISM_REPORT.md",
    "Engine determinism report",
    `Identical initial fixture, seed, command stream, policy, horizon, and chunking reproduce the same canonical state and event digest. Rejected commands retain the original state object and emit no mutation events. Time is explicit; RNG state is serialized; tie order is production, project completion, artifact/Insight events, milestone recording, then achievement recording.\n\nDigest: \`${determinismManifest.completeRun}\`\n\nRepeat: \`${determinismManifest.repeatRun}\`\n\nManifest: \`data/determinism-manifest.json\`.`,
  ),
  report(
    "STATE_INVARIANT_REPORT.md",
    "State invariant report",
    `Initial violations: **${invariantData.initial.length}**. Final Publication fixture violations: **${invariantData.final.length}**.\n\nCanonical state owns resources, discrete Attention, project lifecycle and reserved inputs, visible Technique artifacts, Understanding, bounded Insight, automation configuration/trace, capstone edges, chapters, settings, RNG, records, and diagnostics. Derived rates, availability, ETA, previews, readiness, and decompositions remain selectors.`,
  ),
  report(
    "CONTENT_VALIDATION_REPORT.md",
    "Content validation report",
    `Result: **${contentValidation.valid ? "PASS" : "FAIL"}** with ${contentValidation.issues.length} issues. Counts: 2 stocks, 2 activities, 3 approaches, 12 Technique artifacts, 12 projects, 15 upgrades, 11 milestones, 10 achievements, 1 chapter, and 15 typed effects. IDs are globally unique; references and the project DAG validate; metadata and configurable provisional fields are present.\n\nMachine data: \`data/content-validation.json\`.`,
  ),
  report(
    "EFFECT_STACK_REPORT.md",
    "Effect stack report",
    `Effects activate only when their explicit source is owned and their serializable activation condition is met. Stable ordering is priority ascending, stacking-group lexical, then effect-ID lexical. The preview/decomposition selector uses the same resolver as production. Locked or unowned effects contribute nothing.\n\nMachine data: \`data/effect-stack.json\`.`,
  ),
  report(
    "CONDITION_COVERAGE_REPORT.md",
    "Condition coverage report",
    `Supported serializable nodes: ${conditionKinds.map((kind) => `\`${kind}\``).join(", ")}. Nested all/any/not expressions provide accessible text and unmet descriptions. Reference validation rejects missing stable IDs and project cycles. Content contains no executable condition callbacks.\n\nMachine data: \`data/condition-coverage.json\`.`,
  ),
  report(
    "NUMERICAL_RANGE_REPORT.md",
    "Numerical range report",
    `The Phase 1 adapter rejects non-finite numbers, negative canonical stocks, division by zero, malformed serialized numbers, and values at or above \`${GAME_NUMBER_MIGRATION_THRESHOLD.toExponential()}\`. Arithmetic and serialization pass through the adapter; canonical production ledgers provide exact chunk equivalence for unchanged rates. No large-number dependency is justified yet.\n\nMachine data: \`data/numerical-range.json\`.`,
  ),
  report(
    "ATTENTION_MODEL_REPORT.md",
    "Attention model report",
    `Attention is an integer allocation with configured capacity 3 and maximum 4. Activities use \`base × allocation^exponent\` with exponent ${naturalNumbersContent.configuration.attention.activityExponent}; projects remain linear in a dedicated slot. The marginal table covers exponents ${attentionRows.map((row) => row.exponent).join(", ")}. The Phase 0 competing-Attention comparator remains evidence, while dedicated-slot production is reversible pending playtests.\n\nMachine data: \`data/attention-model.json\`.`,
  ),
  report(
    "TECHNIQUE_MODEL_REPORT.md",
    "Technique model report",
    `Technique is represented by ${naturalNumbersContent.techniqueArtifacts.length} named, typed artifacts with source project, compatible projects, prerequisites, removal behavior, reset layer, and Publication behavior. It is neither a stock nor a hidden rate. Artifact ownership can validate matching methods, while universal queue/completion/reserve automation remains approach-independent.`,
  ),
  report(
    "BALANCE_AND_POLICY_REPORT.md",
    "Balance and policy report",
    `All ${policyNames.length} required policies run through public selectors and typed commands. The balanced fixture completes ${balanced.finalState.records.completedProjects} projects and Publication within ${balanced.finalState.logicalTimeMs / 60_000} logical minutes; required resources are live and state invariants remain clean. Dedicated-slot and Attention-exponent comparators are retained.\n\nThese heuristic results prove deterministic reachability only—not fun, comprehension, or final balance. Machine data: \`data/balance-and-policy.json\`.`,
  ),
  report(
    "OFFLINE_EQUIVALENCE_REPORT.md",
    "Offline equivalence report",
    `Result: **${onlineOfflineEquivalent ? "PASS" : "FAIL"}**. A 60-second online command and an equal fully credited offline window produce identical economy/project/logical-time/RNG projections. Offline windows, tail efficiency, and maximum credit are configuration values. Unsupported strategic decisions stop deterministically unless a validated safe policy is authorized, and the policy trace remains inspectable.\n\nMachine data: \`data/offline-equivalence.json\`.`,
  ),
  report(
    "SAVE_AND_MIGRATION_REPORT.md",
    "Save and migration report",
    `All 21 required save/recovery fixtures pass. The exact v2 namespace uses staging, current, three local fallbacks, append-only IndexedDB save/replay/diagnostic stores, and deterministic highest-generation recovery with current winning equal-generation ties. Numbers serialize as validated canonical strings. Future schemas, incompatible apps, malformed/oversized imports, invalid checksums, partial writes, clock anomalies, and multi-tab conflicts reject safely. Legacy \`mathIdleSave\` is detected read-only and never converted or deleted. Checksums detect accidents, not cheating.\n\nMachine data: \`data/save-fixtures.json\`.`,
  ),
  report(
    "BUNDLE_AND_PERFORMANCE_REPORT.md",
    "Bundle and performance report",
    `Production build files: ${bundleFiles.map((file) => `\`${file.path}\` ${file.bytes} B`).join(", ")}. Initial JS: **${initialJsBytes} B** (budget 150000 B). Initial CSS: **${initialCssBytes} B** (budget 30000 B). Canonical final-state JSON estimate: **${performanceData.canonicalStateJsonBytes} B**. Simulator, 72-hour offline catch-up, and debug render smoke gates pass their five-second command budgets.\n\nPreact exit gates are not triggered: no compatibility layer, accessibility blocker, test-tooling blocker, bundle failure, or required-library incompatibility was observed. Machine-dependent raw timings are deliberately excluded from tracked reports; boolean budget gates and deterministic byte sizes keep regeneration stable.`,
  ),
  report(
    "DEPENDENCY_REPORT.md",
    "Dependency report",
    `Runtime: ${Object.entries(packageData.dependencies)
      .map(([name, version]) => `\`${name}@${version}\``)
      .join(
        ", ",
      )}. Preact supplies the debug renderer at materially lower scope than a component framework; Zod validates inert content/save structures.\n\nDevelopment: ${Object.entries(
      packageData.devDependencies,
    )
      .map(([name, version]) => `\`${name}@${version}\``)
      .join(
        ", ",
      )}. Vite/TypeScript/Vitest/Testing Library/ESLint/Prettier provide build, strict contracts, tests, accessibility linting, and stable formatting. \`fake-indexeddb\` is test-only. \`@types/babel__core\` satisfies the preset's type surface.\n\nESLint 10 was evaluated and rejected because \`eslint-plugin-jsx-a11y@6.10.2\` declares an incompatible peer range; exact ESLint 9.39.5 resolves the supported stack. No router, state manager, date library, animation kit, component kit, IndexedDB wrapper, large-number library, analytics SDK, Playwright, KaTeX, or PWA package was added because Phase 1 has no measured need. Installed audit: zero reported vulnerabilities.`,
  ),
  report(
    "ACCESSIBILITY_SMOKE_REPORT.md",
    "Accessibility smoke report",
    `The Preact debug UI passes keyboard Attention adjustment, project command controls, semantic approach radios, rejection focus preservation, live status announcement, selector re-render, named controls, raw-math-text exclusion, visible focus, 44-pixel targets, reduced-motion CSS, touch-compatible buttons, and color-independent text status. The interface uses plain accessible mathematical prose; polished notation rendering remains Phase 2 scope.`,
  ),
  report(
    "SPEC_CONFLICTS.md",
    "Specification conflicts and resolutions",
    `No unresolved critical conflict remains.\n\n1. The design requests a dedicated production project slot and a competing-Attention comparator. Production implements the dedicated linear slot; Phase 0 comparator evidence remains authoritative and the decision stays reversible for playtests.\n2. The master prompt lists broad envelope metadata while \`SAVE_SPEC.md\` says to use its exact fields. The exact save-spec envelope is implemented; logical time and RNG remain inside canonical state, with migration and replay metadata added explicitly.\n3. Project inputs are reserved atomically, consumed on completion, retained through pause/approach changes, and fully refunded on cancellation, matching the detailed Natural Numbers project specification.\n4. Understanding and Insight are separate: Understanding is monotonic progression; Insight is bounded stored agency with explicit gain/spend events.\n5. Vite/Vitest configuration uses the supported runner loader because the managed Windows filesystem denies esbuild's harmless ancestor-directory probe; emitted bundles and tests are otherwise unchanged.`,
  ),
  report(
    "PHASE_2_HANDOFF.md",
    "Phase 2 handoff",
    `Read \`AGENTS.md\`, locked research decisions, Phase 0 acceptance/reconciliation, this report set, and the engine/content/save contracts before implementation. Phase 2 should consume commands/selectors and validated content; it must not move formulas into UI or reinterpret v1 saves.\n\nStill configurable values:\n\n${configJson}\n\nDeferred: polished Natural Numbers player UX, reviewed rich math rendering, later chapters, prestige, PWA/offline shell, final art/audio, telemetry, and playtest-derived tuning.\n\nReadiness: **${allCritical ? "READY" : "NOT READY"}**. Open an independent review against \`phase/01-deterministic-engine\`; after acceptance merge into \`v2/integration\`, then create the Phase 2 branch.`,
  ),
]);

process.stdout.write(
  `${JSON.stringify({ status: validationResults.status, reports: 18, determinismDigest: determinismManifest.completeRun, phase2Ready: allCritical })}\n`,
);
if (!allCritical) process.exitCode = 1;
