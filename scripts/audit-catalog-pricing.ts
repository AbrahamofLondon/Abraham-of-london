/**
 * Full catalog + pricing page audit.
 * Run: npx tsx scripts/audit-catalog-pricing.ts
 */
import { CATALOG } from "../lib/commercial/catalog";

console.log("=".repeat(140));
console.log("COMPLETE PRODUCT CATALOG vs PRICING PAGE AUDIT");
console.log("=".repeat(140));

const allProducts = Object.values(CATALOG);

// ─── Section 1: All catalog products ──────────────────────────────────────
console.log("\n## SECTION 1: ALL CATALOG PRODUCTS\n");

console.log(
  "CODE".padEnd(38),
  "NAME".padEnd(42),
  "PRICE".padEnd(14),
  "STATUS".padEnd(16),
  "STRIPE".padEnd(10)
);
console.log("-".repeat(120));

for (const p of allProducts) {
  const price = p.amount > 0 ? `£${(p.amount / 100).toFixed(p.amount % 100 ? 2 : 0)}` : "Free";
  const stripeStatus = p.stripeProductId && p.stripePriceId ? "✅" : p.amount > 0 && p.active ? "⚠️" : "—";
  const status = p.active ? (p.commercialStatus ?? "undefined") : "inactive";
  console.log(
    p.code.padEnd(38),
    (p.displayName || "").padEnd(42),
    price.padEnd(14),
    status.padEnd(16),
    stripeStatus.padEnd(10)
  );
}

// ─── Section 2: Pricing page sections ──────────────────────────────────────
console.log("\n\n## SECTION 2: PRICING PAGE TIERS\n");

const freeOnPage = ["fast_diagnostic"];
console.log("Tier 1 — Free entry:");
console.log("  Products on page:", freeOnPage.join(", "));
console.log("  Also shown: Decision Delay Exposure, Provenance Demo (from FEATURES, not CATALOG)");

console.log("\nTier 1B — Professional subscription:");
console.log("  professional:             ", CATALOG.professional?.displayPrice ?? "MISSING");
console.log("  professional_annual:      ", CATALOG.professional_annual?.displayPrice ?? "MISSING");
console.log("  enterprise:               ", CATALOG.enterprise?.displayPrice ?? "MISSING");
console.log("  additional_collaborator:  NOT ON PAGE (£15/month seat add-on)");

console.log("\nTier 2A — Reporting & execution:");
for (const code of ["executive_reporting", "strategy_room", "strategy_room_extended"]) {
  const p = CATALOG[code];
  if (p) console.log(`  ${code.padEnd(35)} ${p.active ? p.displayPrice : "INACTIVE"}`);
}

const instrumentCodes = [
  "personal_decision_audit", "decision_exposure_instrument", "mandate_clarity_framework",
  "intervention_path_selector", "execution_risk_index", "escalation_readiness_scorecard",
  "structural_failure_diagnostic_canvas", "team_alignment_gap_map", "governance_drift_detector",
  "strategic_priority_stack_builder", "board_brief_builder"
];
console.log("\nTier 2B — Decision instruments:");
for (const code of instrumentCodes) {
  const p = CATALOG[code];
  if (p) console.log(`  ${code.padEnd(35)} ${p.active ? p.displayPrice : "INACTIVE"}${!p.active ? ' ⚠️ FILTERED OUT BY .filter(p => p?.active)' : ''}`);
}

console.log("\nTier 2C — Governed playbooks:");
for (const code of ["execution_integrity_protocol", "alignment_audit_playbook", "drift_detection_framework"]) {
  const p = CATALOG[code];
  if (p) console.log(`  ${code.padEnd(35)} ${p.active ? p.displayPrice : "INACTIVE"}`);
}

console.log("\nTier 3 — Retainer (enquiry only):");
for (const code of ["retainer_core", "retainer_operational", "retainer_institutional"]) {
  const p = CATALOG[code];
  if (p) console.log(`  ${code.padEnd(35)} ${p.active ? p.displayPrice : "INACTIVE"}`);
}

