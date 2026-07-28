import { describe, expect, it } from "vitest";
import { summarizeOffline } from "../../src/app/store";
import { naturalNumbersContent } from "../../src/content";
import {
  createInitialState,
  envelope,
  gameNumber,
  reduceCommand,
  selectApproachComparison,
  selectProjectDeficits,
  selectPublicationReadiness,
} from "../../src/engine";
import {
  formatDuration,
  formatGameNumber,
  formatRate,
} from "../../src/ui/format";
import {
  classifyNotification,
  importantEventMessage,
} from "../../src/ui/notifications";
import {
  availableViews,
  selectCurrentObjective,
  selectDisclosure,
} from "../../src/ui/view-models";

describe("Phase 2 player-facing models", () => {
  it("reveals systems progressively and chooses the next objective", () => {
    const state = createInitialState(naturalNumbersContent);
    expect(selectDisclosure(state)).toMatchObject({
      begun: false,
      projects: false,
      proofMap: false,
      automation: false,
      publication: false,
    });
    expect(availableViews(selectDisclosure(state))).toEqual(["overview"]);
    expect(selectCurrentObjective(state).title).toBe("Begin with zero");

    state.ownedUpgrades.push("nn.info.rate_ledger" as never);
    state.resources.PRECISION = gameNumber(100);
    expect(selectDisclosure(state).projects).toBe(true);
    expect(selectCurrentObjective(state)).toMatchObject({
      title: "Start Zero and Successor",
      targetView: "projects",
    });
  });

  it("formats finite numbers, rates, and durations centrally", () => {
    expect(formatGameNumber(12_345)).toBe("12.35K");
    expect(formatGameNumber(Number.POSITIVE_INFINITY)).toBe("Unavailable");
    expect(formatRate(0.005)).toBe("0.005 / second");
    expect(formatDuration(125)).toBe("2 min 5 sec");
    expect(formatDuration(null)).toBe("No estimate");
  });

  it("classifies routine, important, and critical notifications", () => {
    expect(
      classifyNotification({
        type: "timeAdvanced",
        durationMs: 1_000,
        offline: false,
      }),
    ).toBe("routine");
    const completion = {
      type: "projectCompleted" as const,
      projectId: "nn.project.zero_successor" as never,
      approachId: "nn.approach.formal" as never,
      artifactIds: [],
    };
    expect(classifyNotification(completion)).toBe("important");
    expect(importantEventMessage([completion])).toContain("Project completed");
    expect(
      classifyNotification({
        type: "chapterPublished",
        chapterId: "nn.chapter.natural_numbers" as never,
        masteryArtifactId: "mastery.induction_framework",
      }),
    ).toBe("critical");
  });

  it("builds resource, project, approach, and publication summaries", () => {
    const state = createInitialState(naturalNumbersContent);
    const deficits = selectProjectDeficits(
      state,
      naturalNumbersContent,
      "nn.project.zero_successor" as never,
    );
    expect(deficits.PRECISION).toBeGreaterThan(0);
    const comparison = selectApproachComparison(
      state,
      naturalNumbersContent,
      "nn.project.induction_walkthrough" as never,
    );
    expect(comparison).toHaveLength(3);
    expect(
      selectPublicationReadiness(
        state,
        naturalNumbersContent,
        "nn.chapter.natural_numbers",
      ).ready,
    ).toBe(false);
  });

  it("summarizes offline deltas and decision stops", () => {
    const before = createInitialState(naturalNumbersContent);
    const after = structuredClone(before);
    after.resources.PRECISION = gameNumber(7);
    after.projects["nn.project.zero_successor"]!.status = "completed";
    after.reachedMilestones.push("nn.milestone.zero_named" as never);
    after.diagnostics.unresolvedDecision = "Choose the next project";
    expect(
      summarizeOffline(before, after, 120_000, 90_000, 30_000, [
        "full-rate window",
        "decision stop",
      ]),
    ).toMatchObject({
      elapsedMs: 120_000,
      creditedMs: 90_000,
      discardedMs: 30_000,
      resourceChanges: { PRECISION: 7, INTUITION: 0 },
      completedProjectIds: ["nn.project.zero_successor"],
      stoppedForDecision: true,
    });
  });

  it("stores accessibility settings through validated commands", () => {
    const state = createInitialState(naturalNumbersContent);
    const result = reduceCommand(
      state,
      envelope(
        {
          type: "changeSetting",
          payload: { setting: "textScale", value: "large" },
        },
        1,
      ),
      naturalNumbersContent,
    );
    expect(result.accepted).toBe(true);
    if (result.accepted) expect(result.state.settings.textScale).toBe("large");
  });
});
