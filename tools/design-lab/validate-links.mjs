import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else if (entry.name.endsWith(".md")) output.push(path);
  }
  return output;
}

const files = [...await walk("docs"), ...await walk("reports")];
const failures = [];
let checked = 0;

for (const file of files) {
  const markdown = await readFile(file, "utf8");
  const links = markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g);
  for (const match of links) {
    const raw = match[1].trim().replace(/^<|>$/g, "");
    if (!raw || raw.startsWith("#") || /^(?:https?:|mailto:)/i.test(raw)) continue;
    const withoutAnchor = raw.split("#", 1)[0];
    const target = resolve(dirname(file), decodeURIComponent(withoutAnchor));
    checked += 1;
    try {
      await stat(target);
    } catch {
      failures.push(`${file}: missing local link target ${raw}`);
    }
  }
}

if (failures.length) throw new Error(failures.join("\n"));
process.stdout.write(`Local link/path validation PASS (${checked} targets)\n`);
