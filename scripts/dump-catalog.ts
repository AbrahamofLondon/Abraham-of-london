/**
 * Quick script to dump all catalog products.
 * Run: npx tsx scripts/dump-catalog.ts
 */
import { CATALOG } from "../lib/commercial/catalog";

const products = Object.values(CATALOG);
console.log("=== COMPLETE PRODUCT CATALOG ===\n");

for (const p of products) {
  const price = p.amount > 0 ? `£${(p.amount / 100).toFixed(p.amount % 100 ? 2 : 0)}` : "Free";
  const stripe = p.stripeProductId && p.stripePriceId
    ? `✅ prod:${p.stripeProductId} / price:${p.stripePriceId}`
    : p.amount > 0 && p.active
      ? "⚠️  MISSING STRIPE IDs"
      : "—";

  console.log(`${p.code}`);
  console.log(`  Name:         ${p.displayName}`);
  console.log(`  Market name:  ${p.marketName ?? "—"}`);
  console.log(`  Public label: ${p.publicLabel ?? "—"}`);
  console.log(`  Price:        ${price} (${p.displayPrice})`);
  console.log(`  Status:       ${p.active ? "active" : "inactive"} · ${p.commercialStatus}`);
  console.log(`  Access:       ${p.accessType} · ${p.duration}`);
  console.log(`  Stripe:       ${stripe}`);
  console.log(`  Description:  ${p.shortDescription ?? "—"}`);
  console.log(`  Success path: ${p.successPath}`);
  console.log();
}
