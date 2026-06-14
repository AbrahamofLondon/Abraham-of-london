/**
 * Intervention Calibration Contract
 *
 * Recommends the right next intervention based on:
 * - Maturity level (individual, team, organisation)
 * - Evidence availability
 * - Recurrence patterns
 * - Consequence risk
 * - Current intervention readiness
 *
 * Do not sell the same next step to everyone.
 * Calibrate to the situation.
 *
 * This creates the moat: competitors recommend the same intervention
 * to all users. This system calibrates to each user's state.
 */

export type InterventionLevel =
  | "free_signal"
  | "evidence_limited_review"
  | "diagnostic_deepening"
  | "reporting_output"
  | "execution_governance"
  | "retainer_oversight"
  | "board_facing_draft"
  | "blocked_until_evidence";

export interface InterventionCalibration {
  caseId: string;
  calibratedAt: string;
  calibratingProductCode: string;

  // Recommended next step
  recommendedLevel: InterventionLevel;
  recommendedProductCode?: string;

  // Why this recommendation
  reason: string;
  reasoning: {
    evidenceState: string;
    patternRisk: string;
    readinessLevel: string;
    consequenceRisk: string;
    timelinessFactors: string;
  };

  // What evidence would unlock next level
  evidenceNeeded: string[];
  estimatedTimeToEvidence: string;

  // What NOT to do
  unsuitableInterventions: InterventionLevel[];
  unsuitableReasons: string[];

  // Risk of deferral
  riskIfDelayed: string;
  recommendedFollowupAt: string;

  // Boundary notice
  boundaryNotice: string;
}

/**
 * Calibration Rules by Intervention Level
 */
export const INTERVENTION_CALIBRATION_RULES = {
  free_signal: {
    level: "free_signal" as InterventionLevel,
    name: "Free Signal (Advisory)",
    description: "Pattern recognition shared openly, no cost",
    requirements: ["pattern identified", "no evidence required"],
    suitableFor: [
      "Initial pattern awareness",
      "Recurrence detected",
      "Low-risk contradiction",
    ],
    unsuitableFor: ["critical decision pressure", "high-stakes outcome risk"],
    nextAction: "Monitor pattern, collect evidence for deeper intervention",
  },
  evidence_limited_review: {
    level: "evidence_limited_review" as InterventionLevel,
    name: "Evidence-Limited Review",
    description: "Structured review of available evidence, no claim of completeness",
    requirements: [
      "pattern identified",
      "some evidence available",
      "client accepts evidence boundaries",
    ],
    suitableFor: [
      "Medium evidence gaps",
      "Medium decision pressure",
      "Evidence collection in progress",
    ],
    unsuitableFor: ["zero evidence available", "critical decision needed today"],
    nextAction:
      "Collect missing evidence, move to diagnostic_deepening or reporting_output",
  },
  diagnostic_deepening: {
    level: "diagnostic_deepening" as InterventionLevel,
    name: "Diagnostic Deepening",
    description: "Structured diagnostic to close evidence gaps and find root patterns",
    requirements: [
      "high evidence gaps",
      "pattern complexity suggests deeper cause",
      "client ready for deeper work",
    ],
    suitableFor: [
      "Repeated pattern with unclear root cause",
      "High decision pressure with missing evidence",
      "Need to understand system-level issues",
    ],
    unsuitableFor: ["urgent decision cannot wait", "evidence already complete"],
    nextAction:
      "Use diagnostic findings to move to reporting_output or execution_governance",
  },
  reporting_output: {
    level: "reporting_output" as InterventionLevel,
    name: "Reporting Output (Decision Support)",
    description: "Evidence-bounded report to structure decision-making under uncertainty",
    requirements: [
      "pattern understood",
      "evidence collected and boundaries clear",
      "decision needed within weeks",
    ],
    suitableFor: [
      "Strategic decision with available evidence",
      "Need structured analysis",
      "Governance framework in place",
    ],
    unsuitableFor: [
      "lack evidence for credible output",
      "client cannot implement recommendations",
    ],
    nextAction:
      "Report delivered, execution_governance or retainer_oversight for follow-up",
  },
  execution_governance: {
    level: "execution_governance" as InterventionLevel,
    name: "Execution Governance",
    description:
      "Active governance of decision implementation, verification of commitments",
    requirements: [
      "decision made and commitment recorded",
      "execution plan defined",
      "client has execution capacity",
    ],
    suitableFor: [
      "Complex implementation",
      "High consequence risk",
      "Recurrence pattern suggests execution risk",
    ],
    unsuitableFor: [
      "decision not yet made",
      "execution owner not identified",
      "unclear if implementation will happen",
    ],
    nextAction: "Governance cycle, outcome verification, pattern improvement tracking",
  },
  retainer_oversight: {
    level: "retainer_oversight" as InterventionLevel,
    name: "Retainer Oversight",
    description: "Ongoing governance relationship, continuous pattern monitoring",
    requirements: [
      "repeated intervention need",
      "pattern complexity requires ongoing attention",
      "client committed to long-term engagement",
    ],
    suitableFor: [
      "Organisational pattern needing sustained attention",
      "Multiple recurrence patterns",
      "Long-term decision governance",
    ],
    unsuitableFor: ["one-time issue", "client capacity for short engagement only"],
    nextAction: "Retainer cycle, quarterly reviews, pattern improvement tracking",
  },
  board_facing_draft: {
    level: "board_facing_draft" as InterventionLevel,
    name: "Board-Facing Draft",
    description: "Structured input for board-level decision, with clear boundaries",
    requirements: [
      "strategic decision scale",
      "board governance required",
      "evidence collected",
      "boundaries clearly stated",
    ],
    suitableFor: [
      "Board-level strategic decision",
      "Multi-year implication",
      "Multiple stakeholder inputs needed",
    ],
    unsuitableFor: [
      "operational decision",
      "evidence incomplete",
      "board decision not yet on agenda",
    ],
    nextAction: "Board review, decision governance, post-decision implementation oversight",
  },
  blocked_until_evidence: {
    level: "blocked_until_evidence" as InterventionLevel,
    name: "Blocked Until Evidence Available",
    description: "No intervention suitable; decision must wait for evidence",
    requirements: [
      "critical evidence gaps identified",
      "decision forced before evidence available",
      "deferral has acceptable cost",
    ],
    suitableFor: [
      "Insufficient evidence to support any intervention",
      "Premium on credibility over speed",
      "Client willing to defer",
    ],
    unsuitableFor: [
      "immediate decision forced",
      "evidence unreachable",
      "client cannot wait",
    ],
    nextAction: "Evidence collection plan, estimated completion, revisit readiness",
  },
};

/**
 * Calibration Context — what shapes the recommendation
 */
export interface CalibrationContext {
  caseId: string;
  subjectType: "individual" | "team" | "organisation";
  decisionPressure: "low" | "medium" | "high" | "critical";
  evidenceAvailability: number; // 0.0 to 1.0
  patternRecurrenceCount: number;
  consequenceRisk: "low" | "medium" | "high" | "critical";
  interventionReadiness: string;
  timelineConstraint?: string;
  budgetConstraint?: string;
  contractualAuthority?: string;
}

/**
 * Invariant: Intervention Cannot Grant Authority
 *
 * The calibration engine recommends the right intervention level
 * based on evidence, readiness, and consequence risk.
 *
 * No intervention level can be used to grant authority or bypass
 * ProductAuthorityContract, ProductReleaseGovernance, or
 * EvidencePackageRegistry validation.
 *
 * A board-facing draft does not make a product release-ready.
 * A reporting output does not restore authority.
 * An intervention recommendation is advice, not authority.
 */
