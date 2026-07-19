import { describe, expect, it } from "vitest";
import { naturalNumbersContent, naturalNumbersIds } from "../../src/content";
import { evaluateCondition } from "../../src/engine/conditions/evaluate";
import { resolveActivityRate } from "../../src/engine/effects/resolve";
import { createInitialState } from "../../src/engine/state/game-state";
import type { ConditionDefinition } from "../../src/shared/contracts";

describe("conditions and effects", () => {
  it("evaluates nested serializable conditions with accessible descriptions", () => {
    const state = createInitialState(naturalNumbersContent);
    const result = evaluateCondition(
      {
        type: "all",
        text: { short: "Opening", accessible: "Meet opening requirements" },
        conditions: [
          {
            type: "constant",
            value: true,
            text: { short: "True", accessible: "Always true" },
          },
          {
            type: "resourceAtLeast",
            resourceId: naturalNumbersIds.PRECISION,
            amount: 40,
            text: { short: "40 Precision", accessible: "Own forty Precision" },
          },
        ],
      },
      state,
      naturalNumbersContent,
    );
    expect(result.met).toBe(true);
    expect(result.description).toContain("opening");
  });

  it("never applies an unowned upgrade effect and uses stable ownership", () => {
    const state = createInitialState(naturalNumbersContent);
    state.attention.allocations[naturalNumbersIds.FORMALIZE] = 1;
    const base = resolveActivityRate(
      naturalNumbersIds.FORMALIZE,
      state,
      naturalNumbersContent,
    );
    expect(base.rate).toBe(1.5);
    state.ownedUpgrades.push("nn.routine.notation_discipline" as never);
    const improved = resolveActivityRate(
      naturalNumbersIds.FORMALIZE,
      state,
      naturalNumbersContent,
    );
    expect(improved.rate).toBeCloseTo(1.8, 12);
    expect(improved.contributions.map((entry) => entry.effectId)).toEqual([
      "nn.effect.notation_discipline",
    ]);
  });

  it("keeps Technique visible as artifacts, never a stock", () => {
    const state = createInitialState(naturalNumbersContent);
    expect(Object.keys(state.resources).sort()).toEqual([
      "INTUITION",
      "PRECISION",
    ]);
    expect("technique" in state.resources).toBe(false);
    expect(Array.isArray(state.ownedArtifacts)).toBe(true);
  });

  it("covers every condition AST node without executable callbacks", () => {
    const state = createInitialState(naturalNumbersContent);
    state.projects["nn.project.zero_successor"]!.status = "completed";
    state.ownedUpgrades.push("nn.info.rate_ledger" as never);
    state.reachedMilestones.push("nn.milestone.zero_named" as never);
    state.recordedAchievements.push("nn.achievement.first_successor" as never);
    state.ownedArtifacts.push("nn.artifact.zero_successor" as never);
    state.understanding = 6 as never;
    state.insight = 1 as never;
    const text = { short: "fixture", accessible: "Condition fixture" };
    const conditions: ConditionDefinition[] = [
      { type: "constant", value: true, text },
      {
        type: "all",
        conditions: [{ type: "constant", value: true, text }],
        text,
      },
      {
        type: "any",
        conditions: [{ type: "constant", value: true, text }],
        text,
      },
      {
        type: "not",
        condition: { type: "constant", value: false, text },
        text,
      },
      {
        type: "resourceAtLeast",
        resourceId: naturalNumbersIds.PRECISION,
        amount: 1,
        text,
      },
      {
        type: "projectCompleted",
        projectId: "nn.project.zero_successor" as never,
        text,
      },
      { type: "upgradeOwned", upgradeId: "nn.info.rate_ledger" as never, text },
      {
        type: "milestoneReached",
        milestoneId: "nn.milestone.zero_named" as never,
        text,
      },
      {
        type: "achievementRecorded",
        achievementId: "nn.achievement.first_successor" as never,
        text,
      },
      {
        type: "chapterStatus",
        chapterId: naturalNumbersIds.CHAPTER,
        status: "active",
        text,
      },
      { type: "attentionCapacityAtLeast", amount: 3, text },
      {
        type: "techniqueArtifactOwned",
        artifactId: "nn.artifact.zero_successor" as never,
        text,
      },
      { type: "understandingAtLeast", amount: 6, text },
      { type: "insightAtLeast", amount: 1, text },
    ];
    expect(
      conditions.every(
        (condition) =>
          evaluateCondition(condition, state, naturalNumbersContent).met,
      ),
    ).toBe(true);
  });
});
