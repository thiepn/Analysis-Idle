# Architecture review

Result: **PASS after corrections**.

The dependency direction is preserved: validated inert content → typed commands → deterministic reducer/time transitions and events → canonical state → public selectors → Preact debug UI. `src/engine` has no Preact, DOM, storage, wall-clock, timer, or global-random authority. Time and xoshiro128** state enter explicitly. Persistence and clock sanitation remain under `src/platform`.

The simulator imports the public engine barrel, selects legal content through public selectors, issues command envelopes, records rejection, and never writes canonical state. Its separate policy RNG is serialized with a draw count. Ordinal comparisons replaced locale-dependent ordering.

The debug UI dispatches typed commands. Derived rates, availability, ETA, Publication readiness, Technique matching, and capability gates come from selectors. It reads canonical IDs/status for rendering and command identity, but does not duplicate production formulas, completion, unlock, or save-envelope interpretation.

Content is strict-schema validated, globally ID-checked, reference-checked, depth-bounded, cycle-checked, serializable, and callback-free. No experiment is imported into production. Boundary lint plus the immutable v1 manifest guard the architecture and legacy tree.
