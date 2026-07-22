import { describe, expect, it } from "vitest";
import { runSimulation } from "../../tools/simulator/core";
import { policyNames } from "../../tools/simulator/policies";

describe("headless simulator policies", () => {
  it.each(policyNames)("runs %s without invariant violations", (policy) => {
    const result = runSimulation({ policy, horizonSeconds: 10_800 });
    expect(result.invariantViolations).toEqual([]);
    expect(result.commandLog.length).toBeGreaterThan(0);
    expect(result.deterministicHash).toHaveLength(64);
  });

  it("keeps policies isolated behind commands", () => {
    const result = runSimulation({
      policy: "weakButPlausible",
      horizonSeconds: 1_000,
    });
    expect(result.finalState.sequence).toBe(
      result.commandLog.filter((entry) => entry.accepted).length,
    );
  });

  it("uses explicit replayable policy RNG for random-reasonable choices", () => {
    const result = runSimulation({
      policy: "randomReasonable",
      horizonSeconds: 2_000,
      seed: 77,
    });
    const replay = runSimulation({
      policy: "randomReasonable",
      horizonSeconds: 2_000,
      seed: 77,
    });
    expect(result.policyRng.draws).toBeGreaterThan(0);
    expect(result.policyRng).toEqual(replay.policyRng);
    expect(result.deterministicHash).toBe(replay.deterministicHash);
  });
});
