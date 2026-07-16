import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const originalHead = "239d75fd0e223e91703e261d2196953a896609cb";
const lines = execFileSync("git", ["ls-tree", "-r", "--long", originalHead], { encoding: "utf8" })
  .trim()
  .split(/\r?\n/);
const files = lines.map((line) => {
  const match = line.match(/^(\d+)\s+(\w+)\s+([0-9a-f]+)\s+(\d+)\t(.+)$/);
  if (!match) throw new Error(`Cannot parse ls-tree line: ${line}`);
  const [, mode, type, blob, bytes, path] = match;
  const content = execFileSync("git", ["show", `${originalHead}:${path}`]);
  const text = content.toString("utf8");
  return {
    path,
    mode,
    type,
    blob,
    bytes: Number(bytes),
    lines: text.length === 0 ? 0 : text.split(/\r?\n/).length - (text.endsWith("\n") ? 1 : 0),
    sha256: createHash("sha256").update(content).digest("hex"),
  };
});
const baseline = {
  repository: "thiepn/Analysis-Idle",
  capturedFor: "Analysis Idle v2 Phase 0",
  originalHead,
  originalCommit: execFileSync("git", ["show", "-s", "--format=%H|%aI|%s", originalHead], { encoding: "utf8" }).trim(),
  defaultBranch: "main",
  legacyBranch: "legacy/v1",
  legacyTag: "v1.0.0-legacy",
  trackedFiles: files.length,
  trackedBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  physicalLines: files.reduce((sum, file) => sum + file.lines, 0),
  runtime: "plain HTML, CSS, and browser JavaScript modules",
  storageKeys: ["mathIdleSave"],
  saveVersions: { initialState: 4, currentWriter: 5 },
};
await mkdir("reports/phase-0", { recursive: true });
await writeFile("reports/phase-0/LEGACY_FILE_MANIFEST.json", `${JSON.stringify({ originalHead, files }, null, 2)}\n`);
await writeFile("reports/phase-0/LEGACY_BASELINE.json", `${JSON.stringify(baseline, null, 2)}\n`);
process.stdout.write(`Legacy baseline PASS ${originalHead} (${files.length} files)\n`);

