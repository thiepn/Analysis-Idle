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
          payload: { activityId: naturalNumbersIds.EXPLORE, allocation: 1 },
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

  it("preserves at least the configured floor without a switching exploit", () => {
    let state = createInitialState(naturalNumbersContent);
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

  it("rejects Insight underflow", () => {
    const state = createInitialState(naturalNumbersContent);
    const result = reduceCommand(
      state,
      envelope(
        { type: "spendInsight", payload: { amount: 1, purpose: "test" } },
        1,
      ),
      naturalNumbersContent,
    );
    expect(result.accepted).toBe(false);
    if (!result.accepted)
      expect(result.reason.code).toBe("INSIGHT_INSUFFICIENT");
  });

  it("applies a bounded Insight modifier and expires it at a logical-time boundary", () => {
    const initial = createInitialState(naturalNumbersContent);
    initial.insight = gameNumber(3);
    initial.attention.allocations[naturalNumbersIds.FORMALIZE] = 1;
    const spent = reduceCommand(
      initial,
      envelope(
        {
          type: "spendInsight",
          payload: { amount: 3, purpose: "bounded test modifier" },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(spent.accepted).toBe(true);
    if (!spent.accepted) return;
    expect(
      resolveActivityRate(
        naturalNumbersIds.FORMALIZE,
        spent.state,
        naturalNumbersContent,
      ).rate,
    ).toBeCloseTo(1.8, 12);
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
    expect(
      advanced.events.some((event) => event.type === "insightModifierExpired"),
    ).toBe(true);
  });
});
