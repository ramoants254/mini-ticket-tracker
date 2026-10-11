import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // All test files share one database and truncate it between tests,
    // so files must not run in parallel.
    fileParallelism: false,
  },
});
