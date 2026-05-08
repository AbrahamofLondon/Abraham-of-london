export type OversightBrief = {
  briefId: string;
  accountId: string;
  periodStart: string;
  periodEnd: string;
  executiveSummary: string;
  activeCases: Array<{
    caseId: string;
    title: string;
    state: string;
    primaryRisk?: string;
    nextAction?: string;
  }>;
  costOfInaction?: {
    totalEstimated: number;
    casesIncluded: number;
  };
  counsel: {
    reviewsTriggered: number;
    requiredNow: number;
  };
  boardroom: {
    dossiersAvailable: number;
    exportsQueued: number;
  };
  verification: {
    commitmentsDue: number;
    commitmentsVerified: number;
    unresolvedBreaches: number;
  };
  retainedEnforcement?: {
    cyclesReviewed: number;
    activeRetainedDecisions: number;
    enforcementBreaches: number;
    improvementSignals: number;
    deteriorationSignals: number;
  };
  decisionCredit?: {
    score?: number;
    trend?: string;
    interpretation?: string;
  };
  requiredActions: string[];
};
