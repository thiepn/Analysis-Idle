import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(".");
const portIndex = process.argv.indexOf("--port");
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : 4173);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png" };

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", `http://${request.headers.host}`).pathname);
    let candidate = resolve(join(root, normalize(pathname).replace(/^[/\\]+/, "")));
    if (!candidate.startsWith(root)) throw new Error("outside root");
    if ((await stat(candidate)).isDirectory()) candidate = join(candidate, "index.html");
    const body = await readFile(candidate);
    response.writeHead(200, { "Content-Type": types[extname(candidate)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => process.stdout.write(`Phase 0 server http://127.0.0.1:${port}\n`));

