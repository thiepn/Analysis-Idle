# Architecture decisions

## Frontend comparison

| Criterion | Plain TypeScript DOM | Preact | React |
|---|---|---|---|
| Runtime/bundle | Best | Small | Largest of candidates |
| Composition/disclosure | Manual infrastructure | Strong components | Strong components |
| Update safety | Depends on bespoke caches/diffs | Predictable component updates | Mature component updates |
| Tests/ecosystem | Bespoke | Adequate | Richest |
| Accessibility | Full control, all semantics manual | Standard semantic DOM/JSX | Standard semantic DOM/JSX |
| Solo maintenance | v1's 1,165-line UI demonstrates risk | Best balance | Reliable but broader scope |

Decision: **Preact**. Reconsider if Phase 1 requires extensive `preact/compat`, fails required accessibility/testing behavior, exceeds the measured interaction/bundle budget, or needs a justified React-only dependency. These are exit gates, not permission to switch on ecosystem preference alone. Plain DOM remains appropriate for disposable prototypes.

## Boundaries

- Engine: no DOM/Preact/storage/`Date.now`/timers/formatting; state + command + explicit time/RNG → state/events.
- Content: validated immutable definitions; no UI strings mixed with formulas without typed presentation fields.
- Platform: clocks, lifecycle, storage, tab lock, import/export.
- Persistence: envelope/validation/migration; never called from formulas/components.
- UI: selectors/view models/commands only.
- Simulator: same engine/content as production.

## Other locked ADRs

- npm and committed lockfile.
- Native number behind opaque adapter/canonical strings; migration gate before `1e280` or precision loss matters.
- Dual local persistence: namespaced rotating localStorage for the current canonical envelope, settings, writer lease, and fallback backups; IndexedDB for append-only backup history and replay/diagnostic logs when available. Cross-store recovery is generation-ordered and deterministic.
- GitHub Actions builds Pages with case-sensitive base `/Analysis-Idle/`; Phase 0 does not deploy.
- PWA after save/update/multi-tab integration tests.
- Global prestige extension point only; no implementation.
