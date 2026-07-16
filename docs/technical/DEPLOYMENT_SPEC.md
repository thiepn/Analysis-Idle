# Deployment specification

Phase 0 adds validation CI only and does not deploy/change Pages settings. Phase 1 adds `dev`, production `build`, local `preview`, PR artifact, and release-candidate validation. Vite base for the case-sensitive repository path is `/Analysis-Idle/`; assets use base-aware URLs.

The future Pages workflow checks out, installs with `npm ci`, runs all gates, builds `dist`, uploads an artifact, and deploys only from the protected release/integration policy chosen by the owner—not automatically from Phase 0 and never by rewriting the current v1 deployment. Preview builds are artifacts, not production.

PWA/service worker is deferred until save migrations, multi-tab ownership, cache namespace, downgrade handling, and update UX pass integration tests. Later: versioned caches, explicit “update ready,” save checkpoint before activation/reload, no forced automatic `skipWaiting`, offline shell only; economy offline math stays in engine.

Official basis: [Vite static/GitHub Pages deployment](https://vite.dev/guide/static-deploy.html). Actual repository Pages setting/live availability remains a documented audit limitation.

