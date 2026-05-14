import type { BehavioralTrendDirection, BehavioralTrendSummary } from "@/lib/behavioral/behavioral-trend-contract";

type BehavioralEvidenceStatus = "live" | "snapshot" | "unavailable";
type OversightStructuredActionType =
  | "VERIFY_COMMITMENT"
  | "ESCALATE_COUNSEL"
  | "GENERATE_BOARDROOM_DOSSIER"
  | "RESOLVE_DEPENDENCY"
  | "PROTECT_OPTION"
  | "ADDRESS_IRREVERSIBILITY"
  | "REVIEW_LOSS"
  | "RECHECK_PATTERN"
  | "REVIEW_OPERATING_CADENCE";

export type RetainerCycleMemoryStatus =
  | "NEW_SIGNAL"
  | "REPEATED_SIGNAL"
  | "DETERIORATED_AFTER_WARNING"
  | "DETERIORATED_AFTER_INTERVENTION"
  | "IMPROVED_AFTER_INTERVENTION"
  | "STABLE_UNRESOLVED"
  | "EVIDENCE_UNAVAILABLE"
  | "INSUFFICIENT_HISTORY";

export type RetainerCycleMemorySeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type RetainerCycleMemoryEscalationLevel =
  | "NONE"
  | "OPERATING_CADENCE_RESET"
  | "RETAINED_INTERVENTION"
  | "BOARDROOM_REVIEW"
  | "COUNSEL_REVIEW";

export type RetainerCycleMemoryFinding = {
  id: string;
  signalKey: string;
  source?: string | null;
  status: RetainerCycleMemoryStatus;
  severity: RetainerCycleMemorySeverity;
  currentDirection?: BehavioralTrendDirection | "UNAVAILABLE" | null;
  priorDirections?: BehavioralTrendDirection[];
  cyclesObserved: number;
  cyclesDeteriorating: number;
  cyclesUnavailable: number;
  lastObservedAt?: string | null;
  lastInterventionAt?: string | null;
  lastWarningAt?: string | null;
  explanation: string;
  recommendedAction: string;
};

export type RetainerCycleMemorySummary = {
  status: "available" | "partial" | "insufficient";
  generatedAt: string;
  accountId?: string | null;
  userId?: string | null;
  findings: RetainerCycleMemoryFinding[];
  escalationRequired: boolean;
  escalationLevel: RetainerCycleMemoryEscalationLevel;
  summary: string;
};

export type PriorBehavioralTrendCycle = {
  cycleId?: string | null;
  observedAt: string;
  behavioralTrends?: BehavioralTrendSummary | null;
  behavioralEvidenceStatus?: BehavioralEvidenceStatus;
};

export type PriorBehavioralActionRecord = {
  actionType: OversightStructuredActionType;
  source?: string | null;
  signalKey?: string | null;
  createdAt?: string | null;
};

export type RetainedEnforcementCycleRecord = {
  cycleId?: string | null;
  cadenceState?: string | null;
  completedAt?: string | null;
  skippedAt?: string | null;
  escalatedAt?: string | null;
  escalationReason?: string | null;
  updatedAt?: string | null;
};

export type RetainerCycleMemoryBuildInput = {
  generatedAt: string;
  accountId?: string | null;
  userId?: string | null;
  currentBehavioralTrends?: BehavioralTrendSummary | null;
  currentBehavioralEvidenceStatus?: BehavioralEvidenceStatus;
  priorBehavioralTrends?: PriorBehavioralTrendCycle[];
  priorStructuredActions?: PriorBehavioralActionRecord[];
  retainedEnforcementCycles?: RetainedEnforcementCycleRecord[];
  governanceFlags?: {
    counselReviewRequired?: boolean;
    boardroomReviewRequired?: boolean;
  };
};
