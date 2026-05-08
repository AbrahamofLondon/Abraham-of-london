/**
 * Cohort Proof Contract — Social Proof Governance
 *
 * Defines thresholds and rules for aggregate proof statements.
 * No cohort proof may be published below minimum sample size.
 */

export const COHORT_PROOF_THRESHOLDS = {
  /** Minimum N before any public aggregate claim */
  MIN_PUBLISHABLE_SAMPLE: 15,

  /** Minimum N for internal display (admin/operator only) */
  MIN_INTERNAL_SAMPLE: 5,

  /** Minimum N for any causal language ("led to", "caused") */
  MIN_CAUSAL_SAMPLE: 50,

  /** Minimum N for confidence interval display */
  MIN_CONFIDENCE_INTERVAL_SAMPLE: 30,
} as const;

export type CohortProofStatement = {
  type: "breach_reality" | "action_advantage" | "cost_escalation" | "authority_exposure" | "pattern_recurrence";
  text: string;
  cohortSize: number;
  cohortDefinition: string;
  timeframe: string | null;
  verificationMethod: string;
  publicationEligible: boolean;
  reason: string;
};

export type CohortProofResult =
  | { status: "PUBLISHABLE"; statements: CohortProofStatement[] }
  | { status: "INSUFFICIENT_SAMPLE"; cohortSize: number; requiredSize: number }
  | { status: "NO_DATA" };

/**
 * Check whether a cohort meets the publication threshold.
 */
export function cohortMeetsPublicationThreshold(sampleSize: number): boolean {
  return sampleSize >= COHORT_PROOF_THRESHOLDS.MIN_PUBLISHABLE_SAMPLE;
}

/**
 * Determine the appropriate language level for a given sample size.
 */
export function determineLanguageLevel(sampleSize: number): "causal" | "associative" | "observational" | "insufficient" {
  if (sampleSize >= COHORT_PROOF_THRESHOLDS.MIN_CAUSAL_SAMPLE) return "causal";
  if (sampleSize >= COHORT_PROOF_THRESHOLDS.MIN_PUBLISHABLE_SAMPLE) return "associative";
  if (sampleSize >= COHORT_PROOF_THRESHOLDS.MIN_INTERNAL_SAMPLE) return "observational";
  return "insufficient";
}
