import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { generateArtifacts } from "../../experiments/run.js";

const DATA = new URL("../../reports/phase-0/data/", import.meta.url);

async function digest(files: string[]): Promise<string> {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) hash.update(await readFile(new URL(file, DATA)));
  return hash.digest("hex");
}

const first = await generateArtifacts();
const files = [...Object.keys(first), "determinism-manifest.json"];
const firstDigest = await digest(files);
await generateArtifacts();
const secondDigest = await digest(files);

if (firstDigest !== secondDigest) throw new Error(`repeatability failed: ${firstDigest} != ${secondDigest}`);
process.stdout.write(`Deterministic repeatability PASS ${firstDigest}\n`);

