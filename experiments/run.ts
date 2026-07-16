import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import {
  MODEL_VERSION,
  activeIdleExperiment,
  attentionExperiment,
  branchExperiment,
  coreLoopExperiment,
  frontendExperiment,
  numericalExperiment,
  offlineExperiment,
  pacingExperiment,
  prestigeExperiment,
  resourceExperiment,
} from "./models.js";

const ROOT = new URL("../", import.meta.url);
const DATA = new URL("../reports/phase-0/data/", import.meta.url);

type Artifact = { id: string; file: string; report: string; result: unknown; conclusion: string; limitation: string };

function artifacts(): Artifact[] {
  return [
    { id: "core-loop", file: "core-loop-results.json", report: "CORE_LOOP_COMPARISON.md", result: coreLoopExperiment(), conclusion: "Candidate F is provisionally favored across the tested weight sets, provided disclosure is staged.", limitation: "Scores and first-30-minute actions are design estimates, not playtest observations." },
    { id: "attention", file: "attention-model-results.json", report: "ATTENTION_MODEL_COMPARISON.md", result: attentionExperiment(), conclusion: "Use 3→4 discrete slots, tap/plus-minus controls, presets, and a provisional 0.80 exponent.", limitation: "Optimization does not establish comprehension or fun; exponent and capacity require playtests." },
    { id: "resources", file: "resource-model-results.json", report: "RESOURCE_MODEL_COMPARISON.md", result: resourceExperiment(), conclusion: "Two primary stocks plus visible project-method Technique state are provisionally favored over one, three, and four stock models under the stated criteria.", limitation: "Source/sink and method-artifact behavior must be stress-tested in the Phase 1 simulator and comprehension playtests." },
    { id: "branches", file: "branch-model-results.json", report: "BRANCH_COMPARISON.md", result: branchExperiment(), conclusion: "Natural Numbers uses reversible per-project approaches; automation remains universal.", limitation: "Persistent campaign identities remain deferred until several chapters prove reusable behaviors." },
    { id: "pacing", file: "pacing-results.json", report: "PACING_ANALYSIS.md", result: pacingExperiment(), conclusion: "Configure the first Publication for a provisional 60–120 active-equivalent minute band over 1–3 sessions.", limitation: "Band scores are design-density heuristics; simulator timelines and human fatigue/comprehension playtests are required." },
    { id: "active-idle", file: "active-idle-results.json", report: "ACTIVE_IDLE_COMPARISON.md", result: activeIdleExperiment(), conclusion: "Deterministic stored Insight targets a 10–15% sustained advantage with a 20% ceiling.", limitation: "Perceived usefulness and missed-opportunity frustration need accessibility-inclusive playtests." },
    { id: "offline", file: "offline-model-results.json", report: "OFFLINE_MODEL_COMPARISON.md", result: offlineExperiment(), conclusion: "Simulate to unresolved decisions, then apply an explicit safe policy within bounded credit windows.", limitation: "12h/72h/25% windows are configurable hypotheses, not validated retention targets." },
    { id: "prestige", file: "prestige-purpose-results.json", report: "PRESTIGE_PURPOSE_ANALYSIS.md", result: prestigeExperiment(), conclusion: "Global prestige is deferred until a multi-chapter prototype proves a unique purpose.", limitation: "No reset formula or timing can be validated from one chapter." },
    { id: "frontend", file: "frontend-stack-results.json", report: "FRONTEND_STACK_COMPARISON.md", result: frontendExperiment(), conclusion: "Select Preact + TypeScript + Vite with a framework-independent engine.", limitation: "Bundle figures must be measured once the Phase 1 scaffold exists." },
    { id: "numerical", file: "numerical-range-results.json", report: "NUMERICAL_RANGE_ANALYSIS.md", result: numericalExperiment(), conclusion: "Use native numbers only behind an adapter; enforce a migration gate before the finite range is threatened.", limitation: "Later campaign magnitude is an envelope, not a balanced economy forecast." },
  ];
}

function selectedIds(): Set<string> | null {
  const only = process.argv.find((argument) => argument.startsWith("--only"));
  if (!only) return null;
  const inline = only.split("=")[1];
  const value = inline ?? process.argv[process.argv.indexOf(only) + 1] ?? "";
  return new Set(value.split(",").filter(Boolean));
}

export async function generateArtifacts(): Promise<Record<string, string>> {
  await mkdir(DATA, { recursive: true });
  const filter = selectedIds();
  const generated: Record<string, string> = {};
  for (const artifact of artifacts()) {
    if (filter && !filter.has(artifact.id) && artifact.id !== "audit") continue;
    const payload = {
      experimentId: artifact.id,
      hypothesis: artifact.conclusion,
      modelVersion: MODEL_VERSION,
      seed: null,
      playerPolicy: "deterministic heuristic policy enumeration",
      horizon: "first chapter / first 30 minutes where applicable",
      stoppingCondition: "all configured candidates evaluated",
      status: "selected-under-current-criteria",
      deterministic: true,
      result: artifact.result,
      conclusion: artifact.conclusion,
      limitations: [artifact.limitation, "This experiment cannot prove that a game is fun."],
    };
    const json = `${JSON.stringify(payload, null, 2)}\n`;
    await writeFile(new URL(artifact.file, DATA), json, "utf8");
    const report = `# ${artifact.id.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}\n\n## Result\n\n${artifact.conclusion}\n\n## Method\n\nDeterministic model \`${MODEL_VERSION}\`; no randomness or timestamp enters the output. Inputs, candidate metrics, criteria weights, rankings, and sensitivity results are preserved in [\`${artifact.file}\`](./data/${artifact.file}). Scores are explained heuristics, while numerical allocation and offline outputs are enumerated calculations.\n\n## Limitation\n\n${artifact.limitation} This evidence narrows implementation choices; it does not measure fun.\n`;
    await writeFile(new URL(`reports/phase-0/${artifact.report}`, ROOT), report, "utf8");
    generated[artifact.file] = createHash("sha256").update(json).digest("hex");
  }
  const manifest = `${JSON.stringify({ modelVersion: MODEL_VERSION, hashes: generated }, null, 2)}\n`;
  await writeFile(new URL("determinism-manifest.json", DATA), manifest, "utf8");
  return generated;
}

await generateArtifacts();
