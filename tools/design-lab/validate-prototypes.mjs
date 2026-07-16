import { readFile, stat } from "node:fs/promises";

const html = await readFile("prototypes/phase-0/index.html", "utf8");
const required = ["viewport", "progressive disclosure", "Study allocation", "Projects", "dependency map", "approach", "upgrade", "offline return", "Publication"];
const missing = required.filter((term) => !html.toLowerCase().includes(term.toLowerCase()));
if (missing.length) throw new Error(`Prototype concepts missing: ${missing.join(", ")}`);
if ((await stat("prototypes/phase-0/style.css")).size < 1000) throw new Error("Prototype styling is incomplete");
process.stdout.write("Prototype build/smoke PASS\n");

