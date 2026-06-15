#!/usr/bin/env node
/**
 * scripts/check-product-storefront-coverage.mjs
 *
 * READ-ONLY storefront coverage verification (resolver-governed model).
 *
 * Verifies that every governance product is inspected, release-ready products
 * are surfaced + resolve to an action + reachable route, checkout-safe paid
 * products carry real Stripe metadata, and blocked products are non-purchasable
 * even with Stripe IDs — with the resolver (not page arrays) as the authority.
 *
 * Exits non-zero on any coverage gap or gating violation.
 */

import { readdirSync, statSync } from "fs";
import { join } from "path";
import {
  ROOT, parseCatalogProduct, allLiteralCatalogKeys, getGovernanceState, allGovernanceCodes,
  resolveCommercialAction, PRODUCT_CODE_MAP, RELEASE_READY, BLOCKED, routeExists, readFileSafe,
} from "./_commercial-mirror.mjs";

const DEDICATED_ROUTES = {
  fast_diagnostic: ["pages/offers/fast-diagnostic-decision-support.tsx", "pages/diagnostics/fast.tsx"],
  enterprise_assessment: ["pages/offers/enterprise-assessment-advisory-review.tsx", "pages/diagnostics/enterprise-assessment.tsx"],
  gmi_quarterly: ["pages/intelligence/gmi/index.tsx"],
  reporting_monthly: [],
  reporting_custom: [],
  boardroom_brief: [],
  executive_reporting: ["pages/diagnostics/executive-reporting.tsx"],
};

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

console.log("\n────────────────────────────────────────────────────────────");
console.log("  PUBLIC CONTENT STOREFRONT COVERAGE (resolver-governed)");
console.log("────────────────────────────────────────────────────────────\n");

// 1. All governance products inspected
const govCodes = allGovernanceCodes();
console.log(`Governance products inspected: ${govCodes.length}`);
check("all governance products inspected (>=43)", govCodes.length >= 43, `${govCodes.length}`);

// Resolve helper for a governance code via the product-code map
function resolveForGovernanceCode(code) {
  const map = PRODUCT_CODE_MAP[code];
  const catalogKey = map?.catalogKey || code;
  const product = parseCatalogProduct(catalogKey);
  if (!product) return { product: null, action: null, catalogKey, map };
  const action = resolveCommercialAction(product, getGovernanceState(code));
  return { product, action, catalogKey, map };
}

console.log("\nRelease-ready storefront coverage:");
for (const code of RELEASE_READY) {
  const { product, action, catalogKey, map } = resolveForGovernanceCode(code);
  // 2. maps to catalog key / alias / declared gap
  const mapped = Boolean(map && (map.catalogKey || (map.aliasKeys && map.aliasKeys.length)));
  // 3. has a resolver action
  const hasAction = Boolean(action);
  // 4. reachable route OR declared manual fulfilment route
  const routes = (DEDICATED_ROUTES[code] || []).filter(routeExists);
  const manualRoute = action && ["manual_fulfilment", "request_access", "contact_sales", "view_free_surface"].includes(action.state);
  const reachable = routes.length > 0 || manualRoute;

  const ok = mapped && hasAction && reachable && Boolean(product);
  check(
    `${code}`, ok,
    `catalog=${catalogKey}${product ? "" : "(MISSING)"} action=${action?.state || "none"} route=${routes[0] || (manualRoute ? action.state : "—")}`,
  );
}

// 5. Every checkout-safe paid product has real Stripe metadata
console.log("\nCheckout-safe paid products — Stripe metadata:");
let paidChecked = 0;
for (const key of allLiteralCatalogKeys()) {
  const p = parseCatalogProduct(key);
  if (!p || p.commercialStatus !== "paid" || p.requiresCheckout !== true) continue;
  const g = getGovernanceState(key);
  if (g.known && (g.checkoutSafe === false || g.commercialSafe === false)) continue; // not checkout-safe → excluded
  paidChecked++;
  const hasStripe = Boolean(p.stripePriceId);
  check(`${key}: has Stripe price`, hasStripe, hasStripe ? "ok" : "MISSING stripePriceId for checkout-safe paid product");
}
console.log(`  (checkout-safe paid products checked: ${paidChecked})`);

// 6 + 7. Blocked products non-purchasable even with Stripe IDs; cannot resolve to checkout
console.log("\nBlocked product gating (resolver authority):");
for (const code of BLOCKED) {
  const { product, action } = resolveForGovernanceCode(code);
  const hasStripe = Boolean(product?.stripePriceId);
  const ok = action && action.purchasable === false && action.state !== "checkout";
  check(`${code} non-purchasable`, ok, `action=${action?.state} stripePriceId=${hasStripe ? "present" : "none"}`);
}

