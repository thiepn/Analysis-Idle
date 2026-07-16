# Offline simulation technical specification

Input is validated state, explicit elapsed milliseconds, offline configuration, and deterministic RNG state. Output is new state, ordered domain events, summary, stop reason, effective credited time, and result hash. Wall-clock metadata never enters equality hashes.

Algorithm:

1. Clamp/credit elapsed using configured windows and clock-anomaly rules.
2. Derive next event boundary: resource cap, work completion, milestone, unlock, queued start, rule failure, capstone/Publication.
3. Advance rates/work exactly to the earliest boundary; use stable ID tie ordering.
4. Apply domain events/effects/conditions; run the saved policy only for authorized actions.
5. Stop at unresolved decision, credit exhaustion, event/iteration safety ceiling, or no progress.
6. Return one normalized summary; never emit UI modals from engine.

Unresolved decisions are project/approach selection, upgrade purchase, new allocation lane without a rule, cap reroute, capstone assembly, Publication, prestige, and automation failure. Milestones and already-configured queue/reserves are resolvable.

Tests: zero/negative/extreme elapsed, same seed/hash, simultaneous events, cap, project completion, missing resources, queue/reserve, unlocked activity, capstone/Publication stop, rule failure, no-progress loop, clock rollback, forward jump, maximum events, and online-vs-offline equivalence for the same commands/time.

