import { defineConfig } from "vitest/config";

// Golden evals run against the built CLI, MCP server and hook: run `pnpm build` first.
// They are named *.eval.ts so `pnpm test` (the unit tests in tests/) does not pick them up.
export default defineConfig({
  test: {
    include: ["eval/**/*.eval.ts"],
    testTimeout: 30000,
  },
});
