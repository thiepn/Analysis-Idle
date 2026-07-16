# Platform strategy

Canonical platform: responsive browser, local-first, static build, GitHub Pages, desktop/mobile support. The engine runs identically in browser, headless simulator, and offline reconciliation through ports.

Phase sequence:

1. Phase 1: project/engine/content/simulator/save contracts and minimal debug UI; no deploy/PWA.
2. Phase 2: Natural Numbers production slice and responsive accessible UI.
3. Later: protected Pages release migration, offline application shell, installable PWA after lifecycle gates.
4. Optional packaging: Tauri, Capacitor, Steam, supporter edition, cloud sync—wrappers around browser engine.

No backend/account/cloud/multiplayer/leaderboard/monetization/native fork/localization/modding in initial v2. Browser saves/exports remain usable without network. A PWA caches application assets; it never owns canonical state or economy calculation.

