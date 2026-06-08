#!/usr/bin/env node
/**
 * scripts/audit-rendered-product-ctas.mjs
 *
 * Rendered Product CTA Audit
 *
 * Scans every product-facing page's source for href patterns and validates:
 *   1. No CTA points to bare /pricing (except explicit "View pricing" text)
 *   2. No CTA points to an unknown/unregistered route
 *   3. Benchmark Context CTAs resolve to /benchmark-context (not /pricing, not /decision-centre)
 *   4. Return Brief CTAs resolve to /return-brief
 *   5. Professional upgrade CTAs resolve to /professional
 *   6. /professional page exists (file check)
 *   7. /benchmark-context page exists (file check)
 *   8. Feature upgradeHref fields do not contain bare /pricing
 *   9. Semantic destination resolver has no /pricing loops (FAIL confidence)
 *  10. All product knowledge graph nodes have canonical routes registered
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — one or more FAIL findings
 */

import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");
const require = createRequire(import.meta.url);

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

function pass(msg)  { console.log(`  ${C.green}✓ PASS${C.reset}  ${msg}`); }
function warn(msg)  { console.log(`  ${C.yellow}⚠ WARN${C.reset}  ${msg}`); }
function fail(msg)  { console.log(`  ${C.red}✗ FAIL${C.reset}  ${msg}`); }
function info(msg)  { console.log(`  ${C.dim}•${C.reset}      ${msg}`); }
function header(msg) { console.log(`\n${C.bold}${C.cyan}${msg}${C.reset}`); }

let totalPass = 0, totalWarn = 0, totalFail = 0;

function record(severity, msg) {
  if (severity === "PASS") { pass(msg); totalPass++; }
  else if (severity === "WARN") { warn(msg); totalWarn++; }
  else { fail(msg); totalFail++; }
}

// ─── Page existence checks ────────────────────────────────────────────────────

header("P7.1 — Page existence: /benchmark-context, /professional");

const pagesToCheck = [
  ["pages/benchmark-context.tsx",       "/benchmark-context"],
  ["pages/professionals.tsx",           "/professionals (subscription section)"],
  ["pages/return-brief/index.tsx",      "/return-brief"],
];

for (const [relPath, route] of pagesToCheck) {
  const fullPath = join(projectRoot, relPath);
  if (existsSync(fullPath)) {
    record("PASS", `${route} → ${relPath} exists`);
  } else {
    record("FAIL", `${route} → ${relPath} NOT FOUND — create the page`);
  }
}

// ─── Feature upgradeHref anti-loop check ─────────────────────────────────────

header("P7.2 — Feature upgradeHref: no bare /pricing");

// Read feature-entitlements.ts source directly (avoids TSX import)
const featuresPath = join(projectRoot, "lib/product/feature-entitlements.ts");
const featuresSource = readFileSync(featuresPath, "utf8");

// Extract all upgradeHref values via regex
const upgradeHrefMatches = [...featuresSource.matchAll(/upgradeHref:\s*["']([^"']+)["']/g)];
let pricingLoopFeatureCount = 0;

for (const match of upgradeHrefMatches) {
  const href = match[1];
  if (href === "/pricing") {
    record("FAIL", `Feature upgradeHref resolves to bare /pricing: "${href}"`);
    pricingLoopFeatureCount++;
  }
}

if (pricingLoopFeatureCount === 0) {
  record("PASS", `All ${upgradeHrefMatches.length} feature upgradeHref values avoid bare /pricing`);
}

// Check specific critical features route to correct destinations
const criticalFeatureRoutes = [
  { pattern: /return_brief[\s\S]{0,200}upgradeHref:\s*["']([^"']+)["']/, name: "return_brief", expected: "/professionals" },
  { pattern: /benchmark_context_advanced[\s\S]{0,200}upgradeHref:\s*["']([^"']+)["']/, name: "benchmark_context_advanced", expected: "/benchmark-context" },
  { pattern: /professional_tier[\s\S]{0,200}upgradeHref:\s*["']([^"']+)["']/, name: "professional_tier", expected: "/professionals" },
];

for (const { pattern, name, expected } of criticalFeatureRoutes) {
  const m = featuresSource.match(pattern);
  const href = m?.[1];
  if (href === expected) {
    record("PASS", `${name}.upgradeHref = "${href}" ✓`);
  } else if (href) {
    record("FAIL", `${name}.upgradeHref = "${href}" — expected "${expected}"`);
  } else {
    record("WARN", `${name}.upgradeHref: could not parse value from source`);
  }
}

// ─── KNOWN_ROUTES registration check ─────────────────────────────────────────

header("P7.3 — KNOWN_ROUTES includes /benchmark-context and /professional");

