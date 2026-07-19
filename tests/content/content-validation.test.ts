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
});
