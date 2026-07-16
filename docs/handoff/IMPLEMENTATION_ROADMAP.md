# Implementation roadmap and scope audit

## Phase 1 required

Production project scaffold; engine/state/commands/selectors; number/RNG/effect/condition adapters; content schemas/NN fixtures; simulator/policies/reports; preliminary event-driven offline; save envelope/migrations/legacy detection; CI; minimal accessible debug UI.

## Phase 2 required

Complete Natural Numbers production gameplay/UI, final balance pass, Publication transition, automation stages 1–4, active Insight, return summary, responsive dependency map, accessibility/browser/performance validation, production-quality save UX.

## Full release required

Finite campaign chapters with unique mechanics and Publications; campaign ending; stable deployment/update path; final coherent art identity; essential audio feedback or intentional no-audio decision; save/export recovery; mastery/replay role; release/browser/AT gates.

## Later expansion

Global prestige only if unique purpose proven; post-Publication challenges; persistent campaign identities; PWA; audio/music expansion; optional cloud sync; Tauri/Capacitor/Steam/supporter packaging; localization/modding only with separate scope proof.

## Rejected initial scope

Backend accounts, cloud dependency, multiplayer, leaderboards, ads, premium currency, daily/seasonal FOMO, native rewrite, server anti-cheat, mandatory clicking, power achievements, automation branch, multiplier-only chapters.

## Branch sequence

After Phase 0 passes, create a scoped Phase 1 branch from accepted `v2/integration` (recommended `phase/01-engine-foundation`), open review into `v2/integration`, and keep `main` as v1 until an owner-approved release migration.

