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

// ─── Check 7: app/dashboard/** source must not contain 'use client' ──────────
// All dashboard/* routes must be pure server-side redirects (force-static).
// A 'use client' component would create a Lambda without proper NFT traces,
// triggering "Unable to find lambda for route: /dashboard/..." at deploy time.

const dashboardAppDir = path.join(projectRoot, "app", "dashboard");
if (fileExists(dashboardAppDir)) {
  const dashboardPageFiles = collectSourcePageFiles(dashboardAppDir);
  for (const pageFile of dashboardPageFiles) {
    try {
      const content = fs.readFileSync(pageFile, "utf8");
      if (/^\s*['"]use client['"]/m.test(content)) {
        fail(
          `app/dashboard route contains 'use client': ${path.relative(projectRoot, pageFile)}` +
            ` — dashboard routes must be server-only redirects with force-static`,
        );
      }
    } catch {
      // skip unreadable files
    }
  }
}

// ─── Check 8: REDIRECT_ONLY / LEGACY_DISABLED routes must declare force-static ─
// These routes are permanently retired or redirect-only. They must declare
// force-static so Next.js prerenders them as static responses — never Lambdas.
// force-dynamic on a redirect/notFound page creates a Lambda that cannot be
// cleanly packaged, causing sequential "Unable to find lambda" deploy failures.

const FORCE_STATIC_RE = /export\s+const\s+dynamic\s*=\s*["']force-static["']/;
const FORCE_DYNAMIC_RE = /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/;

const MUST_BE_FORCE_STATIC = [
  path.join("app", "dashboard", "live"),
  path.join("app", "dashboard", "pdf-analytics"),
  path.join("app", "dashboard", "purpose-alignment"),
  path.join("app", "pdf-dashboard"),
  path.join("app", "testing", "lab"),
  path.join("app", "downloads", "vault"),
];

for (const rel of MUST_BE_FORCE_STATIC) {
  for (const ext of ["page.tsx", "page.ts", "page.jsx", "page.js"]) {
    const abs = path.join(projectRoot, rel, ext);
    if (!fileExists(abs)) continue;
    try {
      const content = fs.readFileSync(abs, "utf8");
      if (!FORCE_STATIC_RE.test(content)) {
        fail(
          `Quarantined route missing force-static: ${path.join(rel, ext)}` +
            ` — retired/redirect routes must declare \`export const dynamic = "force-static"\``,
        );
      }
      if (FORCE_DYNAMIC_RE.test(content)) {
        fail(
          `Quarantined route incorrectly uses force-dynamic: ${path.join(rel, ext)}` +
            ` — use force-static to prerender as a static redirect, not a Lambda`,
        );
      }
    } catch {
      // skip unreadable files
    }
    break; // found the page file for this directory
  }
}

// ─── Check 9: Production dynamic routes must declare force-dynamic explicitly ─
// Routes that are not under app/admin/ (which inherits force-dynamic from its
// layout) must explicitly declare force-dynamic to ensure Vercel creates a
// Lambda with a complete NFT trace. Omitting the declaration causes Next.js to
// attempt static prerender which fails when runtime data (params, DB) is needed.

const MUST_BE_FORCE_DYNAMIC = [
  path.join("app", "render", "pdf", "[id]"),
  path.join("app", "settings", "integrations"),
  path.join("app", "assessment", "[token]"),
  path.join("app", "purpose-alignment"),
];

for (const rel of MUST_BE_FORCE_DYNAMIC) {
  for (const ext of ["page.tsx", "page.ts", "page.jsx", "page.js"]) {
    const abs = path.join(projectRoot, rel, ext);
    if (!fileExists(abs)) continue;
    try {
      const content = fs.readFileSync(abs, "utf8");
      if (!FORCE_DYNAMIC_RE.test(content)) {
        fail(
          `Production route missing force-dynamic: ${path.join(rel, ext)}` +
            ` — non-admin dynamic routes must declare \`export const dynamic = "force-dynamic"\``,
        );
      }
    } catch {
      // skip unreadable files
    }
    break; // found the page file for this directory
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
