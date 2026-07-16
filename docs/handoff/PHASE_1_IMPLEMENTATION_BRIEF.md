# Phase 1 implementation brief

## Entry condition

Do not begin unconditional Phase 1 while Phase 0 is `BLOCKED`. First ingest the missing Deep Research Foundation and Completion Audit and re-run acceptance. If the owner explicitly authorizes provisional Phase 1 scaffolding before that, limit work to reversible engine/platform contracts and do not hard-code disputed product values.

## Phase 1 objective

Create the production TypeScript foundation, deterministic engine, validated content contract, numerical/save boundaries, headless simulator, CI, and minimal debug UI. Do not implement polished Natural Numbers gameplay, later chapters, prestige, PWA, final assets/audio, or deploy v2.

## Locked architecture

Use npm, TypeScript strict mode, Preact + Vite UI scaffold, framework-free engine/content/persistence, and flow: validated definitions → commands → deterministic transitions/events → canonical state → selectors/view models → UI. Platform supplies explicit elapsed time/RNG/storage/lifecycle. Native numbers exist only behind `GameNumber`. Canonical save is a namespaced rotating validated localStorage envelope; legacy `mathIdleSave` is read-only detection. GitHub Pages base is `/Analysis-Idle/`; no deployment in Phase 1.

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

Encode stable resources/meters, 12 projects, 15 upgrades/capabilities, 11 milestones, 10 badge-only achievements, node types, three project approaches, capstone edges, Publication transform, and reviewed mathematical source/accessibility fields from the Natural Numbers documents. All costs, work, rates, caps, exponent, Insight and offline windows remain validated configuration tagged provisional.

## Required scripts

`npm run dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:unit`, `test:integration`, `test:determinism`, `simulate`, `balance:report`, `content:validate`, `save:fixtures`, and one `ci` command. Preserve Phase 0 reports/experiments as historical tools; production never imports them.

## Required tests

- State invariants, command rejection/immutability, formula units/finite values, stable effect order/ownership, condition truth/progress/dependencies/cycles.
- Time chunk invariance, same input/seed hashes, RNG replay, event tie ordering, online/offline equivalence.
- Attention zero/full/invalid; caps; project reserve/cancel/switch/complete; queue/reserve/rule trace; Insight ceiling.
- Content schema/IDs/reachability/math metadata/accessibility/reset/stacking; no locked effects.
- Save new/v1-detect/old/future/corrupt/partial/quota/backups/import/clock/multi-tab.
- Headless policies from `BALANCE_SPEC.md`; JSON/CSV reports and failure gates.
- Minimal UI keyboard allocation, command dispatch, selector updates, focus/status; engine has no Preact/DOM import.

## Required reports

Engine determinism hash manifest; content validation; state/effect/condition coverage; numerical range; policy/balance/pacing; offline equivalence; save fixture/migration; bundle/performance; dependency/license; accessibility smoke; Phase 1 completion and machine summary.

## Prohibited shortcuts

No engine wall clock/DOM/storage/Preact; no UI formulas/state mutation; no direct numeric arithmetic outside adapter; no arbitrary content callbacks; no effects from locked/unowned sources; no animation-frame economy; no localStorage single-slot overwrite; no silent v1 conversion; no prestige/PWA/deploy; no experiment imports; no claiming provisional numbers are final.

## Acceptance

All scripts pass from clean `npm ci`; same input/seed hashes match; content/state/save schemas validate; representative policies run with no non-finite/unreachable/dead-resource failure; minimal debug UI controls engine via commands; v1 runtime remains runnable/untouched; main/deployment unchanged; reports reproduce without dirtying tracked outputs.

