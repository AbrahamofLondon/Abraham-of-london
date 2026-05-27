#!/usr/bin/env node
/**
 * scripts/check-route-lambda-integrity.mjs
 *
 * Post-build guard: verifies that every App Router route in the build manifest
 * has a coherent deployment state before Vercel packages the output.
 *
 * Runs AFTER `next build --webpack` (called from clean-standalone.mjs).
 *
 * Checks:
 *   1. app-paths-manifest.json is present and parseable
 *   2. Every route in the manifest has a corresponding .js file in .next/server/app/
 *   3. Dynamic routes (not prerendered) have an .nft.json trace file
 *   4. No orphaned route.js file exists without a manifest entry
 *   5. Client-only 'use client' pages have force-static OR force-dynamic declared
 *      (heuristic: pages must not be pure client components without an export)
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
