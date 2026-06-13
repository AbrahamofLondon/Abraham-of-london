/**
 * lib/validation/validation-constitution.ts
 *
 * Validation Constitution: Non-Negotiable Rules
 *
 * If products protect customers from weak-evidence decisions,
 * the validation system must be more rigorous than the products it judges.
 *
 * These are constitutional rules. They cannot be violated without escalation.
 */

export type ValidationAppliesTo =
  | "product"
  | "route"
  | "composer"
  | "artifact"
  | "report"
  | "benchmark"
  | "gate"
  | "classification"
  | "evidence_ledger";

export type RequiredResponse =
  | "block_release"
  | "mark_measurement_inconclusive"
  | "revoke_claim"
  | "require_independent_retest"
  | "freeze_status"
  | "escalate_to_operator_review";

export type RuleSeverity = "warning" | "blocking" | "critical";

export interface ValidationConstitutionRule {
  id: string;
  priority: number; // 1-100, higher = more critical
  name: string;
  principle: string;
  appliesTo: ValidationAppliesTo[];
  violationCondition: string;
  requiredResponse: RequiredResponse;
  severity: RuleSeverity;
  reasoningChain: string;
}

/**
 * The 12 Non-Negotiable Rules of the Validation Constitution
 */
export const VALIDATION_CONSTITUTION: ValidationConstitutionRule[] = [
  {
    id: "rule_1_no_single_metric_upgrade",
    priority: 95,
    name: "No Single Metric Upgrade",
    principle: "Improvement from a single metric is not validation.",
    appliesTo: ["product", "classification"],
    violationCondition: "Product upgraded based on decision-force score alone",
    requiredResponse: "block_release",
    severity: "critical",
    reasoningChain:
      "A single metric cannot prove customer value. Decision-force measures structure, not substance. Anti-toy and red-team measure actual usefulness. All three required for upgrade.",
  },

  {
    id: "rule_2_no_scorer_product_coupling",
    priority: 98,
    name: "No Scorer/Product Coupling",
    principle: "Scorer changes and product changes must not occur in the same validation pass.",
    appliesTo: ["product", "benchmark", "validation_ledger"],
    violationCondition: "Scorer changed AND product changed in same pass, result marked as product upgrade",
    requiredResponse: "mark_measurement_inconclusive",
    severity: "critical",
    reasoningChain:
      "If scorer changes and product claims improve simultaneously, we cannot distinguish product improvement from measurement change. Example: fixing regex match in scorer, then claiming decision-force improvement without retesting against frozen scorer.",
  },

  {
    id: "rule_3_full_validation_chain",
    priority: 99,
    name: "Full Validation Chain Required",
    principle: "No product may be upgraded without anti-toy, red-team, generic-AI, and market comparison evidence.",
    appliesTo: ["product", "classification"],
    violationCondition:
      "Product upgraded with fewer than 4 independent test results, or any test marked null/incomplete",
    requiredResponse: "block_release",
    severity: "critical",
    reasoningChain:
      "Partial validation is weak evidence. Anti-toy tests case-derivation. Red-team tests substance. Generic-AI tests outperformance. Market comparison tests positioning. Missing any one of these leaves a blind spot.",
  },

  {
    id: "rule_4_reasoning_chain_required",
    principle: "No product may claim judgement without reasoning-chain evidence.",
    priority: 90,
    appliesTo: ["product", "artifact", "report"],
    violationCondition:
      "Product claims diagnostic_product or judgement_product without reasoning-chain-evidence fields populated",
    requiredResponse: "revoke_claim",
    severity: "critical",
    reasoningChain:
      "Judgement claims require proof that the system reasons through the problem, not just summarizes input. Reasoning-chain evidence documents: signals interpreted, weights assigned, contradictions resolved, patterns identified, consequences modeled.",
  },

  {
    id: "rule_5_rendered_output_required",
    priority: 92,
    name: "Rendered Output Evidence Required",
    principle: "No product may claim external proof without live/rendered output evidence.",
    appliesTo: ["product", "artifact", "evidence_ledger"],
    violationCondition:
      "Product claims externally_proven_gold_product or diagnostic_product without rendered output captured in validation evidence",
    requiredResponse: "revoke_claim",
    severity: "critical",
    reasoningChain:
      "Claims about customer-facing value must be based on what the customer actually sees, not internal fields. Rendered output must be captured in evidence ledger with hash for traceability.",
  },

  {
    id: "rule_6_no_static_intelligence_claim",
    priority: 88,
    name: "No Static Intelligence Claim",
    principle: "No static product may claim intelligence or judgement.",
    appliesTo: ["product", "classification"],
    violationCondition:
      "Product with static_output_only flag claims judgement_product or intelligence-related authority",
    requiredResponse: "revoke_claim",
    severity: "blocking",
    reasoningChain:
      "Intelligence and judgement require the product to respond to input. A static template or form cannot make context-specific decisions. Static products may advise, but not judge.",
  },

  {
    id: "rule_7_no_benchmark_failure_conversion",
    priority: 87,
    name: "No Benchmark Failure Conversion",
    principle: "No benchmark infrastructure failure may be converted into product success.",
    appliesTo: ["benchmark", "gate"],
    violationCondition:
      "Benchmark test not run due to infrastructure issue, but result still marked as product validation success",
    requiredResponse: "mark_measurement_inconclusive",
    severity: "critical",
    reasoningChain:
      "Benchmark failure and product failure are different. If anti-toy harness breaks, we cannot validate anti-toyness. The correct response is to mark the result inconclusive and require infrastructure repair, not to skip the test.",
  },

  {
    id: "rule_8_no_manual_override",
    priority: 96,
    name: "No Manual Classification Override",
    principle: "No manual override may assign gold, diagnostic, judgement, board-grade, or governed status.",
    appliesTo: ["classification"],
    violationCondition: "Classification assigned manually against evidence validation result",
    requiredResponse: "freeze_status",
    severity: "critical",
    reasoningChain:
      "Classification must derive from evidence. If evidence says blocked_until_claim_evidenced, classification cannot be manually overridden to diagnostic_product. Manual override destroys the integrity of the evidence chain.",
  },

  {
    id: "rule_9_frozen_scenarios",
    priority: 89,
    name: "Frozen Scenarios",
    principle: "No scenario changes may occur in the same pass as product improvement.",
    appliesTo: ["product", "artifact"],
    violationCondition:
      "Scenario set changed AND product code changed in same commit, validation attempted anyway",
    requiredResponse: "mark_measurement_inconclusive",
    severity: "critical",
    reasoningChain:
      "If scenarios change, we do not know whether improved results are from product improvement or scenario change. Scenarios must be frozen before measuring product improvement.",
  },

  {
    id: "rule_10_failed_dimensions_disclosed",
    priority: 85,
    name: "Failed Dimensions Must Be Disclosed",
    principle: "No validation result may omit failed dimensions.",
    appliesTo: ["report", "evidence_ledger"],
    violationCondition:
      "Validation report shows passing score but omits dimensions that scored below threshold",
    requiredResponse: "require_independent_retest",
    severity: "blocking",
    reasoningChain:
      "A product that passes overall but fails critical dimensions is not safe for upgrade. Example: decision-force 8.5 but falsificationStrength 3.0 means the product cannot be falsified (dangerous). All dimensions must be reported.",
  },

  {
    id: "rule_11_public_claim_match",
    priority: 91,
    name: "Public Claim Must Match Evidence",
    principle: "No public claim may exceed evidence-supported claim.",
    appliesTo: ["product", "artifact", "report"],
    violationCondition:
      "Product claims diagnostic_product in catalog but evidence ledger shows blocked_until_claim_evidenced",
    requiredResponse: "revoke_claim",
    severity: "critical",
    reasoningChain:
      "Customer-facing claims must exactly match evidence ledger. If registry says diagnostic_product but evidence says blocked, the mismatch must be resolved by removing the product from release, not by changing the evidence.",
  },

  {
    id: "rule_12_evidence_expiry",
    priority: 84,
    name: "Evidence Expiry and Revalidation",
    principle: "No product may remain released if validation evidence expires or is invalidated.",
    appliesTo: ["product", "evidence_ledger"],
    violationCondition:
      "Product released on validation evidence that is now older than expiry window, no revalidation occurred",
    requiredResponse: "freeze_status",
    severity: "blocking",
    reasoningChain:
      "Evidence decays over time. If composer changes, route changes, or scenario set changes, evidence from prior validation no longer applies. Product must either revalidate or move back to blocked status.",
  },
];

