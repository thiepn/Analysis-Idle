import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "experiments/**/*.test.ts",
    ],
    coverage: { reporter: ["text", "json-summary"] },
    restoreMocks: true,
  },
});
