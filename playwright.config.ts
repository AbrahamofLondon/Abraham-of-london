import { defineConfig, devices } from "@playwright/test";

/**
 * playwright.config.ts
 *
 * This file was previously an empty 0-byte placeholder (confirmed via
 * `git log -p --follow`: it was created 2025-12-10 by copying an empty
 * README.md — never real content, a 7-month-old scaffolding gap, not a
 * recent regression). Populated here with the minimum needed to run the
 * visual-authority-convergence baseline capture
 * (tests/e2e/visual-authority-baseline.spec.ts). The other empty spec
 * files (home.spec.ts, health.spec.ts, visual.spec.ts, utils.ts, etc.)
 * remain untouched and out of scope for this pass — flagged separately.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "visual-authority-baseline.spec.ts",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "off", // we take explicit full-page screenshots ourselves, per-viewport
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx next dev --webpack",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
