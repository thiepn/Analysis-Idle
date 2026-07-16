# Phase 0 completion report

`PHASE_0_STATUS: BLOCKED`

## 1. Executive summary

Codex preserved v1, audited the repository and runtime, compared the major v2 hypotheses, selected a coherent architecture, specified the Natural Numbers vertical slice, built deterministic design-lab tooling and a responsive prototype, and prepared the Phase 1 engine handoff. Phase 0 cannot truthfully pass because the two research documents named as authoritative inputs were not supplied. Their contents were not invented; affected decisions remain lower-confidence and Phase 1 is not authorized to begin.

## 2. Original repository SHA

`239d75fd0e223e91703e261d2196953a896609cb`.

## 3. Git preservation status

- Working branch: `phase/00-design-lock`.
- `legacy/v1`: created at the original SHA.
- Annotated `v1.0.0-legacy`: tag object `d0eec7c7df87534f99684f55339ad58fa6437030`, targeting the original SHA.
- `main`: unchanged at the original SHA.
- `v2/integration`: intentionally not created because this phase remains BLOCKED; the Git handoff documents the next ref operation after acceptance.
- No ref was pushed, no PR was opened, and deployment configuration was not changed.

## 4. Files created

New work comprises repository governance and CI under `AGENTS.md`, nested `AGENTS.md`, and `.github/`; the Phase 0 Node/TypeScript toolchain; `docs/research`, `docs/design`, `docs/balance`, `docs/technical`, `docs/art`, `docs/qa`, and `docs/handoff`; deterministic `experiments`; the disposable `prototypes/phase-0`; design-lab tools; and all `reports/phase-0` data, comparisons, audits, screenshots, and completion records.

## 5. Files modified

No file tracked by the v1 baseline was modified. Git refs were added for preservation and the Phase 0 branch.

## 6. Files intentionally untouched

All 22 v1 tracked files, `main`, the production Pages source, remote refs, public deployment, save key behavior, and legacy runtime behavior remain untouched. The full v2 game, production engine, final save implementation, final assets, PWA, audio, and later chapters are out of scope.

## 7. Research conflicts resolved

Internal assumptions were challenged rather than inherited: three resources reduced to two; six Attention reduced to 3→4; Technique moved from currency to project behavior; generic reset prestige deferred; 90–180 timing normalized to 120–180 active-equivalent minutes; and a mistaken third Practice lane was removed from the prototype. The unavailable Foundation and Completion Audit cannot be compared, so their unknown conflicts remain the blocking item.

## 8. Selected core architecture

Candidate F: a staged hybrid of discrete Attention allocation, dedicated projects, and simplified mathematical dependencies. Priority automation is introduced only after the player understands the manual decisions. The production flow is validated content → commands → deterministic transitions → canonical state → selectors → UI.

## 9. Selected Attention model

Three whole slots initially and a fourth during Natural Numbers; every allocation is available through 44px plus/minus controls and presets, with dragging optional. Slot production uses configurable concavity with exponent 0.80 marked `PROVISIONAL`.

## 10. Selected resource model

Precision and Intuition are the only chapter-local primary stocks. Attention is capacity, Understanding is non-spendable mastery progress, Insight is bounded active capacity, and Mastery is the durable Publication record. No direct Precision↔Intuition conversion exists.

## 11. Selected branch and automation architecture

Natural Numbers uses reversible per-project Formal, Exploratory, and Constructive approaches, not permanent player-type branches. Automation is universal, rule-based, inspectable, bounded by reserves/safe policies, and stops at unresolved decisions. No branch owns quality-of-life access.

## 12. Active-play decision

Insight is the bounded active layer: deterministic, capped provisionally at three charges, earned from meaningful events rather than repeatable clicks. Target sustained advantage is 10–15% with a hard provisional ceiling of 20%; waiting remains viable.

## 13. Offline decision

Offline reconciliation reuses the deterministic event engine. It stops at an unresolved decision unless a validated safe policy resolves it, returns an event/decision summary, and uses configurable provisional credit windows: 12h full, then 25% through 72h, then zero.

## 14. Publication decision

Publication is a typed chapter transformation: solved work is compressed into named Mastery artifacts and later capabilities. Chapter stocks, allocation, active/queued work, and local modifiers reset; settings, records, templates, discoveries, and Mastery persist. Publication grants no generic multiplier.

## 15. Prestige decision

Global prestige is `DEFERRED`. Phase 1 reserves a typed extension boundary but implements no command, currency, formula, reset, or UI. A multi-chapter prototype must prove a unique purpose distinct from Publication before adoption.

## 16. Campaign scope

The finite initial campaign target is 30–50 active-equivalent hours over 4–8 weeks (`PROVISIONAL`). First Publication targets 120–180 active-equivalent minutes over 1–3 sessions (`PROVISIONAL`). Later chapters and postgame are deferred.

