# Experiment rules

Experiments are disposable evidence tools, never production code. Each experiment declares a hypothesis, parameters, model version, seed (or `null`), policy, horizon, stopping condition, reproducible output, conclusion, and limitation. Archive machine-readable results and reports under `reports/phase-0/`.

Inconclusive results remain inconclusive. Mathematical evidence, UX heuristics, and playtest requirements must be labeled separately. Production modules must never import from `experiments/`.

