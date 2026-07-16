# Phase acceptance

## Phase 0 result

`PHASE_0_STATUS = PASS`

Both named research documents are preserved byte-for-byte, their SHA-256 checksums and byte counts verify against `docs/research/SOURCE_MANIFEST.json`, and all 53 required reconciliation decisions have an allowed status with an explicit revision. The inherited missing-source `BLOCKED` result remains documented as historical context in the completion report; it is resolved, not erased.

All safety, audit, experiment, design, technical, art, accessibility, prototype, handoff, source-integrity, reconciliation-completeness, contradiction, and Git-preservation gates must pass together. The required command suite is `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run phase0:all`. A command failure or a changed `main`/legacy target blocks acceptance.

Phase 1 may begin only from `phase/01-deterministic-engine` after both it and `v2/integration` reference the accepted Phase 0 tip. No Phase 1 implementation belongs on `phase/00-design-lock`, and no v2 work belongs on `main`.
