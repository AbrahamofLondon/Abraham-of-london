#!/usr/bin/env node
/**
 * scripts/check-route-lambda-integrity.mjs
 *
 * Post-build guard: verifies that every App Router route in the build manifest
 * has a coherent deployment state before Vercel packages the output.
 * Also runs source-level checks to prevent retired routes from re-entering
 * the App Router and causing "Unable to find lambda" packaging failures.
 *
 * Runs AFTER `next build --webpack` (called from clean-standalone.mjs).
 *
 * Checks:
 *   1. app-paths-manifest.json is present and parseable
 *   2. Every route in the manifest has a corresponding .js file in .next/server/app/
 *   3. Dynamic routes (not prerendered) have an .nft.json trace file
 *   4. No orphaned route.js file exists without a manifest entry
 *   5. pages-manifest.json (Pages Router) — all entries have JS files
 *   6. middleware-manifest.json — all referenced files exist
 *   7. No REDIRECT_ONLY or LEGACY_DISABLED route has a physical app/[dir]/page.tsx
 *      (these must be handled by config-level redirects, never by App Router pages)
 *   8. No route from previous missing-lambda failures has a physical page file
 *   9. No route under app/dashboard/** has a physical page file
 *      (dashboard routes are fully retired; redirects live in next.config.mjs)
 *
 * Exit codes:
 *   0  — all checks pass
 *   1  — at least one violation found (fails the build / deploy)
 *
 * Usage:
 *   node scripts/check-route-lambda-integrity.mjs [--warn-only]
 *   --warn-only  Print violations but exit 0 (use during migration)
 */

import fs from "node:fs";
import path from "node:path";

const WARN_ONLY = process.argv.includes("--warn-only");
const projectRoot = process.cwd();
const nextServer = path.join(projectRoot, ".next", "server");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

let violations = 0;
let warnings = 0;

function fail(msg) {
  console.error(`[route-integrity] ✗ FAIL: ${msg}`);
  violations++;
}

function warn(msg) {
  console.warn(`[route-integrity] ⚠ WARN: ${msg}`);
  warnings++;
}

function ok(msg) {
  if (process.env.ROUTE_INTEGRITY_VERBOSE === "1") {
    console.log(`[route-integrity] ✓ ${msg}`);
  }
}

// ─── Guard: .next/server must exist ──────────────────────────────────────────

if (!fileExists(nextServer)) {
  console.error(
    "[route-integrity] .next/server not found — run `next build` first.",
  );
  process.exit(WARN_ONLY ? 0 : 1);
}

// ─── Check 1: app-paths-manifest.json ────────────────────────────────────────

const appPathsManifestPath = path.join(
  nextServer,
  "app-paths-manifest.json",
);

const appPathsManifest = readJson(appPathsManifestPath);
if (!appPathsManifest) {
  // App Router not used or not built yet — not an error if no app/ dir.
  const appDir = path.join(projectRoot, "app");
  if (fileExists(appDir)) {
    fail(`app-paths-manifest.json missing but app/ directory exists`);
  } else {
    ok("no app/ directory — skipping App Router checks");
  }
} else {
  ok(`app-paths-manifest.json found with ${Object.keys(appPathsManifest).length} entries`);

  // ─── Check 2: Every manifest entry has a .js file ──────────────────────────
  for (const [routePath, jsRelPath] of Object.entries(appPathsManifest)) {
    // jsRelPath is relative to .next/server/
    const jsAbs = path.join(nextServer, jsRelPath);

    if (!fileExists(jsAbs)) {
      fail(
        `Route ${routePath} is in manifest but JS file not found: ${jsRelPath}`,
      );
      continue;
    }

    ok(`${routePath} → ${jsRelPath} (JS present)`);

    // ─── Check 3: Dynamic routes should have NFT trace ─────────────────────
    const nftPath = `${jsAbs}.nft.json`;
    if (!fileExists(nftPath)) {
      // Missing NFT is a warning: it means the route might not have all its
      // dependencies traced. This causes "Tracing entries due to missing build
      // traces" in the Vercel log. A route without NFT still deploys, but may
      // be missing runtime files.
      warn(
        `Route ${routePath}: NFT trace missing at ${path.relative(projectRoot, nftPath)}`,
      );
    } else {
      ok(`${routePath} → NFT trace present`);
    }
  }

  // ─── Check 4: Orphaned .js files in .next/server/app/ ─────────────────────
  // A page.js that has no manifest entry means it was built but Vercel won't
  // create a function for it — this is the "Unable to find lambda" scenario.
  const appServerDir = path.join(nextServer, "app");
  if (fileExists(appServerDir)) {
    // Build the set of expected JS files from the manifest
    const manifestJsFiles = new Set(
      Object.values(appPathsManifest).map((rel) =>
        path.normalize(path.join(nextServer, rel)),
      ),
    );

    const orphans = collectRouteFiles(appServerDir).filter(
      (f) => !manifestJsFiles.has(path.normalize(f)),
    );

    for (const orphan of orphans) {
      const rel = path.relative(projectRoot, orphan);
      warn(
        `Orphaned route file (not in manifest): ${rel}` +
          ` — this may trigger "Unable to find lambda" on Vercel`,
      );
    }
  }
}

// ─── Check 5: pages-manifest.json (Pages Router) ─────────────────────────────

