/**
 * Universal Claim Authority Registry
 *
 * Every claim a product makes must be evidenced.
 * If a product claims judgement, diagnosis, intelligence, simulation, falsification,
 * consequence, governance, or gold-standard status, it must show the reasoning.
 *
 * This module defines what evidence is required to support each claim type.
 * Products without the required evidence cannot make the claim.
 *
 * Non-negotiable:
 * - No claim without evidence.
 * - No judgement without reasoning.
 * - No intelligence without interpretation.
 * - No gold without live proof.
 */

export type ProductClaim =
  | "summary"
  | "reference"
  | "signal"
  | "diagnosis"
  | "judgement"
  | "intelligence"
  | "simulation"
  | "falsification"
  | "consequence_modelling"
  | "execution_guidance"
  | "governed_decision_output"
  | "board_grade"
  | "gold_standard"
  | "externally_proven_gold"
  | "market_outperforming"
  | "premium_value"
  | "continuity_oversight"
  | "archive_intelligence";

export type EvidenceType =
  | "live_route_output"
  | "rendered_output_capture"
  | "reasoning_chain"
  | "input_interpretation"
  | "signal_extraction"
  | "signal_weighting"
  | "contradiction_detection"
  | "pattern_classification"
  | "scenario_simulation"
  | "consequence_model"
  | "falsification_pressure"
  | "judgement_synthesis"
  | "execution_translation"
  | "anti_toy_pass"
  | "red_team_pass"
  | "market_comparison_pass"
  | "generic_ai_outperform_pass"
  | "evidence_ledger_entry"
  | "operator_review"
  | "customer_access_proof"
  | "fulfilment_proof"
  | "live_cycle_proof"
  | "payment_webhook_proof"
  | "composed_output";

export interface ClaimEvidenceRequirement {
  claim: ProductClaim;
  requiredEvidence: EvidenceType[];
  severity: "blocked_without" | "downgraded_without";
  fallbackClaim?: ProductClaim;
}

