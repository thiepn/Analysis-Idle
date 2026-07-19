import { resolve } from "node:path";
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: "v2",
  base: "/Analysis-Idle/",
  plugins: [preact()],
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    fs: { allow: [resolve(import.meta.dirname)] },
  },
});
