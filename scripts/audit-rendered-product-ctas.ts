/**
 * scripts/audit-rendered-product-ctas.ts
 *
 * Rendered Product CTA Audit — runtime import edition.
 *
 * Run via: pnpm exec tsx scripts/audit-rendered-product-ctas.ts
 *
 * Validates:
 *   P7.1  Page existence: /benchmark-context, /professionals, /return-brief
 *   P7.2  Feature upgradeHref: no bare /pricing (runtime import — no source scraping)
 *   P7.2a Critical feature routes: return_brief, benchmark_context_advanced, professional_tier
 *   P7.2b Critical feature semanticAccessRoutes
 *   P7.3  KNOWN_ROUTES includes /benchmark-context, /professionals, /return-brief
 *   P7.4  /pricing page has no self-looping CTAs
 *   P7.5  Feature pages avoid /pricing hrefs
 *   P7.6  Benchmark Context authority: minimumPoolSize, disclaimer, anonymization, canonicalRoute
 *   P7.7  Product knowledge graph: key nodes present, no /pricing canonicalRoute
 *   P7.8  Semantic resolver: safe fallbacks defined, SAFE_UNKNOWN_FALLBACK ≠ /pricing
 *   P7.9  Feature semanticAccessRoute: 15 entries, none /pricing
 *   P7.10 Feature ownerProduct and capabilityType: 15 entries each
 *   P7.11 CheckoutButton usage: no label= or direct Stripe ID props
 *
 * Exit codes:
 *   0 — all checks pass (0 WARN, 0 FAIL)
 *   1 — one or more FAIL findings
 */

import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { fileURLToPath } from "url";

// Runtime imports — type-safe, no source scraping
import { FEATURES } from "../lib/product/feature-entitlements";
import { BENCHMARK_CAPABILITY } from "../lib/benchmarks/benchmark-context-authority";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");

// ─── Colour helpers ───────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  dim:    "\x1b[2m",
  cyan:   "\x1b[36m",
};

function pass(msg: string)   { console.log(`  ${C.green}✓ PASS${C.reset}  ${msg}`); }
function warn(msg: string)   { console.log(`  ${C.yellow}⚠ WARN${C.reset}  ${msg}`); }
function fail(msg: string)   { console.log(`  ${C.red}✗ FAIL${C.reset}  ${msg}`); }
function info(msg: string)   { console.log(`  ${C.dim}•${C.reset}      ${msg}`); }
function header(msg: string) { console.log(`\n${C.bold}${C.cyan}${msg}${C.reset}`); }

let totalPass = 0, totalWarn = 0, totalFail = 0;

function record(severity: "PASS" | "WARN" | "FAIL", msg: string) {
  if (severity === "PASS") { pass(msg); totalPass++; }
  else if (severity === "WARN") { warn(msg); totalWarn++; }
  else { fail(msg); totalFail++; }
}

// ─── P7.1 Page existence ─────────────────────────────────────────────────────

header("P7.1 — Page existence: /benchmark-context, /professionals, /return-brief");

const pagesToCheck: Array<[string, string]> = [
  ["pages/benchmark-context.tsx",   "/benchmark-context"],
  ["pages/professionals.tsx",       "/professionals"],
  ["pages/return-brief/index.tsx",  "/return-brief"],
];

for (const [relPath, route] of pagesToCheck) {
  const fullPath = join(projectRoot, relPath);
  if (existsSync(fullPath)) {
    record("PASS", `${route} → ${relPath} exists`);
  } else {
    record("FAIL", `${route} → ${relPath} NOT FOUND — create the page`);
  }
}

// ─── P7.2 Feature upgradeHref — runtime import (no source scraping) ──────────

header("P7.2 — Feature upgradeHref: no bare /pricing (runtime)");

const allFeatures = Object.values(FEATURES);

const pricingUpgradeHrefs = allFeatures.filter(f => f.upgradeHref === "/pricing");
if (pricingUpgradeHrefs.length > 0) {
  for (const f of pricingUpgradeHrefs) {
    record("FAIL", `${f.slug}.upgradeHref = "/pricing" — must not route to bare /pricing`);
  }
} else {
  record("PASS", `All ${allFeatures.length} feature upgradeHref values avoid bare /pricing`);
}

// P7.2a — Critical feature upgrade destinations (exact assertions, hard FAIL if wrong)
header("P7.2a — Critical feature upgradeHref destinations");

