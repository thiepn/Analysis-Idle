# Technical specification

## Production stack

Phase 1 builds TypeScript + Preact + Vite. The deterministic engine, validated content, numerical adapter, and persistence codecs are framework-independent. Preact receives selector-derived view models and dispatches commands; components never calculate economy or mutate canonical state.

```text
validated content definitions
  → commands
  → deterministic transitions + domain events
  → canonical state
  → pure selectors/view models
  → Preact subscription/rendering
```

Platform adapters supply monotonic elapsed milliseconds, wall-clock metadata, storage, visibility, cross-tab ownership, and explicit RNG state. Simulation advances on fixed/event boundaries; animation frames may animate presentation only. Passive UI refresh is coalesced to 4–10Hz and silent to assistive technology.

## Intended Phase 1 paths

`src/engine/` (state, commands, reducer, advance, RNG, effects, conditions, numbers); `src/content/` (schemas/validated Natural Numbers definitions); `src/platform/` (clock/storage/tab lifecycle); `src/ui/` (Preact app/components/view models); `src/app/` (composition); `tools/simulator/`; `tests/fixtures/`. Legacy root runtime remains until a later controlled deployment migration.

## Quality invariants

Strict TypeScript, stable IDs, exhaustive discriminated unions, finite assertions, explicit reset layers, no ambient clock/randomness, deterministic hashes, schema validation at content/save boundaries, no experiment imports, and one canonical command path for UI/headless/offline.

Current official references: [TypeScript strictness](https://www.typescriptlang.org/docs/handbook/2/basic-types.html), [Preact + Vite](https://preactjs.com/guide/v10/getting-started/), [Vite static deployment](https://vite.dev/guide/static-deploy.html).

