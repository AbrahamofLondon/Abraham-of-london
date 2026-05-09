export type RetainedCadenceState =
  | "NOT_CONFIGURED"
  | "MANUAL_OPERATOR_REVIEW"
  | "SCHEDULED"
  | "DUE_SOON"
  | "OVERDUE"
  | "COMPLETED"
  | "SKIPPED_WITH_REASON"
  | "ESCALATED";

export type RetainedCadenceSource =
  | "manual"
  | "scheduled"
  | "system_triggered";

export type RetainedReviewCycle = {
  cycleId: string;
  accountId?: string | null;
  organisationId?: string | null;
  sponsorUserId?: string | null;
  sponsorEmail?: string | null;
  cadenceState: RetainedCadenceState;
  cadenceSource: RetainedCadenceSource;
  cadenceType: "monthly" | "quarterly" | "custom" | "manual";
  scheduledFor?: string | null;
  completedAt?: string | null;
  skippedAt?: string | null;
  skippedReason?: string | null;
  escalationReason?: string | null;
  operatorId?: string | null;
  evidencePosture: "SYSTEM_INFERRED" | "OPERATOR_RECORDED" | "USER_REPORTED";
  createdAt: string;
  updatedAt: string;
};

export type BuyerVisibleCadencePosture = {
  state: RetainedCadenceState;
  label: string;
  explanation: string;
  scheduledFor?: string | null;
  lastCompletedAt?: string | null;
  skippedAt?: string | null;
  cadenceSource: RetainedCadenceSource;
  cadenceType?: RetainedReviewCycle["cadenceType"];
  evidencePosture: RetainedReviewCycle["evidencePosture"];
  sourceLabel: "Retained Oversight Cadence";
};

export const RETAINED_CADENCE_PUBLIC_COPY: Record<RetainedCadenceState, {
  label: string;
  explanation: string;
}> = {
  NOT_CONFIGURED: {
    label: "Retained cadence is not configured for this account.",
    explanation: "No retained review schedule has been recorded yet.",
  },
  MANUAL_OPERATOR_REVIEW: {
    label: "Retained review is operator-confirmed.",
    explanation: "Automated scheduling is not active for this account.",
  },
  SCHEDULED: {
    label: "Next retained review is scheduled.",
    explanation: "Oversight continuity is being tracked through a scheduled review cycle.",
  },
  DUE_SOON: {
    label: "A retained review is due soon.",
    explanation: "The next retained review window is approaching.",
  },
  OVERDUE: {
    label: "A retained review is overdue.",
    explanation: "Operator attention is required.",
  },
  COMPLETED: {
    label: "Latest retained review completed.",
    explanation: "The latest retained review cycle has been recorded as complete.",
  },
  SKIPPED_WITH_REASON: {
    label: "Latest retained review was skipped with recorded reason.",
    explanation: "A retained review cycle was not completed and a reason was recorded.",
  },
  ESCALATED: {
    label: "This retained review cycle has been escalated.",
    explanation: "The cadence record shows escalation rather than routine completion.",
  },
};
