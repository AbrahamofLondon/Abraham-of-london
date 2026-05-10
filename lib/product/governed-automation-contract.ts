/**
 * Governed Automation Contract
 *
 * Defines the standard record for all automation events in the system.
 * Every automated action must satisfy 6 conditions:
 * 1. Trigger — what starts it
 * 2. Scope — whose data does it affect
 * 3. Action — what does the system do
 * 4. Boundary — what must it not do
 * 5. Escalation — when must a human intervene
 * 6. Audit — what record proves it happened
 */

export type GovernedAutomationDomain =
  | "RETAINED_CADENCE"
  | "CHECKPOINT_REVIEW"
  | "RETURN_BRIEF"
  | "OVERSIGHT_BRIEF"
  | "DELIVERY_PREPARATION"
  | "SUPPRESSION_LOGGING"
  | "OUTCOME_FOLLOWUP"
  | "COUNSEL_ESCALATION"
  | "BOARDROOM_READINESS"
  | "PORTFOLIO_MEMORY"
  | "ROLE_BOUNDARY"
  | "EVIDENCE_INTEGRITY";

export type AutomationMode =
  | "AUTOMATED"
  | "SCHEDULED"
  | "OPERATOR_TRIGGERED"
  | "HUMAN_REVIEW_REQUIRED"
  | "BLOCKED";

export type AutomationSafetyBoundary =
  | "NO_RAW_RESPONDENT_TEXT"
  | "NO_OPERATOR_NOTES_TO_CLIENT"
  | "NO_COUNSEL_NOTES_TO_CLIENT"
  | "NO_UNVERIFIED_OUTCOME_CLAIM"
  | "NO_PROFESSIONAL_JUDGMENT"
  | "NO_LOW_SAMPLE_AGGREGATE"
  | "NO_EXTERNAL_DELIVERY_WITHOUT_APPROVAL"
  | "NO_PAYMENT_OR_CONTRACT_ACTION"
  | "NO_ACCESS_EXPANSION"
  | "NO_DESTRUCTIVE_ACTION";

export type AutomationTrigger =
  | "TIME_BASED"
  | "CHECKPOINT_DUE"
  | "CHECKPOINT_OVERDUE"
  | "EVIDENCE_RECEIVED"
  | "OUTCOME_DUE"
  | "SUPPRESSION_REQUIRED"
  | "DELIVERY_REQUESTED"
  | "CADENCE_BROKEN"
  | "MANUAL_OPERATOR";

export type AutomationAction =
  | "CREATE_REVIEW_CYCLE"
  | "MARK_DUE"
  | "MARK_OVERDUE"
  | "ESCALATE_TO_OPERATOR"
  | "PREPARE_BRIEF"
  | "PREPARE_DELIVERY"
  | "LOG_SUPPRESSION"
  | "REQUEST_OUTCOME_VERIFICATION"
  | "FLAG_COUNSEL_REVIEW"
  | "UPDATE_PORTFOLIO_MEMORY"
  | "BLOCK_UNSAFE_OUTPUT";

export type AutomationResult = "COMPLETED" | "SKIPPED" | "ESCALATED" | "BLOCKED" | "FAILED";

