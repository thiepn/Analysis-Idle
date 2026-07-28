import { describe, expect, it } from "vitest";
import { naturalNumbersContent, naturalNumbersIds } from "../../src/content";
import { evaluateCondition } from "../../src/engine/conditions/evaluate";
import {
  resolveActivityRate,
  resolveProjectRequirements,
  resolveProjectSpeed,
} from "../../src/engine/effects/resolve";
import { selectArtifactCompatibility } from "../../src/engine/selectors";
import { createInitialState } from "../../src/engine/state/game-state";
import { advanceDeterministicTime } from "../../src/engine/time/advance";
import type {
  ApproachId,
  ConditionDefinition,
} from "../../src/shared/contracts";

describe("conditions and effects", () => {
  it("evaluates nested serializable conditions with accessible descriptions", () => {
    const state = createInitialState(naturalNumbersContent);
    state.resources.PRECISION = 40 as never;
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
    expect(base.rate).toBe(0.25);
    state.ownedUpgrades.push("nn.routine.notation_discipline" as never);
    const improved = resolveActivityRate(
      naturalNumbersIds.FORMALIZE,
      state,
      naturalNumbersContent,
    );
    expect(improved.rate).toBeCloseTo(0.3, 12);
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

  it("keeps Technique typed, owned, removable, and free of hidden global speed", () => {
    const state = createInitialState(naturalNumbersContent);
    const artifact = "nn.artifact.primitive_recursion" as never;
    const matchingProject = "nn.project.addition" as never;
    state.ownedUpgrades.push("nn.keystone.recursion_template" as never);
    state.ownedArtifacts.push(artifact);
    expect(
      selectArtifactCompatibility(
        naturalNumbersContent,
        artifact,
        matchingProject,
      ),
    ).toBe(true);
    expect(
      resolveProjectSpeed(
        "nn.project.well_ordering" as never,
        state,
        naturalNumbersContent,
      ),
    ).toBe(1);
    state.ownedArtifacts = [];
    state.techniqueRecords = {};
    expect(state.ownedArtifacts.includes(artifact)).toBe(false);
    expect(
      resolveProjectSpeed(
        "nn.project.well_ordering" as never,
        state,
        naturalNumbersContent,
      ),
    ).toBe(1);
  });

  it("records approach-specific Technique output without creating a stock", () => {
    const completeWith = (approachId: ApproachId) => {
      const state = createInitialState(naturalNumbersContent);
      const project = state.projects["nn.project.zero_successor"]!;
      project.status = "active";
      project.approachId = approachId;
      const approach = naturalNumbersContent.approaches.find(
        (entry) => entry.id === approachId,
      )!;
      return advanceDeterministicTime(
        state,
        naturalNumbersContent,
        45 * approach.workMultiplier * 1_000,
        false,
      ).state.techniqueRecords["nn.artifact.zero_successor"]!;
    };
    expect(completeWith(naturalNumbersIds.FORMAL).outputKind).toBe("lemma");
    expect(completeWith(naturalNumbersIds.CONSTRUCTIVE).outputKind).toBe(
      "template",
    );
  });

  it("gives lemma, reveal, and template outputs distinct downstream effects", () => {
    const definition = naturalNumbersContent.projects.find(
      (project) => project.id === "nn.project.peano_frame",
    )!;
    const baseline = createInitialState(naturalNumbersContent);
    const base = resolveProjectRequirements(
      definition,
      naturalNumbersIds.FORMAL,
      baseline,
      naturalNumbersContent,
    );
    const withKind = (outputKind: "lemma" | "reveal" | "template") => {
      const state = structuredClone(baseline);
      state.ownedArtifacts.push("nn.artifact.zero_successor" as never);
      state.techniqueRecords["nn.artifact.zero_successor"] = {
        artifactId: "nn.artifact.zero_successor" as never,
        sourceProjectId: "nn.project.zero_successor" as never,
        approachId:
          outputKind === "lemma"
            ? naturalNumbersIds.FORMAL
            : outputKind === "reveal"
              ? naturalNumbersIds.EXPLORATORY
              : naturalNumbersIds.CONSTRUCTIVE,
        outputKind,
        acquiredAtLogicalTimeMs: 0,
      };
      return resolveProjectRequirements(
        definition,
        naturalNumbersIds.FORMAL,
        state,
        naturalNumbersContent,
      );
    };
    expect(withKind("lemma").precision).toBeCloseTo(base.precision * 0.9);
    expect(withKind("reveal").intuition).toBeCloseTo(base.intuition * 0.9);
    expect(withKind("template").work).toBeCloseTo(base.work * 0.9);
  });

  it("adds percentages within a stacking group and requires method ownership", () => {
    const content = structuredClone(naturalNumbersContent);
    const owner = content.upgrades.find(
      (upgrade) => upgrade.id === "nn.routine.notation_discipline",
    )!;
    const base = structuredClone(owner.effects[0]!);
    owner.effects = [
      {
        ...base,
        id: "test.group.20" as never,
        operation: "groupAddPercent",
        magnitude: 0.2,
      },
      {
        ...base,
        id: "test.group.30" as never,
        operation: "groupAddPercent",
        magnitude: 0.3,
      },
      {
        ...base,
        id: "test.method" as never,
        source: { kind: "method", id: "nn.artifact.zero_successor" },
        operation: "flatAdd",
        magnitude: 0.1,
        stackingGroup: "method.owned",
      },
    ];
    const state = createInitialState(content);
    state.attention.allocations[naturalNumbersIds.FORMALIZE] = 1;
    state.ownedUpgrades.push(owner.id);
    expect(
      resolveActivityRate(naturalNumbersIds.FORMALIZE, state, content).rate,
    ).toBeCloseTo(0.375, 12);
    state.ownedArtifacts.push("nn.artifact.zero_successor" as never);
    expect(
      resolveActivityRate(naturalNumbersIds.FORMALIZE, state, content).rate,
    ).toBeCloseTo(0.525, 12);
  });

  it("covers every condition AST node without executable callbacks", () => {
    const state = createInitialState(naturalNumbersContent);
    state.projects["nn.project.zero_successor"]!.status = "completed";
    state.projects["nn.project.zero_successor"]!.starts = 1;
    state.ownedUpgrades.push("nn.info.rate_ledger" as never);
    state.reachedMilestones.push("nn.milestone.zero_named" as never);
    state.recordedAchievements.push("nn.achievement.first_successor" as never);
    state.ownedArtifacts.push("nn.artifact.zero_successor" as never);
    state.understanding = 6 as never;
    state.insight = 1 as never;
    state.resources.PRECISION = 1 as never;
    state.records.validCapstones = 1;
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
      {
        type: "projectStarted",
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
      { type: "recordAtLeast", record: "validCapstones", amount: 1, text },
    ];
    expect(
      conditions.every(
        (condition) =>
          evaluateCondition(condition, state, naturalNumbersContent).met,
      ),
    ).toBe(true);
  });
});
