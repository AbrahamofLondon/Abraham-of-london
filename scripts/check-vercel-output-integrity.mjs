#!/usr/bin/env node
/**
 * scripts/check-vercel-output-integrity.mjs
 *
 * Post-`npx vercel build` gate: validates the actual packaging output
 * produced by @vercel/next before any deployment attempt.
 *
 * MUST be run after `npx vercel build` completes. Never run after `next build`
 * alone — the .vercel/output directory is only produced by the Vercel adapter.
 *
 * Checks:
 *   1. .vercel/output/config.json exists and is non-trivial (> 50 bytes)
 *   2. .vercel/output/functions exists when dynamic routes are present
 *   3. No previously-failing "Unable to find lambda" routes appear in
 *      .next/server/app as compiled page files without a corresponding
 *      .vercel/output/functions entry
 *   4. No Vercel function exceeds 50 MB (Hobby plan Lambda limit)
 *   5. Every route in app-paths-manifest.json that expects a function
 *      has a .vercel/output/functions/**\/.func directory
 *
 * Prints:
 *   - Total function count
 *   - Largest 20 functions (by directory size)
 *   - Routes with missing output entries
 *   - Static vs dynamic counts
 *
 * Exit codes:
 *   0  — all checks pass
 *   1  — at least one violation found
 *
 * Usage:
 *   node scripts/check-vercel-output-integrity.mjs [--warn-only]
 */

import fs from "node:fs";
import path from "node:path";

const WARN_ONLY = process.argv.includes("--warn-only");
const projectRoot = process.cwd();
const vercelOutput = path.join(projectRoot, ".vercel", "output");
const vercelFunctions = path.join(vercelOutput, "functions");
const vercelConfig = path.join(vercelOutput, "config.json");
const nextServer = path.join(projectRoot, ".next", "server");

// Lambda size limit for Vercel Hobby plan (unzipped)
const LAMBDA_SIZE_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB

// Routes that were previously failing with "Unable to find lambda" —
// if any of these appear as compiled server files without a corresponding
// Vercel function, it is an immediate failure.
const KNOWN_FAILED_LAMBDA_ROUTES_APP_PATHS = [
  // These pages have been rebuilt as server-wrapper + client-component:
  //   app/dashboard/pdf-analytics/page  → PdfAnalyticsClient.tsx
  //   app/pdf-dashboard/page            → PdfDashboardClient.tsx
  //   app/downloads/vault/page          → VaultBrowserClient.tsx
  // They are expected to have .func directories and are NOT in this list.
  //
  // Permanently retired routes (no page file, redirect only):
  "app/dashboard/purpose-alignment/page",
  "app/dashboard/live/page",
  "app/testing/lab/page",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

let violations = 0;
let warnings = 0;

function fail(msg) {
  console.error(`[vercel-output] ✗ FAIL: ${msg}`);
  violations++;
}

function warn(msg) {
  console.warn(`[vercel-output] ⚠ WARN: ${msg}`);
  warnings++;
}

function ok(msg) {
  if (process.env.VERCEL_OUTPUT_VERBOSE === "1") {
    console.log(`[vercel-output] ✓ ${msg}`);
  }
}

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

/**
 * Convert a Next App Router manifest key to the public URL path Vercel uses
 * when naming output functions.
 *
 * Examples:
 *   /api/search/route                  -> /api/search
 *   /settings/integrations/page        -> /settings/integrations
 *   /(dashboard)/portfolio/page        -> /portfolio
 */
function appManifestKeyToUrlPath(routePath) {
  const withoutLeaf = routePath.replace(/\/(?:page|route)$/, "") || "/";
  const segments = withoutLeaf
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^\(.+\)$/.test(segment))
    .filter((segment) => !segment.startsWith("@"));

  return segments.length ? `/${segments.join("/")}` : "/";
}

