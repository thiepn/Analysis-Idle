# Analysis Idle v2 game design

## Product promise

Analysis Idle v2 is a finite, local-first planning game in which mathematical ideas become mechanics. The player allocates scarce Attention, prepares two distinct resources, chooses reversible ways to conduct projects, and turns a solved chapter into reusable methods through Publication. It is enjoyable as a planning system without requiring prior Analysis knowledge; optional explanations add mathematical meaning rather than exam pressure.

## Audience and principles

Primary audiences are idle-game planners, curious mathematics learners, and mobile/desktop players who prefer short check-ins. The game must respect absence, disabilities, mistakes, and time. Waiting follows a plan; clicking is never production; automation removes execution and reveals higher-order decisions; poor plans recover; mathematical language is precise but optional depth is layered.

## Locked loop architecture

1. Allocate 3 whole Attention between **Formalize** (Precision) and **Explore** (Intuition); a fourth slot unlocks during Natural Numbers.
2. Accumulate chapter-local Precision and Intuition with concave slot scaling. Activity work alone uses the provisional exponent; projects do not.
3. Inspect project requirements, downstream effects, Technique preparation, and ETA; select Formal, Exploratory, or Constructive approach.
4. Reserve inputs and run one project in its dedicated slot. Projects never consume Attention merely to exist.
5. Complete dependency nodes, earn non-spendable Understanding, unlock controls, and record mathematical methods.
6. Configure queue/reserve/completion automation so absence executes the player's stated plan.

The stable loop is allocation → preparation → project choice → validated result → new decision. Session loop: inspect bottleneck → adjust plan → queue/automate → optionally spend Insight → leave with a safe policy. Chapter loop: foundations → transformations → proof network → equivalence capstone → Publication. The prestige loop is absent.

## Resources and meters

- **Precision** (stock): formal definitions, obligations, and reusable lemmas. Produced by Formalize; consumed by formal project requirements.
- **Intuition** (stock): examples, counterexamples, alternatives, and revealed requirements. Produced by Explore; consumed by discovery requirements.
- **Attention** (capacity): whole assignable slots, never spent or stockpiled.
- **Understanding** (monotonic score): awarded by validated concepts/projects, never spent, used for progression summaries.
- **Insight** (bounded charges): deterministic optional interventions; cap 3 is provisional.
- **Mastery** (published record): qualitative chapter methods and compression state, not a multiplier currency.

**Technique is visible but is not a stock.** Exercises inside projects prepare named proof steps; Constructive work emits typed step/template artifacts; the project preview and completion ledger show that preparation. Technique never becomes a hidden efficiency score, passive multiplier, or payment required to unlock universal automation.

Precision ↔ Intuition conversion is forbidden in Natural Numbers. Caps, costs, and rates remain configuration.

## Projects and approaches

One dedicated project slot exists after the opening project; queue-one unlocks later. Project inputs reserve atomically. There are no destructive random failures. Invalid dependencies block with an explanation.

- **Formal:** makes proof obligations explicit; matching completed obligations become reusable lemmas.
- **Exploratory:** reveals examples/counterexamples and downstream requirements before work commits.
- **Constructive:** decomposes results into explicit reusable steps/templates.

Approaches change downstream artifacts and dependency behavior—not only rates. Selection is free before start. A mid-project change preserves inputs and at least 90% work (`PROVISIONAL` floor), preventing traps.

## Active and idle coexistence

Insight arrives deterministically and is stored. Its default intervention removes a bounded portion of remaining project work or reveals a downstream requirement. Sustained benefit targets 10–15%, with a tested hard ceiling of 20%. No popups, timing windows, or repeatable clicking.

Offline progress uses deterministic event-driven catch-up. It runs the saved plan until an unresolved decision, then only actions allowed by an explicit safe policy. Return uses one summary with elapsed time, policy, gains, completions, deferred decisions, caps, blocked rules, and next action.

## Publication

Publication is a typed chapter transformation. It archives the dependency workspace; resets chapter stocks, allocations, active/queued projects, and chapter modifiers; retains settings, accessibility, records, automation capabilities/templates, Insight, and published methods; and exposes a compressed theorem/method card to later chapters. Published chapters do not passively farm raw currency.

## Progression and scope

Natural Numbers targets 60–120 active-equivalent minutes over 1–3 sessions (`PROVISIONAL`). The finite initial campaign targets 30–50 active-equivalent hours over 4–8 weeks (`PROVISIONAL`). Each chapter must introduce a behavior-changing mechanic and a mathematically justified capstone. Postgame mastery/replay is optional. Global prestige is deferred until several chapters prove a unique purpose.

## Non-goals

No backend, account, cloud save, multiplayer, leaderboard, advertising, premium currency, streak/FOMO, native rewrite, Steam launch, localization, modding, user scripting, or anti-cheat in the initial release. No full v2 implementation in Phase 0.