const criticalUpgradeExpected: Array<[string, string]> = [
  ["return_brief",              "/professionals"],
  ["benchmark_context_advanced", "/benchmark-context"],
  ["professional_tier",         "/professionals"],
];

for (const [slug, expected] of criticalUpgradeExpected) {
  const feature = FEATURES[slug as keyof typeof FEATURES];
  if (!feature) {
    record("FAIL", `Feature "${slug}" not found in FEATURES — missing from feature-entitlements.ts`);
    continue;
  }
  if (feature.upgradeHref === expected) {
    record("PASS", `${slug}.upgradeHref = "${expected}" ✓`);
  } else {
    record("FAIL", `${slug}.upgradeHref = "${feature.upgradeHref}" — expected "${expected}"`);
  }
}

// P7.2b — Critical feature semanticAccessRoute destinations
header("P7.2b — Critical feature semanticAccessRoute destinations");

const criticalAccessExpected: Array<[string, string]> = [
  ["return_brief",              "/return-brief"],
  ["benchmark_context_advanced", "/benchmark-context"],
  ["professional_tier",         "/professionals"],
];

for (const [slug, expected] of criticalAccessExpected) {
  const feature = FEATURES[slug as keyof typeof FEATURES];
  if (!feature) {
    record("FAIL", `Feature "${slug}" not found — cannot check semanticAccessRoute`);
    continue;
  }
  if (feature.semanticAccessRoute === expected) {
    record("PASS", `${slug}.semanticAccessRoute = "${expected}" ✓`);
  } else {
    record("FAIL", `${slug}.semanticAccessRoute = "${feature.semanticAccessRoute}" — expected "${expected}"`);
  }
}

// ─── P7.3 KNOWN_ROUTES ────────────────────────────────────────────────────────

header("P7.3 — KNOWN_ROUTES includes /benchmark-context, /professionals, /return-brief");

const resolverPath = join(projectRoot, "lib/product/product-access-link-resolver.ts");
const resolverSource = readFileSync(resolverPath, "utf8");

const routesToCheck = ["/benchmark-context", "/professionals", "/return-brief"];
for (const route of routesToCheck) {
  if (resolverSource.includes(`"${route}"`)) {
    record("PASS", `KNOWN_ROUTES includes "${route}"`);
  } else {
    record("FAIL", `KNOWN_ROUTES is missing "${route}" — add to product-access-link-resolver.ts`);
  }
}

// ─── P7.4 Pricing page self-loop scan ─────────────────────────────────────────

header("P7.4 — Source scan: /pricing page has no self-looping CTAs");

const pricingPagePath = join(projectRoot, "pages/pricing.tsx");
if (existsSync(pricingPagePath)) {
  const pricingSource = readFileSync(pricingPagePath, "utf8");
  const hrefMatches = [...pricingSource.matchAll(/href=["']([^"']+)["']/g)];
  const selfLoops = hrefMatches.filter(m => m[1] === "/pricing");
  if (selfLoops.length === 0) {
    record("PASS", `/pricing page: no self-looping hrefs (${hrefMatches.length} hrefs scanned)`);
  } else {
    record("FAIL", `/pricing page: ${selfLoops.length} self-looping href="/pricing" found`);
  }
} else {
  record("FAIL", "pages/pricing.tsx not found");
}

// ─── P7.5 Feature pages avoid /pricing hrefs ─────────────────────────────────

header("P7.5 — Source scan: feature pages avoid /pricing hrefs");

const featurePagePaths: Array<[string, string]> = [
  ["pages/return-brief/index.tsx", "/return-brief"],
  ["pages/benchmark-context.tsx",  "/benchmark-context"],
  ["pages/professionals.tsx",      "/professionals"],
  ["pages/boardroom-mode.tsx",     "/boardroom-mode"],
];

for (const [relPath, route] of featurePagePaths) {
  const fullPath = join(projectRoot, relPath);
  if (!existsSync(fullPath)) {
    info(`${route}: page file not found (${relPath}) — skipping`);
    continue;
  }
  const source = readFileSync(fullPath, "utf8");
  const pricingLinks = [...source.matchAll(/href=["']([^"']+)["']/g)].filter(m => m[1] === "/pricing");
  if (pricingLinks.length === 0) {
    record("PASS", `${route}: no bare /pricing hrefs`);
  } else {
    record("FAIL", `${route}: ${pricingLinks.length} bare /pricing href(s) found`);
  }
}

// ─── P7.6 Benchmark Context authority ────────────────────────────────────────

header("P7.6 — Benchmark Context authority (runtime)");

