import { describe, expect, it } from "vitest";
import {
  createSaveEnvelope,
  validateSaveText,
} from "../../src/platform/persistence";
import { naturalNumbersContent } from "../../src/content";
import { runSimulation } from "../../tools/simulator/core";

describe("Phase 2 complete player path", () => {
  it("reaches every chapter system and reloads the published state", () => {
    const result = runSimulation({
      policy: "cheapestAvailable",
      horizonSeconds: 7_200,
      stopCondition: "publication",
      traceLevel: "full",
    });
    const commands = new Set(
      result.commandLog
        .filter((entry) => entry.accepted)
        .map((entry) => entry.envelope.command.type),
    );
    const events = new Set(result.eventLog.map((event) => event.type));

    expect([...commands]).toEqual(
      expect.arrayContaining([
        "advanceTime",
        "setAttention",
        "startProject",
        "switchProjectApproach",
        "purchaseUpgrade",
        "assembleCapstoneEdge",
        "publishChapter",
      ]),
    );
    expect([...events]).toEqual(
      expect.arrayContaining([
        "resourceChanged",
        "projectCompleted",
        "milestoneReached",
        "achievementRecorded",
        "insightGained",
        "capstoneEdgeAssembled",
        "chapterPublished",
      ]),
    );
    expect(result.finalState.ownedArtifacts.length).toBeGreaterThan(0);
    expect(
      result.commandLog.some(
        (entry) =>
          entry.accepted &&
          entry.envelope.command.type === "purchaseUpgrade" &&
          entry.envelope.command.payload.upgradeId.includes("automation"),
      ),
    ).toBe(true);
    expect(result.finalState.records.publications).toBe(1);

    const envelope = createSaveEnvelope(result.finalState, {
      generation: 1,
      savedAtMs: Date.now(),
      sessionId: "phase2-player-path",
      buildId: "phase2-player-path",
    });
    const decoded = validateSaveText(
      JSON.stringify(envelope),
      naturalNumbersContent,
    );
    expect(decoded.valid).toBe(true);
    if (decoded.valid) {
      expect(decoded.state).toEqual(result.finalState);
      expect(decoded.state.records.publications).toBe(1);
    }
  });
});
