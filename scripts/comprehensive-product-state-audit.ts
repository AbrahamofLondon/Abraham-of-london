/**
 * Comprehensive Product State Audit
 *
 * Full review of all 43 products with detailed state assessment.
 * Determines maximum achievable state and immediate upgrade actions.
 */

import { getAllProducts } from "../lib/commercial/catalog";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

// Load evidence sources
const externalBench = existsSync(join(REPORTS_DIR, "external-product-value-benchmark.json"))
  ? JSON.parse(readFileSync(join(REPORTS_DIR, "external-product-value-benchmark.json"), "utf-8"))
  : null;

// Map of evidence by product
const productEvidence = new Map<
  string,
  {
    code: string;
    name: string;
    status: string;
    isGold: boolean;
    hasLiveRoute: boolean;
    hasComposer: boolean;
    isStatic: boolean;
    isPaid: boolean;
    commercialStatus: string;
    evidence: string[];
    currentClaim: string;
    maxHonestState: string;
    action: string;
  }
>();

const allProducts = getAllProducts();

// Build initial evidence map from external benchmark
const goldProducts = new Set<string>();
const blockedLowValue = new Set<string>();

if (externalBench && externalBench.results) {
  externalBench.results.forEach((r: any) => {
    if (r.finalStatus === "externally_proven_gold") {
      goldProducts.add(r.productCode);
    }
    if (r.finalStatus === "blocked_for_low_value") {
      blockedLowValue.add(r.productCode);
    }
  });
}

// Analyze each product
allProducts.forEach((product) => {
  const code = product.code;
  const isGold = goldProducts.has(code);
  const isLowValue = blockedLowValue.has(code);

  // Determine product type
  const isPaid = product.commercialStatus === "paid" || product.commercialStatus === "contracted";
  const isInternal = product.commercialStatus === "internal_only" || product.commercialStatus === "inactive";
  const isDormant = product.commercialStatus === "dormant" || product.commercialStatus === "retired";

  // Determine if product has active composer/computation
  const hasComposer = [
    "fast_diagnostic",
    "team_assessment",
    "enterprise_assessment",
    "personal_decision_audit",
    "boardroom_brief",
    "decision_exposure_instrument",
    "mandate_clarity_framework",
    "intervention_path_selector",
    "escalation_readiness_scorecard",
    "structural_failure_diagnostic_canvas",
    "execution_risk_index",
    "team_alignment_gap_map",
    "governance_drift_detector",
    "strategic_priority_stack_builder",
    "board_brief_builder",
    "execution_integrity_protocol",
    "alignment_audit_playbook",
    "drift_detection_framework",
    "operator_decision_pack",
    "operator_essentials_pack",
    "command_pack",
    "governance_suite",
    "boardroom_mode",
    "executive_reporting",
    "diagnostic_report_basic",
    "diagnostic_report_pro",
    "executive_reporting_priority",
    "strategy_room",
    "strategy_room_extended",
  ].includes(code);

  // Determine if product is static (case dossier, archive, etc.)
  const isStatic =
    code.startsWith("case_dossier_") ||
    code.startsWith("gmi_") ||
    code.includes("archive") ||
    product.commercialStatus === "dormant" ||
    product.commercialStatus === "retired";

  // Evidence list
  const evidence: string[] = [];
  let currentClaim = "blocked_until_evidence";
  let maxHonestState = "blocked_until_evidence";
  let action = "review_in_future_pass";

  if (isGold) {
    evidence.push("externally_proven_gold_evidence");
    currentClaim = "externally_proven_gold_product";
    maxHonestState = "externally_proven_gold_product";
    action = "maintain_gold_status";
  } else if (isLowValue) {
    evidence.push("rendered_output_capture");
    evidence.push("anti_toy_test_failed");
    currentClaim = "blocked_for_low_value";
    maxHonestState = "blocked_until_evidence";
    action = "composer_redesign_required";
  } else if (hasComposer && !isGold) {
    evidence.push("composer_exists");
    evidence.push("renders_output");
    // Not yet tested by external benchmark
    currentClaim = "blocked_until_evidence";
    maxHonestState = "diagnostic_product"; // If it has a composer, it could be diagnostic
    action = "wire_live_route_and_test_externally";
  } else if (isStatic) {
    evidence.push("static_content");
    currentClaim = "static_reference";
    maxHonestState = "static_reference";
    action = "accept_static_reference_state";
  } else if (isInternal) {
    evidence.push("internal_product_definition");
    currentClaim = "internal_only";
    maxHonestState = "internal_only";
    action = "keep_internal_only";
  } else if (isDormant) {
    evidence.push("dormant_product");
    currentClaim = "dormant";
    maxHonestState = "dormant";
    action = "keep_dormant";
  } else {
    evidence.push("product_exists");
    if (isPaid) {
      evidence.push("paid_product");
      evidence.push("blocked_awaiting_fulfilment_proof");
    }
    currentClaim = "blocked_until_evidence";
    maxHonestState = hasComposer ? "diagnostic_product" : "static_reference";
    action = "gather_external_proof_or_reclassify";
  }

  productEvidence.set(code, {
    code,
    name: product.displayName,
    status: product.commercialStatus || "unknown",
    isGold,
    hasLiveRoute: isGold, // Approximate: gold products have live routes
    hasComposer,
    isStatic,
    isPaid,
    commercialStatus: product.commercialStatus || "unknown",
    evidence,
    currentClaim,
    maxHonestState,
    action,
  });
});

