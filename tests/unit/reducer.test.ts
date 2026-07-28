import { describe, expect, it } from "vitest";
import { naturalNumbersContent, naturalNumbersIds } from "../../src/content";
import { envelope, reduceCommand } from "../../src/engine";
import { resolveActivityRate } from "../../src/engine/effects/resolve";
import { gameNumber } from "../../src/engine/numbers/game-number";
import { createInitialState } from "../../src/engine/state/game-state";
import { dispatch } from "../helpers";

describe("typed reducer", () => {
  it("rejects stale commands without changing object identity", () => {
    const state = createInitialState(naturalNumbersContent);
    const result = reduceCommand(
      state,
      envelope(
        {
          type: "advanceTime",
          payload: { durationMs: 1_000, offline: false, safePolicy: false },
        },
        2,
      ),
      naturalNumbersContent,
    );
    expect(result.accepted).toBe(false);
    if (!result.accepted)
      expect(result.reason.code).toBe("STALE_COMMAND_SEQUENCE");
    expect(result.state).toBe(state);
    expect(result.events).toEqual([]);
  });

  it("enforces discrete Attention capacity", () => {
    const state = createInitialState(naturalNumbersContent);
    const accepted = reduceCommand(
      state,
      envelope(
        {
          type: "setAttention",
          payload: { activityId: naturalNumbersIds.FORMALIZE, allocation: 3 },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(accepted.accepted).toBe(true);
    const base = accepted.accepted ? accepted.state : state;
    const rejected = reduceCommand(
      base,
      envelope(
        {
          type: "setAttention",
          payload: { activityId: naturalNumbersIds.FORMALIZE, allocation: 4 },
        },
        2,
      ),
      naturalNumbersContent,
    );
    expect(rejected.accepted).toBe(false);
    if (!rejected.accepted)
      expect(rejected.reason.code).toBe("ATTENTION_CAPACITY_EXCEEDED");
  });

  it("reserves project inputs atomically and refunds them on cancellation", () => {
    let state = createInitialState(naturalNumbersContent);
    state.resources.PRECISION = gameNumber(100);
    state.resources.INTUITION = gameNumber(100);
    const before = structuredClone(state.resources);
    state = dispatch(state, {
      type: "startProject",
      payload: { projectId: "nn.project.zero_successor" as never },
    });
    const project = state.projects["nn.project.zero_successor"]!;
    expect(project.reservedPrecision).toBe(15);
    expect(state.resources.PRECISION).toBe((before.PRECISION ?? 0) - 15);
    state = dispatch(state, {
      type: "cancelProject",
      payload: { projectId: project.id },
    });
    expect(state.resources).toEqual(before);
    expect(state.projects[project.id]!.progress).toBe(0);
    expect(state.projects[project.id]!.reservedPrecision).toBe(0);
  });

  it("clamps cancellation refunds to the active resource caps", () => {
    let state = createInitialState(naturalNumbersContent);
    state.resources.PRECISION = gameNumber(100);
    state.resources.INTUITION = gameNumber(100);
    state = dispatch(state, {
      type: "startProject",
      payload: { projectId: "nn.project.zero_successor" as never },
    });
    state.resources.PRECISION = gameNumber(179);
    state.resources.INTUITION = gameNumber(179);
    state = dispatch(state, {
      type: "cancelProject",
      payload: { projectId: "nn.project.zero_successor" as never },
    });
    expect(state.resources.PRECISION).toBe(180);
    expect(state.resources.INTUITION).toBe(150);
  });

  it("preserves at least the configured floor without a switching exploit", () => {
    let state = createInitialState(naturalNumbersContent);
    state.resources.PRECISION = gameNumber(100);
    state.resources.INTUITION = gameNumber(100);
    state = dispatch(state, {
      type: "startProject",
      payload: { projectId: "nn.project.zero_successor" as never },
    });
    state = dispatch(state, {
      type: "advanceTime",
      payload: { durationMs: 10_000, offline: false, safePolicy: false },
    });
    const before = state.projects["nn.project.zero_successor"]!.progress;
    state = dispatch(state, {
      type: "switchProjectApproach",
      payload: {
        projectId: "nn.project.zero_successor" as never,
        approachId: naturalNumbersIds.CONSTRUCTIVE,
      },
    });
    const first = state.projects["nn.project.zero_successor"]!.progress;
    state = dispatch(state, {
      type: "switchProjectApproach",
      payload: {
        projectId: "nn.project.zero_successor" as never,
        approachId: naturalNumbersIds.FORMAL,
      },
    });
    expect(first).toBeGreaterThan(0);
    expect(state.projects["nn.project.zero_successor"]!.progress).toBeLessThan(
      before,
    );
    expect(
      state.projects["nn.project.zero_successor"]!.progress,
    ).toBeGreaterThanOrEqual(0);
  });

  it("resumes an exactly funded paused project without charging twice", () => {
    let state = createInitialState(naturalNumbersContent);
    state.resources.PRECISION = gameNumber(15);
    state.resources.INTUITION = gameNumber(0);
    state = dispatch(state, {
      type: "startProject",
      payload: { projectId: "nn.project.zero_successor" as never },
    });
    state = dispatch(state, {
      type: "pauseProject",
      payload: { projectId: "nn.project.zero_successor" as never },
    });
    const before = structuredClone(state.resources);
    state = dispatch(state, {
      type: "startProject",
      payload: { projectId: "nn.project.zero_successor" as never },
    });
    expect(state.resources).toEqual(before);
    expect(state.projects["nn.project.zero_successor"]!.status).toBe("active");
  });

  it("gates earned automation and validates runtime command enums", () => {
    const initial = createInitialState(naturalNumbersContent);
    const queue = reduceCommand(
      initial,
      envelope(
        {
          type: "queueProject",
          payload: { projectId: "nn.project.zero_successor" as never },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(queue.accepted).toBe(false);
    if (!queue.accepted) expect(queue.reason.code).toBe("PREREQUISITE_MISSING");

    const unlocked = structuredClone(initial);
    unlocked.ownedUpgrades.push("nn.automation.completion_rule" as never);
    const invalid = reduceCommand(
      unlocked,
      envelope(
        {
          type: "setCompletionBehavior",
          payload: { behavior: "bogus" as never },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(invalid.accepted).toBe(false);
    if (!invalid.accepted) expect(invalid.reason.code).toBe("INVALID_AMOUNT");
    expect(invalid.state).toBe(unlocked);
  });

  it("rejects fractional Insight charges", () => {
    const state = createInitialState(naturalNumbersContent);
    state.insight = gameNumber(1);
    state.ownedUpgrades.push("nn.active.insight_notebook" as never);
    const result = reduceCommand(
      state,
      envelope(
        {
          type: "spendInsight",
          payload: { amount: 0.5, purpose: "traceStep" },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(result.accepted).toBe(false);
    if (!result.accepted) expect(result.reason.code).toBe("INVALID_AMOUNT");
  });

  it("rejects Insight underflow", () => {
    const state = createInitialState(naturalNumbersContent);
    state.ownedUpgrades.push("nn.active.insight_notebook" as never);
    const result = reduceCommand(
      state,
      envelope(
        {
          type: "spendInsight",
          payload: { amount: 1, purpose: "traceStep" },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(result.accepted).toBe(false);
    if (!result.accepted)
      expect(result.reason.code).toBe("INSIGHT_INSUFFICIENT");
  });

  it("applies a bounded typed Insight intervention to remaining project work", () => {
    const initial = createInitialState(naturalNumbersContent);
    initial.insight = gameNumber(3);
    initial.ownedUpgrades.push("nn.active.insight_notebook" as never);
    initial.attention.allocations[naturalNumbersIds.FORMALIZE] = 1;
    initial.projects["nn.project.zero_successor"]!.status = "active";
    const spent = reduceCommand(
      initial,
      envelope(
        {
          type: "spendInsight",
          payload: { amount: 1, purpose: "strengthenBaseCase" },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(spent.accepted).toBe(true);
    if (!spent.accepted) return;
    expect(
      spent.state.projects["nn.project.zero_successor"]!.progress,
    ).toBeCloseTo(4.275, 12);
    expect(
      resolveActivityRate(
        naturalNumbersIds.FORMALIZE,
        spent.state,
        naturalNumbersContent,
      ).rate,
    ).toBeCloseTo(0.25, 12);
    const advanced = reduceCommand(
      spent.state,
      envelope(
        {
          type: "advanceTime",
          payload: { durationMs: 60_000, offline: false, safePolicy: false },
        },
        2,
      ),
      naturalNumbersContent,
    );
    expect(advanced.accepted).toBe(true);
    if (!advanced.accepted) return;
    expect(advanced.state.insightModifiers).toEqual([]);
    expect(advanced.state.insight).toBe(2);
  });

  it("gates Insight ownership, its ceiling, and repeated intervention", () => {
    const base = createInitialState(naturalNumbersContent);
    base.insight = gameNumber(3);
    base.projects["nn.project.zero_successor"]!.status = "active";
    const locked = reduceCommand(
      base,
      envelope(
        {
          type: "spendInsight",
          payload: { amount: 1, purpose: "traceStep" },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(locked.accepted).toBe(false);
    if (!locked.accepted)
      expect(locked.reason.code).toBe("PREREQUISITE_MISSING");

    base.ownedUpgrades.push("nn.active.insight_notebook" as never);
    const overCeiling = reduceCommand(
      base,
      envelope(
        {
          type: "spendInsight",
          payload: { amount: 3, purpose: "traceStep" },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(overCeiling.accepted).toBe(false);
    const once = dispatch(base, {
      type: "spendInsight",
      payload: { amount: 1, purpose: "traceStep" },
    });
    const twice = reduceCommand(
      once,
      envelope(
        {
          type: "spendInsight",
          payload: { amount: 1, purpose: "traceStep" },
        },
        once.sequence + 1,
      ),
      naturalNumbersContent,
    );
    expect(twice.accepted).toBe(false);
  });

  it("reveals downstream requirements without accelerating project work", () => {
    const state = createInitialState(naturalNumbersContent);
    state.insight = gameNumber(1);
    state.ownedUpgrades.push("nn.active.insight_notebook" as never);
    state.projects["nn.project.zero_successor"]!.status = "active";
    const result = reduceCommand(
      state,
      envelope(
        {
          type: "spendInsight",
          payload: { amount: 1, purpose: "revealDownstream" },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.projects["nn.project.zero_successor"]!.progress).toBe(
      0,
    );
    expect(result.state.insightReveals).toEqual(["nn.project.zero_successor"]);
  });
});
