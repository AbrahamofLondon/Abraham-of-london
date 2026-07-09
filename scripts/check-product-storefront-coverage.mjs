#!/usr/bin/env node
/**
 * scripts/check-product-storefront-coverage.mjs
 *
 * READ-ONLY storefront coverage verification (resolver-governed model).
 *
 * Executes PRODUCTION code directly via tsx import. No mirror logic.
 * Verifies that every governance product is inspected, release-ready products
 * are surfaced + resolve to an action + reachable route, checkout-safe paid
 * products carry real Stripe metadata, and blocked products are non-purchasable
 * even with Stripe IDs — with the resolver (not page arrays) as the authority.
 *
 * Exits non-zero on any coverage gap or gating violation.
 */

import { readdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");

// ── Production module imports via tsx ──────────────────────────────────────
// These import the REAL production modules, not a mirror.
let productionModules;
try {
  productionModules = await import("../lib/commercial/commercial-action-resolver.ts");
} catch (e) {
  console.error("FATAL: Cannot import production resolver module. Ensure tsx is available.");
  console.error(e.message);
  process.exit(2);
}

const { resolveCommercialAction, PUBLIC_INTAKE_ALLOWLIST } = productionModules;

// ── Governance state loader (reads production governance JSON files) ──────
const readinessPath = join(ROOT, "reports", "product-release-readiness-matrix.json");
const governancePath = join(ROOT, "reports", "product-release-governance-matrix.json");

function loadGovernanceState(code) {
  let readiness = {}, governance = {};
  try { readiness = JSON.parse(readFileSync(readinessPath, "utf8")); } catch {}
  try { governance = JSON.parse(readFileSync(governancePath, "utf8")); } catch {}
  const r = readiness[code] || null;
  const g = governance[code] || null;
  const b = (v) => (typeof v === "boolean" ? v : null);
  return {
    productCode: code,
    known: Boolean(r || g),
    readinessStatus: r?.readinessStatus ?? null,
    releaseReadyNow: r?.releaseReadyNow === true,
    checkoutSafe: b(r?.checkoutSafe),
    commercialSafe: b(r?.commercialSafe),
    releaseLane: r?.releaseLane ?? g?.releaseLane ?? null,
    releaseMode: r?.releaseMode ?? g?.releaseMode ?? null,
    checkoutAllowed: b(g?.checkoutAllowed),
    manualFulfilmentAllowed: b(g?.manualFulfilmentAllowed),
    commercialClaimAllowed: b(g?.commercialClaimAllowed),
  };
}

function allGovernanceCodes() {
  let readiness = {}, governance = {};
  try { readiness = JSON.parse(readFileSync(readinessPath, "utf8")); } catch {}
  try { governance = JSON.parse(readFileSync(governancePath, "utf8")); } catch {}
  return Array.from(new Set([...Object.keys(readiness), ...Object.keys(governance)])).sort();
}

// ── Catalog access (reads production catalog.ts directly) ─────────────────
// We import the production catalog module for authoritative product data.
let catalog;
try {
  catalog = await import("../lib/commercial/catalog.ts");
} catch (e) {
  console.error("FATAL: Cannot import production catalog module.");
  console.error(e.message);
  process.exit(2);
}

const { CATALOG, getAllProducts, getProduct } = catalog;

// ── Helper: resolve a governance code through production code ─────────────
function resolveForGovernanceCode(code) {
  const product = getProduct(code);
  if (!product) return { product: null, action: null };
  const governance = loadGovernanceState(code);
  const action = resolveCommercialAction(product, governance);
  return { product, action, governance };
}

// ── Route existence check ─────────────────────────────────────────────────
function routeExists(rel) { return existsSync(join(ROOT, rel)); }

// ── DEDICATED_ROUTES (route existence map for release-ready products) ─────
const DEDICATED_ROUTES = {
  fast_diagnostic: ["pages/offers/fast-diagnostic-decision-support.tsx", "pages/diagnostics/fast.tsx"],
  enterprise_assessment: ["pages/offers/enterprise-assessment-advisory-review.tsx", "pages/diagnostics/enterprise-assessment.tsx"],
  gmi_quarterly: ["pages/intelligence/gmi/index.tsx"],
  reporting_monthly: [],
  reporting_custom: [],
  boardroom_brief: [],
  executive_reporting: ["pages/diagnostics/executive-reporting.tsx"],
};

// ── RELEASE_READY and BLOCKED product lists (from governance, not mirror) ─
// These are derived from governance state, not hardcoded in a mirror.
function getReleaseReadyProducts() {
  const codes = allGovernanceCodes();
  return codes.filter((code) => {
    const g = loadGovernanceState(code);
    return g.known && g.releaseReadyNow === true;
  });
}

function getBlockedProducts() {
  const codes = allGovernanceCodes();
  return codes.filter((code) => {
    const g = loadGovernanceState(code);
    return g.known && (g.readinessStatus === "blocked" || g.releaseMode === "blocked");
  });
}

const RELEASE_READY = getReleaseReadyProducts();
const BLOCKED = getBlockedProducts();

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

console.log("\n────────────────────────────────────────────────────────────");
console.log("  PUBLIC CONTENT STOREFRONT COVERAGE (resolver-governed)");
console.log("  Authority: production resolver (commercial-action-resolver.ts)");
console.log("────────────────────────────────────────────────────────────\n");

// 1. All governance products inspected
const govCodes = allGovernanceCodes();
console.log(`Governance products inspected: ${govCodes.length}`);
check("all governance products inspected (>=43)", govCodes.length >= 43, `${govCodes.length}`);

console.log("\nRelease-ready storefront coverage:");
for (const code of RELEASE_READY) {
  const { product, action } = resolveForGovernanceCode(code);
  const hasAction = Boolean(action);
  const routes = (DEDICATED_ROUTES[code] || []).filter(routeExists);
  const manualRoute = action && ["manual_fulfilment", "request_access", "contact_sales", "view_free_surface"].includes(action.state);
  const reachable = routes.length > 0 || manualRoute;
  const ok = hasAction && reachable && Boolean(product);
  check(
    `${code}`, ok,
    `catalog=${code}${product ? "" : "(MISSING)"} action=${action?.state || "none"} route=${routes[0] || (manualRoute ? action.state : "—")}`,
  );
}

// 2. Every checkout-safe paid product has real Stripe metadata
console.log("\nCheckout-safe paid products — Stripe metadata:");
let paidChecked = 0;
for (const p of getAllProducts()) {
  if (p.commercialStatus !== "paid" || p.requiresCheckout !== true) continue;
  const g = loadGovernanceState(p.code);
  if (g.known && (g.checkoutSafe === false || g.commercialSafe === false)) continue;
  paidChecked++;
  const hasStripe = Boolean(p.stripePriceId);
  check(`${p.code}: has Stripe price`, hasStripe, hasStripe ? "ok" : "MISSING stripePriceId for checkout-safe paid product");
}
console.log(`  (checkout-safe paid products checked: ${paidChecked})`);

// 3. Blocked products non-purchasable even with Stripe IDs
console.log("\nBlocked product gating (resolver authority):");
for (const code of BLOCKED) {
  const { product, action } = resolveForGovernanceCode(code);
  const hasStripe = Boolean(product?.stripePriceId);
  const ok = action && action.purchasable === false && action.state !== "checkout";
  check(`${code} non-purchasable`, ok, `action=${action?.state} stripePriceId=${hasStripe ? "present" : "none"}`);
}

// 4. Page-level arrays cannot override resolver gating
console.log("\nPage arrays vs resolver:");
const pricingText = readFileSync(join(ROOT, "pages/pricing.tsx"), "utf8");
const filterResolverAware = /function isSelfServeProduct[\s\S]{0,900}?resolvePricingAction/.test(pricingText);
check("isSelfServeProduct is resolver-aware", filterResolverAware);

const arrayKeys = new Set();
for (const block of pricingText.matchAll(/\[([^\]]*)\]\.filter\(\s*isSelfServeProduct\s*\)/g))
  for (const m of block[1].matchAll(/CATALOG\.(\w+)/g)) arrayKeys.add(m[1]);
