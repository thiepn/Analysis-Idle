# Economy formulas and units

## Units

| Symbol | Meaning | Unit |
|---|---|---|
| `a_i`, `C` | assigned/total Attention | dimensionless whole slots |
| `P`, `I` | Precision, Intuition | respective stock units |
| `β_i` | base activity rate | stock units / second |
| `α` | concavity exponent | dimensionless |
| `W`, `s` | remaining work, project speed | work; work / second |
| `K_P`, `K_I` | project requirements | stock units |
| `U` | Understanding | validated-content points |
| `Q` | Insight | whole charges |
| `M` | Mastery | typed published records, not arithmetic currency |

## Production (`PROVISIONAL` center)

For production activity `i` only:

```text
rate_i = β_i [stock/s] × a_i^α [1] × additiveGroup_i [1] × namedMultipliers_i [1]
α = 0.80
```

Zero slots produce zero. `Σa_i ≤ C`; unassigned slots are allowed. The exponent is a provisional activity-allocation model and never applies to project work. Stock advance over explicit `Δt` seconds:

```text
stock' = min(cap, stock + rate × Δt)
```

No formula reads wall clock or animation frames. Switching has no fee initially; add none unless measured behavior justifies it.

## Project work

Starting validates prerequisites and atomically reserves `K_P` Precision and `K_I` Intuition. Projects use their dedicated slot, consume no Attention merely to run, and advance linearly with elapsed time. With base speed `s` and typed method effects:

```text
W' = max(0, W − s × namedMethodFactor × Δt)
```

Completion consumes reserved inputs, validates artifacts, grants configured `U`, emits domain events, then runs explicit completion policy. Approach transforms requirement vector/artifact schema and may transform work, but is normalized against downstream value. Cancellation returns reserved inputs; a mid-project approach change preserves ≥90% work (`P`).

Technique has no stock formula. For a compatible owned acquisition, a `lemma` multiplies the displayed Precision requirement by `0.90`, a `reveal` multiplies the displayed Intuition requirement by `0.90`, and a `template` multiplies displayed project work by `0.90`. Each output kind applies at most once; the factors are centralized provisional configuration and only explicit artifact compatibility can activate them.

## Insight and offline

Charges are integers `0 ≤ Q ≤ cap`. Phase 2 measures the active benefit with paired full-Publication runs at identical seed and policy, changing only the Insight effect. The measured advantage is 1.4814% inside the retuned 1–3% sustained target. A typical intervention removes 10% of remaining project work and no legal intervention may exceed the 20% hard ceiling. Offline effective time (`P`):

```text
credit(t) = min(t, 12h) + 0.25 × max(0, min(t, 72h) − 12h)
```

Events/safe-policy may stop earlier. The formula is configuration, not final retention evidence.

## Costs

Projects use fixed contextual input vectors; milestones unlock controls; routine upgrades use one-time fixed costs. Repeatable geometric costs and dynamic player-relative costs are absent in Natural Numbers. Later geometric/polynomial costs require dimensional labels and simulator evidence.
