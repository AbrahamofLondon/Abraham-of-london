// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || "3100";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],
  use: { baseURL: BASE_URL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev", // no inline env; Windows-safe
    url: `http://localhost:${PORT}`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: { PORT }, // pass PORT via env
  },
});
