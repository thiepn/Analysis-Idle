# Offline progression specification

## Model

Use deterministic bounded event-driven catch-up: advance to the next event, resolve automatic effects, stop at an unresolved decision unless a configured safe policy permits continuation. Never replay every display tick.

| Event | Default |
|---|---|
| Project completion | Start queued project only if completion behavior, prerequisites, inputs, and reserves pass; else stop |
| Upgrade affordability | Continue production; never auto-buy without a rule |
| Activity/approach unlock | Continue existing allocation; defer choice |
| Resource cap | Stop lane unless configured reroute policy exists |
| Milestone | Grant and summarize; continue |
| Capstone/Publication/prestige availability | Stop relevant progression |
| Automation failure | Stop affected lane and record reason |

Credit windows are configuration: first 12 hours at 100%, then 25% through 72 hours (`PROVISIONAL`); no credit afterward. Phase 1 comparisons must include 4h/24h, 8h/48h, 12h/72h, and 24h/168h full/maximum windows under the same policies before release. Clock rollback yields zero negative time and a warning; extreme forward jumps use the same cap and record anomaly metadata.

Return summary is one screen: elapsed time; credited/effective time; policy; gains; projects; milestones; decisions deferred; caps; failed rules; and next action. It restores focus to that action. No cascade of dialogs.
