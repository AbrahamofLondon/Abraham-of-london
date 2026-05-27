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
 *   1.  app-paths-manifest.json is present and parseable
 *   2.  Every route in the manifest has a corresponding .js file in .next/server/app/
 *   3.  Dynamic routes (not prerendered) have an .nft.json trace file
 *   4.  No orphaned route.js file exists without a manifest entry
 *   5.  pages-manifest.json (Pages Router) — all entries have JS files
 *   6.  middleware-manifest.json — all referenced files exist
 *   7.  Every physical app/[dir]/page.tsx is in route-deployment-registry.ts
 *   8.  Every registry entry with redirectConfigured:true has a source in next.config.mjs
 *   9.  No DEBUG_INTERNAL route is productionDeployable:true
 *   10. No REDIRECT_ONLY or LEGACY_DISABLED route has a physical app/[dir]/page.tsx
 *   11. No route from previous missing-lambda failures has a physical page file
 *   12. No route under app/dashboard/** has a physical page file
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

// ─── Check 7: Every physical App Router page must have a registry entry ──────
// Prevents new routes from entering production without explicit classification.
// Every app/[dir]/page.tsx MUST appear in lib/platform/route-deployment-registry.ts.

const appSourceDir = path.join(projectRoot, "app");
if (fileExists(appSourceDir)) {
  const physicalPages = collectSourcePageFiles(appSourceDir);

  // Build set of registered paths (exact match)
  const registeredPaths = new Set([
    // Load from the compiled registry — use require on the TS-compiled output
    // OR parse the source file for path values. We parse the source to avoid
    // needing a compiled .js output. Look for: path: "..." entries.
    ...extractRegistryPaths(path.join(projectRoot, "lib", "platform", "route-deployment-registry.ts")),
  ]);

  for (const pageFile of physicalPages) {
    const urlPath = pageFileToUrlPath(appSourceDir, pageFile);
    if (urlPath === null) continue; // skip files we can't parse

    if (!registeredPaths.has(urlPath)) {
      fail(
        `Physical App Router page not in route registry: app${pageFile.slice(appSourceDir.length)}` +
          ` → URL "${urlPath}" — add an entry to lib/platform/route-deployment-registry.ts`,
      );
    } else {
      ok(`Registered: ${urlPath}`);
    }
  }
}

// ─── Check 8: Redirect-declared registry entries must exist in next.config.mjs ─
// If a route entry has redirectConfigured:true and physicalRouteAllowed:false,
// a matching source must appear in next.config.mjs async redirects().

const nextConfigPath = path.join(projectRoot, "next.config.mjs");
const configRedirectSources = extractNextConfigRedirectSources(nextConfigPath);

const REGISTRY_REDIRECT_PATHS = extractRegistryRedirectPaths(
  path.join(projectRoot, "lib", "platform", "route-deployment-registry.ts")
);

for (const registryPath of REGISTRY_REDIRECT_PATHS) {
  if (!configRedirectSources.has(registryPath)) {
    fail(
      `Registry declares redirectConfigured:true for "${registryPath}" but no matching` +
        ` source found in next.config.mjs redirects() — add the redirect or fix the registry`,
    );
  } else {
    ok(`Redirect source "${registryPath}" confirmed in next.config.mjs`);
  }
}

// ─── Check 9: No DEBUG_INTERNAL route may be productionDeployable ─────────────

const debugRoutes = extractDebugInternalProductionDeployable(
  path.join(projectRoot, "lib", "platform", "route-deployment-registry.ts")
);
for (const p of debugRoutes) {
  fail(
    `DEBUG_INTERNAL route "${p}" is marked productionDeployable:true — ` +
      `debug routes must never be reachable in production`,
  );
}

// ─── Check 11: REDIRECT_ONLY / LEGACY_DISABLED routes must NOT have page files ─
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

// ─── Check 12: No previously-failing lambda routes may have page files ────────
// These are the specific routes that triggered "Unable to find lambda" failures
// on Vercel. If any re-appears as a physical page file, fail immediately.

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

// ─── Check 13: app/dashboard/** must have no page files at all ────────────────
// All dashboard sub-routes are retired. Redirects are in next.config.mjs.

const dashboardAppDir = path.join(projectRoot, "app", "dashboard");
if (fileExists(dashboardAppDir)) {
  const dashboardPageFiles = collectSourcePageFiles(dashboardAppDir);
  for (const pageFile of dashboardPageFiles) {
    fail(
      `app/dashboard contains a page file: ${path.relative(projectRoot, pageFile)}` +
        ` — all dashboard routes are retired; remove it and configure the redirect in next.config.mjs`,
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

/**
 * Convert a physical page.tsx path to its URL path.
 * Handles route groups: (dashboard)/portfolio → /portfolio
 * Handles catch-all and dynamic segments unchanged.
 *
 * @param {string} appDir - absolute path to the app/ directory
 * @param {string} pageFile - absolute path to the page.tsx file
 * @returns {string|null} URL path like "/admin/campaigns/[id]" or null if unparseable
 */
