# Parameter reconciliation

The locked research decisions remain authoritative; unresolved tuning remains visibly configurable and provisional.

| Topic               | Drift found                     | Current reconciled value                                                          | Status                            |
| ------------------- | ------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- |
| Offline full window | 8 h                             | 12 h full, then 25% tail, maximum 72 h credit                                     | PROVISIONAL                       |
| Campaign/mastery    | 10–20 h                         | 30–50 active-equivalent h for the finite campaign                                 | PROVISIONAL                       |
| Active play         | 20% used as normal maximum      | 10–15% sustained target; 20% hard ceiling                                         | PROVISIONAL                       |
| Attention           | “cap 3”/“recovery 4s” ambiguity | starts at 3, maximum 4; no recovery mechanic                                      | LOCKED MODEL                      |
| First Publication   | inconsistent pacing             | 60–120 active-equivalent min; balanced simulation 93.79 min                       | PROVISIONAL                       |
| Production rates    | prior 0.18/0.14 missed pacing   | Formalize 0.25/s, Explore 0.20/s                                                  | PROVISIONAL simulator calibration |
| Saves               | scattered prose                 | debounce 1 s; max delay 10 s; passive checkpoint 30 s; lease 15 s; import 250 KiB | PROVISIONAL                       |

The higher provisional production rates are a recorded correction, not a hidden balance constant: 0.18/0.14 put the balanced all-project Publication near 155 minutes, outside the accepted 60–120-minute target. The reproducible 0.25/0.20 fixture reaches it near the value above. This validates reachability, not final fun or balance.
