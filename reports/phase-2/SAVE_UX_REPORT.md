# Save and Recovery UX Report

Generated from implementation SHA `12c59cecc03fe71d58f1d8cfe7f6e556688d0bf3` on branch `phase/02-natural-numbers-vertical-slice`.

The UI shows saved/dirty/saving/error state, generation, writer ownership, recovery source, export, import preview, and legacy-v1 detection. Import is previewed before replacement; invalid/corrupt/future/oversized saves receive typed errors. Rotated local backups, IndexedDB history, page-hide saving, a 15-second writer lease, and the existing Phase 1 migration path are retained. Save payloads use the isolated `analysis-idle:v2` namespace and a 256000-byte import ceiling.
