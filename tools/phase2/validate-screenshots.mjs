import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const directory = resolve(root, "reports/phase-2/screenshots");
mkdirSync(directory, { recursive: true });
const required = [
  "opening-desktop.png",
  "second-resource-tablet.png",
  "attention-mobile.png",
  "first-project-desktop.png",
  "approach-selection-tablet.png",
  "technique-artifact-mobile.png",
  "upgrades-desktop.png",
  "proof-map-desktop.png",
  "automation-tablet.png",
  "insight-mobile.png",
  "offline-return-desktop.png",
  "capstone-desktop.png",
  "publication-ready-tablet.png",
  "publication-sequence-mobile.png",
  "post-publication-desktop.png",
  "settings-mobile.png",
  "save-recovery-tablet.png",
  "import-preview-desktop.png",
];
const entries = required.map((name) => {
  const path = resolve(directory, name);
  return {
    name,
    exists: existsSync(path),
    bytes: existsSync(path) ? statSync(path).size : 0,
    manuallyInspected: false,
  };
});
const existingManifest = resolve(directory, "manifest.json");
if (existsSync(existingManifest)) {
  const previous = JSON.parse(readFileSync(existingManifest, "utf8"));
  for (const entry of entries) {
    const matched = previous.screenshots?.find(
      (candidate) => candidate.name === entry.name,
    );
    entry.manuallyInspected = Boolean(matched?.manuallyInspected);
  }
}
writeFileSync(
  existingManifest,
  `${JSON.stringify(
    {
      schemaVersion: 1,
      requiredCount: required.length,
      complete: entries.every(
        (entry) =>
          entry.exists && entry.bytes > 1_000 && entry.manuallyInspected,
      ),
      screenshots: entries,
    },
    null,
    2,
  )}\n`,
);
const missing = entries.filter(
  (entry) => !entry.exists || entry.bytes <= 1_000 || !entry.manuallyInspected,
);
if (missing.length > 0) {
  console.error(
    `Screenshot validation incomplete: ${missing.map((entry) => entry.name).join(", ")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Screenshot validation: ${entries.length} inspected images pass.`,
  );
}
