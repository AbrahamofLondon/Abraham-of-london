/**
 * Consequence Verification Contract
 *
 * Tests whether warnings, recommendations, and predictions materialized.
 *
 * CRITICAL RULE: Verification is append-only.
 * - Original warning is immutable (audit-locked)
 * - Verification outcome is appended as a new record
 * - If outcome contradicts warning, falsification path is triggered
 *
 * Do not mutate source warnings.
 * Preserve the original evidence.
 * Allow verified outcomes to be appended.
 */

export type VerificationState =
  | "not_due"
  | "due_unverified"
  | "verified_improved"
  | "verified_deteriorated"
  | "verified_no_change"
  | "contradicted_by_outcome"
  | "insufficient_evidence";

export interface ConsequenceVerificationRecord {
  // Identity
  verificationId: string;
  caseId: string;
  sourceEventId: string; // The original warning/recommendation (IMMUTABLE)

  // Original warning/recommendation
  originalWarningOrRecommendation: string;

  // Verification schedule
  scheduledVerificationAt: string;
  scheduledVerificationDueBy?: string;
  dueInDays?: number;

  // Verification result (APPEND-ONLY)
  verificationPerformedAt?: string;
  expectedOutcome: string;
  actualOutcome?: string;

  // Verification state
  verificationState: VerificationState;

  // Outcome assessment
  outcomeSummary?: string;
  evidenceOfOutcome?: string[];

  // If contradicted
  contradictedByOutcome: boolean;
  falsificationEventId?: string;

  // Audit protection
  auditLockIds: string[];

  // Metadata
  createdAt: string;
  lastUpdatedAt: string;
}

/**
 * Invariants: Consequence Verification Is Append-Only
 */
export const CONSEQUENCE_VERIFICATION_INVARIANTS = {
  APPEND_ONLY: "Verification outcomes are appended, never mutate source",
  SOURCE_IMMUTABLE: "Original warning is preserved under audit lock",
  OUTCOME_REQUIRED:
    "Verification must include actual outcome and supporting evidence",
  CONTRADICTION_TRIGGERS_FALSIFICATION:
    "If outcome contradicts warning, falsification path is triggered",
  NO_MUTATION: "Source events cannot be modified by verification outcome",
  AUDIT_LOCKED:
    "Both source event and verification record are audit-locked",
};
