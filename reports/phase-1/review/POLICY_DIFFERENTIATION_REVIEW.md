# Policy differentiation review

All 15 required policies reach Publication through legal commands with clean invariants. Comparative data now includes the requested orders and behavioral counters in `../data/balance-and-policy.json`.

| Policy                 | Publication min | Rejected | Attention changes | Idle s | Offline s | Automation actions | Insight | Policy RNG draws |
| ---------------------- | --------------: | -------: | ----------------: | -----: | --------: | -----------------: | ------: | ---------------: |
| cheapestAvailable      |          104.89 |        0 |                42 | 1500.0 |       0.0 |                  3 |       0 |                0 |
| immediatePayback       |          100.24 |        0 |                37 | 1440.0 |       0.0 |                  2 |       0 |                0 |
| futureValue            |          103.26 |        0 |                36 | 1140.0 |       0.0 |                  1 |       0 |                0 |
| nearestMilestone       |           93.04 |        0 |                33 |  735.0 |       0.0 |                  0 |       0 |                0 |
| balanced               |           93.79 |        0 |                33 |  780.0 |       0.0 |                  0 |       0 |                0 |
| formalSpecialist       |          100.24 |        0 |                37 | 1440.0 |       0.0 |                  2 |       0 |                0 |
| exploratorySpecialist  |          103.75 |        0 |                31 | 1440.0 |       0.0 |                  2 |       0 |                0 |
| constructiveSpecialist |          104.86 |        0 |                44 | 1350.0 |       0.0 |                  3 |       0 |                0 |
| hybrid                 |          105.39 |        0 |                39 | 1530.0 |       0.0 |                  3 |       0 |                0 |
| activeOptimizer        |           98.01 |        0 |                33 | 1500.0 |       0.0 |                  2 |       3 |                0 |
| mostlyIdle             |          104.22 |        0 |                50 | 1200.0 |    7824.1 |                  0 |       0 |                0 |
| weakButPlausible       |          113.79 |        0 |                 2 | 1980.0 |       0.0 |                  0 |       0 |                0 |
| randomReasonable       |          107.80 |        0 |                44 | 1591.0 |       0.0 |                  4 |       0 |              166 |
| longOffline            |          110.04 |        0 |                55 | 3000.0 |    9469.9 |                  2 |       0 |                0 |
| ignoreOneSystem        |           97.25 |        0 |                42 | 1020.0 |       0.0 |                  0 |       0 |                0 |

The best observed fixture is nearestMilestone; the slowest is weakButPlausible. Weak, idle, and ignore-one-system policies pay a visible but modest penalty because the Phase 1 fixture deliberately remains small and all twelve projects are mandatory. Specialist approach orders differ, active optimization records Insight use, offline policies record offline advancement, and random policy records replayable RNG draws.

This spread is sufficient to detect path/dominance regressions before Phase 2, but not sufficient to claim final strategy depth. Phase 2 playtests must decide whether the weak/ignore penalties are perceptually meaningful and whether any approach dominates human play.
