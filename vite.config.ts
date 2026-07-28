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
    // Release artifacts omit embedded source content; local debugging uses
    // Vite's development server and CI validates the production bundle.
    sourcemap: false,
  },
  server: {
    fs: { allow: [resolve(import.meta.dirname)] },
  },
});
