export type InstitutionalMemoryCycleSnapshot = {
  cycleId: string;
  periodStart: string;
  periodEnd: string;
  decisionsUnderGovernance: number;
  recurringPatterns: number;
  unresolvedCommitments: number;
  verifiedCommitments: number;
  boardroomEscalations: number;
  counselEscalations: number;
  costTracked: number;
  irreversibilityScore?: number;
};

export type InstitutionalMemoryArchive = {
  accountId: string;
  monthsOfMemory: number;
  cycleCount: number;
  recurringPatternCount: number;
  unresolvedCommitmentCount: number;
  verifiedOutcomeCount: number;
  boardroomEscalationCount: number;
  counselEscalationCount: number;
  costHistoryTracked: number;
  latestIrreversibilityScore?: number;
  cycleSnapshots: InstitutionalMemoryCycleSnapshot[];
};
