import { readFile, writeFile } from "node:fs/promises";

const reconciliationPath = "reports/phase-0/data/research-reconciliation.json";
const outputPath = "reports/phase-0/RESEARCH_RECONCILIATION_REPORT.md";
const data = JSON.parse(await readFile(reconciliationPath, "utf8"));

function cell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll(/\s+/g, " ").trim();
}

const rows = data.decisions.map((decision) => `| ${cell(decision.decision)} | ${cell(decision.foundation)} | ${cell(decision.audit)} | ${cell(decision.existingPhase0)} | ${cell(decision.experimentalEvidence)} | ${cell(decision.conflict)} | **${cell(decision.status)}** | ${cell(decision.requiredRevision)} |`).join("\n");

const report = `# Research reconciliation report

## Source integrity and evidence boundary

- Foundation: \`${data.sources.foundation.path}\`, SHA-256 \`${data.sources.foundation.sha256}\`.
- Completion Audit: \`${data.sources.completionAudit.path}\`, SHA-256 \`${data.sources.completionAudit.sha256}\`.
- Both are immutable byte-for-byte source copies listed in \`docs/research/SOURCE_MANIFEST.json\`.

The Foundation is a preliminary design hypothesis. The Completion Audit is the correction layer, but many of its citations are non-portable internal tokens and its economic diagrams are explicitly drafts. The Phase 0 labs are deterministic comparative evidence, but their scores are heuristic judgments rather than observations of fun, comprehension, or retention. Structural decisions combine all three layers; every numeric center remains configurable and provisional.

## Headline findings

The source reconciliation preserves the clean rewrite, Candidate F hybrid, discrete Attention, two primary stocks, dedicated project slot, universal automation, reversible approaches, bounded deterministic Insight, decision-aware offline simulation, typed Publication, prestige deferral, Preact, native-number adapter, GitHub Pages, notebook/instrument art, and WCAG 2.2 AA baseline.

Six targeted revisions were required:

1. Technique remains visible as exercise/project-method preparation and typed step/template artifacts; only its status as a primary stock is rejected.
2. The 0.80 concavity center applies to production activities only. Dedicated projects use linear work plus typed effects.
3. The forced/guided opening is labeled honestly; the first strategic trade-off begins when Explore appears.
4. First Publication changes from 120–180 to a broader provisional 60–120 active-equivalent minute band.
5. The ten-achievement set becomes seven badge/history rewards plus three non-power record, visual-information, or post-Publication challenge unlocks.
6. Storage is explicitly dual-layer: localStorage holds the current canonical envelope/settings/lease and fallback backups; IndexedDB holds append-only backups and replay/debug logs when available.

## Complete reconciliation table

| Decision | Foundation position | Audit position | Existing Phase 0 position | Experimental evidence | Conflict | Final status | Required revision |
|---|---|---|---|---|---|---|---|
${rows}

Every one of the ${data.requiredDecisionCount} required decisions has exactly one allowed status.

## Special-scrutiny conclusions

### Resources and Technique

The three-stock model gives Technique a clear label but makes Exercises a mandatory production lane and risks turning universal automation into a Technique tax. A capability-only model is too easy to hide as efficiency. The selected model therefore keeps Precision and Intuition as the two spendable stocks while making exercises/method preparation visible inside projects. Constructive work emits typed steps/templates, Formal work emits lemmas, and Exploratory work emits requirement/counterexample information. Phase 1 must expose these artifacts in state, selectors, and policy reports; otherwise the two-stock model fails its own acceptance gate.

### Attention, opening, and project competition

Three starting slots yield four two-lane allocations after Explore appears; the fourth yields five. Before Explore, the first confirmation and Zero/Successor project are guided actions, not strategic choices. The dedicated project slot remains selected because competing project Attention with two production lanes and only 3–4 slots creates frequent production shutdown/deadlock states. Opportunity cost instead comes from reserved inputs, contextual vectors, project order, artifacts, and automation policies. Phase 1 must retain a contrary competing-project policy comparator.

The 0.80 power center is retained provisionally because 0.85–0.90 more often select all-in allocations in weighted contexts. It is not final and does not apply to project progress. An explicit marginal-yield table remains a comprehension comparator.

### Approaches and automation

Permanent Rigor/Intuition/Automation branches are deferred. Formal, Exploratory, and Constructive approaches are reversible and must alter downstream artifacts. Automation remains global in all 15 Natural Numbers upgrade/capability entries; Constructive may prepare better templates but cannot own queue, completion, reserve, or anti-tedium access.

### Pacing and offline

The prior 120–180 minute first-Publication target had no player evidence and underweighted first-chapter fatigue. A five-band heuristic comparison provisionally favors 60–90 minutes, with 90–120 close; the specification therefore keeps a configurable 60–120 band until simulator and Phase 2 playtests narrow it. The campaign envelope remains 30–50 active-equivalent hours only as a production estimate.

The Foundation's 8h/48h and Phase 0's 12h/72h schedules are both unproven. The 12h full plus 25% through 72h schedule remains the configurable center because it is more generous while still bounded. Decision semantics—not the window—is locked: harmless informational unlocks continue the saved plan; unresolved project/approach/cap/policy/capstone/Publication choices stop or require an explicit safe rule.

### Frontend, numbers, and storage

Preact remains selected under the documented criteria, with Phase 1 exit gates for compat usage, bundle, accessibility, and testing. React remains a fallback, not a co-selected stack. Native numbers remain behind an opaque adapter with precision and magnitude migration gates. The audit's dual-storage recommendation is incorporated without moving current-state authority into IndexedDB: localStorage current remains canonical and IndexedDB provides structured backup/history durability with a tested fallback.

## Natural Numbers re-audit

- Catalogue remains 12 projects, 15 upgrades/capabilities, 11 milestones, and 10 achievements.
- Production lanes remain Formalize/Precision and Explore/Intuition; projects use a dedicated slot.
- Exercise and Technique concepts are visible through the Counterexample Lab, Induction Walkthrough, Constructive prepared steps, Recursion Template, and method artifacts.
- The opening contains a guided first action and does not claim it is a choice. Explore is targeted around 1–2 minutes; the first meaningful 3/0 versus 2/1 trade-off follows immediately.
- All automation entries are global. No approach owns basic anti-tedium functionality.
- Upgrade entries retain unique categories, prerequisites, named stacking/reset behavior, accessible descriptions, and tests. The catalogue contains only two routine rate multipliers and no achievement power.
- Milestones alternate convention/information, system reveal, control, meaning, approach, automation, mathematical transformation, and Publication rather than passive threshold multipliers.
- Achievement revision adds three non-power unlocks and no hidden mandatory production effect.
- Capstone, reset/persistence ledger, offline stopping, and post-Publication challenge timing remain internally aligned.

## Experiment revalidation

All ten labs remain deterministic. Reconciliation changes the model version, resource variants, exponent scope, opening audit, offline window comparison, and pacing bands. The previous digest is retained in completion records; a new digest is expected and must be recorded rather than forced. Generated reports use “provisionally favored” or “selected under current criteria,” and every report repeats that the lab cannot prove fun.

## Result

Research reconciliation is complete. No source contradiction requires Phase 1 to invent a core architecture. Remaining uncertainties are balance values, comprehension, fatigue, and multi-chapter systems; they have validated configuration paths, tests, and clean deferred extension boundaries.
`;

await writeFile(outputPath, report, "utf8");
process.stdout.write(`Research reconciliation report PASS (${data.decisions.length} decisions)\n`);
