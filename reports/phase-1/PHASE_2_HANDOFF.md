# Phase 2 handoff

Read `AGENTS.md`, locked research decisions, Phase 0 acceptance/reconciliation, this report set, and the engine/content/save contracts before implementation. Phase 2 should consume commands/selectors and validated content; it must not move formulas into UI or reinterpret v1 saves.

Still configurable values:

```json
{
  "attention": {
    "startingCapacity": 3,
    "maximumCapacity": 4,
    "activityExponent": 0.8
  },
  "insight": {
    "cap": 3,
    "sustainedTargetMin": 0.1,
    "sustainedTargetMax": 0.15,
    "ceiling": 0.2,
    "modifierPerInsight": 0.1,
    "modifierDurationSeconds": 60
  },
  "automation": {
    "queueCapacity": 1
  },
  "offline": {
    "fullEfficiencyHours": 12,
    "tailEfficiency": 0.25,
    "maximumCreditedHours": 72
  },
  "pacing": {
    "firstPublicationMinMinutes": 60,
    "firstPublicationMaxMinutes": 120,
    "campaignMinHours": 30,
    "campaignMaxHours": 50
  },
  "projects": {
    "approachSwitchPreservation": 0.9,
    "baseSpeedPerSecond": 1
  }
}
```

Deferred: polished Natural Numbers player UX, reviewed rich math rendering, later chapters, prestige, PWA/offline shell, final art/audio, telemetry, and playtest-derived tuning.

Readiness: **READY**. Open an independent review against `phase/01-deterministic-engine`; after acceptance merge into `v2/integration`, then create the Phase 2 branch.