const gatedInLiterals = [];
for (const key of arrayKeys) {
  const p = getProduct(key);
  if (!p) continue;
  const action = resolveCommercialAction(p, loadGovernanceState(key));
  if (action.state !== "checkout" && action.state !== "view_free_surface") {
    gatedInLiterals.push(`${key}→${action.state}`);
  }
}
if (gatedInLiterals.length) {
  console.log(`     ℹ️  candidate-list keys pruned by the resolver-aware filter (not sold): ${gatedInLiterals.join(", ")}`);
}
check("self-serve candidate lists are runtime-gated by the resolver", filterResolverAware, `${arrayKeys.size} array keys, ${gatedInLiterals.length} pruned`);

// productCode props on CheckoutButton
let codeViolations = 0;
for (const m of pricingText.matchAll(/productCode\s*=\s*"(\w+)"/g)) {
  const key = m[1];
  const p = getProduct(key);
  if (!p) continue;
  const action = resolveCommercialAction(p, loadGovernanceState(key));
  if (action.state === "checkout" || action.state === "view_free_surface") continue;
  const guarded = new RegExp(`resolvePricingAction\\(CATALOG\\.${key}\\)\\.purchasable`).test(pricingText)
    || new RegExp(`CATALOG\\.${key}\\)\\.purchasable`).test(pricingText);
  if (!guarded) {
    codeViolations++;
    console.log(`     ⚠️  productCode="${key}" resolves to ${action.state} and is not guarded by a purchasability conditional`);
  }
}
check("CheckoutButton productCodes are checkout-cleared or resolver-guarded", codeViolations === 0);

