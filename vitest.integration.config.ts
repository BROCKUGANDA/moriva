import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.mjs"],
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 30000,
    pool: "threads",
    // sequential file execution keeps the HTTP journey deterministic
    maxWorkers: 1,
  },
});
