import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

const required = [
  "AGENTS.md", "src/engine/AGENTS.md", "src/content/AGENTS.md", "src/ui/AGENTS.md", "tools/AGENTS.md", "experiments/AGENTS.md",
  "docs/research/DEEP_RESEARCH_FOUNDATION.md", "docs/research/DEEP_RESEARCH_COMPLETION_AUDIT.md",
  "docs/research/SOURCE_MANIFEST.json", "docs/research/RESEARCH_SYNTHESIS.md", "docs/research/RESEARCH_DECISIONS.md", "docs/research/OPEN_QUESTIONS.md",
  "docs/design/GAME_DESIGN.md", "docs/design/NATURAL_NUMBERS_GDD.md", "docs/balance/RESOURCE_MODEL.md",
  "docs/technical/TECHNICAL_SPEC.md", "docs/technical/SAVE_SPEC.md", "docs/qa/ACCESSIBILITY_STANDARD.md",
  "docs/handoff/PHASE_1_IMPLEMENTATION_BRIEF.md", "docs/handoff/PHASE_1_INPUT_MANIFEST.md",
  "reports/phase-0/RESEARCH_RECONCILIATION_REPORT.md", "reports/phase-0/data/research-reconciliation.json", "reports/phase-0/PHASE_0_COMPLETION_REPORT.md",
  "reports/phase-0/phase-0-summary.json", "prototypes/phase-0/index.html"
];
const failures = [];
for (const file of required) {
  try {
    if ((await stat(file)).size === 0) failures.push(`${file}: empty`);
  } catch {
    failures.push(`${file}: missing`);
  }
}

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else output.push(path);
  }
  return output;
}

for (const file of await walk("reports/phase-0/data")) {
  if (file.endsWith(".json")) {
    try { JSON.parse(await readFile(file, "utf8")); } catch { failures.push(`${file}: invalid JSON`); }
  }
}
try {
  const manifest = JSON.parse(await readFile("docs/research/SOURCE_MANIFEST.json", "utf8"));
  for (const source of manifest.sources ?? []) {
    const bytes = await readFile(source.repositoryPath);
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== source.sha256) failures.push(`${source.repositoryPath}: checksum mismatch`);
    if (bytes.byteLength !== source.bytes) failures.push(`${source.repositoryPath}: byte count mismatch`);
  }
} catch (error) {
  failures.push(`docs/research/SOURCE_MANIFEST.json: source verification failed (${error instanceof Error ? error.message : String(error)})`);
}
for (const file of await walk("src")) {
  if (/\.(ts|tsx|js|jsx)$/.test(file) && /from\s+["'][^"']*experiments\//.test(await readFile(file, "utf8"))) {
    failures.push(`${file}: production import from experiments`);
  }
}
if (failures.length) throw new Error(failures.join("\n"));
process.stdout.write(`Artifact lint PASS (${required.length} required artifacts; source checksums verified)\n`);
