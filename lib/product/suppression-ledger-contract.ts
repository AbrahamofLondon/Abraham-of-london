/**
 * Suppression Audit Ledger — Contract
 *
 * Defines the shape of suppression events that are logged whenever
 * the system withholds evidence, respondent text, or unsafe aggregates
 * from a sponsor-visible or operator-visible surface.
 *
 * The ledger stores only field references, surface names, rules, and
 * evidence-source metadata — never raw suppressed content.
 */

export type SuppressionOverrideStatus =
  | "NONE"
  | "APPROVED_FOR_RELEASE"
  | "REMAIN_SUPPRESSED";

export type SuppressionEvent = {
  eventId: string;
  scopeId: string;
  surface: string;
  fieldName: string;
  evidenceSource: string;
  originalPosture: string;
  suppressionReason: string;
  suppressionRule: string;
  suppressedAt: string;
  suppressedBySystem: boolean;
  reviewedByOperator: string | null;
  reviewedAt: string | null;
  overrideStatus: SuppressionOverrideStatus;
  overrideReason: string | null;
};

export type SuppressionSummary = {
  totalSuppressed: number;
  bySurface: Record<string, number>;
  latestAt: string | null;
  sponsorSafeNotice: string;
};
