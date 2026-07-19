# Save and migration report

All 21 required save/recovery fixtures pass. The exact v2 namespace uses staging, current, three local fallbacks, append-only IndexedDB save/replay/diagnostic stores, and deterministic highest-generation recovery with current winning equal-generation ties. Accepted-command saves use a one-second debounce with a ten-second hard maximum; hidden visibility and pagehide trigger checkpoints. Numbers serialize as validated canonical strings. Future schemas, incompatible apps, malformed/oversized imports, invalid checksums, partial writes, clock anomalies, and multi-tab conflicts reject safely. Legacy `mathIdleSave` is detected read-only and never converted or deleted. Checksums detect accidents, not cheating.

Machine data: `data/save-fixtures.json`.
