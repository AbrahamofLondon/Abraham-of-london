// CI-safe Playwright prepare script.
// - Skips entirely on CI/Netlify
// - Never attempts privilege escalation
// - Only installs locally when you run `npm i` on your dev machine

import { execSync } from "node:child_process";
import os from "os";

const isCI = !!process.env.CI || !!process.env.NETLIFY;
const skip = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === "1";

if (isCI || skip) {
  console.log("[prepare-playwright] Skipping in CI/Netlify (or SKIP env set).");
  process.exit(0);
}

try {
  console.log("[prepare-playwright] Installing Playwright browsers (chromium only)...");
  // Keep it lightweight for developers; no sudo, no system deps.
  execSync("npx --yes playwright install chromium", { stdio: "inherit" });

  // Optional: install OS deps only when NOT in CI and on Linux desktop
  if (os.platform() === "linux" && !isCI) {
    try {
      execSync("npx --yes playwright install-deps chromium", { stdio: "inherit" });
    } catch {
      console.log("[prepare-playwright] Skipped install-deps (not required or insufficient permissions).");
    }
  }

  console.log("[prepare-playwright] Done.");
} catch (err) {
  console.warn("[prepare-playwright] Non-fatal error:", err?.message || err);
  // Do not fail install for local dev conveniences
  process.exit(0);
}