export const CLAIM_EVIDENCE_REQUIREMENTS: Record<ProductClaim, ClaimEvidenceRequirement> = {
  summary: {
    claim: "summary",
    requiredEvidence: [],
    severity: "blocked_without",
  },

  reference: {
    claim: "reference",
    requiredEvidence: [],
    severity: "blocked_without",
  },

  signal: {
    claim: "signal",
    requiredEvidence: ["input_interpretation", "signal_extraction"],
    severity: "downgraded_without",
    fallbackClaim: "summary",
  },

  diagnosis: {
    claim: "diagnosis",
    requiredEvidence: [
      "input_interpretation",
      "signal_extraction",
      "signal_weighting",
      "pattern_classification",
      "rendered_output_capture",
    ],
    severity: "downgraded_without",
    fallbackClaim: "signal",
  },

  judgement: {
    claim: "judgement",
    requiredEvidence: [
      "input_interpretation",
      "signal_extraction",
      "signal_weighting",
      "contradiction_detection",
      "pattern_classification",
      "consequence_model",
      "falsification_pressure",
      "judgement_synthesis",
      "rendered_output_capture",
      "reasoning_chain",
    ],
    severity: "blocked_without",
    fallbackClaim: "diagnosis",
  },

  intelligence: {
    claim: "intelligence",
    requiredEvidence: [
      "input_interpretation",
      "signal_extraction",
      "signal_weighting",
      "reasoning_chain",
      "rendered_output_capture",
    ],
    severity: "blocked_without",
    fallbackClaim: "diagnosis",
  },

  simulation: {
    claim: "simulation",
    requiredEvidence: [
      "reasoning_chain",
      "pattern_classification",
      "scenario_simulation",
      "consequence_model",
      "rendered_output_capture",
    ],
    severity: "blocked_without",
    fallbackClaim: "diagnosis",
  },

  falsification: {
    claim: "falsification",
    requiredEvidence: [
      "falsification_pressure",
      "reasoning_chain",
      "rendered_output_capture",
    ],
    severity: "downgraded_without",
    fallbackClaim: "diagnosis",
  },

  consequence_modelling: {
    claim: "consequence_modelling",
    requiredEvidence: [
      "consequence_model",
      "reasoning_chain",
      "rendered_output_capture",
    ],
    severity: "downgraded_without",
    fallbackClaim: "diagnosis",
  },

  execution_guidance: {
    claim: "execution_guidance",
    requiredEvidence: [
      "execution_translation",
      "rendered_output_capture",
      "reasoning_chain",
    ],
    severity: "downgraded_without",
    fallbackClaim: "summary",
  },

  governed_decision_output: {
    claim: "governed_decision_output",
    requiredEvidence: [
      "reasoning_chain",
      "judgement_synthesis",
      "consequence_model",
      "falsification_pressure",
      "operator_review",
      "rendered_output_capture",
      "evidence_ledger_entry",
    ],
    severity: "blocked_without",
  },

  board_grade: {
    claim: "board_grade",
    requiredEvidence: [
      "reasoning_chain",
      "judgement_synthesis",
      "consequence_model",
      "falsification_pressure",
      "scenario_simulation",
      "operator_review",
      "rendered_output_capture",
      "evidence_ledger_entry",
      "live_route_output",
    ],
    severity: "blocked_without",
  },

  gold_standard: {
    claim: "gold_standard",
    requiredEvidence: [
      "live_route_output",
      "rendered_output_capture",
      "reasoning_chain",
      "anti_toy_pass",
      "red_team_pass",
      "market_comparison_pass",
      "generic_ai_outperform_pass",
      "evidence_ledger_entry",
    ],
    severity: "blocked_without",
  },

  externally_proven_gold: {
    claim: "externally_proven_gold",
    requiredEvidence: [
      "live_route_output",
      "rendered_output_capture",
      "reasoning_chain",
      "anti_toy_pass",
      "red_team_pass",
      "market_comparison_pass",
      "generic_ai_outperform_pass",
      "evidence_ledger_entry",
    ],
    severity: "blocked_without",
  },

  market_outperforming: {
    claim: "market_outperforming",
    requiredEvidence: [
      "market_comparison_pass",
      "generic_ai_outperform_pass",
      "rendered_output_capture",
    ],
    severity: "downgraded_without",
  },

  premium_value: {
    claim: "premium_value",
    requiredEvidence: [
      "payment_webhook_proof",
      "fulfilment_proof",
      "customer_access_proof",
      "rendered_output_capture",
    ],
    severity: "blocked_without",
  },

  continuity_oversight: {
    claim: "continuity_oversight",
    requiredEvidence: [
      "live_cycle_proof",
      "reasoning_chain",
      "operator_review",
      "rendered_output_capture",
    ],
    severity: "blocked_without",
  },

  archive_intelligence: {
    claim: "archive_intelligence",
    requiredEvidence: [
      "input_interpretation",
      "signal_extraction",
      "rendered_output_capture",
    ],
    severity: "downgraded_without",
    fallbackClaim: "reference",
  },
};

export function getClaimRequirement(claim: ProductClaim): ClaimEvidenceRequirement {
  return CLAIM_EVIDENCE_REQUIREMENTS[claim];
}

export function claimIsSupportedBy(claim: ProductClaim, availableEvidence: EvidenceType[]): boolean {
  const requirement = getClaimRequirement(claim);
  return requirement.requiredEvidence.every((evidence) => availableEvidence.includes(evidence));
}

export interface ClaimAuthorityResult {
  claim: ProductClaim;
  supported: boolean;
  evidence: {
    required: EvidenceType[];
    available: EvidenceType[];
    missing: EvidenceType[];
  };
  canDowngradeTo?: ProductClaim;
}

export function evaluateClaim(
  claim: ProductClaim,
  availableEvidence: EvidenceType[],
): ClaimAuthorityResult {
  const requirement = getClaimRequirement(claim);
  const missing = requirement.requiredEvidence.filter((e) => !availableEvidence.includes(e));
  const supported = missing.length === 0;

  return {
    claim,
    supported,
    evidence: {
      required: requirement.requiredEvidence,
      available: availableEvidence.filter((e) => requirement.requiredEvidence.includes(e)),
      missing,
    },
    canDowngradeTo: supported ? undefined : requirement.fallbackClaim,
  };
}
