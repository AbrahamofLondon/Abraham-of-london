/**
 * Boardroom Dossier — Type Definitions
 *
 * Structured intelligence package for board-level decision governance.
 * Classification: RESTRICTED
 */

import type { SovereignSignalAssessment } from "@/lib/sovereign/sovereign-signal-public-dto";

export type DecisionPortfolioEntry = {
  decisionId: string;
  decisionText: string;
  sourceStage: string;
  affectedDomain: string | null;
  confidence: number;
  aiExposureLevel: string;
  decisionVelocityScore: number;
  forwardTerrainState: string;
  createdAt: string;
};

export type ContradictionEntry = {
  type: string;
  severity: string;
  userA: { role?: string; claim: string };
  userB: { role?: string; claim: string };
  message: string;
};

export type AuthorityMapEntry = {
  membershipId: string;
  email: string;
  fullName: string | null;
  roleTitle: string | null;
  teamName: string | null;
  functionName: string | null;
  seniorityBand: string | null;
  isExecutive: boolean;
  status: string;
};

export type RiskExposureEntry = {
  contractId: string;
  commitment: string;
  breachCount: number;
  escalationLevel: string;
  dueAt: string;
  status: string;
};

export type CommitmentEntry = {
  contractId: string;
  commitment: string;
  avoidedPattern: string | null;
  dueAt: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
};

export type BreachEntry = {
  contractId: string;
  commitment: string;
  breachCount: number;
  escalationLevel: string;
  consequenceOfInaction: string | null;
  dueAt: string;
};

export type OutcomeEntry = {
  outcomeId: string;
  outcomeClassification: string;
  magnitudeOfChange: number;
  effectivenessScore: number;
  decisionVelocityDelta: number;
  competitivePositionShift: number;
  createdAt: string;
};

export type BoardAction = {
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  description: string;
  relatedEntityId: string | null;
};

export type BoardroomDossier = {
  organisationId: string;
  generatedAt: string;
  period: { from: string; to: string };
  executiveSummary: string;
  decisionPortfolio: DecisionPortfolioEntry[];
  topContradictions: ContradictionEntry[];
  authorityMap: AuthorityMapEntry[];
  riskExposure: RiskExposureEntry[];
  openCommitments: CommitmentEntry[];
  breaches: BreachEntry[];
  verifiedOutcomes: OutcomeEntry[];
  financialImpact: { totalCostOfDelay: number; totalRecovered: number; currency: string };
  recommendedBoardActions: BoardAction[];
  dataCompleteness: { score: number; missingFields: string[] };
  /** Institutional signal exposure — public-safe sovereign signal assessment */
  sovereignSignalAssessment?: SovereignSignalAssessment | null;
};
