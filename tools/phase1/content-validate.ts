import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { naturalNumbersContent, validateContent } from "../../src/content";

const result = validateContent(naturalNumbersContent);
const output = {
  command: "npm run content:validate",
  contentVersion: naturalNumbersContent.contentVersion,
  ...result,
  requiredCounts: {
    projects: 12,
    upgrades: 15,
    milestones: 11,
    achievements: 10,
    approaches: 3,
  },
  primaryStocks: naturalNumbersContent.resources.map((resource) => resource.id),
  techniqueRepresentation: "typed-artifacts-not-stock",
};
const directory = resolve("reports/phase-1/data");
await mkdir(directory, { recursive: true });
await writeFile(
  resolve(directory, "content-validation.json"),
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8",
);
process.stdout.write(
  `${JSON.stringify({ valid: result.valid, counts: result.counts, errors: result.issues.filter((issue) => issue.severity === "error").length })}\n`,
);
if (!result.valid) process.exitCode = 1;
