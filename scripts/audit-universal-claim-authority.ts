/**
 * Universal Claim Authority Audit — All 43 Products
 *
 * This script audits all 43 products against their evidence availability
 * and determines the maximum honest state each product can claim.
 *
 * For each product:
 * 1. What evidence exists today?
 * 2. What claim does that evidence support?
 * 3. What's the maximum honest state for this product?
 * 4. What upgrade can be applied immediately?
 * 5. What blocks the next state?
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAllProducts } from "../lib/commercial/catalog";
import { evaluateClaim } from "../lib/product/universal-claim-authority";
import { ProductMaximumState, ProductStateAssessment, describeState } from "../lib/product/product-maximum-state";
import { readFileSync, existsSync } from "node:fs";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

// Load existing evidence
const externalBenchmark = existsSync(join(REPORTS_DIR, "external-product-value-benchmark.json"))
  ? JSON.parse(readFileSync(join(REPORTS_DIR, "external-product-value-benchmark.json"), "utf-8"))
  : null;

const universalGoldStandard = existsSync(join(REPORTS_DIR, "universal-product-gold-standard-98.json"))
  ? JSON.parse(readFileSync(join(REPORTS_DIR, "universal-product-gold-standard-98.json"), "utf-8"))
  : null;

const gold98Report = existsSync(join(REPORTS_DIR, "universal-product-gold-standard-98.json"))
  ? JSON.parse(readFileSync(join(REPORTS_DIR, "universal-product-gold-standard-98.json"), "utf-8"))
  : null;

// Map of product code to evidence
const evidenceByProduct = new Map<string, Set<string>>();
const currentStatusByProduct = new Map<string, ProductMaximumState>();

// Populate from external benchmark
if (externalBenchmark && externalBenchmark.results) {
  externalBenchmark.results.forEach((result: any) => {
    const code = result.productCode;
    const evidence = new Set<string>();

    if (result.wasInternalGoldClaim) {
      evidence.add("internal_certification");
    }

    if (result.renderedOutputReviewed) {
      evidence.add("rendered_output_capture");
    }

    if (result.liveRouteVerified) {
      evidence.add("live_route_output");
    }

    if (result.antiToyScore !== null) {
      evidence.add("anti_toy_test");
      if (result.antiToyScore <= 5) {
        evidence.add("anti_toy_pass");
      }
    }

    if (result.redTeamSurvives) {
      evidence.add("red_team_pass");
    }

    if (result.outperformsGenericAi === true) {
      evidence.add("generic_ai_outperform_pass");
    }

    if (result.usefulnessProofs && result.usefulnessProofs.length > 0) {
      evidence.add("usefulness_proof");
    }

    // Map final status to maximum state
    let state: ProductMaximumState = "blocked_until_evidence";
    if (result.finalStatus === "externally_proven_gold") {
      state = "externally_proven_gold_product";
      evidence.add("evidence_ledger_entry");
    } else if (result.finalStatus === "blocked_for_low_value") {
      state = "blocked_until_evidence";
    } else if (result.finalStatus === "internal_only") {
      state = "internal_only";
    }

    evidenceByProduct.set(code, evidence);
    currentStatusByProduct.set(code, state);
  });
}

// Get all products
const allProducts = getAllProducts();

// Build assessments
const assessments: ProductStateAssessment[] = allProducts.map((product) => {
  const code = product.code;
  const evidence = evidenceByProduct.get(code) || new Set<string>();
  const currentClaimed = currentStatusByProduct.get(code) || "blocked_until_evidence";

  // Determine evidence-supported state
  let evidenceSupportedState: ProductMaximumState = "static_reference";
  if (evidence.has("evidence_ledger_entry") && evidence.has("anti_toy_pass") && evidence.has("red_team_pass")) {
    evidenceSupportedState = "externally_proven_gold_product";
  } else if (evidence.has("rendered_output_capture") && evidence.has("anti_toy_pass")) {
    evidenceSupportedState = "diagnostic_product";
  } else if (evidence.has("rendered_output_capture")) {
    evidenceSupportedState = "signal_product";
  }

  // Determine maximum achievable now (local upgrades)
  let maximumAchievableNow = evidenceSupportedState;

  // For static products (no live route, no composer output)
  const isStatic =
    !evidence.has("rendered_output_capture") &&
    !evidence.has("live_route_output") &&
    (product.commercialStatus === "dormant" ||
      product.commercialStatus === "internal_only" ||
      product.commercialStatus === "inactive" ||
      product.commercialStatus === "retired");

  if (isStatic) {
    maximumAchievableNow = "static_reference";
  }

  // Blockers
  const blockedFromHigherStateBecause: Array<{ reason: string; type: string }> = [];

  if (!evidence.has("live_route_output")) {
    blockedFromHigherStateBecause.push({
      reason: "No live route output captured",
      type: "missing_evidence",
    });
  }

  if (!evidence.has("rendered_output_capture")) {
    blockedFromHigherStateBecause.push({
      reason: "No rendered output captured",
      type: "missing_evidence",
    });
  }

  if (product.commercialStatus === "paid" && !evidence.has("fulfilment_proof")) {
    blockedFromHigherStateBecause.push({
      reason: "Paid product without fulfilment proof",
      type: "external_dependency",
    });
  }

  const immediateUpgradeAvailable = maximumAchievableNow !== currentClaimed;

  return {
    productCode: code,
    productFamily: product.category || "unknown",
    commercialStatus: product.commercialStatus || "unknown",
    currentClaimedState: currentClaimed,
    evidenceSupportedState,
    maximumAchievableNow,
    blockedFromHigherStateBecause,
    immediateUpgradeAvailable,
    upgradeAppliedThisPass: false,
    remainingUpgradePath: blockedFromHigherStateBecause.length > 0
      ? [{ nextState: "governed_decision_product", blocker: blockedFromHigherStateBecause[0].reason }]
      : [],
    finalStateAfterPass: maximumAchievableNow,
    finalStateReason: `Product evidence supports ${describeState(maximumAchievableNow)}`,
  };
});

// Summary stats
const summary = {
  productsReviewed: assessments.length,
  externallyProvenGold: assessments.filter((a) => a.finalStateAfterPass === "externally_proven_gold_product").length,
  diagnosticProducts: assessments.filter((a) => a.finalStateAfterPass === "diagnostic_product").length,
  signalProducts: assessments.filter((a) => a.finalStateAfterPass === "signal_product").length,
  staticReference: assessments.filter((a) => a.finalStateAfterPass === "static_reference").length,
  internalOnly: assessments.filter((a) => a.finalStateAfterPass === "internal_only").length,
  blockedUntilEvidence: assessments.filter((a) => a.finalStateAfterPass === "blocked_until_evidence").length,
  immediateUpgradesAvailable: assessments.filter((a) => a.immediateUpgradeAvailable).length,
};

console.log("UNIVERSAL CLAIM AUTHORITY AUDIT");
console.log(`Products reviewed: ${summary.productsReviewed}`);
console.log(`Externally proven gold: ${summary.externallyProvenGold}`);
console.log(`Diagnostic products: ${summary.diagnosticProducts}`);
console.log(`Signal products: ${summary.signalProducts}`);
console.log(`Static reference: ${summary.staticReference}`);
console.log(`Internal only: ${summary.internalOnly}`);
console.log(`Blocked until evidence: ${summary.blockedUntilEvidence}`);
console.log(`Immediate upgrades available: ${summary.immediateUpgradesAvailable}`);

// Write reports
mkdirSync(REPORTS_DIR, { recursive: true });

writeFileSync(
  join(REPORTS_DIR, "universal-claim-authority.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary,
      assessments: assessments.sort((a, b) => a.productCode.localeCompare(b.productCode)),
    },
    null,
    2
  ) + "\n"
);

console.log(`\nReport written: ${join(REPORTS_DIR, "universal-claim-authority.json")}`);
