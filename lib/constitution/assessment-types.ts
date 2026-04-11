// lib/constitution/assessment-types.ts

import type {
  AuthorityType,
  ConstitutionalDecision,
  OrgPosture,
  ReadinessTier,
} from "@/lib/constitution/rules";

export type AssessmentSource =
  | "quick_assessment"
  | "diagnostic"
  | "executive_reporting"
  | "strategy_room";

export type FailureModeLabel =
  | "narrative_incoherence"
  | "sponsor_weakness"
  | "governance_erosion"
  | "trust_erosion"
  | "mandate_ambiguity"
  | "execution_fragmentation"
  | "strategic_operational_misalignment"
  | "decision_owner_ambiguity"
  | "market_pressure_without_order";

export type FailureModeRecord = {
  code: FailureModeLabel;
  label: string;
  severity: number; // 0..10
  triggered: boolean;
};

export type AssessmentInput = {
  source: AssessmentSource;

  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
  authorityRole?: string;
  authorityScope?: string;
  organisation?: string;
  organisationType?: string;
  jurisdiction?: string;
  sector?: string;
  revenueBand?: string;
  annualRevenueBand?: string;
  urgencyWindow?: string;
  boardInvolved?: string;

  problemStatement?: string;
  mandateDescription?: string;
  statedProblem?: string;
  symptoms?: string;
  desiredOutcome?: string;
  currentConstraint?: string;
  marketExposure?: string;

  /**
   * Optional structured hints from lightweight front-end tools.
   * They should shape the result, not replace canonical derivation.
   */
  precomputed?: {
    authorityClarity?: number; // 0..100
    coherence?: number; // 0..100
    pressure?: number; // 0..100
    friction?: number; // 0..100
    trustCondition?: number; // 0..100
    governanceDiscipline?: number; // 0..100
  };
};

export type AssessmentScores = {
  clarityScore: number;
  seriousnessScore: number;
  narrativeCoherence: number;
  interventionReadiness: number;
  trustCondition: number;
  governanceDiscipline: number;
  authorityClarityScore: number;
  pressureScore: number;
  frictionScore: number;
};

export type AssessmentProfile = {
  authorityType: AuthorityType;
  readinessTier: ReadinessTier;
  posture: OrgPosture;
  failureModeCount: number;
  failureModeSeverity: number;
  failureModes: FailureModeRecord[];
};

export type AssessmentReadout = {
  headline: string;
  summary: string;
  routeWhy: string[];
  visibleAssessment: Array<{
    label: string;
    value: string;
    interpretation: string;
  }>;
  requiredNextMoves: string[];
};

export type ConstitutionalAssessment = {
  input: AssessmentInput;
  scores: AssessmentScores;
  profile: AssessmentProfile;
  decision: ConstitutionalDecision;
  readout: AssessmentReadout;
  generatedAt: string;
};