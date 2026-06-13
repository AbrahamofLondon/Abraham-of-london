/**
 * lib/product/product-claim-recovery.ts
 *
 * Product Claim Recovery Model
 *
 * Philosophy: Never downgrade ambition when the codebase can be upgraded.
 *
 * Each product carries two states:
 * 1. Target Claim — the strongest claim the product is designed to earn
 * 2. Evidence-Supported Claim — the strongest claim currently proven
 *
 * If target > evidence, the product remains blocked until upgraded.
 * Downgrade is only permitted if the claim is structurally impossible,
 * commercially incoherent, or the product is being intentionally converted.
 *
 * This model prevents false downgrade decisions and ensures that failed
 * external tests trigger remediation rather than abandonment of claims.
 */

export type EvidenceFailureType =
  | "anti_toy"
  | "red_team"
  | "generic_ai_outperformance"
  | "market_comparison"
  | "live_route"
  | "reasoning_chain"
  | "fulfilment"
  | "webhook"
  | "operator_review"
  | "reasoning_depth"
  | "falsification_pressure"
  | "operator_accountability";

export type ClaimRecoveryDecision =
  | "upgrade_to_evidence_claim"
  | "hold_target_claim_block_release"
  | "downgrade_only_if_structurally_impossible"
  | "retire_claim"
  | "convert_product_type";

export type ClaimLevel =
  | "static_reference"
  | "signal_product"
  | "diagnostic_product"
  | "judgement_product"
  | "board_grade_product"
  | "externally_proven_gold";

export interface ProductClaimRecoveryPlan {
  productCode: string;
  displayName: string;

  /** The strongest claim this product is designed to earn through future work */
  targetClaim: ClaimLevel;

  /** The strongest claim currently proven by evidence */
  evidenceSupportedClaim: ClaimLevel;

  /** Evidence types that failed in external testing */
  failedEvidence: EvidenceFailureType[];

  /** Decision: upgrade system, hold target, retire, or convert product */
  recoveryDecision: ClaimRecoveryDecision;

  /** Explanation of why the target claim remains worth pursuing */
  whyClaimRemainsWorthPursuing: string;

  /** Engine-layer upgrades required to close the evidence gap */
  requiredEngineUpgrades: string[];

  /** Output-structure upgrades required to close the evidence gap */
  requiredOutputUpgrades: string[];

  /** Current release status */
  releaseStatus: "blocked_until_claim_evidenced" | "released" | "internal_only";

  /** Hard rule: downgrade only if conditions met */
  downgradePermitted: boolean;

  /** If downgradePermitted, the structural/commercial reason */
  downgradeReason?: string;

  /** Timeline estimate for claim evidence recovery (days) */
  estimatedRecoveryDays?: number;

  /** Specific actions to close the evidence gap */
  recoveryActions: string[];

  /** Evidence thresholds that must be met for upgrade */
  upgradeThresholds: {
    antiToyScoreMax?: number;
    redTeamScoreMin?: number;
    genericAiOutperformRequired?: boolean;
    marketComparisonRequired?: boolean;
    reasoningChainRequired?: boolean;
    falsificationPressureRequired?: boolean;
    operatorAccountabilityRequired?: boolean;
  };
}

