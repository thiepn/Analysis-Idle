import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

type SourceRecord = { repositoryPath: string; sha256: string; bytes: number };
type Decision = { id: string; status: string; requiredRevision: string };

const allowedStatuses = new Set(["ACCEPTED", "ACCEPTED WITH REVISION", "PROVISIONAL", "DEFERRED", "REJECTED", "SUPERSEDED"]);

async function text(path: string): Promise<string> {
  return readFile(path, "utf8");
}

describe("research source integrity", () => {
  it("preserves both original inputs at their recorded hashes and byte counts", async () => {
    const manifest = JSON.parse(await text("docs/research/SOURCE_MANIFEST.json")) as { sources: SourceRecord[] };
    expect(manifest.sources).toHaveLength(2);
    for (const source of manifest.sources) {
      const bytes = await readFile(source.repositoryPath);
      expect(bytes.byteLength).toBe(source.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(source.sha256);
    }
  });

  it("cites both preserved inputs in the authoritative synthesis and Phase 1 manifest", async () => {
    const synthesis = await text("docs/research/RESEARCH_SYNTHESIS.md");
    const handoff = await text("docs/handoff/PHASE_1_INPUT_MANIFEST.md");
    for (const filename of ["DEEP_RESEARCH_FOUNDATION.md", "DEEP_RESEARCH_COMPLETION_AUDIT.md"]) {
      expect(synthesis).toContain(filename);
      expect(handoff).toContain(filename);
    }
    expect(handoff).toContain("research-reconciliation.json");
  });
});

describe("research reconciliation completeness", () => {
  it("classifies exactly the 53 required decisions with allowed statuses", async () => {
    const data = JSON.parse(await text("reports/phase-0/data/research-reconciliation.json")) as { decisions: Decision[] };
    expect(data.decisions).toHaveLength(53);
    expect(new Set(data.decisions.map((decision) => decision.id)).size).toBe(53);
    data.decisions.forEach((decision, index) => {
      expect(decision.id).toBe(`R-${String(index + 1).padStart(3, "0")}`);
      expect(allowedStatuses.has(decision.status)).toBe(true);
      expect(decision.requiredRevision.trim().length).toBeGreaterThan(0);
    });
  });

  it("keeps every unresolved numeric center visibly provisional and configurable", async () => {
    const data = JSON.parse(await text("reports/phase-0/data/research-reconciliation.json")) as {
      provisionalValues: Array<{ status: string; configurationPath: string }>;
    };
    expect(data.provisionalValues.length).toBeGreaterThanOrEqual(10);
    for (const value of data.provisionalValues) {
      expect(value.status).toBe("PROVISIONAL");
      expect(value.configurationPath.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("Phase 0 unblock consistency", () => {
  it("contains no stale missing-source acceptance language", async () => {
    const paths = [
      "docs/research/RESEARCH_SYNTHESIS.md",
      "docs/handoff/PHASE_1_INPUT_MANIFEST.md",
      "docs/qa/PHASE_ACCEPTANCE.md",
      "reports/phase-0/PHASE_0_COMPLETION_REPORT.md",
      "reports/phase-0/VALIDATION_REPORT.md",
    ];
    for (const path of paths) {
      const content = await text(path);
      expect(content).not.toContain("Both named research inputs are missing");
      expect(content).not.toContain("PHASE_0_STATUS: BLOCKED");
    }
  });
});
