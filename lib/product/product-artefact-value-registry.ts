/**
 * lib/product/product-artefact-value-registry.ts
 *
 * Product Artefact Value Registry.
 *
 * Every paid product must declare its required artefact payload dimensions,
 * minimum scores, and commercial tier. This registry is the source of truth
 * for what constitutes a "valuable" artefact for each product.
 *
 * Products not listed here default to a minimum standard of:
 *   - input_basis >= 1
 *   - problem_definition >= 1
 *   - recommended_next_move >= 1
 *   - minimumOverallScore = 4
 */

import type {
  ArtefactValueProfile,
  ArtefactValueDimension,
  ArtefactValueScore,
  CommercialTier,
} from "./universal-artefact-value-standard";

// ─── Registry ─────────────────────────────────────────────────────────────────

/**
 * The full product artefact value registry.
 * Add new products here as they are onboarded to the value standard.
 */
export const PRODUCT_ARTEFACT_VALUE_REGISTRY: ArtefactValueProfile[] = [
  // ── Boardroom Brief ──────────────────────────────────────────────────────
  {
    productCode: "boardroom_brief",
    artefactType: "boardroom_dossier",
    commercialTier: "paid_premium",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "evidence_interpretation",
      "commercial_consequence",
      "decision_options",
      "recommended_next_move",
      "falsification_challenge",
      "risk_and_dependency_map",
      "execution_sequence",
      "customer_specificity",
      "commercial_value_claim",
    ],
    minimumScores: {
      input_basis: 2,
      strategic_diagnosis: 3,
      commercial_consequence: 3,
      recommended_next_move: 3,
      falsification_challenge: 2,
      customer_specificity: 2,
      commercial_value_claim: 3,
    },
    minimumOverallScore: 28,
    approvalBlockedBelowScore: true,
  },

  // ── Strategy Room ────────────────────────────────────────────────────────
  {
    productCode: "strategy_room",
    artefactType: "strategy_room_brief",
    commercialTier: "paid_premium",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "commercial_consequence",
      "decision_options",
      "recommended_next_move",
      "falsification_challenge",
      "customer_specificity",
      "commercial_value_claim",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      commercial_consequence: 2,
      recommended_next_move: 2,
      falsification_challenge: 1,
      customer_specificity: 2,
    },
    minimumOverallScore: 17,
    approvalBlockedBelowScore: true,
  },
  {
    productCode: "strategy_room_extended",
    artefactType: "strategy_room_brief",
    commercialTier: "paid_premium",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "evidence_interpretation",
      "commercial_consequence",
      "decision_options",
      "recommended_next_move",
      "falsification_challenge",
      "risk_and_dependency_map",
      "execution_sequence",
      "customer_specificity",
      "commercial_value_claim",
    ],
    minimumScores: {
      strategic_diagnosis: 3,
      commercial_consequence: 3,
      recommended_next_move: 3,
      falsification_challenge: 2,
      customer_specificity: 2,
      commercial_value_claim: 3,
    },
    minimumOverallScore: 26,
    approvalBlockedBelowScore: true,
  },

  // ── Executive Reporting ──────────────────────────────────────────────────
  {
    productCode: "executive_reporting",
    artefactType: "executive_report",
    commercialTier: "paid_premium",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "evidence_interpretation",
      "commercial_consequence",
      "recommended_next_move",
      "falsification_challenge",
      "customer_specificity",
      "commercial_value_claim",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      commercial_consequence: 2,
      recommended_next_move: 2,
      customer_specificity: 2,
    },
    minimumOverallScore: 18,
    approvalBlockedBelowScore: true,
  },

  // ── Instant Digital Access Instruments ───────────────────────────────────
  {
    productCode: "personal_decision_audit",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "decision_exposure_instrument",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "mandate_clarity_framework",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "intervention_path_selector",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "escalation_readiness_scorecard",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "structural_failure_diagnostic_canvas",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "execution_risk_index",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "team_alignment_gap_map",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "governance_drift_detector",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "strategic_priority_stack_builder",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "board_brief_builder",
    artefactType: "decision_instrument",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 8,
    approvalBlockedBelowScore: false,
  },

  // ── Governed Methodology Runs ────────────────────────────────────────────
  {
    productCode: "execution_integrity_protocol",
    artefactType: "methodology_run",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      recommended_next_move: 2,
    },
    minimumOverallScore: 7,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "alignment_audit_playbook",
    artefactType: "methodology_run",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      recommended_next_move: 2,
    },
    minimumOverallScore: 7,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "drift_detection_framework",
    artefactType: "methodology_run",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      recommended_next_move: 2,
    },
    minimumOverallScore: 7,
    approvalBlockedBelowScore: false,
  },

  // ── GMI Reports (Archived Intelligence) ──────────────────────────────────
  {
    productCode: "gmi_q1_2026",
    artefactType: "archived_intelligence_report",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "evidence_interpretation",
      "commercial_consequence",
      "customer_specificity",
    ],
    minimumScores: {
      evidence_interpretation: 2,
      commercial_consequence: 2,
    },
    minimumOverallScore: 6,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "gmi_q2_2026",
    artefactType: "archived_intelligence_report",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "evidence_interpretation",
      "commercial_consequence",
      "customer_specificity",
    ],
    minimumScores: {
      evidence_interpretation: 2,
      commercial_consequence: 2,
    },
    minimumOverallScore: 6,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "gmi_q3_2026",
    artefactType: "archived_intelligence_report",
    commercialTier: "paid_entry",
    requiredDimensions: [
      "input_basis",
      "evidence_interpretation",
      "commercial_consequence",
      "customer_specificity",
    ],
    minimumScores: {
      evidence_interpretation: 2,
      commercial_consequence: 2,
    },
    minimumOverallScore: 6,
    approvalBlockedBelowScore: false,
  },

  // ── Professional Subscriptions ───────────────────────────────────────────
  {
    productCode: "professional",
    artefactType: "subscription_oversight",
    commercialTier: "subscription",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "commercial_consequence",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      commercial_consequence: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 12,
    approvalBlockedBelowScore: false,
  },
  {
    productCode: "professional_annual",
    artefactType: "subscription_oversight",
    commercialTier: "subscription",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "commercial_consequence",
      "recommended_next_move",
      "customer_specificity",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      commercial_consequence: 2,
      recommended_next_move: 2,
    },
    minimumOverallScore: 12,
    approvalBlockedBelowScore: false,
  },

  // ── Bundle Products ──────────────────────────────────────────────────────
  {
    productCode: "operator_decision_pack",
    artefactType: "bundle",
    commercialTier: "paid_premium",
    requiredDimensions: [
      "input_basis",
      "problem_definition",
      "strategic_diagnosis",
      "commercial_consequence",
      "decision_options",
      "recommended_next_move",
      "falsification_challenge",
      "customer_specificity",
      "commercial_value_claim",
    ],
    minimumScores: {
      strategic_diagnosis: 2,
      commercial_consequence: 2,
      recommended_next_move: 2,
      falsification_challenge: 1,
    },
    minimumOverallScore: 17,
    approvalBlockedBelowScore: true,
  },
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/**
 * Get the value profile for a given product code.
 * Returns null if the product is not registered (free or unknown product).
 */
