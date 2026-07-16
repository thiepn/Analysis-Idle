# Save and data-integrity specification

## Namespace and legacy boundary

Primary keys:

```text
analysis-idle:v2:save:staging
analysis-idle:v2:save:current
analysis-idle:v2:save:backup:0..2
analysis-idle:v2:settings
analysis-idle:v2:writer-lease
```

Legacy `mathIdleSave` is detected read-only. v2 never overwrites or silently converts it because economies are semantically incompatible; offer “open legacy game” and legacy raw export, then start a distinct v2 save.

## Envelope

`{format, schemaVersion, contentVersion, buildId, generation, savedAtMs, sessionId, state, checksum}`. Game numbers serialize as validated canonical strings. Checksum detects accidental corruption only—not cheating/security. Future versions are rejected safely.

## Write/load lifecycle

1. Validate canonical state and encode envelope.
2. Write/re-read/validate staging inside `try/catch`.
3. Rotate current to three backups, promote staging, confirm read.
4. On load, validate all candidates and choose highest valid generation; migrate sequentially before engine use; keep last-known-good.
5. Debounce roughly 1s after commands, hard maximum 10s; Publication/import saves immediately; passive simulation checkpoints ~30s (`PROVISIONAL`).
6. Checkpoint when document becomes hidden; `pagehide` is fallback. Never depend on `unload`.

Import parses as data, limits size, validates envelope/schema/content IDs/numbers, previews overwrite/generation, preserves current as backup, and never executes content. Export uses a versioned file and no secrets.

## Multiple tabs and clock anomalies

One writer/simulator uses Web Locks where available; BroadcastChannel notifies spectator tabs; a timestamped lease plus `storage` event is fallback. Takeover is explicit after lease expiry. On bfcache restore, recheck writer and elapsed time. Rollback clocks yield zero negative offline time; forward anomalies remain capped and logged.

`localStorage` is synchronous and appropriate for a small envelope; move canonical saves only if size exceeds 250KiB, measured writes exceed budget, or structured history/logs require IndexedDB. IndexedDB receives replay/local analytics first. Sources: [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event).

