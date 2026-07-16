# Phase 0 completion report

`PHASE_0_STATUS: PASS`

## 1. Executive summary

Phase 0 is complete. Codex preserved v1, reconciled both authoritative research inputs across all 53 required decisions, corrected inherited design conflicts, revalidated the Natural Numbers vertical slice, and prepared a deterministic Phase 1 handoff. All numeric balance centers remain visibly provisional configuration. No Phase 1 production implementation, deployment, push, PR, or `main` change occurred.

The earlier Phase 0 tip was correctly reported as `BLOCKED` because the research files were unavailable at that time. That historical decision is retained in Git history. The blocker is now resolved by exact source ingestion, checksum verification, source-by-source reconciliation, specification revision, and the complete validation gate.

## 2. Source ingestion and reconciliation

- Foundation: `docs/research/DEEP_RESEARCH_FOUNDATION.md`, 56,730 bytes, SHA-256 `a4a5771965d0addfedc9f82655942ec0959078aab8285b8e507d2a44b6f1191c`.
- Completion Audit: `docs/research/DEEP_RESEARCH_COMPLETION_AUDIT.md`, 36,565 bytes, SHA-256 `3b64ba6b78364dc5c1289228307e16e6584d6eb1dcda9eb713a1d4e6084a9ab6`.
- `docs/research/SOURCE_MANIFEST.json` records filenames, byte counts, roles, immutable-copy policy, and checksums.
- `reports/phase-0/data/research-reconciliation.json` contains exactly 53 uniquely numbered decisions and the complete provisional-value register.
- `reports/phase-0/RESEARCH_RECONCILIATION_REPORT.md` is deterministically generated from that machine record.

The allowed decision statuses are `ACCEPTED`, `ACCEPTED WITH REVISION`, `PROVISIONAL`, `DEFERRED`, `REJECTED`, and `SUPERSEDED`. No source proposition was silently promoted to fact. The Completion Audit's non-portable inline citation tokens are a provenance limitation, but the Foundation source registry, preserved originals, local experiments, and explicit validation requirements keep the implementation boundary auditable.

## 3. Git and legacy preservation

- Original repository SHA: `239d75fd0e223e91703e261d2196953a896609cb`.
- Working branch: `phase/00-design-lock`.
- `main`: unchanged at the original SHA.
- `legacy/v1`: unchanged at the original SHA.
- Annotated `v1.0.0-legacy`: tag object `d0eec7c7df87534f99684f55339ad58fa6437030`, targeting the original SHA.
- After the accepted reconciliation commit, local `v2/integration` and `phase/01-deterministic-engine` are required to point to that same accepted Phase 0 tip while `phase/00-design-lock` remains checked out.
- No history was rewritten; no ref was force-updated or pushed; no PR was opened; deployment was unchanged.

No file tracked by the v1 baseline was modified. v1 runtime, Pages source, legacy save behavior, and production deployment were intentionally untouched.

## 4. Final design decisions

The selected loop remains Candidate F: whole Attention allocation, two production activities, one dedicated project slot, simplified mathematical dependencies, reversible project approaches, and progressively disclosed universal automation. Flow remains validated content → commands → deterministic transitions → canonical state → selectors → UI.

- **Attention:** start with 3 whole slots and unlock a fourth during Natural Numbers. The 0.80 concavity center applies only to production activities. Capacity, exponent, and timing are provisional.
- **Projects:** advance linearly in a dedicated slot and do not consume Attention merely to run. Opportunity cost comes from reserved inputs, the one-slot schedule, ordering, approaches, artifacts, queues, and reserves. Phase 1 must simulate the contrary competing-Attention model.
- **Resources:** Precision and Intuition are the only primary stocks. Understanding is non-spendable, Insight is bounded active capacity, Attention is capacity, and Mastery is a typed published record. No direct stock conversion exists.
- **Technique:** retained visibly as named exercises, prepared proof steps, and Constructive typed templates. It is not a stock, hidden efficiency modifier, passive multiplier, or automation tax.
- **Approaches/automation:** Formal, Exploratory, and Constructive are reversible project approaches; no permanent Natural Numbers branch exists. Queue, completion, and reserve automation unlock universally.
- **Active play:** deterministic stored Insight provisionally targets 10–15% sustained advantage with a 20% ceiling and cap 3. No random popup, timed input, or repeatable production clicking exists.
- **Offline:** deterministic event-driven catch-up follows a saved plan, stops at unresolved decisions unless an explicit safe policy applies, and reports results. The 12h-full/25%-tail/72h-maximum schedule remains provisional alongside four comparison schedules.
- **Publication/prestige:** Publication is a typed semantic transformation, not a multiplier reset. Global prestige, Axioms, timing, and formula remain deferred until a multi-chapter prototype proves a distinct purpose.
- **Achievements/challenges:** the slice has 10 achievements: seven badge/history records and three non-power records/visual/access unlocks. All have zero production power. Challenge play remains deferred until after first Publication.
- **Pacing:** first Publication is provisionally 60–120 active-equivalent minutes over 1–3 sessions. Campaign scope remains 30–50 active-equivalent hours over 4–8 weeks as a production estimate.

