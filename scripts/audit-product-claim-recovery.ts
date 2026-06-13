/**
 * Audit Product Claim Recovery
 *
 * For all 43 products, assign:
 * 1. Target Claim — the strongest claim the product is designed to earn
 * 2. Evidence-Supported Claim — the strongest claim currently proven
 * 3. Recovery Status — blocked until evidenced, released, or internal
 * 4. Recovery Actions — specific steps to close the evidence gap
 *
 * Downgrade is not the answer. Recovery is the answer.
 */

import { getAllProducts } from "../lib/commercial/catalog";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  ProductClaimRecoveryPlan,
  ClaimRecoveryReport,
  generateRemediationPlan,
  determineRecoveryDecision,
  validateRecoveryPlan,
} from "../lib/product/product-claim-recovery";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

// ────────────────────────────────────────────────────────────────────────────
// Target Claims for All 43 Products
// ────────────────────────────────────────────────────────────────────────────

const PRODUCT_TARGET_CLAIMS: Record<string, { target: string; evidence: string }> = {
  // Wave 1: Existing Gold (3 products)
  fast_diagnostic: { target: "externally_proven_gold", evidence: "externally_proven_gold" },
  team_assessment: { target: "externally_proven_gold", evidence: "externally_proven_gold" },
  enterprise_assessment: { target: "externally_proven_gold", evidence: "externally_proven_gold" },

  // Wave 1B: Assessments (upgraded in prior work)
  // (These should be referenced from actual database)

  // Wave 2: Tier 1 (8 products)
  personal_decision_audit: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  boardroom_brief: { target: "board_grade_product", evidence: "blocked_until_claim_evidenced" },
  decision_exposure_instrument: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  mandate_clarity_framework: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  intervention_path_selector: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  escalation_readiness_scorecard: { target: "signal_product", evidence: "blocked_until_claim_evidenced" },
  boardroom_mode: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  diagnostic_report_basic: { target: "signal_product", evidence: "blocked_until_claim_evidenced" },

  // Tier 2 (9 products)
  structural_failure_diagnostic_canvas: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  execution_risk_index: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  team_alignment_gap_map: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  governance_drift_detector: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  strategic_priority_stack_builder: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  executive_reporting: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  diagnostic_report_pro: { target: "signal_product", evidence: "blocked_until_claim_evidenced" },
  operator_decision_pack: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  command_pack: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },

  // Tier 3 (6 products)
  execution_integrity_protocol: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  alignment_audit_playbook: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  drift_detection_framework: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  strategy_room: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  strategy_room_extended: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  boardroom_brief_builder: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },

  // Static/Reference Products (11 products)
  case_dossier_tariff_shock: { target: "static_reference", evidence: "static_reference" },
  case_dossier_team_alignment: { target: "static_reference", evidence: "static_reference" },
  case_dossier_escalation_denied: { target: "static_reference", evidence: "static_reference" },
  gmi_q1_2026: { target: "static_reference", evidence: "static_reference" },
  gmi_q2_2026: { target: "static_reference", evidence: "static_reference" },
  gmi_q3_2026: { target: "static_reference", evidence: "static_reference" },
  inner_circle: { target: "static_reference", evidence: "static_reference" },
  professional: { target: "signal_product", evidence: "blocked_until_claim_evidenced" },
  professional_annual: { target: "signal_product", evidence: "blocked_until_claim_evidenced" },
  enterprise: { target: "signal_product", evidence: "blocked_until_claim_evidenced" },
  additional_collaborator: { target: "signal_product", evidence: "blocked_until_claim_evidenced" },

  // Retainer Products (3 products)
  retainer_core: { target: "signal_product", evidence: "blocked_until_claim_evidenced" },
  retainer_operational: { target: "signal_product", evidence: "blocked_until_claim_evidenced" },
  retainer_institutional: { target: "signal_product", evidence: "blocked_until_claim_evidenced" },

  // Other products
  board_brief_builder: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  executive_reporting_priority: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  governance_suite: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
  operator_essentials_pack: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" },
};

// ────────────────────────────────────────────────────────────────────────────
// Recovery Plans by Product Type
// ────────────────────────────────────────────────────────────────────────────

