export const FEEDBACK_SCHEMA_VERSION = 1;

export const FEEDBACK_SURFACES = [
  "pressure_signal_result",
  "fast_diagnostic_result",
  "boardroom_brief_sample",
  "boardroom_brief_delivered",
  "strategy_room_session",
  "decision_centre_case",
  "return_brief_outcome",
  "retainer_review_cycle",
  "case_study_public",
  "gmi_report",
  "playbook_download",
  "admin_delivery",
  "return-brief",
] as const;

export const FEEDBACK_CATEGORIES = [
  "clarity",
  "accuracy",
  "usefulness",
  "actionability",
  "trust",
  "evidence_quality",
  "delivery_quality",
  "commercial_fit",
  "outcome_relevance",
  "technical_issue",
] as const;

export const FEEDBACK_RATINGS = ["positive", "neutral", "negative"] as const;

export const FEEDBACK_ACTION_STATUSES = [
  "logged",
  "triage_required",
  "linked_to_risk",
  "linked_to_quality_review",
  "linked_to_case_study_candidate",
  "linked_to_sales_followup",
  "closed_no_action",
  "resolved",
] as const;

export const FEEDBACK_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export type FeedbackSurface = (typeof FEEDBACK_SURFACES)[number] | string;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackRating = (typeof FEEDBACK_RATINGS)[number];
export type FeedbackActionStatus = (typeof FEEDBACK_ACTION_STATUSES)[number];
export type FeedbackSeverity = (typeof FEEDBACK_SEVERITIES)[number];
export type FeedbackTriageStatus = "unreviewed" | "in_review" | "reviewed" | "closed";

export type FeedbackSubmitPayload = {
  surface: string;
  subjectId?: string | null;
  rating: FeedbackRating;
  comment?: string | null;
  subjectType?: string | null;
  category?: FeedbackCategory | null;
  confidence?: number | "low" | "medium" | "high" | null;
  followupRequested?: boolean | null;
  evidenceHash?: string | null;
  artifactVersion?: string | number | null;
  productCode?: string | null;
  orderId?: string | null;
  artifactId?: string | null;
  outcomeHypothesisId?: string | null;
  falsificationEntryId?: string | null;
  retainerCycleId?: string | null;
  caseStudyId?: string | null;
  sourceUrl?: string | null;
  userId?: string | null;
  email?: string | null;
  sessionId?: string | null;
};

export type FeedbackEventRecord = {
  id: string;
  feedbackId: string;
  surface: string;
  subjectType: string;
  subjectId: string | null;
  rating: FeedbackRating;
  category: FeedbackCategory;
  confidence: number;
  comment: string | null;
  followupRequested: boolean;
  evidenceHash: string | null;
  artifactVersion: string | null;
  productCode: string | null;
  userId: string | null;
  email: string | null;
  sessionId: string | null;
  sourceUrl: string | null;
  referrer: string | null;
  environment: string;
  deployCommit: string | null;
  schemaVersion: number;
  actionStatus: FeedbackActionStatus;
  severity: FeedbackSeverity;
  triageStatus: FeedbackTriageStatus;
  reviewRequired: boolean;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  linkedOrderId: string | null;
  linkedArtifactId: string | null;
  linkedFalsificationEntryId: string | null;
  linkedOutcomeHypothesisId: string | null;
  linkedCaseStudyId: string | null;
  linkedRetainerCycleId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FeedbackPublicResponse = {
  ok: true;
  feedbackId: string;
  actionStatus: FeedbackActionStatus;
  reviewRequired: boolean;
  publicMessage: string;
  nextActions?: Array<{
    id: string;
    label: string;
    href: string;
  }>;
  routing?: {
    actionKind: string;
    reviewEscalationState: "none" | "review_required" | "risk_review";
  };
};

export type FeedbackActionResult = {
  actionStatus?: FeedbackActionStatus;
  severity?: FeedbackSeverity;
  triageStatus?: FeedbackTriageStatus;
  reviewRequired?: boolean;
  linkedFalsificationEntryId?: string | null;
  linkedCaseStudyId?: string | null;
  linkedOutcomeHypothesisId?: string | null;
  linkedRetainerCycleId?: string | null;
};

export type FeedbackHealthMetrics = {
  totalFeedback: number;
  positiveRate: number | null;
  negativeRate: number | null;
  confidenceWeightedPositiveRate: number | null;
  confidenceWeightedNegativeRate: number | null;
  reviewRequiredCount: number;
  paidProductNegativeCount: number;
  boardroomBriefDeliveredPositiveRate: number | null;
  unresolvedPatternCount: number;
  positiveHighConfidenceRate: number | null;
  negativeHighConfidenceRate: number | null;
  followupRequestedCount: number;
};

export type FeedbackAdoptionAnalytics = {
  bySurface: Array<{
    surface: string;
    total: number;
    positiveRate: number | null;
    positiveHighConfidenceRate: number | null;
    negativeHighConfidenceRate: number | null;
    followupRequestedCount: number;
  }>;
  categoryDistribution: Array<{
    surface: string;
    category: string;
    count: number;
  }>;
  conversionSignals: {
    freeFeedbackToCheckout14d: number;
    feedbackToSaveCase14d: number;
    feedbackToReturnVisit14d: number;
    feedbackToCaseStudyConsent30d: number;
    feedbackToRetainerEvaluation30d: number;
  };
};

export type FeedbackAdminRow = Pick<
  FeedbackEventRecord,
  | "feedbackId"
  | "surface"
  | "rating"
  | "category"
  | "confidence"
  | "productCode"
  | "actionStatus"
  | "severity"
  | "reviewRequired"
  | "createdAt"
  | "linkedCaseStudyId"
  | "linkedFalsificationEntryId"
>;
