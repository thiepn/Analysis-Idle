# Phase 1 implementation brief

## Entry condition

Phase 0 is accepted only at the reconciliation tip recorded by the completion report and referenced by `v2/integration`. Both research inputs are checksum-verified, all 53 required decisions are reconciled, and the Phase 0 gate is `PASS`. Begin Phase 1 from `phase/01-deterministic-engine`; do not implement Phase 1 on the Phase 0 branch or on `main`.

## Phase 1 objective

Create the production TypeScript foundation, deterministic engine, validated content contract, numerical/save boundaries, headless simulator, CI, and minimal debug UI. Do not implement polished Natural Numbers gameplay, later chapters, prestige, PWA, final assets/audio, or deploy v2.

## Locked architecture

Use npm, TypeScript strict mode, Preact + Vite UI scaffold, framework-free engine/content/persistence, and flow: validated definitions → commands → deterministic transitions/events → canonical state → selectors/view models → UI. Platform supplies explicit elapsed time/RNG/storage/lifecycle. Native numbers exist only behind `GameNumber`. Persistence uses rotating validated localStorage current/fallback envelopes plus IndexedDB append-only backups and replay/diagnostic logs when available; legacy `mathIdleSave` is read-only detection. GitHub Pages base is `/Analysis-Idle/`; no deployment in Phase 1. Preact has explicit exit gates for excessive compatibility weight, accessibility/test failure, or measured bundle/interaction budget failure.

## Exact production structure

```text
src/app/            composition/store subscription
src/engine/         state, commands, reducer, advance, rng, numbers, effects, conditions, selectors
src/content/        schemas, validators, stable IDs, Natural Numbers data fixtures
src/platform/       clock, storage, lifecycle, tab ownership, import/export
src/ui/             Preact components and debug view models
tools/simulator/    policies, runner, reports
tests/fixtures/     saves, commands, content and deterministic snapshots
```

## Required schemas/commands

Implement conceptual state from `STATE_SCHEMA.md`; effect/condition AST from `EFFECTS_AND_CONDITIONS.md`; save envelope from `SAVE_SPEC.md`. Minimum commands: `advanceTime`, `setAttention`, `start/pause/cancel/switchApproach/queueProject`, `purchaseUpgrade`, `setCompletionBehavior`, `setReserve`, `spendInsight`, `assembleCapstoneEdge`, `publishChapter` (transition proof may use fixtures), `save/import/export/load`, and settings. Every rejected command returns a typed reason and leaves state unchanged.

Deterministic RNG: xoshiro128** (or another explicitly documented 32-bit algorithm) with full state/draw count serialized. Natural Numbers should currently need no randomness, but the extension point/replay test must exist.

## Content data needed

Encode stable resources/meters, 12 projects, 15 upgrades/capabilities, 11 milestones, 10 achievements (seven badge/history and three non-power unlocks), node types, three project approaches, visible Technique exercises/prepared-step/template artifacts, capstone edges, Publication transform, and reviewed mathematical source/accessibility fields from the Natural Numbers documents. Technique is not a third stock, hidden efficiency number, or automation gate. All costs, work, rates, caps, exponent, Insight, approach preservation, pacing, and offline windows remain validated configuration tagged provisional.

The minimum cross-cutting provisional config set is: starting/max Attention `3/4`; activity exponent `0.80`; Insight cap `3`; active target `10–15%` and ceiling `20%`; offline full window `12h`, tail `25%`, maximum `72h`; first Publication `60–120` active-equivalent minutes; campaign `30–50` active-equivalent hours; approach-switch preservation floor `90%`. Project costs/work/rates/caps/approach transforms are likewise provisional content data.

## Required scripts

`npm run dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:unit`, `test:integration`, `test:determinism`, `simulate`, `balance:report`, `content:validate`, `save:fixtures`, and one `ci` command. Preserve Phase 0 reports/experiments as historical tools; production never imports them.

## Required tests

- State invariants, command rejection/immutability, formula units/finite values, stable effect order/ownership, condition truth/progress/dependencies/cycles.
- Time chunk invariance, same input/seed hashes, RNG replay, event tie ordering, online/offline equivalence.
- Attention zero/full/invalid; caps; project reserve/cancel/switch/complete; queue/reserve/rule trace; Insight ceiling.
- Dedicated project-slot versus competing-Attention simulator comparator; activity exponent candidates 0.80/0.85/0.90 versus an explicit marginal table; projects remain linear in production behavior.
- Technique exercise/artifact visibility, typed matching, ownership/reset, removal behavior, and proof that it cannot alter rates or gate universal automation.
- Content schema/IDs/reachability/math metadata/accessibility/reset/stacking; no locked effects.
- Save new/v1-detect/old/future/corrupt/partial/quota/localStorage fallback/IndexedDB append/recovery tie/import/clock/multi-tab.
- Headless policies from `BALANCE_SPEC.md`; JSON/CSV reports and failure gates.
- Minimal UI keyboard allocation, command dispatch, selector updates, focus/status; engine has no Preact/DOM import.

## Required reports

Engine determinism hash manifest; content validation; state/effect/condition coverage; numerical range; policy/balance/pacing; offline equivalence; save fixture/migration; bundle/performance; dependency/license; accessibility smoke; Phase 1 completion and machine summary.

## Prohibited shortcuts

No engine wall clock/DOM/storage/Preact; no UI formulas/state mutation; no direct numeric arithmetic outside adapter; no arbitrary content callbacks; no effects from locked/unowned sources; no animation-frame economy; no localStorage single-slot overwrite; no silent v1 conversion; no third Technique currency or invisible Technique multiplier; no approach-exclusive universal automation; no prestige/PWA/deploy; no experiment imports; no claiming provisional numbers are final.

## Acceptance

All scripts pass from clean `npm ci`; same input/seed hashes match; content/state/save schemas validate; representative policies run with no non-finite/unreachable/dead-resource failure; minimal debug UI controls engine via commands; v1 runtime remains runnable/untouched; main/deployment unchanged; reports reproduce without dirtying tracked outputs.
