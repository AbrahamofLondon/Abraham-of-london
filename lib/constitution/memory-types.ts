export type CaseOutcomeStatus =
  | "OPEN"
  | "STABILISED"
  | "ESCALATED"
  | "RESOLVED"
  | "DECLINED"
  | "FAILED";

export type RecommendationOutcome =
  | "UNKNOWN"
  | "ADOPTED"
  | "IGNORED"
  | "PARTIAL"
  | "FAILED"
  | "SUCCEEDED";

export type InstitutionalMemoryRecord = {
  id: string;
  caseKey: string;
  operatorKey: string;
  createdAt: string;
  updatedAt: string;

  latestRoute: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
  latestConfidence: number;
  latestReadinessScore: number;
  latestSeriousness: number;
  latestTrajectory: string;

  submissionCount: number;
  escalationCount: number;
  diagnosticCount: number;
  rejectionCount: number;

  outcomeStatus: CaseOutcomeStatus;
  warnings: string[];
  tags: string[];
  metadata?: Record<string, unknown>;
};

export type RecommendationMemoryRecord = {
  id: string;
  caseKey: string;
  recommendationId: string;
  title: string;
  actionType: string;
  createdAt: string;
  lastReviewedAt?: string;
  outcome: RecommendationOutcome;
  outcomeNotes?: string;
};

export type LearningSnapshot = {
  generatedAt: string;
  totalCases: number;
  totalEscalations: number;
  totalDiagnostics: number;
  totalRejections: number;
  routeQualityScore: number;
  recommendationEffectivenessScore: number;
  driftFlags: string[];
};