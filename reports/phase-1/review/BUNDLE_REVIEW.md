# Bundle and dependency review

Result: **PASS against the authoritative gzip budgets**.

- Application JS: 173551 B raw / 49880 B gzip (≤100 KiB gzip).
- Largest entry JS: 49880 B gzip (≤75 KiB).
- CSS: 2614 B raw / 1075 B gzip (≤25 KiB).
- Initial shell: 51302 B gzip (≤200 KiB).
- Production source maps: excluded.

The previously reported 150,000-byte raw-JS threshold was a Phase 1 diagnostic, not the authoritative budget. The build contains application code and runtime dependencies only; tests, reports, simulator, and fixtures are not imported by the entry. Vite tree-shaking/minification is active.

Runtime dependencies remain Preact and Zod, both MIT. Tooling is development-only; licenses and alternatives are recorded in `docs/technical/DEPENDENCY_DECISIONS.md`. No router, state manager, animation/component/graph library, IndexedDB wrapper, large-number package, analytics SDK, or PWA dependency was added.
