#!/usr/bin/env node
/**
 * scripts/check-commercial-checkout-governance.mjs
 *
 * READ-ONLY commercial checkout governance verification + Stripe metadata audit.
 *
 * Enforces the non-negotiable: checkout-ready data is not checkout permission.
 * The resolver is the commercial authority; governance state controls
 * purchasability; blocked products stay blocked even with valid Stripe IDs.
 *
 * Exits non-zero on any governance violation.
 */

import {
  parseCatalogProduct, allLiteralCatalogKeys, getGovernanceState,
  resolveCommercialAction, BLOCKED, readFileSafe,
} from "./_commercial-mirror.mjs";

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const keys = allLiteralCatalogKeys();
const products = keys.map((k) => ({ key: k, p: parseCatalogProduct(k), g: getGovernanceState(k) }))
  .filter((x) => x.p);
const actionFor = (x) => resolveCommercialAction(x.p, x.g);

console.log("\n────────────────────────────────────────────────────────────");
console.log("  COMMERCIAL CHECKOUT GOVERNANCE");
console.log("────────────────────────────────────────────────────────────\n");

// ── Stripe metadata audit (honest recording, no fabrication) ───────────────
const audit = {
  complete: [], missingProductId: [], missingPriceId: [],
  stripePresentButGovernanceBlocked: [], checkoutSafeButMissingStripe: [],
  manualFulfilmentOnly: [], contracted: [], freeAccess: [],
};
for (const x of products) {
  const { key, p, g } = x;
  const hasPid = Boolean(p.stripeProductId);
  const hasPrice = Boolean(p.stripePriceId);
  if (hasPid && hasPrice) audit.complete.push(key);
  if (!hasPid) audit.missingProductId.push(key);
  if (!hasPrice) audit.missingPriceId.push(key);

  const action = actionFor(x);
  const governanceBlocked = g.known && (g.readinessStatus === "blocked" || g.releaseMode === "blocked" || String(g.releaseLane || "").startsWith("blocked") || g.checkoutSafe === false || g.commercialSafe === false);
  if ((hasPid || hasPrice) && governanceBlocked) audit.stripePresentButGovernanceBlocked.push(key);
  if (p.commercialStatus === "paid" && p.requiresCheckout === true && !governanceBlocked && !hasPrice) audit.checkoutSafeButMissingStripe.push(key);
  if (g.releaseMode === "manual_fulfilment_only" || p.commercialStatus === "manual_billing") audit.manualFulfilmentOnly.push(key);
  if (p.commercialStatus === "contracted" || p.requiresContract === true) audit.contracted.push(key);
  if (action.state === "view_free_surface") audit.freeAccess.push(key);
}

console.log("📊 Stripe metadata audit:");
for (const [k, v] of Object.entries(audit)) console.log(`  ${k.padEnd(34)} ${v.length}${v.length ? `  [${v.slice(0, 8).join(", ")}${v.length > 8 ? ", …" : ""}]` : ""}`);
console.log("");

// ── Governance rules ────────────────────────────────────────────────────────
console.log("Governance rules:");

// 1. Blocked products with Stripe IDs still resolve to non-checkout
for (const code of BLOCKED) {
  const p = parseCatalogProduct(code);
  if (!p) { check(`${code} present in catalog`, false, "missing"); continue; }
  const action = resolveCommercialAction(p, getGovernanceState(code));
  check(`blocked ${code} → non-checkout despite Stripe`, action.purchasable === false && action.state !== "checkout",
    `action=${action.state} stripePriceId=${p.stripePriceId ? "present" : "none"}`);
}

// 2. Manual-fulfilment products do not expose direct checkout
const manualProducts = products.filter((x) => x.g.releaseMode === "manual_fulfilment_only" || x.p.commercialStatus === "manual_billing");
let manualViol = manualProducts.filter((x) => actionFor(x).state === "checkout").map((x) => x.key);
check("manual-fulfilment products never resolve to checkout", manualViol.length === 0, manualViol.join(", ") || `${manualProducts.length} checked`);

// 3. Free products do not require Stripe checkout
const freeProducts = products.filter((x) => actionFor(x).state === "view_free_surface");
let freeViol = freeProducts.filter((x) => actionFor(x).purchasable).map((x) => x.key);
check("free products are non-purchasable (no Stripe checkout)", freeViol.length === 0, `${freeProducts.length} free`);

// 4. Contracted products do not expose direct checkout
const contractedProducts = products.filter((x) => x.p.commercialStatus === "contracted" || x.p.requiresContract === true);
let contractedViol = contractedProducts.filter((x) => actionFor(x).state === "checkout").map((x) => x.key);
check("contracted products never resolve to checkout", contractedViol.length === 0, `${contractedProducts.length} contracted`);

// 5. checkout-safe products missing Stripe are flagged (honest, non-fatal record)
if (audit.checkoutSafeButMissingStripe.length) {
  console.log(`  ⚠️  checkout-safe-intended but missing Stripe metadata: ${audit.checkoutSafeButMissingStripe.join(", ")} (resolver returns 'unavailable')`);
}

// 6. All checkout buttons use the resolver (defense in depth)
const cbText = readFileSafe("components/commercial/CheckoutButton.tsx");
check("CheckoutButton is resolver-gated", cbText.includes("resolveCommercialAction") && cbText.includes("checkoutPermitted"));

// 7. Server checkout API enforces the governance gate
const apiText = readFileSafe("pages/api/billing/checkout.ts");
check("billing API enforces governance gate", apiText.includes("resolveCommercialAction") && apiText.includes("CHECKOUT_BLOCKED_BY_GOVERNANCE"));

console.log("\n" + "=".repeat(60));
if (failures > 0) { console.log(`❌ Checkout governance FAILED (${failures} issue(s)).`); process.exit(1); }
console.log("✅ Checkout governance PASSED.");
