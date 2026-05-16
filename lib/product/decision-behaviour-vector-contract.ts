/**
 * lib/product/decision-behaviour-vector-contract.ts
 *
 * Decision Behaviour Vector — the proprietary behavioural intelligence layer.
 *
 * Every governed case produces one vector. Vectors are anonymised,
 * aggregated, and used to build benchmark context, pattern detection,
 * and institutional intelligence.
 *
 * Privacy rule:
 * The vector must NOT contain:
 *   - raw decision text
 *   - personal names
 *   - emails
 *   - actor IDs
 *   - suppression details
 *   - private evidence
 *   - operator notes
 */

export type DecisionBehaviourVectorSourceType =
  | "FAST_DIAGNOSTIC"
  | "PURPOSE_ALIGNMENT"
  | "CONSTITUTIONAL"
  | "TEAM_ASSESSMENT"
  | "ENTERPRISE_ASSESSMENT"
  | "EXECUTIVE_REPORT"
  | "STRATEGY_ROOM_RECORD"
  | "RETURN_BRIEF";

export type DecisionBehaviourVector = {
  version: 1;
  caseId: string;
  sourceType: DecisionBehaviourVectorSourceType;

  createdAt: string;
  updatedAt?: string | null;

  decisionState: {
    framed: boolean;
    saved: boolean;
    acted: boolean | null;
    delayed: boolean | null;
    blocked: boolean | null;
    abandoned: boolean | null;
    reopened: boolean | null;
    resolved: boolean | null;
  };

  timing: {
    daysToSave?: number | null;
    daysToFirstAction?: number | null;
    daysToReturnBrief?: number | null;
    daysToResolution?: number | null;
  };

  friction: {
    authorityGap?: boolean;
    evidenceGap?: boolean;
    accountabilityGap?: boolean;
    executionGap?: boolean;
    stakeholderGap?: boolean;
    recurrenceDetected?: boolean;
  };

  outcome: {
    status:
      | "UNKNOWN"
      | "ACTED"
      | "DELAYED"
      | "BLOCKED"
      | "ABANDONED"
      | "RESOLVED"
      | "RECURRED"
      | "ESCALATED";
    selfReported?: boolean;
    verified?: boolean;
  };

  commercialExposure?: {
    costBasis: "USER_REPORTED" | "SYSTEM_ESTIMATED" | "NOT_AVAILABLE";
    delayCostBand?: "LOW" | "MEDIUM" | "HIGH" | "SEVERE" | null;
  };

  privacy: {
    anonymisable: boolean;
    contributionConsent: boolean;
    containsRawDecisionText: false;
  };
};
