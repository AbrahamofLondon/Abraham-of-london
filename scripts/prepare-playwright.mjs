// File: scripts/prepare-playwright.mjs
// Why: Ensure Playwright browsers are present in CI; optional locally.
import { execSync } from 'node:child_process';

const isCI = process.env.CI === 'true' || process.env.CI === '1';
const optIn = process.env.PLAYWRIGHT_INSTALL === 'true' || process.env.PLAYWRIGHT_INSTALL === '1';

if (isCI || optIn) {
  try {
    execSync('npx playwright install --with-deps', { stdio: 'inherit' });
  } catch (err) {
    // Fail loudly in CI so tests don't run with missing browsers.
    if (isCI) process.exit(1);
    console.warn('Playwright install optional failed (local).', err?.message);
  }
} else {
  console.log('Skipping Playwright browser install (set PLAYWRIGHT_INSTALL=1 to opt in locally).');
}