function urlPathToFuncName(urlPath) {
  return urlPath === "/" ? "index" : urlPath.replace(/^\//, "");
}

/** Recursively sum directory size in bytes. */
function dirSize(dir) {
  let total = 0;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) total += dirSize(full);
      else if (entry.isFile()) total += fs.statSync(full).size;
    }
  } catch {}
  return total;
}

/** Recursively collect .func directories under a base directory. */
function collectFuncDirs(dir) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.endsWith(".func")) {
          results.push(full);
        } else {
          results.push(...collectFuncDirs(full));
        }
      }
    }
  } catch {}
  return results;
}

// ─── Guard: .vercel/output must exist ────────────────────────────────────────

if (!fileExists(vercelOutput)) {
  console.error(
    "[vercel-output] .vercel/output not found — run `npx vercel build` first.",
  );
  process.exit(WARN_ONLY ? 0 : 1);
}

// ─── Check 1: config.json exists and is non-trivial ──────────────────────────

if (!fileExists(vercelConfig)) {
  fail(".vercel/output/config.json is missing");
} else {
  const stat = fs.statSync(vercelConfig);
  if (stat.size < 50) {
    fail(
      `.vercel/output/config.json is suspiciously small (${stat.size} bytes) — Vercel adapter may have failed to produce output`,
    );
  } else {
    const cfg = readJson(vercelConfig);
    if (!cfg || typeof cfg !== "object") {
      fail(".vercel/output/config.json is not valid JSON");
    } else {
      ok(`config.json present (${stat.size} bytes, version: ${cfg.version ?? "unknown"})`);
    }
  }
}

// ─── Check 2: functions directory when dynamic routes expected ────────────────

const appPathsManifest = readJson(
  path.join(nextServer, "app-paths-manifest.json"),
);

let dynamicRouteCount = 0;
let staticRouteCount = 0;

// Check if functions dir exists when we have dynamic routes
if (appPathsManifest && Object.keys(appPathsManifest).length > 0) {
  if (!fileExists(vercelFunctions)) {
    fail(
      ".vercel/output/functions does not exist but app-paths-manifest.json has entries — Vercel adapter did not package any functions",
    );
  } else {
    ok(".vercel/output/functions directory exists");
  }
}

// ─── Check 3: Known previously-failing routes must NOT have server files ─────

for (const relAppPath of KNOWN_FAILED_LAMBDA_ROUTES_APP_PATHS) {
  const jsFile = path.join(nextServer, `${relAppPath}.js`);
  if (fileExists(jsFile)) {
    fail(
      `Previously-failing lambda route has a compiled server file: .next/server/${relAppPath}.js` +
        ` — this route caused "Unable to find lambda" on Vercel; ensure the page file is deleted`,
    );
  } else {
    ok(`Previously-failing route absent from server output: ${relAppPath}`);
  }
}

// ─── Check 4 + 5: Function sizes and manifest coverage ───────────────────────

const funcDirs = fileExists(vercelFunctions) ? collectFuncDirs(vercelFunctions) : [];

// Size check
const funcSizes = [];
for (const funcDir of funcDirs) {
  const size = dirSize(funcDir);
  const relName = path.relative(vercelFunctions, funcDir);
  funcSizes.push({ name: relName, size });
  if (size > LAMBDA_SIZE_LIMIT_BYTES) {
    fail(
      `Lambda exceeds 50 MB limit: ${relName} (${(size / 1024 / 1024).toFixed(1)} MB)` +
        ` — reduce bundle size before deploying`,
    );
  }
}

// Sort descending for reporting
funcSizes.sort((a, b) => b.size - a.size);

// Manifest coverage: every app-paths-manifest entry that produced a .js file
// should have a corresponding .func directory in the output

