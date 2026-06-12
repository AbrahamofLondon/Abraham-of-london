/**
 * lib/product/universal-artefact-value-standard.ts
 *
 * Universal Artefact Value Standard.
 *
 * Defines the required value dimensions, scoring model, and commercial tier
 * expectations for every paid product artefact in the estate.
 *
 * Principle:
 *   A customer should receive an artefact whose value clearly exceeds the price paid.
 *   No paid product may produce, preview, approve, or deliver an artefact
 *   that lacks substantive decision value.
 *
 * Score meaning:
 *   0 = missing
 *   1 = generic / thin
 *   2 = useful / acceptable
 *   3 = commercially strong / premium
 */

// ─── Value Dimensions ─────────────────────────────────────────────────────────

/**
 * The dimensions of value that an artefact must demonstrate.
 * Every paid product artefact should be assessed against relevant dimensions.
 */
export type ArtefactValueDimension =
  | "input_basis"
  | "problem_definition"
  | "strategic_diagnosis"
  | "evidence_interpretation"
  | "commercial_consequence"
  | "decision_options"
  | "recommended_next_move"
  | "falsification_challenge"
  | "risk_and_dependency_map"
  | "execution_sequence"
  | "customer_specificity"
  | "commercial_value_claim";

/**
 * Human-readable labels for each dimension.
 */
export const ARTEFACT_VALUE_DIMENSION_LABELS: Record<ArtefactValueDimension, string> = {
  input_basis: "Input Basis — what customer data/context was provided",
  problem_definition: "Problem Definition — what specific problem is being addressed",
  strategic_diagnosis: "Strategic Diagnosis — what is really going on beneath the surface",
  evidence_interpretation: "Evidence Interpretation — what the evidence means in this context",
  commercial_consequence: "Commercial Consequence — what is at stake financially/strategically",
  decision_options: "Decision Options — what choices are available",
  recommended_next_move: "Recommended Next Move — what the customer should do next",
  falsification_challenge: "Falsification Challenge — how the recommendation could be wrong",
  risk_and_dependency_map: "Risk & Dependency Map — what could block success",
  execution_sequence: "Execution Sequence — concrete 72-hour steps",
  customer_specificity: "Customer Specificity — how tailored this is to the customer",
  commercial_value_claim: "Commercial Value Claim — what this is worth to the customer",
};

// ─── Score Model ──────────────────────────────────────────────────────────────

export type ArtefactValueScore = 0 | 1 | 2 | 3;

export const ARTEFACT_VALUE_SCORE_LABELS: Record<ArtefactValueScore, string> = {
  0: "missing",
  1: "generic / thin",
  2: "useful / acceptable",
  3: "commercially strong / premium",
};

// ─── Value Profile ────────────────────────────────────────────────────────────

export type CommercialTier =
  | "free"
  | "paid_entry"
  | "paid_premium"
  | "subscription"
  | "retainer"
  | "enterprise";

export interface ArtefactValueProfile {
  productCode: string;
  artefactType: string;
  commercialTier: CommercialTier;
  requiredDimensions: ArtefactValueDimension[];
  /** Minimum score per dimension. If a dimension is not listed, the default minimum is 1. */
  minimumScores: Partial<Record<ArtefactValueDimension, ArtefactValueScore>>;
  /** Minimum overall score (sum of all required dimension scores). */
  minimumOverallScore: number;
  /** If true, approval/customer-access/delivery is blocked when score is below threshold. */
  approvalBlockedBelowScore: boolean;
}

// ─── Assessment Result ────────────────────────────────────────────────────────

export interface ArtefactValueAssessment {
  productCode: string;
  artefactId: string;
  scores: Partial<Record<ArtefactValueDimension, ArtefactValueScore>>;
  overallScore: number;
  maximumPossibleScore: number;
  minimumOverallScore: number;
  passed: boolean;
  blockingFailures: ArtefactValueDimension[];
  warnings: ArtefactValueDimension[];
  assessedAt: string;
}

export type ValueReadinessStatus =
  | "not_assessed"
  | "insufficient_input"
  | "metadata_only"
  | "draft_value_partial"
  | "ready_for_operator_review"
  | "approved_value_standard"
  | "failed_value_standard";

// ─── Scoring Helpers ──────────────────────────────────────────────────────────

/**
 * Assess an artefact's value against its profile.
 * Returns an assessment result with pass/fail and detailed dimension scores.
 */
export function assessArtefactValue(
  profile: ArtefactValueProfile,
  scores: Partial<Record<ArtefactValueDimension, ArtefactValueScore>>,
): ArtefactValueAssessment {
  const blockingFailures: ArtefactValueDimension[] = [];
  const warnings: ArtefactValueDimension[] = [];
  let overallScore = 0;
  let maximumPossibleScore = 0;

  for (const dimension of profile.requiredDimensions) {
    const score = scores[dimension] ?? 0;
    const minimum = profile.minimumScores[dimension] ?? 1;

    overallScore += score;
    maximumPossibleScore += 3;

    if (score < minimum) {
      if (score === 0) {
        blockingFailures.push(dimension);
      } else {
        warnings.push(dimension);
      }
    }
  }

  const passed =
    blockingFailures.length === 0 &&
    overallScore >= profile.minimumOverallScore;

  return {
    productCode: profile.productCode,
    artefactId: "",
    scores,
    overallScore,
    maximumPossibleScore,
    minimumOverallScore: profile.minimumOverallScore,
    passed,
    blockingFailures,
    warnings,
    assessedAt: new Date().toISOString(),
  };
}

/**
 * Get a human-readable readiness label from a score.
 */
export function scoreToReadinessLabel(score: ArtefactValueScore | undefined): string {
  if (score === undefined || score === 0) return "missing";
  if (score === 1) return "generic / thin";
  if (score === 2) return "sufficient";
  return "strong";
}

/**
 * Derive the overall ValueReadinessStatus from an assessment.
 */
export function deriveValueReadinessStatus(
  assessment: ArtefactValueAssessment,
  hasCustomerInput: boolean,
  hasSubstantiveContent: boolean,
): ValueReadinessStatus {
  if (!hasCustomerInput) return "insufficient_input";
  if (!hasSubstantiveContent) return "metadata_only";
  if (assessment.blockingFailures.length > 0) return "failed_value_standard";
  if (assessment.overallScore < assessment.minimumOverallScore) return "draft_value_partial";
  if (assessment.warnings.length > 0) return "ready_for_operator_review";
  return "approved_value_standard";
}
