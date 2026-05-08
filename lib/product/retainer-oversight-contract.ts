export type RetainerTier =
  | "GOVERNED_CONTINUITY"
  | "EXECUTIVE_OVERSIGHT"
  | "INSTITUTIONAL_COMMAND";

export type RetainerStatus =
  | "PROSPECT"
  | "QUALIFIED"
  | "ACTIVE"
  | "AT_RISK"
  | "PAUSED"
  | "ENDED";

export type OversightCycleStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "BRIEF_READY"
  | "ESCALATION_REQUIRED"
  | "COMPLETED";

export type OversightSignalType =
  | "COST_OF_INACTION_ACCUMULATING"
  | "COMMITMENT_UNVERIFIED"
  | "PATTERN_RECURRED"
  | "INTERVENTION_FAILURE_RISK"
  | "DEPENDENCY_RISK"
  | "EXECUTION_DRIFT"
  | "COUNSEL_OR_BOARDROOM_REVIEW"
  | "DECISION_CREDIT_DECLINED"
  | "COUNSEL_REVIEW_TRIGGERED"
  | "BOARDROOM_THRESHOLD_MET"
  | "DIVERGENCE_DETECTED"
  | "TEAM_DIVERGENCE_REPORTED"
  | "ENTERPRISE_STRAIN_REPORTED"
  | "CHECKPOINT_OVERDUE"
  | "CHECKPOINT_BLOCKED"
  | "CHECKPOINT_ABANDONED"
  | "CHECKPOINT_CONFIRMED"
  | "OUTCOME_IMPROVED"
  | "OUTCOME_DETERIORATED";

export type OversightSignal = {
  id: string;
  type: OversightSignalType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  caseId?: string;
  title: string;
  explanation: string;
  recommendedAction: string;
  createdAt: string;
};

export type OversightCycle = {
  cycleId: string;
  periodStart: string;
  periodEnd: string;
  status: OversightCycleStatus;
  casesReviewed: number;
  casesEscalated: number;
  boardroomDossiersGenerated: number;
  counselReviewsTriggered: number;
  verifiedOutcomes: number;
  unresolvedCommitments: number;
  costOfInactionEstimate?: number;
};

export type RetainerOversightAccount = {
  accountId: string;
  organisationId?: string;
  ownerUserId?: string;
  tier: RetainerTier;
  status: RetainerStatus;
  activeCaseCount: number;
  currentCycle?: OversightCycle;
  oversightSignals: OversightSignal[];
  nextRequiredAction?: string;
};