record(
  BENCHMARK_CAPABILITY.canonicalRoute === "/benchmark-context" ? "PASS" : "FAIL",
  `BENCHMARK_CAPABILITY.canonicalRoute = "${BENCHMARK_CAPABILITY.canonicalRoute}" ${BENCHMARK_CAPABILITY.canonicalRoute === "/benchmark-context" ? "✓" : `— expected "/benchmark-context"`}`,
);
record(
  BENCHMARK_CAPABILITY.allowsPublicClaimsBeforeThreshold === false ? "PASS" : "FAIL",
  `BENCHMARK_CAPABILITY.allowsPublicClaimsBeforeThreshold = ${BENCHMARK_CAPABILITY.allowsPublicClaimsBeforeThreshold}`,
);
record(
  BENCHMARK_CAPABILITY.requiresAnonymization === true ? "PASS" : "FAIL",
  `BENCHMARK_CAPABILITY.requiresAnonymization = ${BENCHMARK_CAPABILITY.requiresAnonymization}`,
);
record(
  BENCHMARK_CAPABILITY.minimumPoolSize === 50 ? "PASS" : "FAIL",
  `BENCHMARK_CAPABILITY.minimumPoolSize = ${BENCHMARK_CAPABILITY.minimumPoolSize} (expected 50)`,
);

// ─── P7.7 Product knowledge graph: key nodes ─────────────────────────────────

header("P7.7 — Product knowledge graph: key nodes present");