## 17. Natural Numbers readiness

The chapter has a GDD, 12-project catalogue, 15 upgrade/capability entries, 11 milestones, 10 badge-only achievements, challenge decision, dependency graph, capstone, Publication mapping, UI journey, mathematical-source requirements, accessibility requirements, balance values, gates, and tests. Numeric centers remain configuration. Content implementation is gated on research reconciliation and Phase 1 schema/simulator work.

## 18. Technical stack decision

Preact 10 + TypeScript 5.9.3 + Vite, with no UI dependency in engine/content modules. Strict commands, state, effects, conditions, selectors, time/RNG ports, content validation, simulation, save envelopes, and migrations are specified. GitHub Pages remains the static target; PWA lifecycle work is deferred.

## 19. Numerical decision

Use native JavaScript `number` only behind an adapter; reject all non-finite inputs/results. Record magnitude telemetry and require a migration decision before approximately `1e280` or earlier precision-loss gates. No large-number dependency is justified in Phase 0.

## 20. Storage decision

Use namespaced rotating localStorage envelopes for canonical saves first, with checksums, backups, explicit import/export, strict future-version rejection, legacy-v1 detection, and atomic migrations. IndexedDB stores logs and future growth and may become canonical only after evidence. Multi-tab ownership uses Web Locks/BroadcastChannel with a lease fallback.

## 21. Asset and art decision

The provisional direction is a living mathematical notebook/academic instrument: restrained paper surfaces, precise diagrams, authored SVG primitives, semantic resource marks, and procedural proof/dependency visualization. The manifest, budgets, reduced-motion behavior, and licensing provenance are specified. Final logo, polished chapter art, sound, and music are deferred.

## 22. Accessibility decision

WCAG 2.2 AA is the release floor. Keyboard/touch parity, 44px targets, visible focus, reduced motion, color-independent state, semantic reading order, live-region restraint, accessible formula prose, KaTeX `htmlAndMathML` when introduced, zoom/reflow, save-recovery announcements, and automated/manual test matrices are architectural requirements.

## 23. Experiment summaries

Ten reproducible labs compare core loops, Attention, resources, project approaches, pacing, active/idle, offline policy, prestige purpose, frontend, and numerical range. Candidate F wins the tested heuristic weight sets; 3→4 Attention and two stocks minimize early burden; Preact wins the documented stack criteria; native numbers remain viable behind a gate; prestige has no proven distinct function. Reports preserve inputs, criteria, alternatives, sensitivity, and limitations. Heuristic scores are not claims of fun.

## 24. Test results

The TypeScript suite contains seven passing deterministic/model tests. Repeatability produces digest `5ae307f3ac0af962d3faf647130d1b39b306b17539c154a956c586bbc936a91f`. The local v1 runtime produced from 10 to 2.37K Understanding at 4.1/s over more than nine minutes with zero console errors. The prototype loaded at desktop/tablet/mobile overrides, exposed an accessible tree, changed Attention allocation and approach state correctly, and logged zero console errors. Full command results are recorded in `VALIDATION_REPORT.md` and `validation-results.json`.

## 25. Unresolved risks

- The two authoritative research documents are unavailable.
- Numerical and pacing centers are not human-playtest evidence.
- Two-stock differentiation, Insight pressure, approach comprehension, and offline fairness require playtests.
- Bundle/performance budgets require production code measurements.
- The public deployment was not accessible from the supplied local context.
- Screenshot capture is browser-assisted; the npm check validates committed image paths/sizes rather than regenerating them headlessly.

## 26. Deferred items

Prestige, permanent campaign branches, early challenges, PWA/service worker, audio, localization, later chapters, postgame, polished assets, canonical IndexedDB, and any large-number library remain explicitly deferred. Their extension points and evidence gates are documented.

## 27. Phase 1 readiness

`false`. The implementation brief is precise enough for execution, but Phase 1 must not begin until the missing research inputs are supplied, reconciled into the decision register, and the BLOCKED status is revalidated. No major engine choice should then need invention.

## 28. Exact next steps

1. Supply `Analysis Idle v2 — Deep Research Foundation v0.1` and `Analysis Idle v2 Deep Research Completion Audit`/`deep-research-report.md`.
2. Add them as immutable source inputs or source-presence records; reconcile every conflict and revise affected decisions, experiments, and handoff documents.
3. Rerun `npm run phase0:all`, update both completion reports to PASS only if every gate is genuinely met, and commit the review.
4. Create/update local `v2/integration` at the accepted Phase 0 tip without touching `main`.
5. Branch `phase/01-deterministic-engine` from `v2/integration` and implement only the deterministic engine, content schemas, headless simulator, save envelope/migrations, and minimal accessible debug UI described in the Phase 1 brief.