// ─── Section 3: Discrepancies ─────────────────────────────────────────────
console.log("\n\n## SECTION 3: DISCREPANCIES & GAPS\n");

const issues: string[] = [];

// 1. Products with undefined commercialStatus
for (const p of allProducts) {
  if (p.active && !p.commercialStatus) {
    issues.push(`UNDEFINED COMMERCIAL STATUS: ${p.code} (${p.displayName}, ${p.displayPrice}) — should be set`);
  }
}

// 2. Active paid products missing Stripe IDs
for (const p of allProducts) {
  if (p.active && p.amount > 0 && (!p.stripeProductId || !p.stripePriceId)) {
    issues.push(`MISSING STRIPE ID: ${p.code} (${p.displayName}, ${p.displayPrice})`);
  }
}

// 3. Professional pricing not set
if (CATALOG.professional?.amount === 0) {
  issues.push(`PROFESSIONAL PRICE NOT SET: amount=0, displays as "${CATALOG.professional.displayPrice}"`);
}
if (CATALOG.professional_annual?.amount === 0) {
  issues.push(`PROFESSIONAL ANNUAL PRICE NOT SET: amount=0, displays as "${CATALOG.professional_annual.displayPrice}"`);
}

// 4. Additional collaborator not on pricing page
issues.push(`ADDITIONAL COLLABORATOR NOT ON PRICING PAGE: additional_collaborator (£15/month seat) — should appear under Professional tier`);

// 5. Active products not on pricing page
const onPricingPage = new Set([
  "fast_diagnostic", "personal_decision_audit",
  "executive_reporting", "strategy_room", "strategy_room_extended",
  "decision_exposure_instrument", "mandate_clarity_framework", "intervention_path_selector",
  "execution_risk_index", "escalation_readiness_scorecard", "structural_failure_diagnostic_canvas",
  "team_alignment_gap_map", "governance_drift_detector", "strategic_priority_stack_builder",
  "board_brief_builder",
  "execution_integrity_protocol", "alignment_audit_playbook", "drift_detection_framework",
  "retainer_core", "retainer_operational", "retainer_institutional",
  "professional", "professional_annual", "enterprise"
]);

for (const p of allProducts) {
  if (p.active && !onPricingPage.has(p.code)) {
    if (p.amount > 0 || p.commercialStatus === "paid" || p.commercialStatus === "free_controlled") {
      issues.push(`ACTIVE PRODUCT NOT ON PRICING PAGE: ${p.code} (${p.displayName}, ${p.displayPrice})`);
    }
  }
}

// 6. Products with Stripe IDs but inactive
for (const p of allProducts) {
  if (!p.active && p.stripeProductId && p.stripePriceId) {
    issues.push(`INACTIVE PRODUCT HAS STRIPE IDS: ${p.code} (${p.displayName}) — clean up Stripe or reactivate`);
  }
}

if (issues.length === 0) {
  console.log("✅ No discrepancies found.");
} else {
  console.log(`⚠️  ${issues.length} issues found:\n`);
  for (let i = 0; i < issues.length; i++) {
    console.log(`  ${i + 1}. ${issues[i]}`);
  }
}

// ─── Section 4: Summary ───────────────────────────────────────────────────
console.log("\n\n## SECTION 4: SUMMARY\n");
console.log(`Total catalog products:        ${allProducts.length}`);
console.log(`Active products:               ${allProducts.filter(p => p.active).length}`);
console.log(`Inactive products:             ${allProducts.filter(p => !p.active).length}`);
console.log(`Products with Stripe IDs:      ${allProducts.filter(p => p.stripeProductId && p.stripePriceId).length}`);
console.log(`Products missing Stripe IDs:   ${allProducts.filter(p => p.active && p.amount > 0 && (!p.stripeProductId || !p.stripePriceId)).length}`);
console.log(`Products with undefined status:${allProducts.filter(p => p.active && !p.commercialStatus).length}`);
console.log(`Products on pricing page:      ${onPricingPage.size}`);