# Save and Recovery UX Report

Generated from implementation SHA `c452b7dc4c4f4605cbb4ebf40474b14fcc02557e` on branch `phase/02-natural-numbers-vertical-slice`.

The UI shows saved/dirty/saving/error state, generation, writer ownership, recovery source, export, import preview, and legacy-v1 detection. Import and manual recovery show source/version/generation/timestamp metadata before replacement; invalid/corrupt/future/oversized saves receive typed live-region errors. A tab begins passive, and a lease takeover reloads the newest validated local/IndexedDB generation before enabling simulation. Cross-session stale generations are rejected before rotation. Rotated local backups, IndexedDB history, page-hide saving, a 15-second writer lease, and the existing Phase 1 migration path are retained. Save payloads use the isolated `analysis-idle:v2` namespace and a 256000-byte import ceiling.