// 8. Page-level arrays cannot override resolver gating:
//    no product in a page self-serve array may resolve to a non-checkout action.
console.log("\nPage arrays vs resolver:");
const pricingText = readFileSafe("pages/pricing.tsx");

// Structural guarantee: the self-serve filter must be resolver-aware so array
// literals cannot present a gated product as purchasable.
const filterResolverAware = /function isSelfServeProduct[\s\S]{0,900}?resolvePricingAction/.test(pricingText);
check("isSelfServeProduct is resolver-aware", filterResolverAware);

// Keys placed directly in a .filter(isSelfServeProduct) array literal.
const arrayKeys = new Set();
for (const block of pricingText.matchAll(/\[([^\]]*)\]\.filter\(\s*isSelfServeProduct\s*\)/g))
  for (const m of block[1].matchAll(/CATALOG\.(\w+)/g)) arrayKeys.add(m[1]);
let arrayViolations = 0;
for (const key of arrayKeys) {
  const p = parseCatalogProduct(key);
  if (!p) continue; // dynamic (e.g. GMI editions) — skip
  const action = resolveCommercialAction(p, getGovernanceState(key));
  if (action.state !== "checkout" && action.state !== "view_free_surface") {
    arrayViolations++;
    console.log(`     ⚠️  ${key} sits in a self-serve array literal but resolver says ${action.state}`);
  }
}
check("self-serve array literals contain no gated products", arrayViolations === 0, `${arrayKeys.size} array keys`);

// productCode props on CheckoutButton: a gated productCode is only acceptable
// when guarded by a resolver purchasability conditional in the same file.
let codeViolations = 0;
for (const m of pricingText.matchAll(/productCode\s*=\s*"(\w+)"/g)) {
  const key = m[1];
  const p = parseCatalogProduct(key);
  if (!p) continue;
  const action = resolveCommercialAction(p, getGovernanceState(key));
  if (action.state === "checkout" || action.state === "view_free_surface") continue;
  const guarded = new RegExp(`resolvePricingAction\\(CATALOG\\.${key}\\)\\.purchasable`).test(pricingText)
    || new RegExp(`CATALOG\\.${key}\\)\\.purchasable`).test(pricingText);
  if (!guarded) {
    codeViolations++;
    console.log(`     ⚠️  productCode="${key}" resolves to ${action.state} and is not guarded by a purchasability conditional`);
  }
}
check("CheckoutButton productCodes are checkout-cleared or resolver-guarded", codeViolations === 0);

// 9 + 10. Resolver is the only checkout source; no page exposes checkout directly.
console.log("\nCheckout source integrity:");
const ctaSource = pricingText.includes("resolvePricingAction") || pricingText.includes("resolveCommercialAction");
check("pricing CTAs use the resolver", ctaSource);

// Calling the governed billing API (/api/billing/checkout) is allowed — it now
// enforces the resolver gate server-side. A true bypass is raw Stripe session
// creation OUTSIDE that API, which skips governance entirely.
const offending = [];
const rawSessionFlows = [];
function walk(dir) {
  let entries;
  try { entries = readdirSync(join(ROOT, dir), { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) { if (!/node_modules|\.next|\.contentlayer/.test(rel)) walk(rel); continue; }
    if (!/\.(tsx?|jsx?)$/.test(e.name)) continue;
    const text = readFileSafe(rel);
    // raw Stripe session creation outside the governed billing API = true bypass
    if (/stripe\.checkout\.sessions\.create/.test(text) && !rel.includes("api/billing/")) {
      rawSessionFlows.push(rel);
    }
  }
}
walk("pages");
walk("app");
walk("components");
// Known separate Stripe flows (events, report requests) are not CATALOG product
// checkout and are reported for awareness, not failed here.
const KNOWN_SEPARATE_FLOWS = ["pages/api/events/checkout.ts", "pages/api/reports/request.ts"];
for (const f of rawSessionFlows) if (!KNOWN_SEPARATE_FLOWS.includes(f)) offending.push(`${f} (raw stripe.checkout.sessions.create)`);
if (rawSessionFlows.some((f) => KNOWN_SEPARATE_FLOWS.includes(f))) {
  console.log(`     ℹ️  separate Stripe flows (not CATALOG checkout): ${rawSessionFlows.filter((f) => KNOWN_SEPARATE_FLOWS.includes(f)).join(", ")}`);
}
check("no CATALOG checkout bypasses the governed billing API", offending.length === 0,
  offending.length ? offending.join("; ") : "clean");

console.log("\n" + "=".repeat(60));
if (failures > 0) { console.log(`❌ Storefront coverage FAILED (${failures} issue(s)).`); process.exit(1); }
console.log("✅ Storefront coverage PASSED.");