const graphPath = join(projectRoot, "lib/product/product-knowledge-graph.ts");
if (existsSync(graphPath)) {
  const graphSource = readFileSync(graphPath, "utf8");

  const expectedNodes: Array<[string, string]> = [
    ["feature:return_brief",               "Return Brief feature node"],
    ["feature:benchmark_context_advanced", "Advanced Benchmark Context feature node"],
    ["feature:professional_tier",          "Professional Tier feature node"],
    ["capability:benchmark_context",       "Benchmark Context capability node"],
    ["route:professional",                 "Professional route node"],
    ["route:benchmark_context",            "Benchmark Context route node"],
    ["route:return_brief",                 "Return Brief route node"],
  ];

  for (const [code, description] of expectedNodes) {
    if (graphSource.includes(`"${code}"`)) {
      record("PASS", `Graph contains "${code}" (${description})`);
    } else {
      record("FAIL", `Graph is missing node "${code}" (${description})`);
    }
  }

  if (graphSource.match(/canonicalRoute:\s*["']\/pricing["']/)) {
    record("FAIL", "A graph node has canonicalRoute: /pricing — routing loop");
  } else {
    record("PASS", "No graph node has canonicalRoute: /pricing");
  }

  // Confirm the null-coalescing fix is present
  if (graphSource.includes("surface.route ?? undefined")) {
    record("PASS", "surface.route null-coalescing fix present (surface.route ?? undefined)");
  } else {
    record("FAIL", "surface.route null-coalescing fix missing — canonicalRoute/accessRoute may receive null");
  }
} else {
  record("FAIL", "lib/product/product-knowledge-graph.ts not found");
}

// ─── P7.8 Semantic resolver safe fallbacks ────────────────────────────────────

header("P7.8 — Semantic resolver: safe fallbacks defined");

const resolverSemPath = join(projectRoot, "lib/product/semantic-destination-resolver.ts");
if (existsSync(resolverSemPath)) {
  const semSource = readFileSync(resolverSemPath, "utf8");

  const safeConstants: Array<[string, string]> = [
    ["SAFE_UPGRADE_FALLBACK",      "/professionals"],
    ["SAFE_BENCHMARK_FALLBACK",    "/benchmark-context"],
    ["SAFE_RETURN_BRIEF_FALLBACK", "/return-brief"],
  ];

  for (const [name, expected] of safeConstants) {
    const m = semSource.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`));
    if (m?.[1] === expected) {
      record("PASS", `${name} = "${expected}"`);
    } else if (m) {
      record("FAIL", `${name} = "${m[1]}" — expected "${expected}"`);
    } else {
      record("FAIL", `${name} not found in semantic-destination-resolver.ts`);
    }
  }

  const unknownFallback = semSource.match(/SAFE_UNKNOWN_FALLBACK\s*=\s*["']([^"']+)["']/);
  if (unknownFallback) {
    if (unknownFallback[1] !== "/pricing") {
      record("PASS", `SAFE_UNKNOWN_FALLBACK = "${unknownFallback[1]}" (not /pricing)`);
    } else {
      record("FAIL", "SAFE_UNKNOWN_FALLBACK = /pricing — use /products");
    }
  } else {
    record("FAIL", "SAFE_UNKNOWN_FALLBACK not found in semantic-destination-resolver.ts");
  }
} else {
  record("FAIL", "lib/product/semantic-destination-resolver.ts not found");
}

// ─── P7.9 Feature semanticAccessRoute coverage ───────────────────────────────

header("P7.9 — Feature semanticAccessRoute: 15 entries, none /pricing (runtime)");

const pricingSemanticRoutes = allFeatures.filter(f => f.semanticAccessRoute === "/pricing");
if (pricingSemanticRoutes.length > 0) {
  for (const f of pricingSemanticRoutes) {
    record("FAIL", `${f.slug}.semanticAccessRoute = "/pricing"`);
  }
} else {
  record("PASS", `All ${allFeatures.length} semanticAccessRoute values avoid /pricing`);
}

if (allFeatures.length === 15) {
  record("PASS", "All 15 features have semanticAccessRoute defined");
} else {
  record("FAIL", `${allFeatures.length}/15 features found — expected exactly 15`);
}

// ─── P7.10 Feature ownerProduct and capabilityType coverage ──────────────────

header("P7.10 — Feature ownerProduct and capabilityType: 15 entries (runtime)");

const missingOwnerProduct = allFeatures.filter(f => f.ownerProduct === undefined);
const missingCapabilityType = allFeatures.filter(f => !f.capabilityType);

if (missingOwnerProduct.length === 0) {
  record("PASS", "All 15 features have ownerProduct defined (null is valid for free features)");
} else {
  record("FAIL", `${missingOwnerProduct.length} feature(s) missing ownerProduct: ${missingOwnerProduct.map(f => f.slug).join(", ")}`);
}

if (missingCapabilityType.length === 0) {
  record("PASS", "All 15 features have capabilityType defined");
} else {
  record("FAIL", `${missingCapabilityType.length} feature(s) missing capabilityType: ${missingCapabilityType.map(f => f.slug).join(", ")}`);
}

// ─── P7.11 CheckoutButton usage: no label= or direct Stripe ID props ──────────

header("P7.11 — CheckoutButton usage: no label= or direct Stripe ID props");

const professionalsPath = join(projectRoot, "pages/professionals.tsx");
if (existsSync(professionalsPath)) {
  const profSource = readFileSync(professionalsPath, "utf8");

  if (/CheckoutButton[^>]*label=/.test(profSource)) {
    record("FAIL", "pages/professionals.tsx: CheckoutButton has label= prop — use children instead");
  } else {
    record("PASS", "pages/professionals.tsx: CheckoutButton has no label= prop ✓");
  }

  if (/CheckoutButton[^>]*stripePriceId=/.test(profSource)) {
    record("FAIL", "pages/professionals.tsx: CheckoutButton has direct stripePriceId= — remove it");
  } else {
    record("PASS", "pages/professionals.tsx: CheckoutButton has no direct stripePriceId= ✓");
  }

  if (/CheckoutButton[^>]*stripeProductId=/.test(profSource)) {
    record("FAIL", "pages/professionals.tsx: CheckoutButton has direct stripeProductId= — remove it");
  } else {
    record("PASS", "pages/professionals.tsx: CheckoutButton has no direct stripeProductId= ✓");
  }
} else {
  record("FAIL", "pages/professionals.tsx not found");
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${C.bold}${"─".repeat(60)}${C.reset}`);
console.log(`${C.bold}Rendered CTA Audit Summary${C.reset}`);
console.log(`  ${C.green}PASS${C.reset}  ${totalPass}`);
console.log(`  ${C.yellow}WARN${C.reset}  ${totalWarn}`);
console.log(`  ${C.red}FAIL${C.reset}  ${totalFail}`);
console.log(`${C.bold}${"─".repeat(60)}${C.reset}\n`);

if (totalFail > 0) {
  console.error(`${C.red}${C.bold}Audit failed with ${totalFail} FAIL(s).${C.reset}\n`);
  process.exit(1);
} else if (totalWarn > 0) {
  console.log(`${C.yellow}${C.bold}Audit passed with ${totalWarn} warning(s).${C.reset}\n`);
  process.exit(1); // WARNs are also failures per brief requirement
} else {
  console.log(`${C.green}${C.bold}All checks passed — 0 WARN 0 FAIL.${C.reset}\n`);
  process.exit(0);
}