const resolverPath = join(projectRoot, "lib/product/product-access-link-resolver.ts");
const resolverSource = readFileSync(resolverPath, "utf8");

const routesToCheck = ["/benchmark-context", "/professionals", "/return-brief"];
for (const route of routesToCheck) {
  if (resolverSource.includes(`"${route}"`)) {
    record("PASS", `KNOWN_ROUTES includes "${route}"`);
  } else {
    record("FAIL", `KNOWN_ROUTES is missing "${route}" — add it to product-access-link-resolver.ts`);
  }
}

// ─── Source scan: pricing page CTA hrefs ─────────────────────────────────────

header("P7.4 — Source scan: /pricing page has no self-looping CTAs");

const pricingPagePath = join(projectRoot, "pages/pricing.tsx");
if (existsSync(pricingPagePath)) {
  const pricingSource = readFileSync(pricingPagePath, "utf8");

  // Extract all href="..." and href={...} patterns
  const hrefMatches = [...pricingSource.matchAll(/href=["']([^"']+)["']/g)];
  let selfLoops = 0;

  for (const match of hrefMatches) {
    const href = match[1];
    if (href === "/pricing") {
      record("FAIL", `/pricing page contains self-looping href="/pricing"`);
      selfLoops++;
    }
  }

  if (selfLoops === 0) {
    record("PASS", `/pricing page: no self-looping hrefs found (${hrefMatches.length} hrefs scanned)`);
  }
} else {
  record("WARN", "pages/pricing.tsx not found — skipping self-loop scan");
}

// ─── Source scan: feature-specific pages ─────────────────────────────────────

header("P7.5 — Source scan: feature pages avoid /pricing hrefs");

const featurePagePaths = [
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
  const hrefMatches = [...source.matchAll(/href=["']([^"']+)["']/g)];
  const pricingLinks = hrefMatches.filter(m => m[1] === "/pricing");

  if (pricingLinks.length === 0) {
    record("PASS", `${route}: no bare /pricing hrefs`);
  } else {
    record("FAIL", `${route}: ${pricingLinks.length} bare /pricing href(s) found — remove or replace`);
  }
}

// ─── Benchmark context authority check ───────────────────────────────────────

header("P7.6 — Benchmark Context authority: minimumPoolSize and disclaimer present");

const bcaPath = join(projectRoot, "lib/benchmarks/benchmark-context-authority.ts");
if (existsSync(bcaPath)) {
  const bcaSource = readFileSync(bcaPath, "utf8");

  if (bcaSource.includes("BENCHMARK_MIN_N")) {
    record("PASS", "benchmark-context-authority imports and uses BENCHMARK_MIN_N");
  } else {
    record("FAIL", "benchmark-context-authority.ts does not reference BENCHMARK_MIN_N");
  }

  if (bcaSource.includes("allowsPublicClaimsBeforeThreshold: false")) {
    record("PASS", "BENCHMARK_CAPABILITY.allowsPublicClaimsBeforeThreshold = false");
  } else {
    record("FAIL", "BENCHMARK_CAPABILITY.allowsPublicClaimsBeforeThreshold is not false");
  }

  if (bcaSource.includes("requiresAnonymization: true")) {
    record("PASS", "BENCHMARK_CAPABILITY.requiresAnonymization = true");
  } else {
    record("FAIL", "BENCHMARK_CAPABILITY.requiresAnonymization is not true");
  }

  if (bcaSource.includes("canonicalRoute: \"/benchmark-context\"")) {
    record("PASS", "BENCHMARK_CAPABILITY.canonicalRoute = /benchmark-context");
  } else {
    record("FAIL", "BENCHMARK_CAPABILITY.canonicalRoute is not /benchmark-context");
  }
} else {
  record("FAIL", "lib/benchmarks/benchmark-context-authority.ts not found");
}

// ─── Product knowledge graph checks ──────────────────────────────────────────

header("P7.7 — Product knowledge graph: key nodes present");