export type GovernedAutomationEvent = {
  id: string;
  domain: GovernedAutomationDomain;
  mode: AutomationMode;
  scopeId: string;
  organisationId?: string | null;
  caseId?: string | null;
  trigger: AutomationTrigger;
  action: AutomationAction;
  boundaries: AutomationSafetyBoundary[];
  requiresHumanReview: boolean;
  humanReviewReason?: string | null;
  result: AutomationResult;
  publicSummary: string;
  internalReason?: string | null;
  createdAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN BOUNDARIES — what each domain is allowed to automate
// ─────────────────────────────────────────────────────────────────────────────

export const DOMAIN_BOUNDARIES: Record<GovernedAutomationDomain, {
  mode: AutomationMode;
  allowedActions: AutomationAction[];
  boundaries: AutomationSafetyBoundary[];
  requiresHumanReview: boolean;
  humanReviewReason?: string;
}> = {
  RETAINED_CADENCE: {
    mode: "SCHEDULED",
    allowedActions: ["CREATE_REVIEW_CYCLE", "MARK_DUE", "MARK_OVERDUE", "ESCALATE_TO_OPERATOR"],
    boundaries: ["NO_EXTERNAL_DELIVERY_WITHOUT_APPROVAL", "NO_DESTRUCTIVE_ACTION"],
    requiresHumanReview: false,
  },
  CHECKPOINT_REVIEW: {
    mode: "AUTOMATED",
    allowedActions: ["MARK_DUE", "MARK_OVERDUE", "ESCALATE_TO_OPERATOR"],
    boundaries: ["NO_PROFESSIONAL_JUDGMENT", "NO_DESTRUCTIVE_ACTION"],
    requiresHumanReview: false,
  },
  RETURN_BRIEF: {
    mode: "AUTOMATED",
    allowedActions: ["PREPARE_BRIEF", "ESCALATE_TO_OPERATOR"],
    boundaries: ["NO_EXTERNAL_DELIVERY_WITHOUT_APPROVAL", "NO_PROFESSIONAL_JUDGMENT"],
    requiresHumanReview: false,
  },
  OVERSIGHT_BRIEF: {
    mode: "SCHEDULED",
    allowedActions: ["PREPARE_BRIEF", "PREPARE_DELIVERY", "ESCALATE_TO_OPERATOR"],
    boundaries: ["NO_EXTERNAL_DELIVERY_WITHOUT_APPROVAL", "NO_LOW_SAMPLE_AGGREGATE"],
    requiresHumanReview: true,
    humanReviewReason: "Brief release to client requires operator approval",
  },
  DELIVERY_PREPARATION: {
    mode: "AUTOMATED",
    allowedActions: ["PREPARE_DELIVERY", "BLOCK_UNSAFE_OUTPUT"],
    boundaries: ["NO_EXTERNAL_DELIVERY_WITHOUT_APPROVAL", "NO_RAW_RESPONDENT_TEXT", "NO_OPERATOR_NOTES_TO_CLIENT"],
    requiresHumanReview: true,
    humanReviewReason: "External delivery requires explicit operator approval",
  },
  SUPPRESSION_LOGGING: {
    mode: "AUTOMATED",
    allowedActions: ["LOG_SUPPRESSION", "BLOCK_UNSAFE_OUTPUT"],
    boundaries: ["NO_RAW_RESPONDENT_TEXT", "NO_OPERATOR_NOTES_TO_CLIENT", "NO_COUNSEL_NOTES_TO_CLIENT"],
    requiresHumanReview: false,
  },
  OUTCOME_FOLLOWUP: {
    mode: "SCHEDULED",
    allowedActions: ["REQUEST_OUTCOME_VERIFICATION", "MARK_DUE", "MARK_OVERDUE"],
    boundaries: ["NO_UNVERIFIED_OUTCOME_CLAIM", "NO_PROFESSIONAL_JUDGMENT"],
    requiresHumanReview: false,
  },
  COUNSEL_ESCALATION: {
    mode: "AUTOMATED",
    allowedActions: ["FLAG_COUNSEL_REVIEW", "ESCALATE_TO_OPERATOR"],
    boundaries: ["NO_PROFESSIONAL_JUDGMENT", "NO_COUNSEL_NOTES_TO_CLIENT"],
    requiresHumanReview: true,
    humanReviewReason: "Counsel review requires professional judgment",
  },
  BOARDROOM_READINESS: {
    mode: "AUTOMATED",
    allowedActions: ["PREPARE_BRIEF", "ESCALATE_TO_OPERATOR"],
    boundaries: ["NO_EXTERNAL_DELIVERY_WITHOUT_APPROVAL", "NO_UNVERIFIED_OUTCOME_CLAIM"],
    requiresHumanReview: true,
    humanReviewReason: "Board-level material requires operator approval",
  },
  PORTFOLIO_MEMORY: {
    mode: "AUTOMATED",
    allowedActions: ["UPDATE_PORTFOLIO_MEMORY", "LOG_SUPPRESSION"],
    boundaries: ["NO_LOW_SAMPLE_AGGREGATE", "NO_RAW_RESPONDENT_TEXT"],
    requiresHumanReview: false,
  },
  ROLE_BOUNDARY: {
    mode: "AUTOMATED",
    allowedActions: ["BLOCK_UNSAFE_OUTPUT", "LOG_SUPPRESSION"],
    boundaries: ["NO_ACCESS_EXPANSION", "NO_OPERATOR_NOTES_TO_CLIENT", "NO_COUNSEL_NOTES_TO_CLIENT"],
    requiresHumanReview: false,
  },
  EVIDENCE_INTEGRITY: {
    mode: "AUTOMATED",
    allowedActions: ["BLOCK_UNSAFE_OUTPUT", "LOG_SUPPRESSION", "ESCALATE_TO_OPERATOR"],
    boundaries: ["NO_UNVERIFIED_OUTCOME_CLAIM", "NO_DESTRUCTIVE_ACTION"],
    requiresHumanReview: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC-SAFE POSTURE — what buyers/operators see
// ─────────────────────────────────────────────────────────────────────────────

export type GovernedAutomationPosture = {
  cadenceStatus: "SCHEDULER_ACTIVE" | "AWAITING_CONFIGURATION" | "NO_RETAINED_CONTRACT";
  checkpointStatus: "TRACKING_ACTIVE" | "NO_ACTIVE_CHECKPOINTS";
  deliveryStatus: "PREPARATION_AUTOMATED" | "AWAITING_TRANSPORT" | "TRANSPORT_CONFIGURED";
  suppressionStatus: "LOGGING_ACTIVE" | "NO_SUPPRESSIONS";
  lastSweepAt: string | null;
  nextScheduledAt: string | null;
  humanBoundaries: string[];
  publicLabel: string;
};
