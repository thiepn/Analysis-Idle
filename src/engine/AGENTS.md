# Engine rules

- No React/Preact or DOM imports; no persistence calls from core calculations.
- Identical state, command, explicit elapsed time, and RNG state must yield identical output.
- Prefer pure transitions; no hidden mutable globals, implicit wall clock, or ambient randomness.
- Effects require stable sources, activation rules, targets, operations, stacking groups, priorities, caps, and reset layers.
- Return finite numerical values through the numerical adapter; reject invalid inputs at boundaries.
- Unit-test formulas, conditions, ordering, resets, offline stepping, and RNG replay.

