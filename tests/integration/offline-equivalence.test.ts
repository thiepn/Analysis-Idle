import { describe, expect, it } from "vitest";
import { naturalNumbersContent, naturalNumbersIds } from "../../src/content";
import { envelope, reduceCommand } from "../../src/engine";
import { createInitialState } from "../../src/engine/state/game-state";
import { gameNumber } from "../../src/engine/numbers/game-number";
import { advanceOffline } from "../../src/platform/time/offline";

describe("online/offline equivalence", () => {
  it("produces the same economy for an equivalent credited window", () => {
    const base = createInitialState(naturalNumbersContent);
    base.attention.allocations[naturalNumbersIds.FORMALIZE] = 2;
    const online = reduceCommand(
      base,
      envelope(
        {
          type: "advanceTime",
          payload: { durationMs: 60_000, offline: false, safePolicy: false },
        },
        1,
      ),
      naturalNumbersContent,
    );
    const offline = advanceOffline(base, naturalNumbersContent, 60_000, true);
    expect(online.accepted).toBe(true);
    if (!online.accepted) return;
    expect(offline.state.resources).toEqual(online.state.resources);
    expect(offline.state.projects).toEqual(online.state.projects);
    expect(offline.state.logicalTimeMs).toBe(online.state.logicalTimeMs);
    expect(offline.state.rng).toEqual(online.state.rng);
  });

  it("advances to and stops at an unresolved completion decision", () => {
    const base = createInitialState(naturalNumbersContent);
    base.projects["nn.project.zero_successor"]!.status = "active";
    const result = advanceOffline(base, naturalNumbersContent, 60_000, false);
    expect(result.stoppedForDecision).toBe(true);
    expect(result.creditedMs).toBe(42_750);
    expect(result.state.projects["nn.project.zero_successor"]!.status).toBe(
      "completed",
    );
    expect(result.state.logicalTimeMs).toBe(42_750);
    expect(result.policyTrace[0]).toMatch(/Stopped/);
  });

  it("uses an authorized saved queue policy but never invents a new choice", () => {
    const base = createInitialState(naturalNumbersContent);
    base.resources.PRECISION = gameNumber(100);
    base.resources.INTUITION = gameNumber(100);
    base.ownedUpgrades.push(
      "nn.automation.queue_one" as never,
      "nn.automation.completion_rule" as never,
    );
    base.completionBehavior = "startNextFunded";
    base.projects["nn.project.zero_successor"]!.status = "active";
    base.projects["nn.project.zero_successor"]!.progress = gameNumber(40);
    base.projects["nn.project.peano_frame"]!.status = "queued";
    base.projectQueue = ["nn.project.peano_frame" as never];
    const result = advanceOffline(base, naturalNumbersContent, 60_000, true);
    expect(result.stoppedForDecision).toBe(false);
    expect(result.creditedMs).toBe(60_000);
    expect(result.state.projects["nn.project.zero_successor"]!.status).toBe(
      "completed",
    );
    expect(result.state.projects["nn.project.peano_frame"]!.status).toBe(
      "active",
    );
    expect(result.state.automationTrace.at(-1)?.result).toBe("accepted");
  });

  it("applies the full, tail, and maximum credit windows once per absence", () => {
    const base = createInitialState(naturalNumbersContent);
    base.attention.allocations[naturalNumbersIds.FORMALIZE] = 0;
    const day = advanceOffline(
      base,
      naturalNumbersContent,
      24 * 3_600_000,
      false,
    );
    expect(day.creditedMs).toBe(15 * 3_600_000);
    expect(day.discardedMs).toBe(0);
    const veryLong = advanceOffline(
      base,
      naturalNumbersContent,
      100 * 3_600_000,
      false,
    );
    expect(veryLong.creditedMs).toBe(27 * 3_600_000);
    expect(veryLong.discardedMs).toBe(28 * 3_600_000);
  });

  it("stops exactly when an allocated lane reaches its resource cap", () => {
    const base = createInitialState(naturalNumbersContent);
    base.resources.PRECISION = gameNumber(179.9);
    const result = advanceOffline(base, naturalNumbersContent, 60_000, false);
    expect(result.stoppedForDecision).toBe(true);
    expect(result.state.resources.PRECISION).toBe(180);
    expect(result.creditedMs).toBeGreaterThan(0);
    expect(result.creditedMs).toBeLessThan(60_000);
  });

  it("applies milestone effects at the exact completion boundary", () => {
    const base = createInitialState(naturalNumbersContent);
    base.attention.allocations[naturalNumbersIds.FORMALIZE] = 3;
    base.resources.PRECISION = gameNumber(179.9);
    base.projects["nn.project.addition"]!.status = "completed";
    const multiplication = base.projects["nn.project.multiplication"]!;
    multiplication.status = "active";
    multiplication.progress = gameNumber(399);
    const result = reduceCommand(
      base,
      envelope(
        {
          type: "advanceTime",
          payload: { durationMs: 10_000, offline: false, safePolicy: false },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.reachedMilestones).toContain(
      "nn.milestone.operations_built",
    );
    expect(result.state.resources.PRECISION).toBeGreaterThan(180);
  });
});