## 5. Natural Numbers content audit

The vertical slice remains complete at the specification level: 12 projects, 15 upgrades/capabilities, 11 milestones, 10 achievements, three approaches, explicit Technique-method artifacts, dependency node types, four capstone implication edges, a Publication mapping, player journeys, mathematical source requirements, accessibility requirements, configurable balance data, and tests/gates.

The opening is explicitly audited at 10 seconds, 60 seconds, 5 minutes, 15 minutes, and 30 minutes. Guided confirmation and passive-production observation are not counted as strategic choices. The first genuine allocation choice appears when Explore/Intuition is visible. All project costs, work, rates, caps, transforms, and timing bands remain provisional validated content data.

## 6. Technical decisions

- Preact + TypeScript + Vite remains selected, with Phase 1 exit gates for excessive compatibility weight, accessibility/test failure, and measured bundle/interaction budget failure.
- Engine and content remain framework-free; time, RNG, persistence, and lifecycle are injected ports.
- Native `number` remains behind `GameNumber`, canonical string serialization, finite validation, and magnitude/meaningful-increment migration gates.
- Persistence is dual-layer: rotating validated localStorage for current canonical state, settings, lease, and fallback backups; native IndexedDB for append-only backup history and replay/diagnostic logs when available. v1 `mathIdleSave` is detected read-only and never silently converted.
- GitHub Pages remains the static target. PWA, large-number backend, audio implementation, and IndexedDB as sole canonical storage remain deferred.

## 7. Accessibility, art, and scope

WCAG 2.2 AA, keyboard/touch parity, 44px project targets, reduced motion, color-independent meaning, semantic reading order, accessible math, mobile portrait support, and one decision-oriented return summary remain architectural gates. The living mathematical notebook/academic instrument direction, procedural CSS/SVG/Canvas strategy, source/license tracking, and asset budgets remain selected provisionally. Final assets, audio, localization, later chapters, postgame, and deployment are outside Phase 0.

## 8. Experimental evidence

Ten deterministic labs compare core loops, Attention/formulas, resource models, approaches, pacing, active/idle, offline policies/windows, prestige purpose, frontend choices, and numerical range. The reconciled model version is `phase0-design-lab/1.1.0-reconciled`. The resource lab now compares one through four stocks plus two non-stock Technique representations. The pacing lab compares five bands. The offline lab compares four schedules. These are reproducible calculations and scored heuristics, not claims that the game is fun.

## 9. Validation

The required gate covers `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run phase0:all`, including source checksums, reconciliation count/status/configuration checks, legacy baseline regeneration, experiment/report generation, deterministic repeatability, formatting, artifact/import lint, prototype checks, six committed screenshots, and local-link checks. Detailed results are in `VALIDATION_REPORT.md` and `validation-results.json`.

The reconciled deterministic digest is `ac202662c8fb5c6a2642acb686cf68d2fb3e205bbffe222e97201f633328a394`. The prior `5ae307f3...` digest is retained only as evidence of the pre-reconciliation model and is expected to differ.

## 10. Remaining risks and deferred evidence

- Human comprehension, fun, fatigue, retention, Technique visibility, approach identity, Insight pressure, and offline fairness require accessibility-inclusive playtests.
- Exact Attention, exponent, resource, project, Insight, offline, pacing, campaign, and work-preservation values require Phase 1 simulation and later playtests.
- The dedicated project slot must be compared against project Attention competition; the power formula must be compared against explicit marginal yields.
- Production bundle, performance, IndexedDB failure behavior, assistive-technology behavior, and storage recovery ordering require Phase 1 implementation evidence.
- Public deployment was intentionally not changed or used as an acceptance shortcut.

## 11. Phase 1 readiness

`true`. Phase 1 has complete authoritative inputs, a reconciled decision register, exact provisional configuration inventory, deterministic architecture boundaries, save roles, content counts, tests, reports, acceptance gates, and prohibited shortcuts. It should implement only the deterministic engine, schemas, persistence ports, headless simulator, CI, and minimal accessible debug UI described in the implementation brief. It must not implement prestige, PWA, deployment, final art/audio, or later chapters.

## 12. Exact next action

Start the next task on `phase/01-deterministic-engine`, which must be based exactly on local `v2/integration` at this accepted Phase 0 tip. Before editing, verify both refs match, read the Phase 1 input manifest in order, and run the current acceptance suite. Do not implement Phase 1 on `phase/00-design-lock` or `main`.
