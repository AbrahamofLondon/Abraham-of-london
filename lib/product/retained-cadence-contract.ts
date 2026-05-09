export type RetainedCadenceState =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "MANUAL_OPERATOR_REVIEW"
  | "SCHEDULED"
  | "DUE_SOON"
  | "REVIEW_DUE"
  | "REVIEW_IN_PROGRESS"
  | "OVERDUE"
  | "COMPLETED"
  | "REVIEW_COMPLETED"
  | "SKIPPED_WITH_REASON"
  | "REVIEW_SKIPPED"
  | "ESCALATED"
  | "CADENCE_BROKEN";

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

export type CadenceHistoryEvent = {
  eventId: string;
  cycleId: string;
  scopeId: string;
  action: string;
  operatorId?: string | null;
  reason?: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type CadencePostureForSponsor = {
  status: RetainedCadenceState;
  lastReviewDate: string | null;
  nextDueDate: string | null;
  cyclesCompleted: number;
  cyclesOverdue: number;
  reliability: number;
};

export const RETAINED_CADENCE_PUBLIC_COPY: Record<RetainedCadenceState, {
  label: string;
  explanation: string;
}> = {
  NOT_CONFIGURED: {
    label: "Retained cadence is not configured for this account.",
    explanation: "No retained review schedule has been recorded yet.",
  },
  CONFIGURED: {
    label: "Retained cadence is configured.",
    explanation: "A retained review schedule has been set up but no cycle is currently due.",
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
  REVIEW_DUE: {
    label: "A retained review is due.",
    explanation: "A review cycle has reached its due date and is awaiting operator action.",
  },
  REVIEW_IN_PROGRESS: {
    label: "A retained review is in progress.",
    explanation: "An operator has started the review cycle and work is underway.",
  },
  OVERDUE: {
    label: "A retained review is overdue.",
    explanation: "Operator attention is required.",
  },
  COMPLETED: {
    label: "Latest retained review completed.",
    explanation: "The latest retained review cycle has been recorded as complete.",
  },
  REVIEW_COMPLETED: {
    label: "Review cycle completed.",
    explanation: "The review cycle has been completed and the next cycle has been scheduled.",
  },
  SKIPPED_WITH_REASON: {
    label: "Latest retained review was skipped with recorded reason.",
    explanation: "A retained review cycle was not completed and a reason was recorded.",
  },
  REVIEW_SKIPPED: {
    label: "Review cycle was skipped.",
    explanation: "A review cycle was skipped with a recorded reason. The next cycle has been scheduled.",
  },
  ESCALATED: {
    label: "This retained review cycle has been escalated.",
    explanation: "The cadence record shows escalation rather than routine completion.",
  },
  CADENCE_BROKEN: {
    label: "Retained cadence has been broken.",
    explanation: "Multiple review cycles have been missed or skipped without recovery. Operator intervention is required to restore cadence.",
  },
};
