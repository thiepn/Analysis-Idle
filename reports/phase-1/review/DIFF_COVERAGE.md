# Complete diff coverage

Base: `933ba5d67b22362c3f5d45e6b35eb481701793ab`. Review-start head: `3cd4ee7a5376dd3330f4cff065b1bef4bcc36843`. Files classified: **130**. Unclassified: **0**.

Every production, test, content, simulator, persistence, UI, CI, report, documentation, and generated file in the base-to-worktree diff was inspected. Generated outputs were traced to their generator and regenerated; they were not accepted as independent proof.

| Status | Classification | File                                                        | Review disposition           |
| ------ | -------------- | ----------------------------------------------------------- | ---------------------------- |
| M      | CI             | `.github/workflows/phase-0.yml`                             | reviewed                     |
| A      | CI             | `.github/workflows/phase-1.yml`                             | reviewed                     |
| M      | DOCUMENTATION  | `.gitignore`                                                | reviewed                     |
| A      | DOCUMENTATION  | `.prettierignore`                                           | reviewed                     |
| M      | DOCUMENTATION  | `docs/balance/NATURAL_NUMBERS_BALANCE.md`                   | reviewed                     |
| M      | DOCUMENTATION  | `docs/technical/DEPENDENCY_DECISIONS.md`                    | reviewed                     |
| A      | PRODUCTION     | `eslint.config.js`                                          | reviewed                     |
| M      | DOCUMENTATION  | `experiments/models.test.ts`                                | reviewed                     |
| M      | DOCUMENTATION  | `experiments/models.ts`                                     | reviewed                     |
| M      | PRODUCTION     | `package-lock.json`                                         | reviewed                     |
| M      | PRODUCTION     | `package.json`                                              | reviewed                     |
| M      | REPORT         | `reports/phase-0/data/attention-model-results.json`         | reviewed                     |
| M      | REPORT         | `reports/phase-0/data/determinism-manifest.json`            | reviewed                     |
| A      | REPORT         | `reports/phase-1/ACCESSIBILITY_SMOKE_REPORT.md`             | reviewed                     |
| A      | REPORT         | `reports/phase-1/ATTENTION_MODEL_REPORT.md`                 | reviewed                     |
| A      | REPORT         | `reports/phase-1/BALANCE_AND_POLICY_REPORT.md`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/BUNDLE_AND_PERFORMANCE_REPORT.md`          | reviewed                     |
| A      | REPORT         | `reports/phase-1/CONDITION_COVERAGE_REPORT.md`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/CONTENT_VALIDATION_REPORT.md`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/DEPENDENCY_REPORT.md`                      | reviewed                     |
| A      | REPORT         | `reports/phase-1/EFFECT_STACK_REPORT.md`                    | reviewed                     |
| A      | REPORT         | `reports/phase-1/ENGINE_DETERMINISM_REPORT.md`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/NUMERICAL_RANGE_REPORT.md`                 | reviewed                     |
| A      | REPORT         | `reports/phase-1/OFFLINE_EQUIVALENCE_REPORT.md`             | reviewed                     |
| A      | REPORT         | `reports/phase-1/PHASE_1_COMPLETION_REPORT.md`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/PHASE_2_HANDOFF.md`                        | reviewed                     |
| A      | REPORT         | `reports/phase-1/SAVE_AND_MIGRATION_REPORT.md`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/SPEC_CONFLICTS.md`                         | reviewed                     |
| A      | REPORT         | `reports/phase-1/STATE_INVARIANT_REPORT.md`                 | reviewed                     |
| A      | REPORT         | `reports/phase-1/TECHNIQUE_MODEL_REPORT.md`                 | reviewed                     |
| A      | REPORT         | `reports/phase-1/VALIDATION_REPORT.md`                      | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/attention-model.json`                 | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/balance-and-policy.json`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/bundle-and-performance.json`          | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/condition-coverage.json`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/content-validation.json`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/determinism-manifest.json`            | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/effect-stack.json`                    | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/numerical-range.json`                 | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/offline-equivalence.json`             | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/save-fixtures.json`                   | reviewed                     |
| A      | REPORT         | `reports/phase-1/data/state-invariants.json`                | reviewed                     |
| A      | GENERATED      | `reports/phase-1/generated/simulator/balanced.csv`          | reviewed as generated output |
| A      | GENERATED      | `reports/phase-1/generated/simulator/balanced.json`         | reviewed as generated output |
| A      | REPORT         | `reports/phase-1/phase-1-summary.json`                      | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/ARCHITECTURE_REVIEW.md`             | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/BUNDLE_REVIEW.md`                   | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/CI_FAILURE_ANALYSIS.md`             | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/CORRECTION_LOG.md`                  | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/DETERMINISM_REVIEW.md`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/DIFF_COVERAGE.md`                   | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/INDEPENDENT_REVIEW_REPORT.md`       | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/OFFLINE_REVIEW.md`                  | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/PARAMETER_RECONCILIATION.md`        | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/POLICY_DIFFERENTIATION_REVIEW.md`   | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/SAVE_REVIEW.md`                     | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/TEST_COVERAGE_GAPS.md`              | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/data/ci-failure-analysis.json`      | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/data/diff-coverage.json`            | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/data/parameter-reconciliation.json` | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/data/remote-ci-verification.json`   | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/review-summary.json`                | reviewed                     |
| A      | REPORT         | `reports/phase-1/review/validation-results.json`            | reviewed                     |
| A      | REPORT         | `reports/phase-1/validation-results.json`                   | reviewed                     |
| A      | UI             | `src/app/App.tsx`                                           | reviewed                     |
| A      | UI             | `src/app/store.ts`                                          | reviewed                     |
| A      | CONTENT        | `src/content/index.ts`                                      | reviewed                     |
| A      | CONTENT        | `src/content/natural-numbers.ts`                            | reviewed                     |
| A      | CONTENT        | `src/content/schemas.ts`                                    | reviewed                     |
| A      | CONTENT        | `src/content/validate.ts`                                   | reviewed                     |
| A      | PRODUCTION     | `src/engine/commands/types.ts`                              | reviewed                     |
| A      | PRODUCTION     | `src/engine/conditions/evaluate.ts`                         | reviewed                     |
| A      | PRODUCTION     | `src/engine/effects/resolve.ts`                             | reviewed                     |
| A      | PRODUCTION     | `src/engine/events/types.ts`                                | reviewed                     |
| A      | PRODUCTION     | `src/engine/index.ts`                                       | reviewed                     |
| A      | PRODUCTION     | `src/engine/numbers/game-number.ts`                         | reviewed                     |
| A      | PRODUCTION     | `src/engine/reducer/reduce.ts`                              | reviewed                     |
| A      | PRODUCTION     | `src/engine/rng/xoshiro.ts`                                 | reviewed                     |
| A      | PRODUCTION     | `src/engine/selectors/index.ts`                             | reviewed                     |
| A      | PRODUCTION     | `src/engine/state/game-state.ts`                            | reviewed                     |
| A      | PRODUCTION     | `src/engine/state/invariants.ts`                            | reviewed                     |
| A      | PRODUCTION     | `src/engine/time/advance.ts`                                | reviewed                     |
| A      | UI             | `src/main.tsx`                                              | reviewed                     |
| A      | PERSISTENCE    | `src/platform/ownership/browser-services.ts`                | reviewed                     |
| A      | PERSISTENCE    | `src/platform/ownership/coordinator.ts`                     | reviewed                     |
| A      | PERSISTENCE    | `src/platform/persistence/checksum.ts`                      | reviewed                     |
| A      | PERSISTENCE    | `src/platform/persistence/envelope.ts`                      | reviewed                     |
| A      | PERSISTENCE    | `src/platform/persistence/index.ts`                         | reviewed                     |
| A      | PERSISTENCE    | `src/platform/persistence/indexed-db.ts`                    | reviewed                     |
| A      | PERSISTENCE    | `src/platform/persistence/local-storage.ts`                 | reviewed                     |
| A      | PERSISTENCE    | `src/platform/persistence/scheduler.ts`                     | reviewed                     |
| A      | PERSISTENCE    | `src/platform/time/clock.ts`                                | reviewed                     |
| A      | PERSISTENCE    | `src/platform/time/offline.ts`                              | reviewed                     |
| A      | PRODUCTION     | `src/shared/contracts.ts`                                   | reviewed                     |
| A      | UI             | `src/styles.css`                                            | reviewed                     |
| A      | TEST           | `tests/content/content-validation.test.ts`                  | reviewed                     |
| A      | TEST           | `tests/determinism/time-replay.test.ts`                     | reviewed                     |
| A      | GENERATED      | `tests/fixtures/saves/corrupt-json.json`                    | reviewed as generated output |
| A      | GENERATED      | `tests/fixtures/saves/current-valid.json`                   | reviewed as generated output |
| A      | GENERATED      | `tests/fixtures/saves/future-unsupported.json`              | reviewed as generated output |
| A      | GENERATED      | `tests/fixtures/saves/invalid-checksum.json`                | reviewed as generated output |
| A      | GENERATED      | `tests/fixtures/saves/invalid-schema.json`                  | reviewed as generated output |
| A      | GENERATED      | `tests/fixtures/saves/new-empty-v2.json`                    | reviewed as generated output |
| A      | GENERATED      | `tests/fixtures/saves/older-supported-v2.json`              | reviewed as generated output |
| A      | GENERATED      | `tests/fixtures/saves/partial-write.json`                   | reviewed as generated output |
| A      | GENERATED      | `tests/fixtures/saves/post-publication.json`                | reviewed as generated output |
| A      | GENERATED      | `tests/fixtures/saves/rng-replay.json`                      | reviewed as generated output |
| A      | TEST           | `tests/helpers.ts`                                          | reviewed                     |
| A      | TEST           | `tests/integration/lifecycle.test.ts`                       | reviewed                     |
| A      | TEST           | `tests/integration/offline-equivalence.test.ts`             | reviewed                     |
| A      | TEST           | `tests/persistence/save.test.ts`                            | reviewed                     |
| A      | TEST           | `tests/simulator/policies.test.ts`                          | reviewed                     |
| A      | TEST           | `tests/ui/app.test.tsx`                                     | reviewed                     |
| A      | TEST           | `tests/unit/conditions-effects.test.ts`                     | reviewed                     |
| A      | TEST           | `tests/unit/invariants.test.ts`                             | reviewed                     |
| A      | TEST           | `tests/unit/numbers-rng.test.ts`                            | reviewed                     |
| A      | TEST           | `tests/unit/reducer.test.ts`                                | reviewed                     |
| A      | PRODUCTION     | `tools/phase1/content-validate.ts`                          | reviewed                     |
| A      | PRODUCTION     | `tools/phase1/generate-reports.ts`                          | reviewed                     |
| A      | PRODUCTION     | `tools/phase1/generate-review-reports.ts`                   | reviewed                     |
| A      | PRODUCTION     | `tools/phase1/save-fixtures.ts`                             | reviewed                     |
| A      | PRODUCTION     | `tools/phase1/validate-boundaries.mjs`                      | reviewed                     |
| A      | SIMULATOR      | `tools/simulator/cli/index.ts`                              | reviewed                     |
| A      | SIMULATOR      | `tools/simulator/core.ts`                                   | reviewed                     |
| A      | SIMULATOR      | `tools/simulator/policies/index.ts`                         | reviewed                     |
| A      | SIMULATOR      | `tools/simulator/reports/generate.ts`                       | reviewed                     |
| A      | DOCUMENTATION  | `tsconfig.json`                                             | reviewed                     |
| A      | PRODUCTION     | `v2/index.html`                                             | reviewed                     |
| A      | PRODUCTION     | `vite.config.ts`                                            | reviewed                     |
| A      | PRODUCTION     | `vitest.config.ts`                                          | reviewed                     |
