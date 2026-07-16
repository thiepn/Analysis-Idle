# Analysis Idle v2 working agreement

Analysis Idle v2 is a deterministic, local-first browser game about planning mathematical study. Preserve the v1 runtime on `main` and `legacy/v1`; develop v2 through `v2/integration` and scoped phase branches. Never commit directly to, rewrite, force-update, or deploy from `main`.

Before changing v2, read the applicable material in `docs/research/`, `docs/design/`, `docs/balance/`, `docs/technical/`, `docs/art/`, and `docs/qa/`, plus the nearest nested `AGENTS.md`. Authoritative locked decisions live in `docs/research/RESEARCH_DECISIONS.md`; unresolved values must remain visibly configurable.

Required checks are `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run phase0:all` (or the phase-equivalent successor). Simulation must be deterministic for identical state, command, time input, and RNG seed. Every balance claim needs a reproducible simulation or an explicit playtest requirement.

Architecture invariants: validated content → commands → deterministic transitions → canonical state → selectors → UI. Engine and content do not depend on the UI. Time, RNG, effect source, stacking, reset layer, and persistence boundaries are explicit. Reject non-finite numbers. Preserve stable content IDs and save compatibility; v1 saves are detected, never silently interpreted as v2.

Meet WCAG 2.2 AA, keyboard/touch parity, reduced motion, color-independent meaning, accessible mathematics, mobile portrait support, and documented mathematical sources. Add dependencies only with a recorded purpose, alternative, maintenance/bundle cost, and production/dev classification.

Update affected authoritative documents and finish each phase with validation and completion reports. Forbidden shortcuts include importing experiments into production, hiding open decisions in constants, attaching effects to unowned content, frame-coupling the economy, mandatory clicking, raw player-facing LaTeX, silent save loss, and claiming heuristic scores prove fun.

