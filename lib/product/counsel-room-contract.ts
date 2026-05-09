/**
 * lib/product/counsel-room-contract.ts
 *
 * Counsel Room — governed escalation surface contract.
 *
 * The Consulting Room is not a sales page.
 * It is the human escalation chamber of the decision infrastructure.
 *
 * Access must be controlled by:
 * 1. evidence already gathered;
 * 2. escalation thresholds;
 * 3. unresolved contradiction;
 * 4. failed execution;
 * 5. retainer or counsel eligibility;
 * 6. operator override where justified.
 *
 * No user should enter the full counsel flow cold unless the system
 * deliberately places them there.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS STATE
// ─────────────────────────────────────────────────────────────────────────────

export type CounselAccessState =
  | "NO_EVIDENCE"
  | "DIAGNOSTIC_REQUIRED"
  | "EVIDENCE_INSUFFICIENT"
  | "ESCALATION_ELIGIBLE"
  | "COUNSEL_RECOMMENDED"
  | "COUNSEL_REQUIRED"
  | "RETAINER_COVERED"
  | "OPERATOR_GRANTED";

// ─────────────────────────────────────────────────────────────────────────────
// ESCALATION TRIGGERS
// ─────────────────────────────────────────────────────────────────────────────

export type CounselEscalationTrigger =
  | "SYSTEM_CANNOT_MODEL_CONDITION"
  | "REPEATED_CONTRADICTION"
  | "FAILED_EXECUTION"
  | "HIGH_CONSEQUENCE_EXPOSURE"
  | "BOARDROOM_THRESHOLD"
  | "COUNSEL_REQUESTED_BY_OPERATOR"
  | "RETAINER_REVIEW"
  | "DISPUTED_SYSTEM_FINDING"
  | "INSUFFICIENT_EVIDENCE_WITH_HIGH_RISK";

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE PACKAGE
// ─────────────────────────────────────────────────────────────────────────────

export type CounselEvidencePackage = {
  userId: string;
  journeyId?: string | null;
  caseId?: string | null;
  completedStages: string[];
  activeContradictions: string[];
  escalationLevel: number;
  triggers: CounselEscalationTrigger[];
  overdueCheckpointCount: number;
  blockedCheckpointCount: number;
  estimatedExposure?: {
    amount?: number | null;
    band?: string | null;
    caveat: string;
  } | null;
  latestRequiredMove?: string | null;
  priorAttempts?: string | null;
  recurrenceSummary?: string | null;
  evidencePosture:
    | "USER_REPORTED"
    | "SYSTEM_INFERRED"
    | "AGGREGATED"
    | "OPERATOR_REVIEWED";
  suppressionReasons: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// COUNSEL ROOM STATE
// ─────────────────────────────────────────────────────────────────────────────

export type CounselRoomState = {
  accessState: CounselAccessState;
  canRequestCounsel: boolean;
  canViewEvidencePackage: boolean;
  canSubmitStructuredIntake: boolean;
  reason: string;
  evidencePackage?: CounselEvidencePackage | null;
  recommendedPath:
    | "COMPLETE_FAST_DIAGNOSTIC"
    | "COMPLETE_CONSTITUTIONAL"
    | "ENTER_STRATEGY_ROOM"
    | "RESPOND_TO_CHECKPOINT"
    | "REQUEST_COUNSEL_REVIEW"
    | "RETAINER_REVIEW"
    | "CONTACT_ONLY";

  /** Stakeholder pressure summary — who decides, who blocks, who may resist */
  stakeholderPressure?: {
    decisionOwner: string | null;
    affectedGroups: string[];
    unresolvedAuthorityTension: string | null;
    potentialBlockers: string[];
    sourceLabel: string;
    thinState: boolean;
  } | null;

  /** Why counsel may be warranted — scenario estimate */
  counselWarrantedEstimate?: {
    whatMayWorsen: string;
    missingEvidence: string;
    cannotAutomate: string;
    sourceLabel: string;
    thinState: boolean;
  } | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// COUNSEL INTAKE
