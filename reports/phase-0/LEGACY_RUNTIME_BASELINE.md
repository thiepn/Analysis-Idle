# Legacy runtime baseline

## Scope and environment

The preserved v1 commit `239d75fd0e223e91703e261d2196953a896609cb` was served unchanged from a local static server and exercised in the Codex in-app Chromium browser on 2026-07-16. The test used a clean origin for startup captures and a separate origin for the extended run, so the screenshots are not contaminated by the purchase made during runtime observation.

The requested browser viewport overrides were 1440 × 900, 768 × 1024, and 390 × 844. Native visible-region PNGs exclude browser chrome and have respective pixel dimensions 1425 × 891, 753 × 1004, and 375 × 812. The browser layout was evaluated at the requested overrides.

## Observed startup

- Page loaded without a console error.
- Starting Understanding: `10`.
- Starting production: `0/s`.
- Displayed chapter: `Natural Numbers`.
- The first and only immediately affordable action was `Write x1`, costing 10 Understanding.
- Locked buildings, research, and achievements were already present in the accessible tree, confirming the progressive-disclosure problem documented in the repository audit.
- `Tabula Rasa` was already unlocked at startup; its small reward rendered as `x1.00`, masking the underlying `x1.003` value.

## First purchase and extended observation

`Write x1` resolved to one enabled button and was activated once. After approximately three seconds the status region reported 13 Understanding and 4.1/s from Definitions. The tab then remained live for more than nine minutes. At the final observation it reported:

- Understanding: `2.37K`;
- production: `4.1/s`;
- highest rate: `4.1/s`;
- chapter: `Natural Numbers`;
- console errors: `0`.

The increase is consistent with the displayed rate. This is a runtime smoke observation, not a frame-time benchmark or balance proof.

## Save creation and offline calculation

Source and runtime inspection agree that v1 writes a full JSON snapshot to the generic local-storage key `mathIdleSave`, autosaves every ten seconds, and has no checksum, rotating backups, export/import envelope, future-version rejection, or explicit v1/v2 namespace. State initializes as save version 4 while the writer declares version 5.

Offline progress applies all elapsed time at the saved current rate. It has no cap, diminishing window, event replay, unresolved-decision stop, or safe-policy trace. Those behaviors are preserved as v1 facts and explicitly rejected as v2 architecture.

## Basic performance profile

No exception or visible freeze occurred during the extended run. Static inspection nevertheless identifies material scaling risks: the request-animation-frame loop is coupled to economy updates; the complete visible UI is refreshed each frame; bulk purchase can iterate up to 10,000 times per visible building per frame; and UI orchestration is concentrated in a 1,165-line module. The baseline therefore establishes functional startup and short-run production, not acceptable long-session performance.

## Screenshots

- [Desktop](./screenshots/legacy/legacy-1440x900.jpg)
- [Tablet](./screenshots/legacy/legacy-768x1024.jpg)
- [Mobile portrait](./screenshots/legacy/legacy-390x844.jpg)

## Result

Legacy runtime smoke: **PASS**. Architectural and accessibility findings remain documented in `CURRENT_REPOSITORY_AUDIT.md` and `ACCESSIBILITY_AUDIT.md`; v1 files were not modified to address them.
