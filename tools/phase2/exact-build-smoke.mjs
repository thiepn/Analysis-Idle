import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { URL } from "node:url";

const root = resolve(import.meta.dirname, "../..");
const dist = resolve(root, "dist");
const base = "/Analysis-Idle/";
const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (!url.pathname.startsWith(base)) {
      response.writeHead(404).end("Not found");
      return;
    }
    const relativePath =
      url.pathname.slice(base.length) === ""
        ? "index.html"
        : url.pathname.slice(base.length);
    const candidate = resolve(dist, relativePath);
    if (!candidate.startsWith(`${dist}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const file = (await stat(candidate).catch(() => null))?.isFile()
      ? candidate
      : resolve(dist, "index.html");
    response.writeHead(200, {
      "content-type": mime[extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(500).end("Smoke server failure");
  }
});

await new Promise((resolveListen) =>
  server.listen(0, "127.0.0.1", resolveListen),
);
const address = server.address();
if (!address || typeof address === "string")
  throw new Error("Exact-build smoke server did not bind.");
const origin = `http://127.0.0.1:${address.port}`;

try {
  const indexResponse = await globalThis.fetch(`${origin}${base}`);
  if (!indexResponse.ok) throw new Error("Production index did not load.");
  const index = await indexResponse.text();
  if (!index.includes("Analysis Idle") || !index.includes("Natural Numbers"))
    throw new Error("Production title was not present.");
  const assets = [...index.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path.startsWith(`${base}assets/`));
  if (assets.length < 2)
    throw new Error("Expected JavaScript and CSS production assets.");
  for (const asset of assets) {
    const response = await globalThis.fetch(`${origin}${asset}`);
    if (!response.ok) throw new Error(`Asset failed to load: ${asset}`);
  }
  const reload = await globalThis.fetch(`${origin}${base}projects`);
  if (!reload.ok || !(await reload.text()).includes('<div id="app">'))
    throw new Error("Direct-route fallback did not return the application.");
  const javascript = await Promise.all(
    assets
      .filter((asset) => asset.endsWith(".js"))
      .map(async (asset) =>
        globalThis.fetch(`${origin}${asset}`).then((value) => value.text()),
      ),
  );
  if (!javascript.join("\n").includes("analysis-idle:v2:save:current"))
    throw new Error("The v2 save namespace was not found in the exact build.");
  console.log(
    `Exact-build smoke: base path, ${assets.length} assets, direct reload, and v2 save namespace passed.`,
  );
} finally {
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
}
