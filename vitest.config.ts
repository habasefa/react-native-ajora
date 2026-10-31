import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "packages/**/__tests__/**/*.{test,spec}.{ts,tsx}",
      "packages/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["node_modules", "lib", "example-app", "legacy"],
    reporters: [["default", { summary: false }]],
    coverage: {
      reporter: ["text", "lcov", "html"],
      provider: "v8",
      include: ["packages/**/*.ts", "packages/**/*.tsx"],
      exclude: [
        "packages/**/*.d.ts",
        "packages/**/index.ts",
        "packages/**/__tests__/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@ajora-ai/core": path.resolve(__dirname, "packages/core/index.ts"),
      "@ajora-ai/shared": path.resolve(__dirname, "packages/shared/index.ts"),
      "@ajora-ai/native": path.resolve(__dirname, "packages/native/index.ts"),
    },
  },
});
