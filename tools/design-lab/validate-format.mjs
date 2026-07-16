import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter((file) => (
    (/^(docs|experiments|prototypes|reports|src|tools|\.github)\//.test(file)
      && /\.(?:css|html|js|json|md|mjs|ts|tsx|txt|ya?ml)$/.test(file))
    || /^(AGENTS\.md|package\.json|tsconfig\.phase0\.json)$/.test(file)
  ));
const failures = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  if (!text.endsWith("\n")) failures.push(`${file}: missing final newline`);
  if (/[ \t]+$/m.test(text)) failures.push(`${file}: trailing whitespace`);
  if (/\t/.test(text) && !file.endsWith(".json")) failures.push(`${file}: tab character`);
}
if (failures.length) throw new Error(failures.join("\n"));
process.stdout.write(`Formatting PASS (${files.length} files)\n`);
