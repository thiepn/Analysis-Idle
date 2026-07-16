# Phase 1 input manifest

## Must read in order

1. `AGENTS.md` and nested engine/content/UI rules.
2. `docs/research/SOURCE_MANIFEST.json`, `DEEP_RESEARCH_FOUNDATION.md`, and `DEEP_RESEARCH_COMPLETION_AUDIT.md`; verify their recorded SHA-256 values before relying on them.
3. `reports/phase-0/data/research-reconciliation.json` and `reports/phase-0/RESEARCH_RECONCILIATION_REPORT.md`.
4. `docs/qa/PHASE_ACCEPTANCE.md` and `reports/phase-0/PHASE_0_COMPLETION_REPORT.md`.
5. `docs/research/RESEARCH_SYNTHESIS.md`, `RESEARCH_DECISIONS.md`, and `OPEN_QUESTIONS.md`.
6. `docs/design/GAME_DESIGN.md`, progression/automation/branch/active/offline/Publication/prestige specs.
7. All `NATURAL_NUMBERS_*` design/balance documents.
8. Technical state/effect/save/offline/numerical/deployment/dependency specs.
9. Balance/QA gates, accessibility standard, art tokens/direction.
10. `reports/phase-0/data/*.json`, comparison reports, audits, legacy baseline/manifest/runtime screenshots.

## Machine inputs

The source manifest, 53-decision reconciliation register, Phase 0 deterministic data/manifests, legacy SHA/manifest, validation results, machine summary, package lock, and prototype are required inputs. Treat experiment code as evidence tooling only; production must not import it.

## Input completeness

Complete. Both authoritative research inputs are preserved with matching checksums and every required reconciliation decision has an allowed status. No missing-source exception or provisional authorization is needed to begin Phase 1 after the accepted Phase 0 tip is referenced by `v2/integration` and `phase/01-deterministic-engine`.