// 5. Resolver is the only checkout source
console.log("\nCheckout source integrity:");
const ctaSource = pricingText.includes("resolvePricingAction") || pricingText.includes("resolveCommercialAction");
check("pricing CTAs use the resolver", ctaSource);

const offending = [];
const rawSessionFlows = [];
const KNOWN_SEPARATE_FLOWS = ["pages/api/events/checkout.ts", "pages/api/reports/request.ts"];
function walk(dir) {
  let entries;
  try { entries = readdirSync(join(ROOT, dir), { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) { if (!/node_modules|\.next|\.contentlayer/.test(rel)) walk(rel); continue; }
    if (!/\.(tsx?|jsx?)$/.test(e.name)) continue;
    const text = readFileSync(join(ROOT, rel), "utf8");
    if (/stripe\.checkout\.sessions\.create/.test(text) && !rel.includes("api/billing/")) {
      rawSessionFlows.push(rel);
    }
  }
}
walk("pages");
walk("app");
walk("components");
for (const f of rawSessionFlows) if (!KNOWN_SEPARATE_FLOWS.includes(f)) offending.push(`${f} (raw stripe.checkout.sessions.create)`);
if (rawSessionFlows.some((f) => KNOWN_SEPARATE_FLOWS.includes(f))) {
  console.log(`     ℹ️  separate Stripe flows (not CATALOG checkout): ${rawSessionFlows.filter((f) => KNOWN_SEPARATE_FLOWS.includes(f)).join(", ")}`);
}
check("no CATALOG checkout bypasses the governed billing API", offending.length === 0,
  offending.length ? offending.join("; ") : "clean");

console.log("\n" + "=".repeat(60));
if (failures > 0) { console.log(`❌ Storefront coverage FAILED (${failures} issue(s)).`); process.exit(1); }
console.log("✅ Storefront coverage PASSED.");