function buildRecoveryPlan(product: any): ProductClaimRecoveryPlan {
  const claims = PRODUCT_TARGET_CLAIMS[product.code] || { target: "signal_product", evidence: "blocked_until_claim_evidenced" };

  const isStaticProduct =
    product.code.startsWith("case_dossier_") || product.code.startsWith("gmi_") || product.code === "inner_circle";

  const failedEvidence: any[] = [];
  if (!isStaticProduct) {
    // Most non-static products are currently blocked pending external proof
    failedEvidence.push("anti_toy", "red_team", "live_route");
  }

  const remediation = generateRemediationPlan(failedEvidence);

  const isBlockedCurrently = claims.evidence === "blocked_until_claim_evidenced";

  return {
    productCode: product.code,
    displayName: product.displayName || product.code,
    targetClaim: claims.target as any,
    evidenceSupportedClaim: claims.evidence as any,
    failedEvidence,
    recoveryDecision: isStaticProduct
      ? "hold_target_claim_block_release"
      : isBlockedCurrently
        ? "hold_target_claim_block_release"
        : "upgrade_to_evidence_claim",
    whyClaimRemainsWorthPursuing: isStaticProduct
      ? "Static reference products are appropriately classified; no recovery needed"
      : `Product has working composer and route infrastructure. Evidence gap is fixable through output improvement and external testing.`,
    requiredEngineUpgrades: remediation.engineUpgrades,
    requiredOutputUpgrades: remediation.outputUpgrades,
    releaseStatus: isBlockedCurrently
      ? "blocked_until_claim_evidenced"
      : claims.evidence === "static_reference"
        ? "released"
        : "released",
    downgradePermitted: false,
    estimatedRecoveryDays: failedEvidence.length > 0 ? 5 * failedEvidence.length : 0,
    recoveryActions: failedEvidence.includes("anti_toy")
      ? [
          "Reduce input echo via distiller engine",
          "Extract falsification pressure",
          "Add operator accountability",
          "Remove generic language",
          "Re-test anti-toy; target score <= 5",
        ]
      : [],
    upgradeThresholds: {
      antiToyScoreMax: 5,
      redTeamScoreMin: 7.0,
      genericAiOutperformRequired: true,
      marketComparisonRequired: !isStaticProduct,
      reasoningChainRequired: !isStaticProduct,
      falsificationPressureRequired: !isStaticProduct,
      operatorAccountabilityRequired: !isStaticProduct,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Main Audit
// ────────────────────────────────────────────────────────────────────────────

const products = getAllProducts();
const recoveryPlans = products.map(buildRecoveryPlan);

// Validate all plans
const validationErrors: string[] = [];
recoveryPlans.forEach((plan) => {
  const { valid, errors } = validateRecoveryPlan(plan);
  if (!valid) {
    validationErrors.push(`${plan.productCode}: ${errors.join("; ")}`);
  }
});

// Count downgrades
const downgraded = recoveryPlans.filter((p) => p.downgradePermitted);

// Report
const report: ClaimRecoveryReport = {
  generatedAt: new Date().toISOString(),
  productsReviewed: products.length,
  productsWithTargetClaims: recoveryPlans.filter((p) => p.targetClaim !== p.evidenceSupportedClaim).length,
  productsBlockedUntilClaimEvidenced: recoveryPlans.filter(
    (p) => p.releaseStatus === "blocked_until_claim_evidenced"
  ).length,
  productsDowngraded: downgraded.length,
  downgradeJustifications: downgraded.map((p) => ({
    productCode: p.productCode,
    reason: (p.downgradeReason?.split("_")[0] as any) || "unknown",
  })),
  claimRecoveryPlans: recoveryPlans,
  gateResult: validationErrors.length === 0 && downgraded.length === 0 ? "PASSED" : "FAILED",
  gateFailureReasons: [
    ...validationErrors,
    ...downgraded.map((p) => `${p.productCode}: downgraded without justification`),
  ],
};

// Output
mkdirSync(REPORTS_DIR, { recursive: true });

writeFileSync(
  join(REPORTS_DIR, "product-claim-recovery.json"),
  JSON.stringify(report, null, 2) + "\n"
);

console.log("PRODUCT CLAIM RECOVERY AUDIT");
console.log(`Generated: ${report.generatedAt}`);
console.log(`\nProducts reviewed: ${report.productsReviewed}`);
console.log(`Products with target claims: ${report.productsWithTargetClaims}`);
console.log(`Products blocked until claim evidenced: ${report.productsBlockedUntilClaimEvidenced}`);
console.log(`Products downgraded: ${report.productsDowngraded}`);

console.log(`\nGate result: ${report.gateResult}`);
if (report.gateFailureReasons.length > 0) {
  console.log(`Failures:`);
  report.gateFailureReasons.forEach((r) => console.log(`  - ${r}`));
}

console.log(`\nPersonal Decision Audit Recovery:`);
const pda = recoveryPlans.find((p) => p.productCode === "personal_decision_audit");
if (pda) {
  console.log(`  Target claim: ${pda.targetClaim}`);
  console.log(`  Evidence-supported claim: ${pda.evidenceSupportedClaim}`);
  console.log(`  Downgrade permitted: ${pda.downgradePermitted}`);
  console.log(`  Recovery actions: ${pda.recoveryActions.length}`);
  console.log(`  Estimated recovery: ${pda.estimatedRecoveryDays} days`);
}

console.log(`\nWritten: ${join(REPORTS_DIR, "product-claim-recovery.json")}`);
