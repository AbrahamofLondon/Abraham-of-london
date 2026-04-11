// lib/assessments/suite-types.ts

export type AssessmentTier =
  | "CONSTITUTIONAL"
  | "TEAM"
  | "ENTERPRISE"
  | "EXECUTIVE_REPORTING";

export type EvidenceQuality = "LOW" | "MEDIUM" | "HIGH";
export type StakeholderBreadth =
  | "LOCAL"
  | "MULTI_TEAM"
  | "EXECUTIVE"
  | "BOARD"
  | "INSTITUTIONAL";

export interface AssessmentSuiteIntake {
  fullName: string;
  email: string;
  organisation: string;
  role: string;
  sector: string;
  problemStatement: string;
  symptoms: string;
  desiredOutcome: string;
  currentConstraint: string;

  governance: {
    authorityScope: "DIRECT" | "PROXY" | "UNCLEAR";
    sponsorNameOrSeat: string;
    stakeholderBreadth: StakeholderBreadth;
    boardInvolved: "YES" | "NO" | "UNCERTAIN";
  };

  economics: {
    revenueBand: "MICRO" | "SMB" | "MID" | "ENTERPRISE" | "WHALE";
    marketExposure: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    decisionWindow: "IMMEDIATE" | "NEAR_TERM" | "MID_TERM" | "LONG_HORIZON";
    estimatedExposureGBP: number;
    headcountAffected: number;
  };

  history: {
    evidenceQuality: EvidenceQuality;
    evidenceNotes: string;
    priorAttemptOutcome: "NONE" | "PARTIAL" | "FAILED" | "WORSENED";
    correctionHistory: string;
  };

  decisionNeed: {
    decisionQuestion: string;
    whatHappensIfNothingChanges: string;
    whyNow: string;
  };

  diagnosticsMeta?: {
    signalReadinessScore?: number;
    source?: string;
  };
}

export interface AssessmentLadderCard {
  id: AssessmentTier;
  title: string;
  href: string;
  strapline: string;
  position: string;
  output: string;
}