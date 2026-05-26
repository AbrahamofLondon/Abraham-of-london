/**
 * scripts/market-readiness-gate.mjs
 *
 * CI Market-Readiness Gate — Enforced Operating Spine
 *
 * Fails if:
 *  1. pnpm build:netlify has not completed in this workspace
 *  2. .netlify build marker output is absent
 *  3. .next build output is absent
 *  4. DATABASE_URL is absent
 *  5. Product/admin/commercial routes drift from disk
 *  6. Pages Router SSG imports unsafe MDX runtime
 *  7. App Router pages directly use useSearchParams
 *  8. Local imports rely on Windows case-insensitive resolution
 *
 * Usage: node scripts/market-readiness-gate.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectAppRouterSearchParamsViolations } from "./check-app-router-searchparams.mjs";
import { collectCaseSensitiveImportViolations } from "./check-case-sensitive-imports.mjs";
import { collectUnsafeMdxPrerenderViolations } from "./check-unsafe-mdx-prerender.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env.local for local runs (CI sets DATABASE_URL in the shell environment).
// This does not override env vars that are already set.
const envLocalPath = path.join(ROOT, ".env.local");
if (!process.env.DATABASE_URL && fs.existsSync(envLocalPath)) {
  const raw = fs.readFileSync(envLocalPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let failures = 0;
let warnings = 0;

function fail(msg) {
  console.error(`  ✗ FAIL  ${msg}`);
  failures++;
}

function warn(msg) {
  console.warn(`  ⚠ WARN  ${msg}`);
  warnings++;
}

function pass(msg) {
  console.log(`  ✓ OK    ${msg}`);
}

function section(title) {
  console.log(`\n▸ ${title}`);
}

function runInProcessCheck(collector, label) {
  const violations = collector(ROOT);
  if (violations.length === 0) {
    pass(label);
    return;
  }

  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  fail(`${label} failed`);
}

// ─── Route existence (mirrors lib/platform/route-existence.ts logic) ─────────

function routeExistsOnDisk(route) {
  const segs = route.replace(/^\//, "").split("/").filter(Boolean);
  if (segs.length === 0) {
    return (
      fs.existsSync(path.join(ROOT, "app", "page.tsx")) ||
      fs.existsSync(path.join(ROOT, "pages", "index.tsx"))
    );
  }

  const segPath = segs.join(path.sep);
  const candidates = [
    path.join(ROOT, "pages", segPath + ".tsx"),
    path.join(ROOT, "pages", segPath + ".ts"),
    path.join(ROOT, "pages", segPath, "index.tsx"),
    path.join(ROOT, "pages", segPath, "index.ts"),
    path.join(ROOT, "app", segPath, "page.tsx"),
    path.join(ROOT, "app", segPath, "page.ts"),
    path.join(ROOT, "app", segPath, "route.ts"),
    path.join(ROOT, "app", segPath, "route.tsx"),
  ];

  // Also check dynamic segment variants
  function findWithDynamics(baseDir, remaining, depth = 0) {
    if (depth > 8) return false;
    if (remaining.length === 0) {
      return (
        fs.existsSync(path.join(baseDir, "page.tsx")) ||
        fs.existsSync(path.join(baseDir, "index.tsx"))
      );
    }
    const [head, ...tail] = remaining;
    if (!fs.existsSync(baseDir)) return false;
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const isDynamic =
        /^\[/.test(e.name) || e.name === head;
      if (isDynamic) {
        if (findWithDynamics(path.join(baseDir, e.name), tail, depth + 1))
          return true;
      }
    }
    return false;
  }

  return (
    candidates.some((c) => fs.existsSync(c)) ||
    findWithDynamics(path.join(ROOT, "pages"), segs) ||
    findWithDynamics(path.join(ROOT, "app"), segs)
  );
}

// ─── Load registries (CommonJS-compatible transpile with ts-node/esm) ─────────
// We use JSON snapshots produced by the registries themselves where possible.
// For direct registry access we need ts-node or compiled output.
// This gate runs in CI after `pnpm build`, so .next/server is available.
// We read the TypeScript source directly via the compiled registry exports
// that Next.js writes during build.

// Fallback: parse registry source as JSON-ish text if compiled output absent.
function loadRegistryEntries(relPath, _arrayName) {
  const srcPath = path.join(ROOT, relPath);
  if (!fs.existsSync(srcPath)) return null;

  const raw = fs.readFileSync(srcPath, "utf8");
  // Strip line comments and block comments before pattern matching to
  // avoid picking up route: "..." patterns that only appear in comments.
  const src = raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  const entries = [];
  const routeRe = /route\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = routeRe.exec(src)) !== null) {
    entries.push(m[1]);
  }
  return entries;
}

function loadNavItems(relPath) {
  const src = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  const items = [];

  // Match href: "...", status: "...", visibility: "..."
  const blockRe = /\{[^}]+\}/g;
  let block;
  while ((block = blockRe.exec(src)) !== null) {
    const hrefM = /href\s*:\s*"([^"]+)"/.exec(block[0]);
    const statusM = /status\s*:\s*"([^"]+)"/.exec(block[0]);
    const visM = /visibility\s*:\s*"([^"]+)"/.exec(block[0]);
    const idM = /id\s*:\s*"([^"]+)"/.exec(block[0]);
    if (hrefM && statusM && visM && idM) {
      items.push({
        id: idM[1],
        href: hrefM[1],
        status: statusM[1],
        visibility: visM[1],
      });
    }
  }
  return items;
}

function loadProductLadder() {
  const src = fs.readFileSync(
    path.join(ROOT, "lib/platform/product-ladder-registry.ts"),
    "utf8",
  );
  const entries = [];
  const blocks = src.match(/\{[^{}]*id\s*:\s*"[^"]*"[^{}]*route\s*:\s*"[^"]*"[^{}]*\}/g) || [];
  for (const block of blocks) {
    const idM = /id\s*:\s*"([^"]+)"/.exec(block);
    const routeM = /route\s*:\s*"([^"]+)"/.exec(block);
    const adminM = /adminOwnerSurface\s*:\s*"([^"]+)"/.exec(block);
    const statusM = /publicStatus\s*:\s*"([^"]+)"/.exec(block);
    if (idM && routeM) {
      entries.push({
        id: idM[1],
        route: routeM[1],
        adminOwnerSurface: adminM ? adminM[1] : null,
        publicStatus: statusM ? statusM[1] : "PUBLIC",
      });
    }
  }
  return entries;
}

// ─── Gate 1: Netlify parity build output exists ──────────────────────────────

section("Gate 1 — Netlify parity build output");
const buildIdPath = path.join(ROOT, ".next", "BUILD_ID");
const nextServerPath = path.join(ROOT, ".next", "server");
const netlifyDir = path.join(ROOT, ".netlify");
const netlifyMarkerPath = path.join(netlifyDir, "aol-parity-build.json");
if (!fs.existsSync(buildIdPath)) {
  fail(
    ".next/BUILD_ID not found — run pnpm build:netlify before the final market-readiness gate.",
  );
} else {
  pass(".next/BUILD_ID present");
}

if (!fs.existsSync(nextServerPath)) {
  fail(".next/server not found — Next build output is incomplete.");
} else {
  pass(".next/server present");
}

if (!fs.existsSync(netlifyDir)) {
  fail(".netlify directory not found — pnpm build:netlify did not complete its parity marker step.");
} else {
  pass(".netlify directory present");
}

if (!fs.existsSync(netlifyMarkerPath)) {
  fail(".netlify/aol-parity-build.json not found — plain local builds cannot satisfy readiness.");
} else {
  try {
    const marker = JSON.parse(fs.readFileSync(netlifyMarkerPath, "utf8"));
    const currentBuildId = fs.existsSync(buildIdPath)
      ? fs.readFileSync(buildIdPath, "utf8").trim()
      : null;
    if (marker.command !== "pnpm build:netlify") {
      fail("Netlify parity marker command is invalid.");
    } else if (!currentBuildId || marker.nextBuildId !== currentBuildId) {
      fail("Netlify parity marker does not match the current .next/BUILD_ID.");
    } else {
      pass("pnpm build:netlify completion marker matches current Next build");
    }
  } catch (err) {
    fail(`Could not parse Netlify parity marker: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Gate 2: Product ladder routes exist on disk ──────────────────────────────

section("Gate 2 — Product ladder route existence");
const ladderEntries = loadProductLadder();
if (!ladderEntries.length) {
  fail("Could not parse product-ladder-registry.ts");
} else {
  for (const entry of ladderEntries) {
    if (entry.publicStatus === "RETIRED") {
      pass(`${entry.id} RETIRED — skipped`);
      continue;
    }
    if (routeExistsOnDisk(entry.route)) {
      pass(`${entry.id} → ${entry.route}`);
    } else {
      fail(`Product surface "${entry.id}" route "${entry.route}" has no file on disk`);
    }
  }
}

// ─── Gate 3: Admin nav items in domain registry ───────────────────────────────

section("Gate 3 — Admin nav → admin-domain-registry alignment");
const navItems = loadNavItems("lib/admin/admin-navigation.ts");
const registryRoutes = new Set(
  loadRegistryEntries("lib/platform/admin-domain-registry.ts", "ADMIN_ROUTES"),
);

if (!navItems.length || !registryRoutes.size) {
  warn("Could not parse admin navigation or registry");
} else {
  for (const item of navItems) {
    if (item.status !== "active") continue;
    if (item.visibility === "internal") continue;
    if (registryRoutes.has(item.href)) {
      pass(`nav "${item.id}" (${item.href}) registered`);
    } else {
      fail(
        `Active nav item "${item.id}" (${item.href}) not found in admin-domain-registry`,
      );
    }
  }
}

// ─── Gate 4: Admin nav routes exist on disk ───────────────────────────────────

section("Gate 4 — Admin nav route existence");
for (const item of navItems) {
  if (item.status !== "active") continue;
  if (item.visibility === "internal") continue;
  if (routeExistsOnDisk(item.href)) {
    pass(`${item.id} → ${item.href}`);
  } else {
    fail(
      `Nav item "${item.id}" (${item.href}) has no route file on disk`,
    );
  }
}

// ─── Gate 5: Admin owner routes for product surfaces exist ────────────────────

section("Gate 5 — Product surface admin owner routes");
for (const entry of ladderEntries) {
  if (entry.publicStatus === "RETIRED") continue;
  if (!entry.adminOwnerSurface) {
    fail(`Product surface "${entry.id}" has no adminOwnerSurface declared`);
    continue;
  }
  if (!registryRoutes.has(entry.adminOwnerSurface)) {
    fail(
      `Product surface "${entry.id}" adminOwnerSurface "${entry.adminOwnerSurface}" not in admin-domain-registry`,
    );
  } else if (!routeExistsOnDisk(entry.adminOwnerSurface)) {
    fail(
      `Product surface "${entry.id}" adminOwnerSurface "${entry.adminOwnerSurface}" has no route file on disk`,
    );
  } else {
    pass(`${entry.id} → ${entry.adminOwnerSurface}`);
  }
}

// ─── Gate 6: Commercial-critical product routes ───────────────────────────────

section("Gate 6 — Commercial-critical routes");
const COMMERCIAL_CRITICAL = [
  // Product surfaces
  { id: "fast-diagnostic",      route: "/diagnostic",                  label: "Fast Diagnostic" },
  { id: "executive-reporting",  route: "/admin/reporting/executive",   label: "Executive Reporting" },
  { id: "boardroom-mode",       route: "/boardroom",                   label: "Boardroom Mode" },
  { id: "strategy-room",        route: "/strategy-room",               label: "Strategy Room" },
  { id: "boardroom-delivery",   route: "/admin/boardroom-delivery",    label: "Boardroom Delivery (admin)" },
  // Payment & delivery infrastructure
  { id: "checkout",             route: "/api/checkout",                label: "Stripe Checkout API" },
  { id: "stripe-webhook",       route: "/api/stripe/webhook",          label: "Stripe Webhook Handler" },
  { id: "paid-er-delivery",     route: "/client/reports",              label: "Paid ER Delivery (client view)" },
  { id: "client-report-delivery", route: "/client",                   label: "Client Report Delivery" },
  { id: "client-portal",        route: "/portal",                      label: "Client Portal" },
];

for (const surface of COMMERCIAL_CRITICAL) {
  if (routeExistsOnDisk(surface.route)) {
    pass(`${surface.label} (${surface.route})`);
  } else {
    fail(
      `Commercial-critical surface "${surface.label}" route "${surface.route}" missing`,
    );
  }
}

// ─── Gate 7: Governance event bus durability (env check) ─────────────────────

section("Gate 7 — Governance event bus durability");
const dbUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? "";
if (!dbUrl) {
  fail(
    "DATABASE_URL not set — durable audit/lineage writes cannot be verified. " +
      "Set DATABASE_URL before running the final market-readiness gate.",
  );
} else {
  pass("DATABASE_URL present — durable governance writes available");
}

// ─── Gate 8: Production parity guardrails ────────────────────────────────────

section("Gate 8 — Production parity guardrails");
runInProcessCheck(
  collectUnsafeMdxPrerenderViolations,
  "No unsafe MDX SSG imports",
);
runInProcessCheck(
  collectAppRouterSearchParamsViolations,
  "No App Router useSearchParams violations",
);
runInProcessCheck(
  collectCaseSensitiveImportViolations,
  "No case-sensitive import mismatches",
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n────────────────────────────────────────────────────");
if (failures > 0 || warnings > 0) {
  console.error(
    `\n❌  Market-readiness gate FAILED — ${failures} failure(s), ${warnings} warning(s)\n`,
  );
  process.exit(1);
} else {
  console.log(
    `\n✅  Market-readiness gate PASSED — 0 failures, 0 warnings\n`,
  );
}