const missingFunctions = [];
if (appPathsManifest && fileExists(vercelFunctions)) {
  for (const [routePath, jsRelPath] of Object.entries(appPathsManifest)) {
    const jsAbs = path.join(nextServer, jsRelPath);
    if (!fileExists(jsAbs)) {
      // Missing server file — already caught by check-route-lambda-integrity
      continue;
    }

    // Derive the expected Vercel function name from the public URL path.
    // Vercel names functions after the URL path segments, replacing
    // [param] with [param] and [...slug] with [...slug].
    // App Router manifest keys include implementation leaves (`/page`, `/route`)
    // and route groups (`/(group)`), but those are not part of the URL.
    const urlPath = appManifestKeyToUrlPath(routePath);
    const funcName = urlPathToFuncName(urlPath);
    const expectedFuncDir = path.join(vercelFunctions, `${funcName}.func`);

    // Static routes won't have a .func dir — they live in .vercel/output/static
    // We can't distinguish static vs dynamic here without the prerender manifest,
    // so we warn rather than fail on missing .func.
    if (!fileExists(expectedFuncDir)) {
      // Check if this is in the static output instead
      const staticEquiv = path.join(
        vercelOutput,
        "static",
        urlPath === "/" ? "index.html" : `${urlPath}.html`,
      );
      if (!fileExists(staticEquiv)) {
        warn(
          `Route ${routePath} (${urlPath}) has a compiled JS file but no .func or static output found` +
            ` — may cause "Unable to find lambda" at deploy time`,
        );
        missingFunctions.push(routePath);
      } else {
        staticRouteCount++;
        ok(`${routePath} → static`);
      }
    } else {
      dynamicRouteCount++;
      ok(`${routePath} → ${funcName}.func`);
    }
  }
}

// ─── Missing lambda risk analysis ────────────────────────────────────────────
// A route is a "missing lambda risk" if it has a compiled .js in .next/server/app
// but is NOT in prerender-manifest (so it should be a Lambda) AND has no .func dir.
// These are the routes most likely to cause "Unable to find lambda" on Vercel.

const prerenderManifest = readJson(path.join(projectRoot, ".next", "prerender-manifest.json")) ?? {};
const prerenderRoutes = new Set(Object.keys(prerenderManifest.routes ?? {}));

const missingLambdaRisks = [];
const unexpectedStaticRoutes = [];
const unexpectedDynamicRoutes = [];

if (appPathsManifest && fileExists(vercelFunctions)) {
  for (const [routePath] of Object.entries(appPathsManifest)) {
    const urlPath = appManifestKeyToUrlPath(routePath);

    const isPrerendered = prerenderRoutes.has(urlPath);
    const funcName = urlPathToFuncName(urlPath);
    const hasFuncDir = fileExists(path.join(vercelFunctions, `${funcName}.func`));

    if (!isPrerendered && !hasFuncDir) {
      missingLambdaRisks.push({ routePath, urlPath });
    }
  }
}

// ─── Unexpected static/dynamic mismatch analysis ─────────────────────────────
// Routes in prerender-manifest are served statically by Vercel's CDN.
// Routes NOT in prerender-manifest but IN app-paths-manifest need a Lambda.
// Report any route that appears to be miscategorised.

// Static routes that have a .func dir (unexpected: costs Lambda when not needed)
if (fileExists(vercelFunctions)) {
  for (const route of prerenderRoutes) {
    if (!appPathsManifest) break;
    const funcName = urlPathToFuncName(route);
    const hasFuncDir = fileExists(path.join(vercelFunctions, `${funcName}.func`));
    if (hasFuncDir) {
      // Having both static prerender + func dir is fine (ISR needs a Lambda for revalidation)
      // Only report if it looks unexpected (initialRevalidateSeconds is false = permanent static)
      const routeEntry = (prerenderManifest.routes ?? {})[route];
      if (routeEntry && routeEntry.initialRevalidateSeconds === false) {
        unexpectedDynamicRoutes.push(route);
      }
    }
  }
}

// ─── Result summary ───────────────────────────────────────────────────────────

