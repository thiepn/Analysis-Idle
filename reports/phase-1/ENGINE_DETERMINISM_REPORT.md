# Engine determinism report

Identical initial fixture, seed, command stream, policy, horizon, and chunking reproduce the same canonical state and event digest. Rejected commands retain the original state object and emit no mutation events. Time is explicit; RNG state is serialized; tie order is production, project completion, artifact/Insight events, milestone recording, then achievement recording.

Digest: `cd58730969fc18386bc650b845e7b6f1498b276c36cdd470fc61f129c6fda079`

Repeat: `cd58730969fc18386bc650b845e7b6f1498b276c36cdd470fc61f129c6fda079`

Manifest: `data/determinism-manifest.json`.
