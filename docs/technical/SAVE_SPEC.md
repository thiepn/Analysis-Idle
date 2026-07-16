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

IndexedDB database `analysis-idle:v2` uses versioned stores `save-backups` (append-only valid envelopes keyed by generation) and `replay-log` (ordered diagnostic/replay records keyed by session and sequence). It is used when available; failure or denial must not make the current game unsavable.

Legacy `mathIdleSave` is detected read-only. v2 never overwrites or silently converts it because economies are semantically incompatible; offer “open legacy game” and legacy raw export, then start a distinct v2 save.

## Envelope

`{format, schemaVersion, contentVersion, buildId, generation, savedAtMs, sessionId, state, checksum}`. Game numbers serialize as validated canonical strings. Checksum detects accidental corruption only—not cheating/security. Future versions are rejected safely.

## Write/load lifecycle

1. Validate canonical state and encode envelope.
2. Write/re-read/validate staging inside `try/catch`.
3. Rotate current to three localStorage fallback backups, promote staging, confirm read.
4. After current is confirmed, append the validated envelope to IndexedDB backup history when available; failure is recorded and does not invalidate the confirmed current save.
5. On load, validate localStorage candidates and eligible IndexedDB backup envelopes, then choose the highest valid generation using deterministic tie rules; migrate sequentially before engine use and keep last-known-good. Current localStorage wins an equal-generation tie unless its checksum/envelope is invalid.
6. Debounce roughly 1s after commands, hard maximum 10s; Publication/import saves immediately; passive simulation checkpoints ~30s (`PROVISIONAL`).
7. Checkpoint when document becomes hidden; `pagehide` is fallback. Never depend on `unload`.

Import parses as data, limits size, validates envelope/schema/content IDs/numbers, previews overwrite/generation, preserves current as backup, and never executes content. Export uses a versioned file and no secrets.

## Multiple tabs and clock anomalies

One writer/simulator uses Web Locks where available; BroadcastChannel notifies spectator tabs; a timestamped lease plus `storage` event is fallback. Takeover is explicit after lease expiry. On bfcache restore, recheck writer and elapsed time. Rollback clocks yield zero negative offline time; forward anomalies remain capped and logged.

`localStorage` is synchronous and appropriate for a small current envelope and immediate fallback recovery. IndexedDB supplies append-only backup history and replay/diagnostic storage without making it the sole canonical dependency. Reconsider sole-canonical storage only if size exceeds 250KiB, measured localStorage writes exceed budget, or recovery tests demonstrate a safer migration. Sources: [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event).
