# Canonical state schema

Conceptual Phase 1 types (names may be refined without changing semantics):

```ts
type Id = string;
type GameNumber = string & { readonly __gameNumber: unique symbol };
type ResetLayer = "session" | "chapter" | "publication" | "campaign" | "never";

interface GameState {
  meta: { schemaVersion: number; contentVersion: string; buildId: string };
  time: { simulatedMs: number; lastWallClockMs: number; clockAnomalies: number };
  rng: { algorithm: "xoshiro128ss"; words: [number, number, number, number]; draws: number };
  resources: Record<Id, { amount: GameNumber; cap: GameNumber; reset: ResetLayer }>;
  attention: { capacity: number; allocations: Record<Id, number> };
  activities: Record<Id, { unlocked: boolean; enabled: boolean }>;
  projects: Record<Id, ProjectState>;
  projectSlot: { activeId: Id | null; queuedIds: Id[] };
  concepts: Record<Id, { discovered: boolean; validated: boolean }>;
  upgrades: Record<Id, { owned: boolean }>;
  milestones: Record<Id, { reached: boolean; reachedAtSimMs: number | null }>;
  achievements: Record<Id, { unlocked: boolean; unlockedAtSimMs: number | null }>;
  challenges: Record<Id, { status: "locked" | "available" | "active" | "complete" }>;
  automation: AutomationState;
  chapters: Record<Id, ChapterState>;
  publication: { published: Record<Id, PublicationRecord>; pendingChapterId: Id | null };
  prestige: null | { schemaVersion: number; extension: Record<string, unknown> };
  records: { totals: Record<Id, GameNumber>; events: DomainEventSummary[] };
  settings: SettingsState;
}
```

`ProjectState` stores status, approach, reserved inputs, work total/remaining, validated nodes, artifacts, and explicit stop reason. `AutomationState` stores completion behavior, one queue, per-resource reserves, stable rule IDs, and last rule trace. `ChapterState` stores status, Understanding, capstone, local flags, and archive reference. Settings include number notation, update rate, confirmations, motion, contrast, text scale, audio categories, and announcement verbosity.

Save-only metadata (generation, timestamp, session/writer ID, checksum) wraps but is not canonical game state. Derived rates, affordability, ETAs, visibility, and effect decompositions are selectors—not persisted truth.

Invariants: allocations are non-negative integers with sum ≤capacity; all IDs exist; amounts are valid finite adapter values; one active project; queued content reachable; reserved inputs balance; prerequisite DAG valid; Insight within cap; published chapter cannot remain active; no unowned effect source activates.

