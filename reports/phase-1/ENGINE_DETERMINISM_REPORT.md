# Engine determinism report

Identical initial fixture, seed, command stream, policy, horizon, and chunking reproduce the same canonical state and event digest. Rejected commands retain the original state object and emit no mutation events. Time is explicit; RNG state is serialized; tie order is production, project completion, artifact/Insight events, milestone recording, then achievement recording.

Digest: `529c97fcc770ff77c1fb099fb23501a312e406efbdc1ec2d52f2e99e04dddbba`

Repeat: `529c97fcc770ff77c1fb099fb23501a312e406efbdc1ec2d52f2e99e04dddbba`

Manifest: `data/determinism-manifest.json`.
