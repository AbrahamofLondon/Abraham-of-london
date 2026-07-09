/**
 * PR C1.2a — Arithmetic verification script.
 * Runs the reconciliation engine against the frozen snapshot and catalog,
 * then reports exact primary outcome counts, anomaly flag counts, and transitions.
 * 
 * This is a verification script only. No catalogue edits, no Stripe writes.
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';

// Load the frozen snapshot
const snapshot = JSON.parse(readFileSync('./reports/gtm/stripe-catalog-snapshot.json', 'utf8'));

// We need to import the TypeScript reconciliation engine and catalog.
// Use tsx via dynamic import.
const { reconcile } = await import('../../lib/commercial/stripe/stripe-reconciliation.ts');
const { CATALOG, getAllProducts } = await import('../../lib/commercial/catalog.ts');

// Build locals array from the catalog
const locals = getAllProducts().map(p => ({
  code: p.code,
  name: p.displayName,
  amount: p.amount,
  currency: 'gbp',
  stripeProductId: p.stripeProductId,
  stripePriceId: p.stripePriceId,
  active: p.active,
  commercialStatus: p.commercialStatus || 'paid',
  recurringInterval: p.duration === 'monthly' ? 'month' : p.duration === 'annual' ? 'year' : null,
}));

console.log(`\n=== RECONCILIATION ENGINE ARITHMETIC VERIFICATION ===`);
console.log(`Snapshot: ${snapshot.productCount} Products, ${snapshot.priceCount} Prices`);
console.log(`Local products: ${locals.length}`);
console.log(`\n--- Primary Outcome Counts ---`);

const results = reconcile(snapshot, locals);

// Count primary outcomes (only local products, not orphan remotes)
const localResults = results.filter(r => r.code !== null);
const orphanResults = results.filter(r => r.code === null);

const primaryCounts = {};
for (const r of localResults) {
  primaryCounts[r.primaryOutcome] = (primaryCounts[r.primaryOutcome] || 0) + 1;
}

const primaryOrder = ['EXACT_MATCH', 'INTENTIONALLY_UNBOUND', 'PRODUCT_ID_MISMATCH', 'PRICE_ID_MISMATCH', 'LOCAL_ID_MISSING', 'REMOTE_OBJECT_MISSING', 'LOCAL_ONLY_PRODUCT', 'AMBIGUOUS_MATCH'];
let totalPrimary = 0;
for (const key of primaryOrder) {
  const count = primaryCounts[key] || 0;
  console.log(`  ${key}: ${count}`);
  totalPrimary += count;
}
console.log(`  TOTAL: ${totalPrimary}`);

// Count anomaly flags
console.log(`\n--- Anomaly Flag Counts ---`);
const anomalyCounts = {};
for (const r of localResults) {
  for (const flag of r.anomalyFlags) {
    anomalyCounts[flag] = (anomalyCounts[flag] || 0) + 1;
  }
}
for (const [key, count] of Object.entries(anomalyCounts).sort()) {
  console.log(`  ${key}: ${count}`);
}

// Orphan remotes
console.log(`\n--- Orphan Remotes ---`);
console.log(`  ORPHAN_REMOTE_PRODUCT: ${orphanResults.length}`);

// Total remote Products accounted
const matchedRemoteIds = new Set(localResults.map(r => r.remoteProductId).filter(Boolean));
console.log(`\n--- Remote Product Accounting ---`);
console.log(`  Matched to local: ${matchedRemoteIds.size}`);
console.log(`  Orphan (not matched): ${orphanResults.length}`);
console.log(`  Total remote: ${matchedRemoteIds.size + orphanResults.length}`);

// Assertions
console.log(`\n--- Assertions ---`);
const expectedExactAfter = 21 + 4 + 1; // original EXACT_MATCH + 4 Product-ID corrections + 1 missing binding correction
console.log(`  Expected EXACT_MATCH (21 + 4 + 1): ${expectedExactAfter}`);
console.log(`  Actual EXACT_MATCH: ${primaryCounts['EXACT_MATCH'] || 0}`);
console.log(`  Match: ${(primaryCounts['EXACT_MATCH'] || 0) === expectedExactAfter ? 'YES' : 'NO'}`);

console.log(`\n  Total local products: ${localResults.length}`);
console.log(`  Total primary outcomes: ${totalPrimary}`);
console.log(`  Arithmetic match: ${localResults.length === totalPrimary ? 'YES' : 'NO'}`);

// D001-D006 transition verification
console.log(`\n--- D001-D006 Transition Table ---`);
const transitionCodes = ['decision_exposure_instrument', 'mandate_clarity_framework', 'intervention_path_selector', 'operator_decision_pack', 'strategy_room_extended', 'additional_collaborator'];
for (const code of transitionCodes) {
  const r = localResults.find(x => x.code === code);
  if (r) {
    console.log(`  ${code}: primaryOutcome=${r.primaryOutcome}, anomalyFlags=[${r.anomalyFlags.join(', ')}]`);
  } else {
    console.log(`  ${code}: NOT FOUND`);
  }
}

// List all 46 products with their primary outcomes
console.log(`\n--- Full Product List (${localResults.length}) ---`);
for (const r of localResults) {
  console.log(`  ${r.code}: ${r.primaryOutcome}${r.anomalyFlags.length ? ' [' + r.anomalyFlags.join(', ') + ']' : ''}`);
}
