# Dependency decisions

## Phase 0 installed development dependencies

| Package/range | Status/purpose | Alternatives | Impact/justification |
|---|---|---|---|
| `typescript ^5.8.3` → 5.9.3 | dev; strict type checking | JSDoc/plain JS | Explicit experiment contracts and future architecture proof |
| `tsx ^4.19.3` → 4.23.1 | dev; run TypeScript labs | precompile/ts-node | Small direct experiment/report runner |
| `vitest ^3.2.4` → 3.2.7 | dev; experiment tests | Node test runner | Native TS/Vite-aligned test ergonomics |
| `@types/node ^22.15.0` → 22.20.1 | dev; Node APIs | handwritten types | Correct filesystem/crypto/tool types |

Exact resolved versions are committed in `package-lock.json`. Installation audited 56 packages with zero reported vulnerabilities. All are development-only and do not affect v1/browser bundles.

## Phase 1 proposed runtime

`preact`, a strict schema validator (prefer Zod unless hand-written validation remains demonstrably clearer), and KaTeX for reviewed accessible math. Proposed dev stack: Vite, `@preact/preset-vite`, TypeScript, Vitest, Testing Library for Preact, Playwright + axe integration, ESLint/typescript-eslint/jsx-a11y, and Prettier. Resolve current stable releases at scaffold time and record exact versions.

Do not add a state manager, router, date library, animation library, component kit, IndexedDB wrapper, large-number library, analytics SDK, or PWA plugin until a measured requirement appears. Phase 1 uses the native IndexedDB API behind the persistence port for append-only backups/replay logs; a wrapper requires a separate maintenance/bundle justification.