console.log("\n[vercel-output] ════════════════════════════════════════════════════");
console.log("[vercel-output]   VERCEL OUTPUT INTEGRITY REPORT");
console.log("[vercel-output] ════════════════════════════════════════════════════");
console.log(`[vercel-output]   Total .func directories:     ${funcDirs.length}`);
console.log(`[vercel-output]   Prerendered static routes:   ${prerenderRoutes.size}`);
console.log(`[vercel-output]   App Router manifest entries: ${appPathsManifest ? Object.keys(appPathsManifest).length : 0}`);
console.log(`[vercel-output]   Missing lambda risks:        ${missingLambdaRisks.length}`);
console.log(`[vercel-output]   Oversized functions (>50MB): ${funcSizes.filter(f => f.size > LAMBDA_SIZE_LIMIT_BYTES).length}`);

// Every generated function with size
if (funcSizes.length > 0) {
  console.log(`\n[vercel-output] ── All generated functions (${funcSizes.length} total) ──────────────`);
  for (const { name, size } of funcSizes) {
    const mb = (size / 1024 / 1024).toFixed(2);
    const flag = size > LAMBDA_SIZE_LIMIT_BYTES ? "  ✗ OVER 50MB LIMIT" : "";
    console.log(`[vercel-output]   ${mb.padStart(7)} MB  ${name}${flag}`);
  }
}

// Largest 20 (redundant display when all are shown, but explicit per brief)
if (funcSizes.length > 20) {
  const top20 = funcSizes.slice(0, 20);
  console.log(`\n[vercel-output] ── Top 20 largest functions ─────────────────────────────`);
  for (const { name, size } of top20) {
    const mb = (size / 1024 / 1024).toFixed(2);
    const flag = size > LAMBDA_SIZE_LIMIT_BYTES ? "  ✗ OVER LIMIT" : "";
    console.log(`[vercel-output]   ${mb.padStart(7)} MB  ${name}${flag}`);
  }
}

// Routes without output mapping
if (missingFunctions.length > 0) {
  console.log(`\n[vercel-output] ── Routes without output entries (${missingFunctions.length}) ───────────`);
  for (const r of missingFunctions) {
    console.log(`[vercel-output]   ⚠  ${r}`);
  }
}

// Missing lambda risks
if (missingLambdaRisks.length > 0) {
  console.log(`\n[vercel-output] ── Missing lambda risks (${missingLambdaRisks.length}) ──────────────────────`);
  console.log("[vercel-output]   These routes are NOT prerendered and have NO .func dir.");
  console.log("[vercel-output]   They will trigger 'Unable to find lambda' on Vercel.");
  for (const { routePath, urlPath } of missingLambdaRisks) {
    console.log(`[vercel-output]   ✗  ${urlPath}  (manifest key: ${routePath})`);
    fail(`Missing lambda: route "${urlPath}" has compiled JS but no .func and is not prerendered`);
  }
}

// Unexpected static/dynamic mismatches
if (unexpectedDynamicRoutes.length > 0) {
  console.log(`\n[vercel-output] ── Unexpected .func for permanently-static routes (${unexpectedDynamicRoutes.length}) ──`);
  console.log("[vercel-output]   These routes are permanently static but have a .func directory.");
  console.log("[vercel-output]   This is usually harmless (cached Lambda) but worth reviewing.");
  for (const r of unexpectedDynamicRoutes) {
    console.log(`[vercel-output]   ℹ  ${r}`);
  }
}

console.log(
  `\n[vercel-output] Scan complete: ${violations} violation(s), ${warnings} warning(s)`,
);

if (violations > 0) {
  if (WARN_ONLY) {
    console.warn(
      `[vercel-output] ${violations} violation(s) found — running in warn-only mode`,
    );
    process.exit(0);
  }
  console.error(
    `[vercel-output] Output gate FAILED: ${violations} violation(s). Fix before deploying.`,
  );
  process.exit(1);
}

console.log("[vercel-output] ✓ All Vercel output integrity checks passed.");
