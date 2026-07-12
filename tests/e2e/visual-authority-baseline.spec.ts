import { test } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const isCaptureMode = process.env.UPDATE_VISUAL_BASELINE === "1";

/**
 * tests/e2e/visual-authority-baseline.spec.ts
 *
 * Persists the disk-based screenshot baseline for the Visual Authority
 * Convergence programme's 8 reference routes, at the 4 viewports specified
 * in the brief (§14 Phase 0). This is the durable follow-up to the
 * in-session-only browser-tool screenshots taken during the first Phase 0
 * pass (see reports/visual/screenshot-baseline-index.md for that
 * limitation) — these files are real, committed, reproducible artifacts.
 *
 * Not a regression gate (no expect/toMatchSnapshot) — purely a capture
 * tool. brief §13.7's actual regression gate is separate, later work that
 * will compare future runs against this baseline.
 */

const ROUTES = [
  "/enterprise-decision-scan",
  "/decision-centre",
  "/diagnostics",
  "/intelligence",
  "/intelligence/gmi/q2-2026",
  "/foundry/decision-test",
  "/boardroom-brief",
  "/checkout/personal-decision-audit",
];

const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "390x844", width: 390, height: 844 },
];

const OUT_DIR = join(process.cwd(), "reports/visual/screenshots/baseline-v2");

function gitSha(): string {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    return "UNKNOWN";
  }
}

function safeRouteName(route: string): string {
  return route === "/" ? "root" : route.replace(/^\//, "").replace(/\//g, "_");
}

test.describe("visual authority baseline capture", () => {
  test.skip(
    !isCaptureMode,
    "Baseline capture requires UPDATE_VISUAL_BASELINE=1",
  );
  test.beforeAll(() => {
    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  });

  const manifest: Array<Record<string, unknown>> = [];

  for (const route of ROUTES) {
    for (const viewport of VIEWPORTS) {
      test(`${route} @ ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Disable animations/transitions so captures are stable, per brief §13.7.
        await page.addInitScript(() => {
          const style = document.createElement("style");
          style.textContent = `
            *, *::before, *::after {
              animation-duration: 0s !important;
              animation-delay: 0s !important;
              transition-duration: 0s !important;
              transition-delay: 0s !important;
              scroll-behavior: auto !important;
            }
          `;
          document.documentElement.appendChild(style);
        });

        await page.goto(route, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);

        const fileName = `${safeRouteName(route)}__${viewport.name}.png`;
        const filePath = join(OUT_DIR, fileName);
        await page.screenshot({ path: filePath, fullPage: true });

        manifest.push({
          route,
          viewport: viewport.name,
          file: `reports/visual/screenshots/${fileName}`,
          capturedAt: new Date().toISOString(),
          sha: gitSha(),
          userAgent: await page.evaluate(() => navigator.userAgent),
          fontsReady: true,
          animationsDisabled: true,
        });
      });
    }
  }

  test.afterAll(() => {
    if (!isCaptureMode) return;
    const manifestPath = join(OUT_DIR, "manifest.json");
    writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          sha: gitSha(),
          routeCount: ROUTES.length,
          viewportCount: VIEWPORTS.length,
          totalShots: ROUTES.length * VIEWPORTS.length,
          shots: manifest,
        },
        null,
        2,
      ) + "\n",
    );
  });
});
