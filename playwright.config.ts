import { defineConfig, devices } from "@playwright/test";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
export default defineConfig({
  testDir: "./tests/e2e",
  reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],
  use: { baseURL: BASE_URL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run dev", url: "http://localhost:3000", timeout: 120000, reuseExistingServer: !process.env.CI, env: { PORT: "3000" } }
});