// ─────────────────────────────────────────────────────────────────────────────

export type CounselIntakePayload = {
  caseId?: string | null;
  journeyId?: string | null;
  escalationTrigger: CounselEscalationTrigger[];
  userSummary: string;
  whatChangedSinceSystemAssessment?: string;
  whatHumanCounselMustConsider: string;
  urgency:
    | "NORMAL"
    | "TIME_SENSITIVE"
    | "BOARD_OR_LEGAL_EXPOSURE"
    | "CRITICAL";
  permissionToUseEvidencePackage: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// COUNSEL CASE
// ─────────────────────────────────────────────────────────────────────────────

export type CounselCaseStatus =
  | "REQUESTED"
  | "EVIDENCE_REVIEW_REQUIRED"
  | "ACCEPTED_FOR_REVIEW"
  | "MORE_EVIDENCE_REQUIRED"
  | "DECLINED_NOT_WARRANTED"
  | "IN_COUNSEL_REVIEW"
  | "COUNSEL_RESPONSE_READY"
  | "CLOSED";

export type CounselCase = {
  id: string;
  userId: string;
  email: string;
  status: CounselCaseStatus;
  escalationTrigger: CounselEscalationTrigger[];
  evidencePackage: CounselEvidencePackage;
  userSummary: string;
  whatChangedSinceSystemAssessment?: string;
  whatHumanCounselMustConsider: string;
  urgency: CounselIntakePayload["urgency"];
  permissionToUseEvidencePackage: boolean;
  operatorNotes?: string;
  counselResponse?: string;
  createdAt: string;
  updatedAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS STATE LABELS — for UI display
// ─────────────────────────────────────────────────────────────────────────────

export const COUNSEL_ACCESS_LABELS: Record<CounselAccessState, {
  title: string;
  description: string;
  restrained: string;
}> = {
  NO_EVIDENCE: {
    title: "Counsel Review is not a starting point.",
    description: "This room opens when the system has enough evidence to determine that direct counsel may be necessary.",
    restrained: "Counsel is not yet warranted by the evidence available.",
  },
  DIAGNOSTIC_REQUIRED: {
    title: "More evidence is needed before counsel can be considered.",
    description: "Complete the diagnostic ladder first. The system needs sufficient evidence to determine whether counsel is warranted.",
    restrained: "Counsel is not yet warranted by the evidence available.",
  },
  EVIDENCE_INSUFFICIENT: {
    title: "The system does not yet have enough evidence to recommend counsel.",
    description: "Additional diagnostic stages will strengthen the evidence base and may change the counsel recommendation.",
    restrained: "Counsel is not yet warranted by the evidence available.",
  },
  ESCALATION_ELIGIBLE: {
    title: "Counsel Review may be warranted.",
    description: "The system has detected conditions that may require human counsel. Review the evidence package below.",
    restrained: "Counsel may be warranted based on the evidence available.",
  },
  COUNSEL_RECOMMENDED: {
    title: "Counsel Review is recommended.",
    description: "The system has identified conditions that should not be handled by automated guidance alone.",
    restrained: "Counsel is recommended based on the evidence available.",
  },
  COUNSEL_REQUIRED: {
    title: "The system has identified conditions that require human counsel.",
    description: "These conditions exceed what the system can safely model. Counsel review is necessary before proceeding.",
    restrained: "Counsel is required. The system cannot resolve this condition alone.",
  },
  RETAINER_COVERED: {
    title: "Counsel Review is covered under your retained oversight.",
    description: "Your active retainer includes counsel review. Open the retained review to continue.",
    restrained: "Counsel review is available under your retained oversight agreement.",
  },
  OPERATOR_GRANTED: {
    title: "Counsel Review has been opened by operator override.",
    description: "An operator has granted access to Counsel Review. Review the evidence package below.",
    restrained: "Access granted by operator override.",
  },
};
