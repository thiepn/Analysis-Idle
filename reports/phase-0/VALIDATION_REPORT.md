# Phase 0 validation report

Validation date: 2026-07-16

Working branch: `phase/00-design-lock`

Command gate: **PASS**

Phase gate: **PASS**

## Required commands

| Command / check | Result | Evidence / note |
|---|---:|---|
| `npm run typecheck` | PASS | TypeScript strict Phase 0 project has no diagnostics. |
| `npm run lint` | PASS | Required artifacts, JSON, import boundary, and both source hashes/byte counts verify. |
| `npm run test` | PASS | 2 files; 12/12 model, source-integrity, reconciliation, configuration, and unblock tests pass. |
| `npm run phase0:all` | PASS | Audit, source/reconciliation reports, repeatability, formatting, lint, typecheck, tests, prototype, screenshots, and links pass. |
| `git diff --check` excluding the two immutable source copies | PASS | No whitespace errors in authored/generated files; original source whitespace is checksum-preserved by policy. |
| Git ref/safety audit | PASS | `main`, `legacy/v1`, and annotated legacy target remain the original SHA; no push/deploy; accepted v2 refs co-point after commit. |

`npm run phase0:all` regenerated the 22-file legacy manifest, all ten machine-readable experiment outputs and comparison reports, and the 53-decision reconciliation report. Deterministic repeatability produces digest `ac202662c8fb5c6a2642acb686cf68d2fb3e205bbffe222e97201f633328a394`.

## Research integrity and reconciliation

- Foundation SHA-256: `a4a5771965d0addfedc9f82655942ec0959078aab8285b8e507d2a44b6f1191c`; 56,730 bytes.
- Completion Audit SHA-256: `3b64ba6b78364dc5c1289228307e16e6584d6eb1dcda9eb713a1d4e6084a9ab6`; 36,565 bytes.
- Source checksums match both original supplied files and repository copies.
- Reconciliation has exactly 53 unique sequential IDs, only allowed statuses, non-empty revisions, and a complete provisional configuration-path register.
- The synthesis, decision register, acceptance document, completion artifacts, and Phase 1 manifest contain no stale missing-source acceptance state.

## Design contradiction audit

- Two primary stocks coexist with visible Technique exercise/method state; no third Technique currency or invisible Technique modifier remains.
- The 0.80 exponent is activity-only; project work is linear and uses a dedicated slot. A contrary project-Attention comparator is required in Phase 1.
- Universal automation is independent of approach and Technique.
- First-Publication pacing is consistently 60–120 active-equivalent minutes and visibly provisional.
- The 10 achievements split exactly into seven badge/history records and three non-power unlocks; none carries production power.
- Storage is consistently localStorage current/fallback plus IndexedDB append-only history/logs.
- Prestige, permanent branches, challenges before Publication, large-number backend, PWA, audio, later chapters, and postgame remain visibly deferred.

## Browser/runtime evidence retained

The preserved v1 runtime baseline remains valid: more than nine minutes after one legal purchase, 10 Understanding and 0/s advanced to 2.37K and 4.1/s with zero console errors. The disposable prototype still passes its build/smoke check and six committed desktop/tablet/mobile JPEG checks. Its accessible tree and allocation/approach controls were previously inspected with zero console errors. Phase 0 does not claim this prototype is production UI or a human usability study.

## Git/ref validation

- `main`: `239d75fd0e223e91703e261d2196953a896609cb`.
- `legacy/v1`: same original SHA.
- annotated tag object `v1.0.0-legacy`: `d0eec7c7df87534f99684f55339ad58fa6437030`, targeting the original SHA.
- accepted refs after reconciliation commit: local `v2/integration` and `phase/01-deterministic-engine` at the accepted Phase 0 tip.
- checked-out branch after handoff: `phase/00-design-lock`.
- pushes, PRs, deployment changes, force updates, and history rewrites: none.

## Known limitations

- No empirical fun, comprehension, fatigue, or retention playtest exists.
- No production v2 bundle exists, so bundle, engine performance, IndexedDB recovery behavior, and assistive-technology integration remain Phase 1 evidence.
- Screenshot capture is browser-assisted; the npm gate validates committed image decode/dimensions and prototype behavior rather than launching a second browser stack.
- Public deployment was intentionally not modified or required for Phase 0 acceptance.

## Result

Every required Phase 0 command, research-integrity gate, reconciliation-completeness gate, design consistency gate, and Git preservation gate passes. The former missing-source blocker is resolved. Phase 0 is accepted and ready for the Phase 1 deterministic-engine task.
