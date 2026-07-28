# Test quality and remaining gaps

Critical success, rejection, boundary, corruption, deterministic-repeat, and integration paths are covered for engine numbers/RNG, effects/conditions, commands, time/offline, content, simulator, saves, and debug UI. Exact assertions replaced permissive save-fixture checks. Added regressions target exact-cost resume, publication reset, typed Insight, unowned/removed Technique, grouped stacking, schema depth/references, threshold/cap chunking, staging/IndexedDB recovery, in-flight scheduler writes, startup restore, and gated UI commands.

Known non-blocking gaps are explicit:

1. Real multi-window Web Locks/BroadcastChannel scheduling needs a browser integration harness in Phase 2; Phase 1 uses deterministic adapter/coordinator tests.
2. Lighthouse, screen-reader, switch-control, and low-end-device p95 measurements require the Phase 2 player surface; current debug UI has semantic/keyboard/reduced-motion smoke coverage.
3. Policy heuristics prove reachability and regression sensitivity, not fun or comprehension; the 30–50-hour campaign target remains a playtest requirement.
4. Native-number migration below 1e280 is tested, but later content must activate the documented migration trigger before exceeding it.
5. Report schemas are deterministic JSON but are not yet published as external JSON Schema artifacts; internal generators and CI consume their typed shapes.

None of these gaps invalidates the deterministic Phase 1 foundation or authorizes skipping the corresponding Phase 2/manual gates.
