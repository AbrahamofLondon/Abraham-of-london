/**
 * scripts/market-readiness-gate.mjs
 *
 * CI Market-Readiness Gate — Enforced Operating Spine
 *
 * Architecture: Netlify (domain/CDN/proxy) → Vercel (full Next.js runtime)
 *
 * Gates 1–8: Core build integrity
 *   1. pnpm build:netlify has completed (Netlify parity marker)
 *   2. Product ladder routes exist on disk
 *   3. Admin nav items in admin-domain-registry
 *   4. Admin nav routes exist on disk
 *   5. Product surface admin owner routes registered
 *   6. Commercial-critical routes exist on disk
 *   7. DATABASE_URL is present (governance event bus)
 *   8. Production parity guardrails (MDX, useSearchParams, case-sensitive imports)
 *
 * Gate 9: Proxy mode enforcement
 *   9. ___netlify-server-handler must NOT exist (Netlify is proxy-only)
 *
 * Gates A–F: Split architecture (Netlify proxy + Vercel runtime)
 *   A. Netlify proxy configuration (publish=public, no plugin-nextjs, catch-all redirect)
 *   B. Vercel dynamic runtime build (.next present, vercel.json correct)
 *   C. Route classification coverage (reports/route-classification.json)
 *   D. Commercial-critical routes classified as dynamic (not STATIC_NETLIFY)
 *   E. Stripe webhook on dynamic runtime + webhook secret set
 *   F. Paid ER and client delivery readiness (NEXTAUTH_URL, domain, secrets)
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

// ─── Gate 9: Proxy mode — no Netlify server handler ──────────────────────────
//
// In the Netlify-proxy + Vercel-runtime architecture, @netlify/plugin-nextjs
// must NOT run and ___netlify-server-handler must NOT be built.
// If the handler directory or zip exists it means the plugin ran accidentally.

section("Gate 9 — Netlify proxy mode (no ___netlify-server-handler)");
(function checkHandlerAbsent() {
  const handlerDir = path.join(ROOT, ".netlify", "functions", "___netlify-server-handler");
  const handlerZip = path.join(ROOT, ".netlify", "functions", "___netlify-server-handler.zip");

  if (fs.existsSync(handlerDir)) {
    function getDirSizeSync(dir) {
      let total = 0;
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) total += getDirSizeSync(full);
          else if (entry.isFile()) total += fs.statSync(full).size;
        }
      } catch { /* skip inaccessible */ }
      return total;
    }
    const sizeMB = (getDirSizeSync(handlerDir) / (1024 * 1024)).toFixed(1);
    fail(
      `___netlify-server-handler directory exists (${sizeMB} MB) — @netlify/plugin-nextjs must have run. ` +
      "In proxy mode, @netlify/plugin-nextjs should NOT be in netlify.toml. " +
      "Delete the handler directory and remove the plugin from netlify.toml.",
    );
  } else if (fs.existsSync(handlerZip)) {
    const zipMB = (fs.statSync(handlerZip).size / (1024 * 1024)).toFixed(1);
    fail(
      `___netlify-server-handler.zip exists (${zipMB} MB) — @netlify/plugin-nextjs must have run. ` +
      "In proxy mode, this zip must not exist. Remove the plugin from netlify.toml.",
    );
  } else {
    pass("No ___netlify-server-handler — Netlify is in proxy mode (correct)");
  }
})();

// ─── Gate A: Netlify proxy configuration ──────────────────────────────────────
//
// Confirms netlify.toml is correctly configured as a proxy-only deployment:
//  - publish = "public" (not ".next")
//  - build command has no "next build"
//  - @netlify/plugin-nextjs is NOT present
//  - catch-all proxy redirect exists with a non-placeholder URL
//  - public/ directory exists for Netlify CDN