const pagesManifestPath = path.join(nextServer, "pages-manifest.json");
const pagesManifest = readJson(pagesManifestPath);
if (pagesManifest) {
  ok(
    `pages-manifest.json found with ${Object.keys(pagesManifest).length} entries`,
  );
  for (const [routePath, jsRelPath] of Object.entries(pagesManifest)) {
    if (jsRelPath.endsWith(".html")) continue; // static page, fine
    const jsAbs = path.join(nextServer, jsRelPath);
    if (!fileExists(jsAbs)) {
      fail(
        `Pages route ${routePath} is in manifest but JS file not found: ${jsRelPath}`,
      );
    }
  }
}

// ─── Check 6: middleware-manifest.json ───────────────────────────────────────

const middlewareManifestPath = path.join(nextServer, "middleware-manifest.json");
const middlewareManifest = readJson(middlewareManifestPath);
if (middlewareManifest) {
  ok("middleware-manifest.json present");
  const middlewareFiles = middlewareManifest?.middleware ?? {};
  for (const [name, entry] of Object.entries(middlewareFiles)) {
    const files = entry?.files ?? [];
    for (const f of files) {
      const abs = path.join(projectRoot, ".next", f);
      if (!fileExists(abs)) {
        fail(`Middleware ${name} references missing file: ${f}`);
      }
    }
  }
}

// ─── Check 7: REDIRECT_ONLY / LEGACY_DISABLED routes must NOT have page files ─
// These routes are permanently retired. Their redirects live in next.config.mjs.
// A physical app/[dir]/page.tsx would create a Lambda (or attempt to) during
// `next build`, causing "Unable to find lambda" failures at Vercel packaging time.
// The authoritative fix is no page file — not a force-static declaration.

const MUST_NOT_HAVE_PAGE_FILE = [
  // REDIRECT_ONLY
  path.join("app", "dashboard", "live"),
  path.join("app", "dashboard", "pdf-analytics"),
  path.join("app", "dashboard", "purpose-alignment"),
  path.join("app", "pdf-dashboard"),
  path.join("app", "testing", "lab"),
  // LEGACY_DISABLED
  path.join("app", "downloads", "vault"),
];

for (const rel of MUST_NOT_HAVE_PAGE_FILE) {
  for (const ext of ["page.tsx", "page.ts", "page.jsx", "page.js"]) {
    const abs = path.join(projectRoot, rel, ext);
    if (fileExists(abs)) {
      fail(
        `Retired route has a physical page file: ${path.join(rel, ext)}` +
          ` — delete this file; the redirect belongs in next.config.mjs redirects(), not App Router`,
      );
    }
  }
}

// ─── Check 8: No previously-failing lambda routes may have page files ─────────
// These are the specific routes that triggered "Unable to find lambda" failures
// on Vercel. If any re-appears as a physical page file, fail immediately so
// the deployment does not silently regress.

const KNOWN_FAILED_LAMBDA_ROUTES = [
  path.join("app", "dashboard", "pdf-analytics"),
  path.join("app", "dashboard", "purpose-alignment"),
  path.join("app", "dashboard", "live"),
  path.join("app", "pdf-dashboard"),
  path.join("app", "testing", "lab"),
  path.join("app", "downloads", "vault"),
];

for (const rel of KNOWN_FAILED_LAMBDA_ROUTES) {
  for (const ext of ["page.tsx", "page.ts", "page.jsx", "page.js"]) {
    const abs = path.join(projectRoot, rel, ext);
    if (fileExists(abs)) {
      fail(
        `Previously-failing lambda route re-introduced: ${path.join(rel, ext)}` +
          ` — this route caused "Unable to find lambda" on Vercel; remove the page file`,
      );
    }
  }
}

// ─── Check 9: app/dashboard/** must have no page files at all ─────────────────
// All dashboard sub-routes are retired. Redirects are in next.config.mjs.
// Any page.tsx under app/dashboard/ is a regression waiting to fail.

const dashboardAppDir = path.join(projectRoot, "app", "dashboard");
if (fileExists(dashboardAppDir)) {
  const dashboardPageFiles = collectSourcePageFiles(dashboardAppDir);
  for (const pageFile of dashboardPageFiles) {
    fail(
      `app/dashboard contains a page file: ${path.relative(projectRoot, pageFile)}` +
        ` — all dashboard routes are retired; remove the page file and configure the redirect in next.config.mjs`,
    );
  }
}

// ─── Result ───────────────────────────────────────────────────────────────────

console.log(
  `[route-integrity] Scan complete: ${violations} violation(s), ${warnings} warning(s)`,
);

if (violations > 0) {
  if (WARN_ONLY) {
    console.warn(
      `[route-integrity] ${violations} violation(s) found — running in warn-only mode, not failing build`,
    );
    process.exit(0);
  }
  console.error(
    `[route-integrity] Build blocked: ${violations} route integrity violation(s).\n` +
      `Fix the routes listed above before deploying.`,
  );
  process.exit(1);
}

console.log("[route-integrity] ✓ All route integrity checks passed.");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively collect page.tsx/ts/jsx/js source files under a directory. */
function collectSourcePageFiles(dir) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectSourcePageFiles(full));
      } else if (
        entry.isFile() &&
        /^page\.(tsx|ts|jsx|js)$/.test(entry.name)
      ) {
        results.push(full);
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return results;
}

/** Recursively collect page.js and route.js files under a directory. */
function collectRouteFiles(dir) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectRouteFiles(full));
      } else if (
        entry.isFile() &&
        (entry.name === "page.js" || entry.name === "route.js")
      ) {
        results.push(full);
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return results;
}