// Summary
const summary = {
  totalProducts: allProducts.length,
  externallyProvenGold: Array.from(productEvidence.values()).filter((p) => p.isGold).length,
  compositionalProducts: Array.from(productEvidence.values()).filter((p) => p.hasComposer && !p.isGold).length,
  staticProducts: Array.from(productEvidence.values()).filter((p) => p.isStatic).length,
  internalProducts: Array.from(productEvidence.values()).filter((p) => p.commercialStatus === "internal_only").length,
  paidProducts: Array.from(productEvidence.values()).filter((p) => p.isPaid).length,
  dormentProducts: Array.from(productEvidence.values()).filter((p) => p.commercialStatus === "dormant" || p.commercialStatus === "retired").length,
};

console.log("COMPREHENSIVE PRODUCT STATE AUDIT");
console.log(`Total products: ${summary.totalProducts}`);
console.log(`Externally proven gold: ${summary.externallyProvenGold}`);
console.log(`Compositional (have composer): ${summary.compositionalProducts}`);
console.log(`Static products: ${summary.staticProducts}`);
console.log(`Internal products: ${summary.internalProducts}`);
console.log(`Paid products: ${summary.paidProducts}`);
console.log(`Dormant/retired: ${summary.dormentProducts}`);

// Build table
const table: any[] = Array.from(productEvidence.values())
  .sort((a, b) => a.code.localeCompare(b.code))
  .map((p) => ({
    productCode: p.code,
    displayName: p.name,
    commercialStatus: p.status,
    hasComposer: p.hasComposer,
    isStatic: p.isStatic,
    isPaid: p.isPaid,
    currentClaim: p.currentClaim,
    maxHonestState: p.maxHonestState,
    action: p.action,
  }));

// Write comprehensive report
mkdirSync(REPORTS_DIR, { recursive: true });

writeFileSync(
  join(REPORTS_DIR, "product-maximum-state-audit.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary,
      products: table,
    },
    null,
    2
  ) + "\n"
);

console.log(`\nReport written: ${join(REPORTS_DIR, "product-maximum-state-audit.json")}`);

// Write markdown table
const markdown = `# Product Maximum-State Audit

Generated: ${new Date().toISOString()}

## Summary

| Metric | Count |
|--------|-------|
| Total Products | ${summary.totalProducts} |
| Externally Proven Gold | ${summary.externallyProvenGold} |
| Compositional (Composer) | ${summary.compositionalProducts} |
| Static | ${summary.staticProducts} |
| Internal Only | ${summary.internalProducts} |
| Paid | ${summary.paidProducts} |
| Dormant/Retired | ${summary.dormentProducts} |

## Product States

| Code | Name | Status | Has Composer | Is Static | Is Paid | Current Claim | Max Honest State | Action |
|------|------|--------|--------------|-----------|---------|---------------|------------------|--------|
${table
  .map(
    (p) =>
      `| ${p.productCode} | ${p.displayName} | ${p.commercialStatus} | ${p.hasComposer ? "✓" : ""} | ${p.isStatic ? "✓" : ""} | ${p.isPaid ? "✓" : ""} | ${p.currentClaim} | ${p.maxHonestState} | ${p.action} |`
  )
  .join("\n")}

## Product Classification Rules

### Externally Proven Gold
- Must have: live route, rendered output, anti-toy pass, red-team pass, market comparison pass
- Example: fast_diagnostic, team_assessment, enterprise_assessment

### Diagnostic Product
- Must have: composer, rendered output capture
- Can claim: diagnosis (but not full judgement without reasoning chain)
- Requirements: signal extraction, pattern classification visible

### Signal Product
- Must have: input interpretation, signal extraction capability
- Can claim: signal, initial insight
- Cannot claim: diagnosis, judgement, intelligence

### Static Reference
- No computation, no live output
- Can claim: reference value, historical context, pattern examples
- Cannot claim: judgement, diagnosis, intelligence, simulation

### Internal Only
- Not customer-facing
- No public claims
- Example: internal utilities, admin products

### Blocked Until Evidence
- Has potential to be higher state
- Missing: rendered output, external validation, live route, payment proof
- Action: gather proof or reclassify as static

`;

writeFileSync(join(REPORTS_DIR, "product-maximum-state-audit.md"), markdown);

console.log(`Markdown written: ${join(REPORTS_DIR, "product-maximum-state-audit.md")}`);
