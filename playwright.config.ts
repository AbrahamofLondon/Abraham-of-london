import { defineConfig, devices } from "@playwright/test";

/**
 * playwright.config.ts
 *
 * This file was previously an empty 0-byte placeholder (confirmed via
 * `git log -p --follow`: it was created 2025-12-10 by copying an empty
 * README.md — never real content, a 7-month-old scaffolding gap, not a
 * recent regression). Populated for the visual-authority-convergence
 * baseline capture, then widened to run the full tests/e2e/ suite once
 * the other empty spec files (home, health, a11y, blog, downloads-assets,
 * visual, utils, axe-helpers) were restored from their pre-wipe git
 * history and reconciled with the current app.
 */
export default defineConfig({
  testDir: "./tests/e2e",
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
    command: "pnpm exec next dev --webpack",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
