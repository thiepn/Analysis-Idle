import { describe, expect, it } from "vitest";
import { naturalNumbersContent, naturalNumbersIds } from "../../src/content";
import { advanceDeterministicTime } from "../../src/engine/time/advance";
import { createInitialState } from "../../src/engine/state/game-state";
import { runSimulation } from "../../tools/simulator/core";

describe("determinism", () => {
  it("replays identical simulator inputs to an identical digest", () => {
    const left = runSimulation({
      policy: "balanced",
      seed: 42,
      horizonSeconds: 7_200,
    });
    const right = runSimulation({
      policy: "balanced",
      seed: 42,
      horizonSeconds: 7_200,
    });
    expect(left.deterministicHash).toBe(right.deterministicHash);
    expect(left.finalState).toEqual(right.finalState);
    expect(left.eventLog).toEqual(right.eventLog);
  });

  it("is chunk invariant without intervening commands", () => {
    const base = createInitialState(naturalNumbersContent);
    base.attention.allocations[naturalNumbersIds.FORMALIZE] = 2;
    const oneChunk = advanceDeterministicTime(
      base,
      naturalNumbersContent,
      100_000,
      false,
    ).state;
    let manyChunks = base;
    for (let index = 0; index < 10; index += 1)
      manyChunks = advanceDeterministicTime(
        manyChunks,
        naturalNumbersContent,
        10_000,
        false,
      ).state;
    expect(manyChunks.resources).toEqual(oneChunk.resources);
    expect(manyChunks.logicalTimeMs).toBe(oneChunk.logicalTimeMs);
    expect(manyChunks.rng).toEqual(oneChunk.rng);
  });
});
