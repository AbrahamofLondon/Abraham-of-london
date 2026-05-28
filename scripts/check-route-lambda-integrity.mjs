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
 *   7.  No app/[dir]/page.tsx is a direct "use client" component outside the migration allowlist
 *       Required pattern: page.tsx = server wrapper; client logic in sibling *Client.tsx
 *   8.  Every physical app/[dir]/page.tsx is in route-deployment-registry.ts
 *   9.  Every registry entry with redirectConfigured:true has a source in next.config.mjs
 *   10. DEBUG_INTERNAL routes that are productionDeployable:true must require auth
 *   11. No REDIRECT_ONLY or LEGACY_DISABLED route has a physical app/[dir]/page.tsx
 *   12. No route from previous missing-lambda failures has a physical page file
 *   13. No route under app/dashboard/** has a physical page file
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

// Shared across checks 7, 8, and 13
const appSourceDir = path.join(projectRoot, "app");

// ─── Check 7: No page.tsx may be a direct "use client" component ─────────────
//
// Required pattern:
//   page.tsx       = server component (may export const dynamic = "force-dynamic")
//   *Client.tsx    = sibling 'use client' component containing all interactive logic
//
// Why: A direct 'use client' page.tsx without a server-component wrapper gets added
// to prerender-manifest.json by Next.js. @vercel/next then expects a Lambda for
// that route, but Next.js prerendered it as static HTML →
// "Unable to find lambda for route: /settings/integrations".
//
// Allowlist: existing violations that are currently safe (pending migration).
//   - Admin routes inherit force-dynamic from app/admin/layout.tsx → ƒ Dynamic.
//     They work now but must eventually follow the server-wrapper pattern.
//   - assessment/[token] has force-dynamic + dynamic param → ƒ Dynamic. Works.
//
// To add a new exception: add an entry with a written justification.
// NEVER add an exception without understanding WHY it is safe.

/** @type {Record<string, string>} path (relative to project root) → justification */
const DIRECT_CLIENT_PAGE_ALLOWLIST = {
  // ── Admin routes ─────────────────────────────────────────────────────────
  // app/admin/layout.tsx exports `const dynamic = "force-dynamic"`, which
  // forces ALL child routes to be ƒ (Dynamic) regardless of 'use client'.
  // These pages are safe now but MUST be migrated to the server-wrapper pattern.
  // Migration pass: convert each to page.tsx (server) + *Client.tsx ('use client').
  "app/admin/boardroom-delivery/page.tsx":                             "admin-layout-force-dynamic — pending migration",
  "app/admin/commercial/page.tsx":                                     "admin-layout-force-dynamic — pending migration",
  "app/admin/decision-intelligence/page.tsx":                         "admin-layout-force-dynamic — pending migration",
  "app/admin/decision/contextual-efficacy/page.tsx":                  "admin-layout-force-dynamic — pending migration",
  "app/admin/decision/contextual-ranking/page.tsx":                   "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/chaos/page.tsx":                    "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/data-poisoning/page.tsx":           "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/debug/page.tsx":                    "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/engines/page.tsx":                  "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/health/page.tsx":                   "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/performance/page.tsx":              "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/product-health/page.tsx":           "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/runs/page.tsx":                     "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/runs/[id]/page.tsx":                "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/simulation/boardroom-mode/page.tsx":                        "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/simulation/executive-report-boardroom-bridge/page.tsx":     "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/simulation/executive-reporting/page.tsx":                   "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/simulation/fast-diagnostic/page.tsx":                       "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/simulation/report-lineage/page.tsx":                        "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/simulation/strategy-room/page.tsx":                         "admin-layout-force-dynamic — pending migration",
  "app/admin/intelligence-foundry/trash-day/page.tsx":                "admin-layout-force-dynamic — pending migration",
  "app/admin/organisations/new/page.tsx":                             "admin-layout-force-dynamic — pending migration",
  "app/admin/organisations/[id]/campaigns/new/page.tsx":              "admin-layout-force-dynamic — pending migration",

  // ── Non-admin with force-dynamic + dynamic param ──────────────────────────
  // assessment/[token] has `export const dynamic = "force-dynamic"` AND a
  // dynamic [token] param, making it ƒ (Dynamic) by two independent mechanisms.
  // Safe as-is; migrate in a future client-pattern cleanup pass.
  "app/assessment/[token]/page.tsx": "force-dynamic + dynamic-param → ƒ Dynamic — pending migration",
};

if (fileExists(appSourceDir)) {
  const pageFiles = collectSourcePageFiles(appSourceDir);

  for (const pageFile of pageFiles) {
    const content = fs.readFileSync(pageFile, "utf8");
    if (!isDirectClientPage(content)) continue;

    const relPath = path.relative(projectRoot, pageFile).replace(/\\/g, "/");

    if (DIRECT_CLIENT_PAGE_ALLOWLIST[relPath]) {
      warn(
        `Direct 'use client' page (allowlisted — pending migration): ${relPath}` +
          `\n            Reason: ${DIRECT_CLIENT_PAGE_ALLOWLIST[relPath]}` +
          `\n            Action: convert to server-wrapper + sibling *Client.tsx`,
      );
    } else {
      fail(
        `Direct 'use client' page.tsx not in migration allowlist: ${relPath}` +
          `\n  Required pattern: page.tsx = server component; client logic in sibling *Client.tsx` +
          `\n  See scripts/check-route-lambda-integrity.mjs DIRECT_CLIENT_PAGE_ALLOWLIST` +
          `\n  to add a justified exception, or fix the page now.`,
      );
    }
  }
}

