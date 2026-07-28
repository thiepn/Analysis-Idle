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

  it("is chunk invariant for fractional project speed and resource thresholds", () => {
    const content = structuredClone(naturalNumbersContent);
    content.configuration.projects.baseSpeedPerSecond = 1 / 3;
    const effectOwner = content.upgrades.find(
      (upgrade) => upgrade.id === "nn.routine.notation_discipline",
    )!;
    effectOwner.effects[0]!.activation = {
      type: "resourceAtLeast",
      resourceId: naturalNumbersIds.PRECISION,
      amount: 1,
      text: { short: "One Precision", accessible: "Reach one Precision" },
    };
    effectOwner.effects[0]!.magnitude = 2;
    const base = createInitialState(content);
    base.attention.allocations[naturalNumbersIds.FORMALIZE] = 1;
    base.projects["nn.project.zero_successor"]!.status = "active";
    base.ownedUpgrades.push(effectOwner.id);
    const one = advanceDeterministicTime(base, content, 10_000, false).state;
    let partitioned = base;
    for (let index = 0; index < 10_000; index += 1)
      partitioned = advanceDeterministicTime(
        partitioned,
        content,
        1,
        false,
      ).state;
    expect(partitioned.resources).toEqual(one.resources);
    expect(partitioned.projects).toEqual(one.projects);
    expect(partitioned.logicalTimeMs).toBe(one.logicalTimeMs);
  });
});
