import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://irishpeptides-web.vercel.app" },
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
});