export function getValueProfile(productCode: string): ArtefactValueProfile | null {
  return PRODUCT_ARTEFACT_VALUE_REGISTRY.find((p) => p.productCode === productCode) ?? null;
}

/**
 * Get all profiles for a given commercial tier.
 */
export function getProfilesByTier(tier: CommercialTier): ArtefactValueProfile[] {
  return PRODUCT_ARTEFACT_VALUE_REGISTRY.filter((p) => p.commercialTier === tier);
}

/**
 * Get all premium profiles (paid_premium, enterprise).
 */
export function getPremiumProfiles(): ArtefactValueProfile[] {
  return PRODUCT_ARTEFACT_VALUE_REGISTRY.filter(
    (p) => p.commercialTier === "paid_premium" || p.commercialTier === "enterprise",
  );
}

/**
 * Get all paid profiles (everything except free).
 */
export function getPaidProfiles(): ArtefactValueProfile[] {
  return PRODUCT_ARTEFACT_VALUE_REGISTRY.filter((p) => p.commercialTier !== "free");
}

/**
 * Get all product codes that have value profiles.
 */
export function getAllRegisteredProductCodes(): string[] {
  return PRODUCT_ARTEFACT_VALUE_REGISTRY.map((p) => p.productCode);
}

/**
 * Check if a product has a value profile that blocks approval below score.
 */
export function isApprovalBlockedByValue(productCode: string): boolean {
  const profile = getValueProfile(productCode);
  return profile?.approvalBlockedBelowScore ?? false;
}
