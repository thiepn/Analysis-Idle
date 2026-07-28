import { describe, expect, it } from "vitest";
import { naturalNumbersContent } from "../../src/content";
import { createInitialState } from "../../src/engine/state/game-state";
import { collectInvariantViolations } from "../../src/engine/state/invariants";

describe("canonical state invariants", () => {
  it("accepts the complete initial reference graph", () => {
    expect(
      collectInvariantViolations(
        createInitialState(naturalNumbersContent),
        naturalNumbersContent,
      ),
    ).toEqual([]);
  });

  it("rejects missing and extra state graph members and invalid runtime enums", () => {
    const state = createInitialState(naturalNumbersContent);
    delete state.resources.PRECISION;
    state.resources.GHOST = 1 as never;
    state.resourceReserves.INTUITION = Number.NaN as never;
    state.completionBehavior = "bogus" as never;
    state.assembledCapstoneEdges.push("missing.edge" as never);
    delete state.projects["nn.project.zero_successor"];
    const violations = collectInvariantViolations(state, naturalNumbersContent);
    expect(violations).toEqual(
      expect.arrayContaining([
        "required resource PRECISION is missing",
        "resource GHOST is not defined",
        "resource reserve INTUITION must be finite and non-negative",
        "completion behavior is invalid",
        "capstone edge missing.edge is undefined",
        "required project nn.project.zero_successor is missing",
      ]),
    );
  });

  it("rejects invalid IDs, approach, queue, Publication, schema, and RNG state", () => {
    const state = createInitialState(naturalNumbersContent);
    state.schemaVersion = 999;
    state.ownedUpgrades.push("unknown.upgrade" as never);
    state.projects["nn.project.zero_successor"]!.approachId =
      "UNKNOWN_APPROACH" as never;
    state.projectQueue.push("nn.project.zero_successor" as never);
    state.chapters["nn.chapter.natural_numbers"] = "published";
    state.rng.words = [0, 0, 0, 0];
    const violations = collectInvariantViolations(state, naturalNumbersContent);
    expect(violations).toEqual(
      expect.arrayContaining([
        "save schema version is unsupported",
        "owned upgrade unknown.upgrade is undefined",
        "project nn.project.zero_successor selected an undefined approach",
        "queued project nn.project.zero_successor has inconsistent status",
        "published chapter nn.chapter.natural_numbers lacks its Mastery artifact",
        "RNG state is invalid",
      ]),
    );
  });
});
