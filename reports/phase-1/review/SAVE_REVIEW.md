# Save and recovery review

Result: **PASS** for 21 generated fixtures, with exact expected result codes rather than “not FAIL” assertions.

The v2 namespace uses staging, current, three local fallbacks, generation ordering, checksum, schema/content validation, and a 250 KiB import ceiling. Recovery considers valid staged, local, and IndexedDB candidates and selects highest generation deterministically. Schema 0 migrates before use; future/incompatible/corrupt/noncanonical state rejects. Import rewraps at a new generation so an older imported envelope cannot be undone by recovery. Production startup opens IndexedDB, restores the best save, sanitizes elapsed time, and applies bounded offline progress.

Adversarial coverage includes conflicting valid generations, newer staging/fallback recovery, IndexedDB generation collision, corrupt candidates among valid candidates, post-Publication export/import, scheduler commands arriving during an in-flight write, quota/append failure, lifecycle checkpoints, malformed/expired leases, and writer conflict. Legacy `mathIdleSave` remains read-only, unconverted, undeleted, and unoverwritten.

Browser ownership prefers an actual held Web Lock, announces/observes BroadcastChannel claims where available, and keeps a verified timestamped lease fallback. Passive tabs reject gameplay/import mutation and may take over only after release/expiry. Real multi-window timing remains a Phase 2 browser integration test; mocked concurrency covers the Phase 1 contract.