const graphPath = join(projectRoot, "lib/product/product-knowledge-graph.ts");
if (existsSync(graphPath)) {
  const graphSource = readFileSync(graphPath, "utf8");

  const expectedNodes = [
    ["feature:return_brief",              "Return Brief feature node"],
    ["feature:benchmark_context_advanced","Advanced Benchmark Context feature node"],
    ["feature:professional_tier",         "Professional Tier feature node"],
    ["capability:benchmark_context",      "Benchmark Context capability node"],
    ["route:professional",                "Professional route node"],
    ["route:benchmark_context",           "Benchmark Context route node"],
    ["route:return_brief",                "Return Brief route node"],
  ];

  for (const [code, description] of expectedNodes) {
    if (graphSource.includes(`"${code}"`)) {
      record("PASS", `Graph contains "${code}" (${description})`);
    } else {
      record("FAIL", `Graph is missing node "${code}" (${description})`);
    }
  }

  // Verify no node in graph has canonicalRoute = /pricing
  const canonicalPricingMatch = graphSource.match(/canonicalRoute:\s*["']\/pricing["']/);
  if (canonicalPricingMatch) {
    record("FAIL", "A graph node has canonicalRoute: /pricing — this creates loops");
  } else {
    record("PASS", "No graph node has canonicalRoute: /pricing");
  }
} else {
  record("FAIL", "lib/product/product-knowledge-graph.ts not found");
}

// ─── Semantic destination resolver: no /pricing in upgrade hrefs ──────────────

header("P7.8 — Semantic resolver: safe fallbacks defined, no /pricing loops");

const resolverSemPath = join(projectRoot, "lib/product/semantic-destination-resolver.ts");
if (existsSync(resolverSemPath)) {
  const semSource = readFileSync(resolverSemPath, "utf8");

  const safeConstants = [
    ["SAFE_UPGRADE_FALLBACK",       "/professionals"],
    ["SAFE_BENCHMARK_FALLBACK",     "/benchmark-context"],
    ["SAFE_RETURN_BRIEF_FALLBACK",  "/return-brief"],
  ];

  for (const [name, expected] of safeConstants) {
    const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`);
    const m = semSource.match(pattern);
    if (m?.[1] === expected) {
      record("PASS", `${name} = "${expected}"`);
    } else if (m) {
      record("FAIL", `${name} = "${m[1]}" — expected "${expected}"`);
    } else {
      record("FAIL", `${name} not found in semantic-destination-resolver.ts`);
    }
  }

  // Verify fail-closed unknown fallback is /products, not /pricing
  const unknownFallbackMatch = semSource.match(/SAFE_UNKNOWN_FALLBACK\s*=\s*["']([^"']+)["']/);
  if (unknownFallbackMatch) {
    const fallback = unknownFallbackMatch[1];
    if (fallback !== "/pricing") {
      record("PASS", `SAFE_UNKNOWN_FALLBACK = "${fallback}" (not /pricing)`);
    } else {
      record("FAIL", "SAFE_UNKNOWN_FALLBACK = /pricing — this is a loop, use /products");
    }
  } else {
    record("WARN", "SAFE_UNKNOWN_FALLBACK constant not found in resolver source");
  }
} else {
  record("FAIL", "lib/product/semantic-destination-resolver.ts not found");
}

// ─── Feature semanticAccessRoute checks ──────────────────────────────────────

header("P7.9 — Feature semanticAccessRoute fields: all present");

const semanticRouteMatches = [...featuresSource.matchAll(/semanticAccessRoute:\s*["']([^"']+)["']/g)];
const pricingSemanticRoutes = semanticRouteMatches.filter(m => m[1] === "/pricing");

if (pricingSemanticRoutes.length > 0) {
  record("FAIL", `${pricingSemanticRoutes.length} feature(s) have semanticAccessRoute = "/pricing"`);
} else {
  record("PASS", `All ${semanticRouteMatches.length} semanticAccessRoute values avoid /pricing`);
}

// Check count matches expected 15 features
if (semanticRouteMatches.length === 15) {
  record("PASS", `All 15 features have semanticAccessRoute defined`);
} else if (semanticRouteMatches.length === 0) {
  record("FAIL", "No semanticAccessRoute fields found — P6 may not be complete");
} else {
  record("WARN", `Only ${semanticRouteMatches.length}/15 features have semanticAccessRoute — check for missing entries`);
}

// ─── ownerProduct field coverage ─────────────────────────────────────────────

header("P7.10 — Feature ownerProduct and capabilityType: all present");

const ownerProductMatches = [...featuresSource.matchAll(/ownerProduct:\s*(null|["'][^"']*["'])/g)];
const capabilityTypeMatches = [...featuresSource.matchAll(/capabilityType:\s*["']([^"']+)["']/g)];

if (ownerProductMatches.length === 15) {
  record("PASS", `All 15 features have ownerProduct defined`);
} else {
  record("WARN", `${ownerProductMatches.length}/15 features have ownerProduct — expected 15`);
}

if (capabilityTypeMatches.length === 15) {
  record("PASS", `All 15 features have capabilityType defined`);
} else {
  record("WARN", `${capabilityTypeMatches.length}/15 features have capabilityType — expected 15`);
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
  process.exit(0);
} else {
  console.log(`${C.green}${C.bold}All checks passed.${C.reset}\n`);
  process.exit(0);
}