/**
 * Validate a product against the constitution
 */
export function validateAgainstConstitution(
  validationResult: Record<string, any>,
  productCode: string
): {
  passed: boolean;
  violatedRules: ValidationConstitutionRule[];
  blockingReasons: string[];
} {
  const violatedRules: ValidationConstitutionRule[] = [];
  const blockingReasons: string[] = [];

  // Rule 1: No single metric upgrade
  if (validationResult.decisionForcePassed === true && validationResult.fullValidationChainPassed !== true) {
    violatedRules.push(VALIDATION_CONSTITUTION[0]); // rule_1
    blockingReasons.push("Decision-force passed but full validation chain not complete (Rule 1)");
  }

  // Rule 2: No scorer/product coupling
  if (validationResult.scorerChangedThisPass && validationResult.productChangedThisPass) {
    violatedRules.push(VALIDATION_CONSTITUTION[1]); // rule_2
    blockingReasons.push("Scorer AND product both changed in same pass (Rule 2)");
  }

  // Rule 3: Full validation chain
  if (
    validationResult.antiToyPassed !== true ||
    validationResult.redTeamPassed !== true ||
    validationResult.genericAiComparisonPassed !== true ||
    validationResult.marketComparisonPassed !== true
  ) {
    violatedRules.push(VALIDATION_CONSTITUTION[2]); // rule_3
    blockingReasons.push("Full validation chain not complete (Rule 3)");
  }

  // Rule 8: No manual override
  if (validationResult.manualClassificationOverride === true) {
    violatedRules.push(VALIDATION_CONSTITUTION[7]); // rule_8
    blockingReasons.push("Manual classification override detected (Rule 8)");
  }

  // Rule 9: Frozen scenarios
  if (validationResult.scenarioChangedThisPass && validationResult.productChangedThisPass) {
    violatedRules.push(VALIDATION_CONSTITUTION[8]); // rule_9
    blockingReasons.push("Scenario set AND product both changed in same pass (Rule 9)");
  }

  const blockingViolations = violatedRules.filter((r) => r.severity === "critical" || r.severity === "blocking");

  return {
    passed: blockingViolations.length === 0,
    violatedRules,
    blockingReasons,
  };
}

export default {
  VALIDATION_CONSTITUTION,
  validateAgainstConstitution,
};
