import type { GameContent } from "../../shared/contracts";
import type { GameState } from "./game-state";

export function collectInvariantViolations(
  state: GameState,
  content: GameContent,
): string[] {
  const violations: string[] = [];
  if (!Number.isSafeInteger(state.sequence) || state.sequence < 0)
    violations.push("sequence must be a non-negative safe integer");
  if (!Number.isFinite(state.logicalTimeMs) || state.logicalTimeMs < 0)
    violations.push("logical time must be finite and non-negative");
  for (const [id, value] of Object.entries(state.resources)) {
    if (!Number.isFinite(value) || value < 0)
      violations.push(`resource ${id} must be finite and non-negative`);
  }
  if (
    !Number.isInteger(state.attention.capacity) ||
    state.attention.capacity < 0 ||
    state.attention.capacity > content.configuration.attention.maximumCapacity
  ) {
    violations.push("attention capacity outside configured bounds");
  }
  const allocated = Object.values(state.attention.allocations).reduce(
    (sum, value) => sum + value,
    0,
  );
  if (
    Object.values(state.attention.allocations).some(
      (value) => !Number.isInteger(value) || value < 0,
    )
  )
    violations.push("attention allocations must be non-negative integers");
  for (const [id, ledger] of Object.entries(state.activityProduction)) {
    if (
      ![
        ledger.segmentElapsedMs,
        ledger.segmentProduced,
        ledger.ratePerSecond,
      ].every((value) => Number.isFinite(value) && value >= 0)
    )
      violations.push(`activity ${id} has an invalid production ledger`);
  }
  if (allocated > state.attention.capacity)
    violations.push("attention allocation exceeds capacity");
  if (
    Object.values(state.projects).filter(
      (project) => project.status === "active",
    ).length > 1
  )
    violations.push("dedicated project slot has multiple active projects");
  for (const project of Object.values(state.projects)) {
    if (!Number.isFinite(project.progress) || project.progress < 0)
      violations.push(`project ${project.id} has invalid progress`);
    if (
      ![project.reservedPrecision, project.reservedIntuition].every(
        (value) => Number.isFinite(value) && value >= 0,
      )
    )
      violations.push(`project ${project.id} has invalid reserved inputs`);
  }
  if (
    !Number.isFinite(state.insight) ||
    state.insight < 0 ||
    state.insight > content.configuration.insight.cap
  )
    violations.push("Insight outside configured bounds");
  if (!Number.isFinite(state.understanding) || state.understanding < 0)
    violations.push(
      "Understanding must be finite, non-negative, and monotonic",
    );
  if (new Set(state.projectQueue).size !== state.projectQueue.length)
    violations.push("project queue contains duplicates");
  return violations;
}

export function assertInvariants(state: GameState, content: GameContent): void {
  const violations = collectInvariantViolations(state, content);
  if (violations.length > 0)
    throw new Error(`GameState invariant violation: ${violations.join("; ")}`);
}
