import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter((file) => (
    (/^(docs|experiments|prototypes|reports|src|tools|\.github)\//.test(file)
      && /\.(?:css|html|js|json|md|mjs|ts|tsx|txt|ya?ml)$/.test(file))
    || /^(AGENTS\.md|package\.json|tsconfig\.phase0\.json)$/.test(file)
  ));
const sourceManifest = JSON.parse(await readFile("docs/research/SOURCE_MANIFEST.json", "utf8"));
const immutableSources = new Set(
  (sourceManifest.sources ?? [])
    .filter((source) => source.immutable === true)
    .map((source) => source.repositoryPath),
);
const failures = [];
for (const file of files) {
  if (immutableSources.has(file)) continue;
  const text = await readFile(file, "utf8");
  if (!text.endsWith("\n")) failures.push(`${file}: missing final newline`);
  if (/[ \t]+$/m.test(text)) failures.push(`${file}: trailing whitespace`);
  if (/\t/.test(text) && !file.endsWith(".json")) failures.push(`${file}: tab character`);
}
if (failures.length) throw new Error(failures.join("\n"));
process.stdout.write(`Formatting PASS (${files.length - immutableSources.size} checked files; ${immutableSources.size} immutable source files preserved)\n`);
