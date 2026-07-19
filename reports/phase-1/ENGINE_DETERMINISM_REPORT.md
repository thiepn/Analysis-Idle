# Engine determinism report

Identical initial fixture, seed, command stream, policy, horizon, and chunking reproduce the same canonical state and event digest. Rejected commands retain the original state object and emit no mutation events. Time is explicit; RNG state is serialized; tie order is production, project completion, artifact/Insight events, milestone recording, then achievement recording.

Digest: `e240e2ef5980c2e5778f2fb995aae60a6dc678d89c00f4cdc80d28d8c639a695`

Repeat: `e240e2ef5980c2e5778f2fb995aae60a6dc678d89c00f4cdc80d28d8c639a695`

Manifest: `data/determinism-manifest.json`.
