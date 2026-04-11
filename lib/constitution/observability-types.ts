export type ConstitutionalSeverity =
  | "INFO"
  | "NOTICE"
  | "WARNING"
  | "BREACH"
  | "CRITICAL";

export type ConstitutionalEventType =
  | "CASE_SUBMITTED"
  | "ROUTE_ASSIGNED"
  | "ROUTE_DEGRADED"
  | "RECOMMENDATION_ISSUED"
  | "RECOMMENDATION_REVIEWED"
  | "FOLLOWUP_CAPTURED"
  | "ESCALATION_ACCEPTED"
  | "ESCALATION_BLOCKED"
  | "CONSTITUTIONAL_BREACH"
  | "DRIFT_FLAGGED"
  | "TRIBUNAL_OPENED"
  | "TRIBUNAL_RESOLVED"
  | "OPERATOR_PENALTY_APPLIED";

export type DriftCategory =
  | "OVER_ESCALATION"
  | "UNDER_ESCALATION"
  | "WEAK_DIAGNOSTIC_HOLDING"
  | "RECOMMENDATION_DECAY"
  | "AUTHORITY_DRIFT"
  | "CONFIDENCE_DECORATION"
  | "OPERATOR_GAMING"
  | "EXPLAINABILITY_FAILURE";

export type ConstitutionalEvent = {
  id: string;
  createdAt: string;
  caseKey?: string;
  operatorKey?: string;
  type: ConstitutionalEventType;
  severity: ConstitutionalSeverity;
  title: string;
  detail: string;
  metadata?: Record<string, unknown>;
};

export type ConstitutionalDriftFlag = {
  id: string;
  createdAt: string;
  category: DriftCategory;
  severity: ConstitutionalSeverity;
  title: string;
  detail: string;
  affectedCaseKeys: string[];
  operatorKey?: string;
  metadata?: Record<string, unknown>;
};

export type TribunalFinding = {
  id: string;
  title: string;
  description?: string;
  severity: ConstitutionalSeverity;
  caseKey?: string;
  operatorKey?: string;
};

export type TribunalCaseStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "UPHELD"
  | "OVERTURNED"
  | "DISMISSED";

export type DriftTribunalCase = {
  id: string;
  createdAt: string;
  updatedAt: string;
  driftFlagId: string;
  title: string;
  status: TribunalCaseStatus;
  assignedReviewers: string[];
  findings: TribunalFinding[];
  resolutionNotes?: string;
};

export type ConstitutionalDashboardSnapshot = {
  generatedAt: string;
  totalEvents: number;
  totalBreaches: number;
  totalCriticals: number;
  openTribunals: number;
  driftFlagCount: number;
  routeIntegrityScore: number;
  recommendationIntegrityScore: number;
  tribunalPressureScore: number;
};