section("Gate A — Netlify proxy configuration");
(function checkNetlifyProxy() {
  const netlifyToml = path.join(ROOT, "netlify.toml");
  if (!fs.existsSync(netlifyToml)) {
    fail("netlify.toml not found");
    return;
  }

  const toml = fs.readFileSync(netlifyToml, "utf8");

  if (/publish\s*=\s*["']\.next["']/.test(toml)) {
    fail("netlify.toml has publish = \".next\" — should be publish = \"public\" in proxy mode");
  } else if (/publish\s*=\s*["']public["']/.test(toml)) {
    pass("netlify.toml publish = \"public\"");
  } else {
    warn("Could not confirm netlify.toml publish directory");
  }

  if (/next build/.test(toml)) {
    fail("netlify.toml build command contains \"next build\" — proxy mode should use the echo command only");
  } else {
    pass("netlify.toml build command has no next build");
  }

  // Check for the plugin DIRECTIVE (package = "..."), not comments that mention it.
  // The toml header comment deliberately says "@netlify/plugin-nextjs is REMOVED" — that's fine.
  const tomlNoComments = toml.replace(/#.*$/gm, "");
  if (/package\s*=\s*["']@netlify\/plugin-nextjs["']/.test(tomlNoComments)) {
    fail("netlify.toml still has a `package = \"@netlify/plugin-nextjs\"` directive — remove this plugin entry in proxy mode");
  } else {
    pass("@netlify/plugin-nextjs package directive not present in netlify.toml");
  }

  // Check for catch-all proxy redirect and warn if still using placeholder
  const catchAllMatch = toml.match(/from\s*=\s*["']\/\*["'][^]*?to\s*=\s*["']([^"']+)["'][^]*?status\s*=\s*200/);
  if (!catchAllMatch) {
    fail("netlify.toml has no catch-all proxy redirect (from = \"/*\" with status = 200) — add it as the last [[redirects]] rule");
  } else {
    const proxyTarget = catchAllMatch[1];
    if (proxyTarget.includes("YOUR_PROJECT")) {
      warn(
        `netlify.toml catch-all proxy redirect still uses placeholder URL: ${proxyTarget} ` +
        "— replace YOUR_PROJECT.vercel.app with the actual Vercel deployment hostname before going live",
      );
    } else {
      pass(`Catch-all proxy redirect configured → ${proxyTarget}`);
    }
  }

  const publicDir = path.join(ROOT, "public");
  if (!fs.existsSync(publicDir)) {
    fail("public/ directory not found — Netlify CDN has nothing to serve for static assets");
  } else {
    pass("public/ directory present");
  }
})();

// ─── Gate B: Vercel dynamic runtime build ─────────────────────────────────────
//
// Confirms the Next.js build output (.next/) is present (produced by pnpm build:fast
// for Vercel) and that vercel.json is correctly configured.

section("Gate B — Vercel dynamic runtime build");
(function checkVercelBuild() {
  const buildId = path.join(ROOT, ".next", "BUILD_ID");
  const nextServer = path.join(ROOT, ".next", "server");
  const vercelJson = path.join(ROOT, "vercel.json");

  if (!fs.existsSync(buildId)) {
    warn(".next/BUILD_ID not found — run pnpm build:fast to produce Vercel build output");
  } else {
    pass(".next/BUILD_ID present");
  }

  if (!fs.existsSync(nextServer)) {
    warn(".next/server not found — Next.js build incomplete");
  } else {
    pass(".next/server present");
  }

  if (!fs.existsSync(vercelJson)) {
    fail("vercel.json not found — Vercel deployment is not configured");
    return;
  }

  let vcfg;
  try {
    vcfg = JSON.parse(fs.readFileSync(vercelJson, "utf8"));
  } catch (e) {
    fail(`vercel.json is not valid JSON: ${e.message}`);
    return;
  }

  const buildCmd = vcfg.buildCommand || "";
  if (!buildCmd.includes("pnpm build:fast") && !buildCmd.includes("next build")) {
    fail(`vercel.json buildCommand does not contain a Next.js build step: "${buildCmd}"`);
  } else {
    pass(`vercel.json buildCommand: "${buildCmd}"`);
  }

  if (!buildCmd.includes("pnpm build:netlify") && !buildCmd.includes("check:netlify")) {
    pass("vercel.json buildCommand correctly excludes pnpm build:netlify (handler check)");
  } else {
    fail("vercel.json buildCommand includes build:netlify or check:netlify — this would fail on Vercel (no ___netlify-server-handler on Vercel)");
  }

  if (vcfg.crons && vcfg.crons.length > 0) {
    pass(`vercel.json has ${vcfg.crons.length} cron job(s) configured`);
  } else {
    warn("vercel.json has no crons — scheduled jobs (cleanup-download-tokens, escalation, decision-state) may not run");
  }
})();

// ─── Gate C: Route classification coverage ────────────────────────────────────
//
// Confirms reports/route-classification.json exists and all dynamic-critical
// categories have at least one classified route.

section("Gate C — Route classification coverage");
(function checkRouteClassification() {
  const classFile = path.join(ROOT, "reports", "route-classification.json");
  if (!fs.existsSync(classFile)) {
    warn(
      "reports/route-classification.json not found — run: node scripts/classify-routes.mjs " +
      "Route classification cannot be verified without this file.",
    );
    return;
  }

  let classification;
  try {
    classification = JSON.parse(fs.readFileSync(classFile, "utf8"));
  } catch (e) {
    fail(`reports/route-classification.json is invalid JSON: ${e.message}`);
    return;
  }

  const REQUIRED_DYNAMIC_CATEGORIES = [
    "ADMIN_DYNAMIC",
    "PAYMENT_DYNAMIC",
    "CLIENT_DELIVERY_DYNAMIC",
    "PUBLIC_DYNAMIC",
  ];

  for (const cat of REQUIRED_DYNAMIC_CATEGORIES) {
    const routes = classification[cat] || [];
    if (routes.length === 0) {
      fail(`Classification category "${cat}" has 0 routes — expected at least 1`);
    } else {
      pass(`${cat}: ${routes.length} route(s) classified`);
    }
  }

  const stripeRoutes = (classification["PAYMENT_DYNAMIC"] || []).filter(
    r => r.includes("stripe") || r.includes("billing"),
  );
  if (stripeRoutes.length === 0) {
    fail("No Stripe/billing routes found in PAYMENT_DYNAMIC — payment processing may be miscategorised");
  } else {
    pass(`PAYMENT_DYNAMIC includes Stripe/billing routes: ${stripeRoutes.length}`);
  }
})();

// ─── Gate D: Commercial-critical routes on dynamic runtime ────────────────────
//
// Verifies that routes which MUST be on Vercel (SSR, auth, payments, admin)
// are NOT classified as STATIC_NETLIFY.

section("Gate D — Commercial-critical routes on dynamic runtime");
(function checkCriticalRoutesOnDynamic() {
  const classFile = path.join(ROOT, "reports", "route-classification.json");
  if (!fs.existsSync(classFile)) {
    warn("reports/route-classification.json not found — skipping Gate D. Run: node scripts/classify-routes.mjs");
    return;
  }

  let classification;
  try {
    classification = JSON.parse(fs.readFileSync(classFile, "utf8"));
  } catch (e) {
    fail(`Could not parse route-classification.json: ${e.message}`);
    return;
  }

  const staticRoutes = new Set(classification["STATIC_NETLIFY"] || []);

  // These path patterns must NOT appear in STATIC_NETLIFY
  const MUST_BE_DYNAMIC = [
    { pattern: /\/admin\//, label: "admin routes" },
    { pattern: /\/api\/stripe\/|\/api\/billing\//, label: "Stripe/billing API routes" },
    { pattern: /\/api\/auth\//, label: "NextAuth API routes" },
    { pattern: /pages\/client\/|pages\/boardroom\/|pages\/inner-circle\/|pages\/directorate\//, label: "client delivery routes" },
    { pattern: /\/api\/admin\//, label: "admin API routes" },
    { pattern: /\/api\/downloads|\/api\/download/, label: "download API routes" },
  ];

  for (const rule of MUST_BE_DYNAMIC) {
    const violations = [...staticRoutes].filter(r => rule.pattern.test(r));
    if (violations.length > 0) {
      for (const v of violations) {
        fail(`Route misclassified as STATIC_NETLIFY (should be dynamic — ${rule.label}): ${v}`);
      }
    } else {
      pass(`No ${rule.label} in STATIC_NETLIFY`);
    }
  }
})();

// ─── Gate E: Stripe webhook on dynamic runtime ────────────────────────────────
//
// Confirms the Stripe webhook route is in PAYMENT_DYNAMIC (not proxied through
// Netlify without raw-body preservation) and that the webhook secret is set.

section("Gate E — Stripe webhook on dynamic runtime");
(function checkStripeWebhook() {
  // Check route exists on disk
  const webhookCandidates = [
    "app/api/stripe/webhook/route.ts",
    "pages/api/stripe/webhook.ts",
    "pages/api/billing/webhook.ts",
    "pages/api/webhooks/stripe.ts",
  ];
  const webhookFiles = webhookCandidates.filter(f => fs.existsSync(path.join(ROOT, f)));
  if (webhookFiles.length === 0) {
    fail("No Stripe webhook route file found — expected one of: " + webhookCandidates.join(", "));
  } else {
    pass(`Stripe webhook route file(s): ${webhookFiles.join(", ")}`);
  }

  // Check route classification
  const classFile = path.join(ROOT, "reports", "route-classification.json");
  if (fs.existsSync(classFile)) {
    let classification;
    try {
      classification = JSON.parse(fs.readFileSync(classFile, "utf8"));
    } catch { classification = null; }

    if (classification) {
      const paymentRoutes = classification["PAYMENT_DYNAMIC"] || [];
      const stripeInPayment = paymentRoutes.some(r => /stripe|billing|webhook/.test(r));
      if (!stripeInPayment) {
        warn(
          "No Stripe/billing/webhook routes found in PAYMENT_DYNAMIC classification. " +
          "Run node scripts/classify-routes.mjs to regenerate.",
        );
      } else {
        pass(`Stripe webhook classified as PAYMENT_DYNAMIC (${paymentRoutes.length} payment routes)`);
      }

      const staticRoutes = classification["STATIC_NETLIFY"] || [];
      const stripeInStatic = staticRoutes.some(r => /stripe|billing|webhook/.test(r));
      if (stripeInStatic) {
        fail("Stripe/webhook route(s) found in STATIC_NETLIFY — Stripe webhooks require raw-body and must be on the dynamic runtime");
      } else {
        pass("No Stripe/webhook routes in STATIC_NETLIFY");
      }
    }
  } else {
    warn("reports/route-classification.json not found — cannot verify Stripe webhook classification");
  }

  // Check env vars
  const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!stripeSecret) {
    warn("STRIPE_SECRET_KEY not set — set on Vercel before going live");
  } else if (stripeSecret.startsWith("sk_test_")) {
    warn("STRIPE_SECRET_KEY is a TEST key — confirm this is intentional for production");
  } else {
    pass("STRIPE_SECRET_KEY present");
  }
  if (!webhookSecret) {
    warn("STRIPE_WEBHOOK_SECRET not set — set on Vercel matching the Stripe Dashboard webhook signing secret");
  } else {
    pass("STRIPE_WEBHOOK_SECRET present");
  }
})();

// ─── Gate F: Paid ER and client delivery readiness ────────────────────────────
//
// Confirms that paid client-delivery routes are present on disk, NEXTAUTH_URL
// is set to the public domain (not a .vercel.app URL), and key delivery env
// vars are configured on Vercel.

section("Gate F — Paid ER and client delivery readiness");
(function checkPaidERReadiness() {
  // Route existence for paid delivery surfaces
  const DELIVERY_ROUTES = [
    { route: "/admin/reporting/executive", label: "Executive Reporting admin surface" },
    { route: "/client/reports",            label: "Client ER report delivery" },
    { route: "/boardroom",                 label: "Boardroom Mode" },
    { route: "/inner-circle",              label: "Inner Circle" },
    // App Router: app/api/download/[token]/route.ts
    { route: "/api/download/[token]",      label: "Authenticated download API" },
  ];

  for (const { route, label } of DELIVERY_ROUTES) {
    if (routeExistsOnDisk(route)) {
      pass(`${label} (${route}) — route file present`);
    } else {
      warn(`${label} (${route}) — no route file found on disk`);
    }
  }

  // NEXTAUTH_URL must be the public domain, not a Vercel deployment URL
  const nextAuthUrl = process.env.NEXTAUTH_URL || "";
  if (!nextAuthUrl) {
    warn("NEXTAUTH_URL not set — must be set to https://www.abrahamoflondon.org on Vercel");
  } else if (nextAuthUrl.includes(".vercel.app")) {
    fail(
      `NEXTAUTH_URL is set to a Vercel deployment URL: "${nextAuthUrl}" — ` +
      "must be set to https://www.abrahamoflondon.org (the public domain visible to users). " +
      "Admin login emails, OAuth callbacks, and session cookies will break if this is wrong.",
    );
  } else if (nextAuthUrl.includes("localhost")) {
    warn(`NEXTAUTH_URL is set to localhost: "${nextAuthUrl}" — expected in dev, must be changed for production`);
  } else {
    pass(`NEXTAUTH_URL: "${nextAuthUrl}"`);
  }

  // NEXT_PUBLIC_APP_URL must also be the public domain
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (!appUrl) {
    warn("NEXT_PUBLIC_APP_URL not set — secure report links and email templates may use wrong domain");
  } else if (appUrl.includes(".vercel.app")) {
    warn(
      `NEXT_PUBLIC_APP_URL is set to a Vercel deployment URL: "${appUrl}" — ` +
      "client-facing report links and email templates will point to .vercel.app instead of abrahamoflondon.org",
    );
  } else {
    pass(`NEXT_PUBLIC_APP_URL: "${appUrl}"`);
  }

  // Download token secret — required for paid PDF delivery
  if (!process.env.DOWNLOAD_TOKEN_SECRET) {
    warn("DOWNLOAD_TOKEN_SECRET not set — signed download URLs will not work");
  } else {
    pass("DOWNLOAD_TOKEN_SECRET present");
  }

  // NEXTAUTH_SECRET
  if (!process.env.NEXTAUTH_SECRET) {
    warn("NEXTAUTH_SECRET not set — admin sessions will not work");
  } else {
    pass("NEXTAUTH_SECRET present");
  }

  // Resend — email delivery for ER reports
  if (!process.env.RESEND_API_KEY) {
    warn("RESEND_API_KEY not set — transactional email delivery (ER reports, Inner Circle invites) will fail");
  } else {
    pass("RESEND_API_KEY present");
  }
})();

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
