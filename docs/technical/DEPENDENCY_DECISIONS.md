# Dependency decisions

## Phase 0 installed development dependencies

| Package/range | Status/purpose | Alternatives | Impact/justification |
|---|---|---|---|
| `typescript ^5.8.3` → 5.9.3 | dev; strict type checking | JSDoc/plain JS | Explicit experiment contracts and future architecture proof |
| `tsx ^4.19.3` → 4.23.1 | dev; run TypeScript labs | precompile/ts-node | Small direct experiment/report runner |
| `vitest ^3.2.4` → 3.2.7 | dev; experiment tests | Node test runner | Native TS/Vite-aligned test ergonomics |
| `@types/node ^22.15.0` → 22.20.1 | dev; Node APIs | handwritten types | Correct filesystem/crypto/tool types |

Exact resolved versions are committed in `package-lock.json`. Installation audited 56 packages with zero reported vulnerabilities. All are development-only and do not affect v1/browser bundles.

## Phase 1 resolved runtime and tooling

| Package | Class/license | Purpose | Alternatives considered | Maintenance and bundle cost |
|---|---|---|---|---|
| `preact 10.29.7` | production; MIT | Minimal debug renderer | DOM-only renderer; React | Keeps the engine framework-independent; one small runtime/rendering API. Its measured cost is included in the Phase 1 application-JS gzip gate. React was unnecessary for this surface; a handwritten renderer would increase lifecycle/accessibility maintenance. |
| `zod 4.4.3` | production; MIT | Strict inert-content and untrusted-save validation | Handwritten guards; JSON Schema/Ajv | One validation API and a material share of the debug bundle, accepted because nested error paths and composable schemas replace duplicated unsafe guards. Measured in the application-JS gzip gate. Ajv adds a separate schema/code-generation workflow; handwritten guards had higher correctness cost. |

KaTeX is deferred until Phase 2 has reviewed player-facing notation that justifies its bundle and accessibility cost.

Development uses exact Vite 7.3.6, `@preact/preset-vite` 2.10.6, TypeScript 5.9.3, Vitest 3.2.7, Testing Library for Preact 3.2.4, user-event 14.6.1, ESLint 9.39.5, typescript-eslint 8.64.0, jsx-a11y 6.10.2, Prettier 3.9.5, jsdom 29.1.1, fake-indexeddb 6.2.5, Node types 22.20.1, Babel core types 7.20.5, and tsx 4.23.1. `fake-indexeddb` and jsdom are test-only; no production bundle cost results.

The development stack is license-compatible with the repository: TypeScript and `fake-indexeddb` are Apache-2.0; the remaining direct development packages are MIT-licensed. Exact transitive versions and integrity hashes are committed in `package-lock.json`. Vite/tsx alternatives were a manual compile step; Vitest alternatives were Node's runner plus custom TS/DOM setup; ESLint/Prettier alternatives were unautomated review. These packages increase install/update surface but not the production bundle. Major-version upgrades require a clean-install CI run and renewed peer/license review.

ESLint 10 was evaluated during installation and rejected because jsx-a11y 6.10.2 declares an incompatible peer range. Exact ESLint 9.39.5 is the supported resolution. Playwright and axe integration were not added: semantic Testing Library smoke tests and jsx-a11y cover the Phase 1 debug surface, while browser-level visual/accessibility automation belongs with the Phase 2 player surface.

Do not add a state manager, router, date library, animation library, component kit, IndexedDB wrapper, large-number library, analytics SDK, or PWA plugin until a measured requirement appears. Phase 1 uses the native IndexedDB API behind the persistence port for append-only backups/replay logs; a wrapper requires a separate maintenance/bundle justification.
