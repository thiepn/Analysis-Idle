import { describe, expect, it } from "vitest";
import { naturalNumbersContent } from "../../src/content";
import { envelope, reduceCommand } from "../../src/engine";
import { createInitialState } from "../../src/engine/state/game-state";
import { runSimulation } from "../../tools/simulator/core";

describe("integrated lifecycle", () => {
  it("completes the fixture and performs the exact Publication boundary", () => {
    const result = runSimulation({ policy: "balanced", horizonSeconds: 7_200 });
    expect(result.finalState.records.completedProjects).toBe(12);
    expect(result.finalState.records.publications).toBe(1);
    expect(result.finalState.resources.PRECISION).toBe(0);
    expect(result.finalState.resources.INTUITION).toBe(0);
    expect(result.finalState.attention.allocations).toEqual({});
    expect(
      Object.values(result.finalState.projects).every(
        (project) => project.status === "cancelled",
      ),
    ).toBe(true);
    expect(result.finalState.activityEnabled.FORMALIZE).toBe(false);
    expect(result.finalState.activityEnabled.EXPLORE).toBe(false);
    expect(result.finalState.resourceReserves).toEqual({
      PRECISION: 0,
      INTUITION: 0,
    });
    expect(result.finalState.ownedUpgrades).not.toContain(
      "nn.routine.notation_discipline",
    );
    expect(result.finalState.masteryArtifacts).toContain(
      "mastery.induction_framework",
    );
    expect(
      result.eventLog.some((event) => event.type === "chapterPublished"),
    ).toBe(true);
    expect(
      result.eventLog.some(
        (event) => event.type === "insightGained" && event.overflow > 0,
      ),
    ).toBe(true);
    const postPublication = reduceCommand(
      result.finalState,
      envelope(
        {
          type: "setAttention",
          payload: { activityId: "FORMALIZE" as never, allocation: 1 },
        },
        result.finalState.sequence + 1,
      ),
      naturalNumbersContent,
    );
    expect(postPublication.accepted).toBe(false);
    expect(postPublication.state.resources.PRECISION).toBe(0);
  });

  it("rejects an unavailable Publication idempotently", () => {
    const state = createInitialState(naturalNumbersContent);
    const command = envelope(
      {
        type: "publishChapter",
        payload: { chapterId: "nn.chapter.natural_numbers" as never },
      },
      1,
    );
    const result = reduceCommand(state, command, naturalNumbersContent);
    expect(result.accepted).toBe(false);
    expect(result.state).toBe(state);
    if (!result.accepted)
      expect(result.reason.code).toBe("PUBLICATION_UNAVAILABLE");
  });
});
