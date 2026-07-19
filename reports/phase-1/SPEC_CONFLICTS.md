# Specification conflicts and resolutions

No unresolved critical conflict remains.

1. The design requests a dedicated production project slot and a competing-Attention comparator. Production implements the dedicated linear slot; Phase 0 comparator evidence remains authoritative and the decision stays reversible for playtests.
2. The master prompt lists broad envelope metadata while `SAVE_SPEC.md` says to use its exact fields. The exact save-spec envelope is implemented; logical time and RNG remain inside canonical state, with migration and replay metadata added explicitly.
3. Project inputs are reserved atomically, consumed on completion, retained through pause/approach changes, and fully refunded on cancellation, matching the detailed Natural Numbers project specification.
4. Understanding and Insight are separate: Understanding is monotonic progression; Insight is bounded stored agency with explicit gain/spend events.
5. Vite/Vitest configuration uses the supported runner loader because the managed Windows filesystem denies esbuild's harmless ancestor-directory probe; emitted bundles and tests are otherwise unchanged.
