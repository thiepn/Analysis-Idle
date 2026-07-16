# Phase 0 validation report

Validation date: 2026-07-16

Working branch: `phase/00-design-lock`

Command gate: **PASS**

Phase gate: **BLOCKED** because the two named research inputs were not supplied.

## Required commands

| Command / check | Result | Duration | Evidence / note |
|---|---:|---:|---|
| `git status --short --branch` | PASS | 0.23s | Correct branch; all Phase 0 work untracked before the planned commits; no legacy modification. |
| `git branch --show-current` | PASS | 0.23s | `phase/00-design-lock`. |
| `git log -1 --oneline` | PASS | 0.25s | Pre-commit Phase 0 tip was legacy baseline `239d75f e2`. |
| `npm install` | PASS | 1.9s | 56 packages audited; zero vulnerabilities; lockfile current. |
| `npm run typecheck` | PASS | 6.30s | TypeScript 5.9.3, no diagnostics. |
| `npm run lint` | PASS | 2.39s | 19 required artifacts, JSON parsing, and experiment-import boundary passed. |
| `npm run test` | PASS | 3.83s | 1 file; 7/7 tests passed. |
| `npm run format:check` | PASS | 1.11s | 129 text files; binaries correctly excluded. |
| `npm run phase0:prototype` | PASS | 2.07s | Static prototype concept/build smoke passed. |
| `npm run phase0:screenshots` | PASS | 0.88s | Six JPEG captures exist, decode, and match the requested viewport envelopes. |
| `npm run phase0:links` | PASS | 0.95s | 13 local Markdown targets resolved. |
| `npm run phase0:all` | PASS | 15.24s | Audit, report generation, repeatability, formatting, lint, typecheck, tests, prototype, screenshots, and links all passed. |

`npm run phase0:all` regenerated the 22-file legacy manifest, all ten machine-readable experiment outputs and comparison reports, then repeated the design lab with digest `5ae307f3ac0af962d3faf647130d1b39b306b17539c154a956c586bbc936a91f`.

## Browser/runtime validation

The preserved v1 ran locally for more than nine minutes after one legal purchase. It progressed from 10 Understanding and 0/s to 2.37K and 4.1/s with zero console errors. Startup, purchase, production, chapter display, save/offline source behavior, responsive views, and basic performance risks are recorded in `LEGACY_RUNTIME_BASELINE.md`.

The Phase 0 prototype loaded with zero console errors. The accessible tree exposed headings, regions, navigation, allocation controls, radio approaches, progress, return summary, dependency-map alternative text, and Publication. A plus control changed allocation from 3/4 to 4/4 and disabled both plus controls; the Exploratory radio became checked. No mouse-only action is required.

Browser viewport overrides and native visible-region captures:

| Requested override | Native image | Legacy | Prototype |
|---|---:|---|---|
| 1440 × 900 | 1425 × 891 | `legacy-1440x900.jpg` | `prototype-1440x900.jpg` |
| 768 × 1024 | 753 × 1004 | `legacy-768x1024.jpg` | `prototype-768x1024.jpg` |
| 390 × 844 | 375 × 812 | `legacy-390x844.jpg` | `prototype-390x844.jpg` |

The image dimensions exclude in-app browser chrome; CSS layout was exercised at the requested overrides. Final captures were inspected visually. A desktop header clipping issue and mobile navigation overflow found in the first prototype capture were corrected and recaptured.

## Failures found and corrective action

1. The first `phase0:report` run wrote report paths one directory above the repository. Path resolution was corrected and deterministic output regenerated in-repository.
2. The first screenshot validator revision assumed PNG signatures while the browser capture API returned JPEG bytes; filenames were corrected to `.jpg` and the validator now decodes JPEG dimensions.
3. The first format validator read image binaries as UTF-8 text; its scope now includes only known text extensions.
4. The first visual prototype review found a clipping desktop save control and horizontally scrolling mobile navigation; flex constraints and mobile wrapping were added.
5. An in-progress third Practice lane and a 90-minute Publication floor conflicted with selected decisions; both were normalized to two production lanes and 120–180 active-equivalent minutes.

All five corrective actions were rerun through `npm run phase0:all` successfully.

## Git/ref validation

- `main`: `239d75fd0e223e91703e261d2196953a896609cb`.
- `legacy/v1`: same original SHA.
- annotated tag object `v1.0.0-legacy`: `d0eec7c7df87534f99684f55339ad58fa6437030`, targeting the original SHA.
- working branch before Phase 0 commits: same original SHA.
- `v2/integration`: absent by design while Phase 0 is BLOCKED.
- pushes: none; PRs: none; deployment changes: none.

## Known limitations and skips

- The Foundation and Completion Audit were unavailable. This is a Phase acceptance blocker, not an automated-command failure.
- No empirical fun/comprehension playtest exists; heuristic scores are comparative evidence only.
- No production v2 bundle exists, so bundle and engine performance budgets remain unmeasured.
- The public deployment could not be verified from supplied local context and was not touched.
- Screenshot generation uses the in-app browser; the npm script validates committed captures rather than launching a second browser stack.
- PWA, audio, localization, later chapters, prestige implementation, and polished assets are intentionally out of scope, not test skips.

## Result

Every runnable Phase 0 command and unaffected deliverable passes. `PHASE_0_STATUS` remains `BLOCKED` solely because required authoritative research inputs are missing and cannot be reconciled without fabrication.