function pageFileToUrlPath(appDir, pageFile) {
  // Get relative from app/: "admin/campaigns/[id]/page.tsx"
  let rel = path.relative(appDir, pageFile);
  // Normalize slashes
  rel = rel.replace(/\\/g, "/");
  // Strip page.tsx suffix
  rel = rel.replace(/\/page\.(tsx|ts|jsx|js)$/, "");
  // Remove route group segments: (anything)/
  rel = rel.replace(/\([^)]+\)\//g, "");
  // If nothing left (i.e. page was at app/page.tsx), it's "/"
  if (!rel) return "/";
  return "/" + rel;
}

/**
 * Extract all path: "..." values from the route registry TypeScript source.
 * Uses regex to avoid requiring a compiled output.
 *
 * @param {string} registryPath - path to route-deployment-registry.ts
 * @returns {Set<string>}
 */
function extractRegistryPaths(registryPath) {
  try {
    const content = fs.readFileSync(registryPath, "utf8");
    // Match: path: "/some/path" or path: '/some/path'
    const matches = [...content.matchAll(/\bpath:\s*["']([^"']+)["']/g)];
    return new Set(matches.map((m) => m[1]));
  } catch {
    return new Set();
  }
}

/**
 * Extract paths that have redirectConfigured:true and physicalRouteAllowed:false.
 * Uses a heuristic: find entries where both flags appear together.
 * Regex is not perfect for nested objects; relies on the consistent formatting
 * used in the registry file.
 *
 * @param {string} registryPath
 * @returns {string[]}
 */
function extractRegistryRedirectPaths(registryPath) {
  try {
    const content = fs.readFileSync(registryPath, "utf8");
    const result = [];
    // Split on top-level object boundaries — find each { ... } block that has
    // both redirectConfigured: true and physicalRouteAllowed: false
    const blockRegex = /\{[^{}]+\}/gs;
    const blocks = content.match(blockRegex) || [];
    for (const block of blocks) {
      const hasRedirectTrue = /redirectConfigured:\s*true/.test(block);
      const hasPhysicalFalse = /physicalRouteAllowed:\s*false/.test(block);
      if (hasRedirectTrue && hasPhysicalFalse) {
        const pathMatch = block.match(/\bpath:\s*["']([^"']+)["']/);
        if (pathMatch) result.push(pathMatch[1]);
      }
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Extract paths of DEBUG_INTERNAL entries that are productionDeployable:true.
 *
 * @param {string} registryPath
 * @returns {string[]}
 */
function extractDebugInternalProductionDeployable(registryPath) {
  try {
    const content = fs.readFileSync(registryPath, "utf8");
    const result = [];
    const blockRegex = /\{[^{}]+\}/gs;
    const blocks = content.match(blockRegex) || [];
    for (const block of blocks) {
      const isDebug = /class:\s*["']DEBUG_INTERNAL["']/.test(block);
      const isDeployable = /productionDeployable:\s*true/.test(block);
      if (isDebug && isDeployable) {
        const pathMatch = block.match(/\bpath:\s*["']([^"']+)["']/);
        if (pathMatch) result.push(pathMatch[1]);
      }
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Extract redirect source strings from next.config.mjs using regex.
 * Finds all: source: "..." or source: '...' patterns in the file.
 *
 * @param {string} configPath - path to next.config.mjs
 * @returns {Set<string>}
 */
function extractNextConfigRedirectSources(configPath) {
  try {
    const content = fs.readFileSync(configPath, "utf8");
    const matches = [...content.matchAll(/\bsource:\s*["']([^"']+)["']/g)];
    return new Set(matches.map((m) => m[1]));
  } catch {
    return new Set();
  }
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
