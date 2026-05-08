export type OversightReviewCycleStatus =
  | "DRAFT_GENERATED"
  | "OPERATOR_REVIEW_REQUIRED"
  | "CLIENT_SAFE_REVIEW_READY"
  | "APPROVED_FOR_DELIVERY"
  | "DELIVERED"
  | "REVISION_REQUIRED"
  | "WITHHELD";

export type OversightReviewDecision =
  | "APPROVE"
  | "REVISE"
  | "WITHHOLD"
  | "ESCALATE_TO_COUNSEL"
  | "ESCALATE_TO_BOARDROOM";

export type OversightSuppressionReason =
  | "RAW_RESPONSE_PROTECTED"
  | "ANONYMOUS_CAMPAIGN_PROTECTED"
  | "SMALL_SAMPLE_SUPPRESSED"
  | "INSUFFICIENT_EVIDENCE"
  | "CLIENT_VISIBILITY_RESTRICTED"
  | "LEGAL_OR_REPUTATION_RISK"
  | "OPERATOR_ONLY_SIGNAL";

export type OversightReviewCycle = {
  cycleId: string;
  accountId?: string;
  organisationId?: string;
  periodStart: string;
  periodEnd: string;
  status: OversightReviewCycleStatus;
  generatedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  deliveredAt?: string;
  reviewer?: {
    userId?: string;
    email?: string;
    role?: string;
  };
  decisions: Array<{
    decision: OversightReviewDecision;
    reason: string;
    timestamp: string;
  }>;
  suppressions: Array<{
    section: string;
    reason: OversightSuppressionReason;
    explanation: string;
  }>;
  warnings: string[];
};
