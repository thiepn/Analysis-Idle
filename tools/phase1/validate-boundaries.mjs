import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

async function files(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await files(path)));
    else if ([".ts", ".tsx"].includes(extname(entry.name))) output.push(path);
  }
  return output;
}

const failures = [];
for (const file of await files("src/engine")) {
  const source = await readFile(file, "utf8");
  const name = relative(".", file);
  if (/from\s+["'][^"']*(?:app|platform|ui)[^"']*["']/.test(source))
    failures.push(`${name}: engine imports an outer layer`);
  if (/from\s+["'](?:preact|react)/.test(source))
    failures.push(`${name}: engine imports a UI framework`);
  if (/\b(?:document|window|localStorage|indexedDB|Date\.now)\b/.test(source))
    failures.push(`${name}: engine references a browser or wall-clock API`);
  if (/Math\.random\s*\(/.test(source))
    failures.push(`${name}: engine uses Math.random`);
}
for (const file of await files("tools/simulator")) {
  const source = await readFile(file, "utf8");
  if (/Math\.random\s*\(/.test(source))
    failures.push(`${relative(".", file)}: simulator uses Math.random`);
  if (/from\s+["'][^"']*(?:experiments|prototypes)[^"']*["']/.test(source))
    failures.push(`${relative(".", file)}: simulator imports Phase 0 evidence`);
}
try {
  const legacyManifest = JSON.parse(
    await readFile("reports/phase-0/LEGACY_FILE_MANIFEST.json", "utf8"),
  );
  execFileSync(
    "git",
    [
      "diff",
      "--exit-code",
      "239d75fd0e223e91703e261d2196953a896609cb",
      "--",
      ...legacyManifest.files.map((entry) => entry.path),
    ],
    { stdio: "ignore" },
  );
} catch {
  failures.push(
    "one or more of the 22 v1 baseline files differ from the immutable legacy commit",
  );
}
if (failures.length > 0) {
  failures.forEach((failure) => process.stderr.write(`${failure}\n`));
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Boundary validation PASS: engine is browser/UI/wall-clock independent; simulator is deterministic; all 22 v1 baseline files are unchanged.\n",
  );
}