export interface ClaimRecoveryReport {
  generatedAt: string;
  productsReviewed: number;
  productsWithTargetClaims: number;
  productsBlockedUntilClaimEvidenced: number;
  productsDowngraded: number;
  downgradeJustifications: Array<{
    productCode: string;
    reason: "structurally_impossible" | "commercially_incoherent" | "no_recovery_path" | "converted_product_type" | "retired";
  }>;
  claimRecoveryPlans: ProductClaimRecoveryPlan[];
  gateResult: "PASSED" | "FAILED";
  gateFailureReasons: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Determine if downgrade is justified
 */
export function isDowngradeJustified(plan: ProductClaimRecoveryPlan): boolean {
  if (!plan.downgradePermitted) {
    return false;
  }

  const justifiedReasons = [
    "structurally_impossible",
    "commercially_incoherent",
    "no_realistic_recovery_path",
    "product_being_converted",
    "product_being_retired",
  ];

  return plan.downgradeReason ? justifiedReasons.some((r) => plan.downgradeReason?.includes(r)) : false;
}

/**
 * Validate claim recovery plan consistency
 */
export function validateRecoveryPlan(plan: ProductClaimRecoveryPlan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // If downgrade is not permitted, target must be >= evidence
  if (!plan.downgradePermitted) {
    const targetRank = claimRank(plan.targetClaim);
    const evidenceRank = claimRank(plan.evidenceSupportedClaim);

    if (evidenceRank > targetRank) {
      errors.push(`Evidence claim (${plan.evidenceSupportedClaim}) cannot exceed target claim (${plan.targetClaim}) when downgrade not permitted`);
    }
  }

  // If blocked, must have recovery actions
  if (plan.releaseStatus === "blocked_until_claim_evidenced" && plan.recoveryActions.length === 0) {
    errors.push(`Product blocked but no recovery actions defined`);
  }

  // If downgrade permitted, must have reason
  if (plan.downgradePermitted && !plan.downgradeReason) {
    errors.push(`Downgrade permitted but no reason provided`);
  }

  // If downgrade not permitted, must explain why target is worth pursuing
  if (!plan.downgradePermitted && !plan.whyClaimRemainsWorthPursuing) {
    errors.push(`Downgrade not permitted but no justification for pursuing target claim`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Rank claim level for comparison
 */
function claimRank(claim: ClaimLevel): number {
  const ranks: Record<ClaimLevel, number> = {
    static_reference: 0,
    signal_product: 1,
    diagnostic_product: 2,
    judgement_product: 3,
    board_grade_product: 4,
    externally_proven_gold: 5,
  };
  return ranks[claim] ?? -1;
}

/**
 * Determine recovery decision based on evidence failures and feasibility
 */
export function determineRecoveryDecision(
  failedEvidence: EvidenceFailureType[],
  hasRecoveryPath: boolean,
  targetClaim: ClaimLevel
): ClaimRecoveryDecision {
  if (!hasRecoveryPath) {
    return "retire_claim";
  }

  if (failedEvidence.length === 0) {
    return "upgrade_to_evidence_claim";
  }

  return "hold_target_claim_block_release";
}

/**
 * Generate remediation recommendations for failed evidence
 */
export function generateRemediationPlan(failures: EvidenceFailureType[]): {
  engineUpgrades: string[];
  outputUpgrades: string[];
} {
  const engineUpgrades: Set<string> = new Set();
  const outputUpgrades: Set<string> = new Set();

  failures.forEach((failure) => {
    switch (failure) {
      case "anti_toy":
        engineUpgrades.add("reduce_input_echo");
        engineUpgrades.add("distil_decision_logic");
        outputUpgrades.add("eliminate_generic_language");
        outputUpgrades.add("add_case_specific_terminology");
        break;

      case "red_team":
        engineUpgrades.add("extract_falsification_pressure");
        engineUpgrades.add("identify_testable_assumptions");
        outputUpgrades.add("add_operator_accountability");
        outputUpgrades.add("add_decision_deadline");
        break;

      case "generic_ai_outperformance":
        engineUpgrades.add("increase_reasoning_depth");
        engineUpgrades.add("add_domain_specific_logic");
        outputUpgrades.add("distinguish_from_generic_output");
        break;

      case "reasoning_chain":
      case "reasoning_depth":
        engineUpgrades.add("strengthen_reasoning_engine");
        engineUpgrades.add("add_falsification_challenge_layer");
        break;

      case "falsification_pressure":
        engineUpgrades.add("extract_testable_assumptions");
        engineUpgrades.add("model_evidence_that_would_change_judgement");
        break;

      case "operator_accountability":
        outputUpgrades.add("assign_decision_owner");
        outputUpgrades.add("set_decision_deadline");
        outputUpgrades.add("define_success_check");
        break;

      case "live_route":
        engineUpgrades.add("wire_live_route");
        engineUpgrades.add("implement_output_capture");
        break;

      case "webhook":
      case "fulfilment":
      case "operator_review":
        engineUpgrades.add("implement_operational_layer");
        break;

      case "market_comparison":
        engineUpgrades.add("benchmark_against_market_baseline");
        outputUpgrades.add("demonstrate_outperformance");
        break;
    }
  });

  return {
    engineUpgrades: Array.from(engineUpgrades),
    outputUpgrades: Array.from(outputUpgrades),
  };
}

export default {
  isDowngradeJustified,
  validateRecoveryPlan,
  determineRecoveryDecision,
  generateRemediationPlan,
};
