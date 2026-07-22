import { describe, expect, it } from "vitest";
import { naturalNumbersContent, validateContent } from "../../src/content";

describe("production content validation", () => {
  it("matches all required Natural Numbers fixture counts", () => {
    const result = validateContent(naturalNumbersContent);
    expect(result.valid).toBe(true);
    expect(result.counts).toMatchObject({
      projects: 12,
      upgrades: 15,
      milestones: 11,
      achievements: 10,
      approaches: 3,
      resources: 2,
    });
  });

  it("contains global unique IDs, metadata, and no executable callbacks", () => {
    const serialized = JSON.stringify(naturalNumbersContent);
    expect(serialized).not.toContain("function");
    const entries = [
      naturalNumbersContent.resources,
      naturalNumbersContent.activities,
      naturalNumbersContent.approaches,
      naturalNumbersContent.techniqueArtifacts,
      naturalNumbersContent.projects,
      naturalNumbersContent.upgrades,
      naturalNumbersContent.milestones,
      naturalNumbersContent.achievements,
      naturalNumbersContent.chapters,
    ].flat();
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
    expect(
      entries.every(
        (entry) =>
          entry.accessible &&
          entry.designSource &&
          entry.mathematicalSource &&
          entry.balanceTestId,
      ),
    ).toBe(true);
  });

  it("fails critical duplicate and reference errors", () => {
    const invalid = structuredClone(naturalNumbersContent);
    invalid.projects[1]!.id = invalid.projects[0]!.id;
    expect(validateContent(invalid).valid).toBe(false);
    expect(
      validateContent(invalid).issues.some(
        (issue) => issue.code === "DUPLICATE_ID",
      ),
    ).toBe(true);
  });

  it("rejects malformed nested gameplay fields and every typed reference", () => {
    const malformed = structuredClone(naturalNumbersContent);
    malformed.projects[0]!.workRequired = Number.NaN;
    expect(
      validateContent(malformed).issues.some(
        (issue) => issue.code === "SCHEMA",
      ),
    ).toBe(true);

    const artifactReference = structuredClone(naturalNumbersContent);
    artifactReference.techniqueArtifacts[0]!.compatibleProjectIds = [
      "missing.project" as never,
    ];
    expect(
      validateContent(artifactReference).issues.some(
        (issue) => issue.code === "UNKNOWN_REFERENCE",
      ),
    ).toBe(true);

    const milestoneReference = structuredClone(naturalNumbersContent);
    milestoneReference.milestones[0]!.condition = {
      type: "projectCompleted",
      projectId: "missing.project" as never,
      text: { short: "Missing", accessible: "Missing project" },
    };
    expect(validateContent(milestoneReference).valid).toBe(false);

    const effectTarget = structuredClone(naturalNumbersContent);
    effectTarget.upgrades[0]!.effects[0]!.target = {
      kind: "activityRate",
      id: "missing.activity" as never,
    };
    expect(validateContent(effectTarget).valid).toBe(false);
  });

  it("rejects deep conditions, wildcard speed, and executable extensions", () => {
    const deep = structuredClone(naturalNumbersContent);
    let condition = deep.upgrades[0]!.unlockCondition;
    for (let depth = 0; depth < 70; depth += 1)
      condition = {
        type: "not",
        condition,
        text: { short: "Nested", accessible: "Nested condition" },
      };
    deep.upgrades[0]!.unlockCondition = condition;
    expect(
      validateContent(deep).issues.some(
        (issue) => issue.code === "CONDITION_DEPTH",
      ),
    ).toBe(true);

    const wildcard = structuredClone(naturalNumbersContent);
    const effect = wildcard.upgrades[0]!.effects[0]!;
    effect.target = { kind: "project", id: "*" };
    effect.operation = "projectSpeed";
    expect(
      validateContent(wildcard).issues.some(
        (issue) => issue.code === "GLOBAL_PROJECT_SPEED",
      ),
    ).toBe(true);

    const executable = structuredClone(naturalNumbersContent) as unknown as {
      projects: Array<Record<string, unknown>>;
    };
    executable.projects[0]!.callback = () => true;
    expect(validateContent(executable).valid).toBe(false);
  });

  it("uses truthful milestone and non-power achievement conditions", () => {
    const zeroNamed = naturalNumbersContent.milestones.find(
      (entry) => entry.id === "nn.milestone.zero_named",
    )!;
    const approachSelected = naturalNumbersContent.milestones.find(
      (entry) => entry.id === "nn.milestone.approach_selected",
    )!;
    expect(zeroNamed.condition.type).toBe("projectStarted");
    expect(approachSelected.condition.type).toBe("projectStarted");
    expect(
      naturalNumbersContent.achievements.filter(
        (entry) => entry.rewardClass === "badgeHistory",
      ),
    ).toHaveLength(7);
    expect(
      naturalNumbersContent.achievements.filter(
        (entry) => entry.rewardClass !== "badgeHistory",
      ),
    ).toHaveLength(3);
    expect(
      naturalNumbersContent.achievements.find(
        (entry) => entry.id === "nn.achievement.patient_plan",
      )!.condition,
    ).toMatchObject({
      type: "recordAtLeast",
      record: "offlineQueuedCompletions",
    });
  });
});
