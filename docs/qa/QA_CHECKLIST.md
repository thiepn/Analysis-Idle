# QA checklist

## Determinism and engine

- Same state/command/time/RNG → identical state/events/hash.
- Fixed/event-driven online and offline paths agree.
- No wall clock, DOM, UI framework, storage, or ambient RNG in engine.
- Invalid/negative/non-finite inputs rejected; stable event/effect ordering.

## Content and balance

- Schemas, IDs, dependencies, cycles, reachability, source notes, reset/stacking/accessibility fields pass.
- No locked/unowned effects; no dead stock/content; representative policy suite and recovery gates pass.
- Capstone requires dependency behavior; achievements have no power; all provisional values are configuration.

## Saves/platform

- New/old/future/corrupt/partial/quota/import fixtures; staging/backup recovery; canonical number strings.
- Legacy key detected read-only; multi-tab writer/spectator/takeover; hidden/pagehide/bfcache; clock anomalies.
- Pages base/assets/deep reload; no Phase 0 deployment; eventual update/downgrade path.

## UI/accessibility

- Required journeys at 1440×900, 768×1024, 390×844; keyboard/touch/one-hand; focus and dialogs.
- Zoom/text spacing/contrast/forced colors/reduced motion; status throttling; math and SVG alternatives.
- Allocation needs no drag/fine pointer; offline summary is one screen; Publication ledger exact.

## Performance

- Bundle, engine/UI/save/offline budgets; no frame-coupled economy/full-tree tick; no routine ≥50ms task.

