import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { naturalNumbersContent } from "../../src/content";
import {
  createInitialState,
  reduceCommand,
  type GameState,
} from "../../src/engine";
import { createSaveEnvelope, exportSave } from "../../src/platform/persistence";
import { runSimulation } from "../simulator/core";

const root = resolve(import.meta.dirname, "../..");
const outputPath = resolve(
  root,
  "reports/phase-2/data/screenshot-fixtures.json",
);
mkdirSync(resolve(root, "reports/phase-2/data"), { recursive: true });

const trace = runSimulation({
  policy: "cheapestAvailable",
  horizonSeconds: 7_200,
  stopCondition: "publication",
  traceLevel: "full",
});
let state = createInitialState(naturalNumbersContent);
const captured = new Map<string, GameState>([
  ["opening", structuredClone(state)],
]);
const capture = (
  name: string,
  predicate: (candidate: GameState) => boolean,
) => {
  if (!captured.has(name) && predicate(state))
    captured.set(name, structuredClone(state));
};

for (const entry of trace.commandLog) {
  const result = reduceCommand(state, entry.envelope, naturalNumbersContent);
  if (result.accepted) state = result.state;
  capture(
    "firstProject",
    (candidate) =>
      candidate.projects["nn.project.zero_successor"]?.status === "active",
  );
  capture("secondResource", (candidate) =>
    candidate.ownedUpgrades.includes("nn.activity.explore" as never),
  );
  capture(
    "approachSelection",
    (candidate) =>
      candidate.projects["nn.project.induction_walkthrough"]?.status ===
      "available",
  );
  capture(
    "techniqueArtifact",
    (candidate) => candidate.ownedArtifacts.length >= 4,
  );
  capture("upgrades", (candidate) => candidate.ownedUpgrades.length >= 6);
  capture(
    "automation",
    (candidate) =>
      candidate.ownedUpgrades.filter((id) => id.includes("automation"))
        .length >= 2,
  );
  capture(
    "insight",
    (candidate) => candidate.insight > 0 || candidate.insightSpent > 0,
  );
  capture(
    "capstone",
    (candidate) =>
      candidate.assembledCapstoneEdges.length > 0 &&
      candidate.assembledCapstoneEdges.length <
        naturalNumbersContent.chapters[0]!.capstoneEdges.length,
  );
  capture(
    "publicationReady",
    (candidate) =>
      candidate.records.completedProjects ===
        naturalNumbersContent.projects.length &&
      candidate.assembledCapstoneEdges.length ===
        naturalNumbersContent.chapters[0]!.capstoneEdges.length &&
      candidate.records.publications === 0,
  );
  capture(
    "postPublication",
    (candidate) => candidate.records.publications === 1,
  );
}

const required = [
  "opening",
  "firstProject",
  "secondResource",
  "approachSelection",
  "techniqueArtifact",
  "upgrades",
  "automation",
  "insight",
  "capstone",
  "publicationReady",
  "postPublication",
];
for (const name of required)
  if (!captured.has(name))
    throw new Error(`Could not derive screenshot fixture: ${name}`);

const now = Date.now();
const fixtures = Object.fromEntries(
  [...captured].map(([name, fixtureState], index) => [
    name,
    exportSave(
      createSaveEnvelope(fixtureState, {
        generation: index + 1,
        savedAtMs: now,
        sessionId: `phase2-screenshot-${name}`,
        buildId: "phase2-screenshot-fixtures",
      }),
    ),
  ]),
);
const offlineBase = captured.get("automation")!;
fixtures.offlineReturn = exportSave(
  createSaveEnvelope(offlineBase, {
    generation: 100,
    savedAtMs: now - 2 * 60 * 60 * 1_000,
    sessionId: "phase2-screenshot-offline",
    buildId: "phase2-screenshot-fixtures",
  }),
);

writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      schemaVersion: 1,
      generatedAtMs: now,
      policy: "cheapestAvailable",
      fixtures,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Screenshot fixtures: ${Object.keys(fixtures).length} deterministic saves generated.`,
);