// ─── Check 8: Every physical App Router page must have a registry entry ──────
// Prevents new routes from entering production without explicit classification.
// Every app/[dir]/page.tsx MUST appear in lib/platform/route-deployment-registry.ts.

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

// ─── Check 9: Production DEBUG_INTERNAL routes must require auth ──────────────

const publicDebugRoutes = extractUnauthedProductionDebugRoutes(
  path.join(projectRoot, "lib", "platform", "route-deployment-registry.ts")
);
for (const p of publicDebugRoutes) {
  fail(
    `DEBUG_INTERNAL route "${p}" is productionDeployable:true without requiresAuth:true — ` +
      `internal routes must be auth-gated in production`,
  );
}

// ─── Check 11: REDIRECT_ONLY / LEGACY_DISABLED routes must NOT have page files ─
// These routes are permanently retired. Their redirects live in next.config.mjs.
// A physical app/[dir]/page.tsx would create a Lambda (or attempt to) during
// `next build`, causing "Unable to find lambda" failures at Vercel packaging time.
// The authoritative fix is no page file — not a force-static declaration.

const MUST_NOT_HAVE_PAGE_FILE = [
  // REDIRECT_ONLY — permanently retired, redirect only in next.config.mjs
  path.join("app", "dashboard", "live"),
  path.join("app", "dashboard", "purpose-alignment"),
  // NOTE: pdf-analytics, pdf-dashboard, downloads/vault, and testing/lab have been REBUILT
  // as server-wrapper + client-component pages (C: REBUILD from rollback audit).
  // They have legitimate page.tsx files and are NOT in this retired list.
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
  // Routes that caused "Unable to find lambda" when they used 'use client'
  // directly in page.tsx (without a server wrapper).
  // pdf-analytics, pdf-dashboard, and downloads/vault have been REBUILT with
  // the correct server-wrapper + client-component pattern and are no longer
  // in this list. Their Lambda failures were pattern errors, not route errors.
  // testing/lab has also been restored as a server-wrapper page behind admin auth.
  path.join("app", "dashboard", "purpose-alignment"),
  path.join("app", "dashboard", "live"),
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

// ─── Check 13: app/dashboard/** retired routes must have no page files ─────────
// Most dashboard sub-routes are retired. Exceptions: routes that have been
// rebuilt as server-wrapper + client-component pages (see rollback audit C:REBUILD).

const DASHBOARD_REBUILT_ROUTES = new Set([
  path.join(projectRoot, "app", "dashboard", "pdf-analytics", "page.tsx"),
  path.join(projectRoot, "app", "dashboard", "pdf-analytics", "page.ts"),
  path.join(projectRoot, "app", "dashboard", "pdf-analytics", "page.jsx"),
  path.join(projectRoot, "app", "dashboard", "pdf-analytics", "page.js"),
]);

const dashboardAppDir = path.join(projectRoot, "app", "dashboard");
if (fileExists(dashboardAppDir)) {
  const dashboardPageFiles = collectSourcePageFiles(dashboardAppDir);
  for (const pageFile of dashboardPageFiles) {
    if (DASHBOARD_REBUILT_ROUTES.has(pageFile)) continue; // legitimately rebuilt
    fail(
      `app/dashboard contains a retired page file: ${path.relative(projectRoot, pageFile)}` +
        ` — retired dashboard routes must use next.config.mjs redirects(), not App Router page files`,
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
 * Extract DEBUG_INTERNAL entries that are productionDeployable:true without auth.
 *
 * @param {string} registryPath
 * @returns {string[]}
 */
function extractUnauthedProductionDebugRoutes(registryPath) {
  try {
    const content = fs.readFileSync(registryPath, "utf8");
    const result = [];
    const blockRegex = /\{[^{}]+\}/gs;
    const blocks = content.match(blockRegex) || [];
    for (const block of blocks) {
      const isDebug = /class:\s*["']DEBUG_INTERNAL["']/.test(block);
      const isDeployable = /productionDeployable:\s*true/.test(block);
      const requiresAuth = /requiresAuth:\s*true/.test(block);
      if (isDebug && isDeployable && !requiresAuth) {
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

/**
 * Returns true if the file's first meaningful non-comment line is a
 * "use client" or 'use client' directive.
 *
 * Skips: blank lines, // single-line comments, block comments (/* … *\/)
 *
 * A direct 'use client' page.tsx (without a server-component wrapper) gets
 * added to prerender-manifest.json by Next.js → @vercel/next expects a Lambda
 * → "Unable to find lambda for route: /…". The required pattern is:
 *   page.tsx       = server component (no 'use client')
 *   *Client.tsx    = sibling 'use client' component
 *
 * @param {string} content - raw UTF-8 content of the page.tsx file
 * @returns {boolean}
 */
function isDirectClientPage(content) {
  const lines = content.split("\n");
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track block comments
    if (inBlockComment) {
      if (trimmed.includes("*/")) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) inBlockComment = true;
      continue;
    }

    // Skip blank lines and single-line comments
    if (!trimmed || trimmed.startsWith("//")) continue;

    // First non-comment, non-blank line — check for "use client" directive
    return /^["']use client["'];?$/.test(trimmed);
  }

  return false;
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
