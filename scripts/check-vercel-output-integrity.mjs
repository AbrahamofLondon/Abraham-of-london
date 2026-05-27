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
  "app/dashboard/pdf-analytics/page",
  "app/dashboard/purpose-alignment/page",
  "app/dashboard/live/page",
  "app/pdf-dashboard/page",
  "app/testing/lab/page",
  "app/downloads/vault/page",
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

    // Derive the expected Vercel function name from the route path.
    // Vercel names functions after the URL path segments, replacing
    // [param] with [param] and [...slug] with [...slug].
    // The .func directory mirrors the URL structure.
    const funcName = routePath === "/" ? "index" : routePath.replace(/^\//, "");
    const expectedFuncDir = path.join(vercelFunctions, `${funcName}.func`);

    // Also check for RSC variant
    if (routePath.endsWith("/page")) {
      // Already a page route — check normally
    }

    // Static routes won't have a .func dir — they live in .vercel/output/static
    // We can't distinguish static vs dynamic here without the prerender manifest,
    // so we warn rather than fail on missing .func.
    if (!fileExists(expectedFuncDir)) {
      // Check if this is in the static output instead
      const staticEquiv = path.join(
        vercelOutput,
        "static",
        routePath === "/" ? "index.html" : `${routePath}.html`,
      );
      if (!fileExists(staticEquiv)) {
        warn(
          `Route ${routePath} has a compiled JS file but no .func or static output found` +
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

// ─── Result summary ───────────────────────────────────────────────────────────

console.log("\n[vercel-output] ── Build Output Summary ──────────────────────────");
console.log(`[vercel-output]   Total functions:    ${funcDirs.length}`);
console.log(`[vercel-output]   Dynamic routes:     ${dynamicRouteCount}`);
console.log(`[vercel-output]   Static routes:      ${staticRouteCount}`);
console.log(`[vercel-output]   Missing output:     ${missingFunctions.length}`);

if (funcSizes.length > 0) {
  const top = funcSizes.slice(0, 20);
  console.log(`\n[vercel-output] ── Largest ${top.length} function(s) ─────────────────────`);
  for (const { name, size } of top) {
    const mb = (size / 1024 / 1024).toFixed(1);
    const bar = size > LAMBDA_SIZE_LIMIT_BYTES ? " ✗ OVER LIMIT" : "";
    console.log(`[vercel-output]   ${mb.padStart(6)} MB  ${name}${bar}`);
  }
}

if (missingFunctions.length > 0) {
  console.log(`\n[vercel-output] ── Routes without output entries ────────────────`);
  for (const r of missingFunctions) {
    console.log(`[vercel-output]   ${r}`);
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
    `[vercel-output] Output gate failed: ${violations} violation(s). Fix before deploying.`,
  );
  process.exit(1);
}

console.log("[vercel-output] ✓ Vercel output integrity checks passed.");
