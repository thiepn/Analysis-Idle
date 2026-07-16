# Current repository audit

## Identity and preservation

- Repository: `thiepn/Analysis-Idle` (`https://github.com/thiepn/Analysis-Idle.git`).
- Default branch: `main`; original HEAD `239d75fd0e223e91703e261d2196953a896609cb` (`e2`).
- History: 9 commits from initial `9fe0e8b` through `e2`, all on 2026-06-03.
- Baseline: 22 files, 166,352 bytes, 5,913 physical lines; 18 JavaScript files/4,800 lines.
- Safety refs: `legacy/v1` and annotated `v1.0.0-legacy`; Phase work `phase/00-design-lock`.
- No existing v2/integration branch at audit start. No history rewrite, main change, push, or deployment action.

## Runtime/deployment

Buildless root-hosted HTML/CSS/browser ES modules. `index.html:200` imports `main.js`; `.nojekyll` and README root-hosting guidance indicate direct GitHub Pages deployment. No Pages workflow/config, service worker, or manifest exists. Actual remote Pages setting/public availability was not established and was not changed.

## Source/content inventory

- `data/`: 24 buildings (six parent groups × four variants), 50 upgrades (NN 6, Integers 6, Rationals 6, Reals 7, Sequences 12, Limits 13), 60 achievements, 10 chapter records.
- Implemented chapters: Natural Numbers, Integers, Rational Numbers, Real Numbers, Sequences, Limits. Planned: Continuity, Differentiation, Integration, Infinite Series (`data/chapters.js:3-487`).
- Executable `progressMilestones`: 10 in Sequences/Limits; earlier `milestones` arrays are display labels only (`systems/milestones.js:7-23`).
- Systems: achievements, buildings, chapters, economy, milestones, research, save/migrations, unlocks, upgrades. Prestige is an empty stub (`systems/prestige.js:1-3`).
- UI: `ui/ui.js` is 1,165 lines/39,502 bytes and handles queries, events, all panels, grouping, formatting, progression, research, achievements, and factories.

## Economy/save

Canonical spendable/produced stock is only `resources.understanding` (`systems/economy.js:8-10`). Buildings and upgrades spend it. State includes inert prestige fields. Save is one full JSON snapshot at generic key `mathIdleSave`, autosaved every 10s (`systems/save.js:4-14`, `main.js:19,90-93`). Migrations support implicit v1→v5, but state initializes as version 4 while writer declares 5. Load parses/migrates/merges/applies unlimited offline rate without schema/checksum/backups/import/export/future-version rejection.

## Baseline engineering status

No `package.json`, lockfile, dependency manifest, tests, CI, formal lint/typecheck/build, license, web manifest, or service worker. README documents no build step. License selection is intentionally left to the owner.

## Required legacy findings

| Finding | Status | Evidence |
|---|---|---|
| One-resource dominance | CONFIRMED | one stock; all purchases use it (`economy.js:8-10`, `buildings.js:65-67`, `upgrades.js:14-20`) |
| Predetermined opening | CONFIRMED | starts 10; only Formal Definitions unlocked/cost 10; next concept requires it (`economy.js:8-16`, `data/buildings.js:2-13`, `data/upgrades.js:2-10`) |
| Linear research | CONFIRMED | 44/50 direct single-predecessor upgrades; opening strict chain (`data/upgrades.js:2-54`) |
| Cosmetic chapter changes | PARTIALLY CONFIRMED | content/aliases/goals/rewards vary, but same stocks/buildings/formulas persist (`chapters.js`, `ui.js:206-209`) |
| Achievement multiplier tax | CONFIRMED | all 60 auto-reward tiny production multipliers; global subset compounds ≈1.1685 (`data/achievements.js:382-469`, `economy.js:305-344`) |
| Extreme payback disparities | CONFIRMED | raw 2.5s Definitions vs 283,333,333s Epsilon Proof Drafts, >113m× spread (`data/buildings.js:8-10,202-211`) |
| Unowned-building effect activation | CONFIRMED | all building-definition effects scanned without source ownership (`economy.js:146-168,189-195`) |
| Unlimited offline progress | CONFIRMED | all elapsed time × current rate; no cap (`save.js:390-401`) |
| Animation-frame-coupled economy | CONFIRMED | frame delta directly produces currency (`main.js:80-98`) |
| Full UI refresh frequency | CONFIRMED WITH CORRECTION | every frame calls all panel updates; rows cache nodes but several panels rewrite markup (`main.js:90-98`, `ui.js:151-166,551,751-800,902-917`) |
| Oversized UI module | CONFIRMED | 1,165 lines/39,502 bytes, 27.4% baseline JS bytes |
| Chapter-selection safety | CONFIRMED | threshold may advance current chapter before prior completion; unknown ID returns first chapter (`chapters.js:4-24`, `data/chapters.js:24-62`) |
| Save-version inconsistency | CONFIRMED | initial 4 vs writer 5 (`economy.js:29-32`, `save.js:4-10`) |
| Non-finite formatting risk | PARTIALLY CONFIRMED/CORRECTED | formatter guards to misleading “0”; arithmetic accepts invalid/overflow and JSON converts non-finite to null (`utils/format.js:1-4`) |
| Generic save key | CONFIRMED | `mathIdleSave` (`save.js:4`) |
| No formal tests/CI | CONFIRMED | no package/test/workflow in baseline |

## Additional critical/major defects

Loaded achievement rewards can remain stale (`main.js:27-43`); unguarded storage failure can terminate the loop (`save.js:7-11`); v5 migration may own locked producing variants (`save.js:142-165`, `economy.js:139-143`); Max loops up to 10,000 per visible building per frame (`buildings.js:34-49`, `ui.js:192-203`); achievement text rounds real ×1.003/×1.005 effects to x1.00; synergy detail may over-report unrelated parent effects; no save-domain validation; “Cantor's Theorem” names a specific uncountability result rather than general Cantor power-set theorem.

## Accessibility/performance

Completion overlay lacks dialog/focus/Escape semantics (`index.html:87-108`, `notifications.js:14-57`); no reduced-motion/forced-color foundation; ASCII mathematics; full-panel frame updates; repeated scans through all building/upgrade/achievement definitions. v1 remains historical and is not fixed in Phase 0.

