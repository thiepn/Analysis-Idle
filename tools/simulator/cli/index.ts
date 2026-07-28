import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runSimulation, timelineCsv } from "../core";
import { policyNames, type PolicyName } from "../policies";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const requestedPolicy = argument("policy") ?? "balanced";
if (!policyNames.includes(requestedPolicy as PolicyName))
  throw new Error(`Unknown policy ${requestedPolicy}`);
const horizon = Number(argument("horizon") ?? 7_200);
const seed = Number(argument("seed") ?? 12_345);
const chunk = argument("chunk");
const formats = (argument("format") ?? "json,csv").split(",");
const outputDirectory = resolve(
  argument("output") ?? "reports/phase-1/generated/simulator",
);
const traceLevel = argument("trace") === "full" ? "full" : "summary";
const stopCondition =
  argument("stop") === "horizon" ? "horizon" : "publication";
if (!Number.isFinite(horizon) || horizon <= 0 || !Number.isInteger(seed))
  throw new Error("Horizon must be positive and seed must be an integer");

const result = runSimulation({
  policy: requestedPolicy as PolicyName,
  horizonSeconds: horizon,
  seed,
  chunkSeconds: chunk === undefined ? null : Number(chunk),
  traceLevel,
  stopCondition,
});
await mkdir(outputDirectory, { recursive: true });
if (formats.includes("json"))
  await writeFile(
    resolve(outputDirectory, `${requestedPolicy}.json`),
    `${JSON.stringify(result, null, 2)}\n`,
    "utf8",
  );
if (formats.includes("csv"))
  await writeFile(
    resolve(outputDirectory, `${requestedPolicy}.csv`),
    timelineCsv(result),
    "utf8",
  );
process.stdout.write(
  `${JSON.stringify({ policy: requestedPolicy, hash: result.deterministicHash, completedProjects: result.finalState.records.completedProjects, publications: result.finalState.records.publications, outputDirectory })}\n`,
);
if (result.invariantViolations.length > 0) process.exitCode = 1;
