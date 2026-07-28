import { gzipSync } from "node:zlib";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { naturalNumbersContent } from "../../src/content";

const root = resolve(import.meta.dirname, "../..");
const dist = resolve(root, "dist");
const dataDirectory = resolve(root, "reports/phase-2/data");
mkdirSync(dataDirectory, { recursive: true });

const checks: Array<{ id: string; passed: boolean; detail: string }> = [];
const check = (id: string, passed: boolean, detail: string) =>
  checks.push({ id, passed, detail });

check(
  "content-project-count",
  naturalNumbersContent.projects.length === 12,
  `${naturalNumbersContent.projects.length} projects`,
);
check(
  "content-upgrade-count",
  naturalNumbersContent.upgrades.length === 15,
  `${naturalNumbersContent.upgrades.length} upgrades`,
);
check(
  "content-milestone-count",
  naturalNumbersContent.milestones.length === 11,
  `${naturalNumbersContent.milestones.length} milestones`,
);
check(
  "content-achievement-count",
  naturalNumbersContent.achievements.length === 10,
  `${naturalNumbersContent.achievements.length} achievements`,
);
check(
  "content-approach-count",
  naturalNumbersContent.approaches.length === 3,
  `${naturalNumbersContent.approaches.length} approaches`,
);
check(
  "two-stock-model",
  naturalNumbersContent.resources.length === 2 &&
    !naturalNumbersContent.resources.some((resource) =>
      /technique/i.test(resource.id),
    ),
  `${naturalNumbersContent.resources.length} stocks; Technique is non-stock`,
);
check(
  "achievement-no-power",
  naturalNumbersContent.achievements.every(
    (achievement) =>
      achievement.rewardClass === "badgeHistory" ||
      achievement.rewardClass.startsWith("nonPower"),
  ),
  "all achievement rewards are badge/history or explicit non-power classes",
);

const sourceFiles = [
  resolve(root, "src/app/App.tsx"),
  resolve(root, "src/content/natural-numbers-copy.ts"),
  resolve(root, "src/ui/ProofMap.tsx"),
];
const sourceText = sourceFiles
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
check(
  "raw-latex-excluded",
  !/\\(frac|begin|end|sum|prod|mathbb|mathrm|text)\b/.test(sourceText),
  "player-facing source contains no raw LaTeX commands",
);
check(
  "mandatory-click-production-excluded",
  !/type:\s*["']produce(?:Resource)?["']/i.test(sourceText),
  "production advances through explicit time commands, not click production",
);

check("dist-exists", existsSync(dist), "production dist directory exists");
const files = existsSync(dist)
  ? readdirSync(dist, { recursive: true })
      .map((entry) => resolve(dist, String(entry)))
      .filter((entry) => statSync(entry).isFile())
  : [];
const bundleFiles = files.map((file) => {
  const body = readFileSync(file);
  return {
    file: file.slice(dist.length + 1).replaceAll("\\", "/"),
    bytes: body.byteLength,
    gzipBytes: gzipSync(body).byteLength,
  };
});
const js = bundleFiles.filter((file) => file.file.endsWith(".js"));
const css = bundleFiles.filter((file) => file.file.endsWith(".css"));
const jsBytes = js.reduce((sum, file) => sum + file.bytes, 0);
const jsGzipBytes = js.reduce((sum, file) => sum + file.gzipBytes, 0);
const cssBytes = css.reduce((sum, file) => sum + file.bytes, 0);
const cssGzipBytes = css.reduce((sum, file) => sum + file.gzipBytes, 0);
check(
  "phase2-js-budget",
  jsGzipBytes <= 90 * 1024,
  `${jsGzipBytes} gzip bytes against a realistic 90 KiB Phase 2 budget`,
);
check(
  "phase2-css-budget",
  cssGzipBytes <= 15 * 1024,
  `${cssGzipBytes} gzip bytes against a 15 KiB Phase 2 budget`,
);
check(
  "source-maps-excluded",
  !bundleFiles.some((file) => file.file.endsWith(".map")),
  "production source maps are absent",
);
const indexText = existsSync(resolve(dist, "index.html"))
  ? readFileSync(resolve(dist, "index.html"), "utf8")
  : "";
check(
  "vite-base-path",
  indexText.includes("/Analysis-Idle/assets/"),
  "built asset URLs use /Analysis-Idle/",
);

const metrics = {
  schemaVersion: 1,
  budget: {
    javascriptGzipBytes: 90 * 1024,
    cssGzipBytes: 15 * 1024,
    rationale:
      "Phase 2 adds a complete production UI and Proof Map over the 49.88 KiB Phase 1 JS baseline while retaining a sub-100 KiB application target.",
  },
  totals: { jsBytes, jsGzipBytes, cssBytes, cssGzipBytes },
  files: bundleFiles,
};
writeFileSync(
  resolve(dataDirectory, "bundle-metrics.json"),
  `${JSON.stringify(metrics, null, 2)}\n`,
);
writeFileSync(
  resolve(dataDirectory, "artifact-validation.json"),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      passed: checks.every((entry) => entry.passed),
      checks,
    },
    null,
    2,
  )}\n`,
);
if (checks.some((entry) => !entry.passed)) {
  for (const failed of checks.filter((entry) => !entry.passed))
    console.error(`FAIL ${failed.id}: ${failed.detail}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 2 artifact validation: ${checks.length} checks passed.`);
}
