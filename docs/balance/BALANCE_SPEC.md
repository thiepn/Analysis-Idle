# Balance specification

Balance is configuration validated by deterministic simulation and human playtests. Structural rules may lock in Phase 0; timing, costs, caps, exponents, and reward cadence marked `PROVISIONAL` do not.

## Required policy suite

Every balance report compares balanced, current-bottleneck-first, all-in Precision, all-in Intuition, no-reallocation, cheapest-project, shortest-ETA, each approach-specialized, downstream-aware, and seeded randomized-feasible policies. Report medians/percentiles only when multiple seeds truly exist; deterministic policies report exact results.

## Measurements

Time to event/Publication; meaningful decisions; allocation changes; project starts/completions; idle intervals; capped time; unused stocks; resource/source/sink shares; approach choice/performance; Insight benefit; offline stop reason; recovery from plausible mistakes; unreachable/dead content; multiplier/effect decomposition; maximum magnitude and finite margin.

## Tuning order

1. Reachability and validity.
2. Resource identity/source–sink completeness.
3. No universal allocation/approach dominance.
4. Recovery and dead-interval gates.
5. Active/offline ceilings.
6. Pacing bands.
7. Presentation polish.

Never tune around a defect by adding opaque global multipliers. Every report records model/content version, configuration hash, seed, policy, horizon, stop condition, and limitations.

