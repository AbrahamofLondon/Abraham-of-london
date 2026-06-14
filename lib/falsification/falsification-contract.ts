/**
 * Falsification Contract
 *
 * Permanent audit trail of system errors.
 * Records where the system was wrong, incomplete, or overconfident.
 *
 * CRITICAL RULES:
 * - Falsification records cannot be deleted
 * - Records are append-only
 * - Source events are audit-locked
 * - Deletion attempts fail if record is locked
 *
 * The system must learn from error instead of hiding it.
 */

export type FalsificationType =
  | "warning_did_not_materialise"
  | "risk_underestimated"
  | "risk_overestimated"
  | "intervention_failed"
  | "wrong_pattern_classification"
  | "insufficient_context";

export interface FalsificationEvent {
  // Identity
  falsificationId: string;
  caseId: string;
  sourceEventId: string; // Original warning/recommendation

  // What was wrong
  originalWarningOrRecommendation: string;
  expectedOutcome: string;
  actualOutcome: string;

  // Error classification
  falsificationType: FalsificationType;
  severity: "low" | "medium" | "high" | "critical";

  // Learning
  calibrationChangeRequired: boolean;
  calibrationNotes: string;
  userVisibleSummary?: string;

  // Audit protection
  auditLockIds: string[];

  // Metadata
  createdAt: string;
  lastUpdatedAt: string;
}

/**
 * Falsification Type Definitions
 */
export const FALSIFICATION_TYPES: Record<
  FalsificationType,
  {
    type: FalsificationType;
    description: string;
    meaning: string;
    calibrationRequired: boolean;
  }
> = {
  warning_did_not_materialise: {
    type: "warning_did_not_materialise",
    description: "Warning issued but predicted outcome did not occur",
    meaning: "System was overly cautious or pattern changed",
    calibrationRequired: true,
  },
  risk_underestimated: {
    type: "risk_underestimated",
    description:
      "Risk was identified but severity was lower than predicted",
    meaning: "System overestimated impact or user mitigated early",
    calibrationRequired: true,
  },
  risk_overestimated: {
    type: "risk_overestimated",
    description:
      "Risk was identified but severity was higher than predicted",
    meaning: "System underestimated impact or situation deteriorated further",
    calibrationRequired: true,
  },
  intervention_failed: {
    type: "intervention_failed",
    description:
      "Intervention was recommended and user acted, but outcome did not improve",
    meaning: "Recommended intervention was ineffective in this context",
    calibrationRequired: true,
  },
  wrong_pattern_classification: {
    type: "wrong_pattern_classification",
    description: "Pattern was misclassified or misidentified",
    meaning:
      "System incorrectly recognized a pattern or applied wrong category",
    calibrationRequired: true,
  },
  insufficient_context: {
    type: "insufficient_context",
    description: "Assessment was correct given available data, but data was incomplete",
    meaning:
      "Missing context prevented accurate assessment; not a system error but a gap exposure",
    calibrationRequired: false,
  },
};

/**
 * Invariants: Falsification Records Cannot Be Erased
 */
export const FALSIFICATION_INVARIANTS = {
  PERMANENT_RECORD:
    "Falsification records cannot be deleted; they are permanent audit trail",
  NO_DELETION_WHILE_LOCKED:
    "Deletion attempts fail if record is audit-locked",
  APPEND_ONLY: "Records are created, never modified or deleted",
  SOURCE_PRESERVED:
    "Original warning is preserved; falsification cannot erase it",
  CALIBRATION_REQUIRED:
    "Most falsifications require calibration adjustment to prevent recurrence",
  LEARNING_REQUIRED:
    "System must learn from error instead of hiding it",
};
