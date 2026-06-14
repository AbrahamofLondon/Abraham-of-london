/**
 * Contradiction Recurrence Contract
 *
 * Detects and tracks patterns where the same organizational
 * contradiction appears repeatedly across products, teams, time,
 * or contexts.
 *
 * This creates the moat: competitors see one diagnostic.
 * This system remembers that the same pattern failed twice before.
 */

export type RecurrencePattern =
  | "mandate_without_execution_owner"
  | "urgency_without_evidence"
  | "strategy_without_sequence"
  | "commitment_without_verification"
  | "authority_claim_without_artifact"
  | "decision_reopened_after_closure"
  | "same_risk_reappeared_after_warning"
  | "evidence_gap_repeated_after_alert"
  | "team_issue_in_individual_context"
  | "individual_issue_in_team_context";

export interface RecurrenceSighting {
  sightingId: string;
  patternKey: RecurrencePattern;
  caseId: string;
  productCode: string;
  seenAt: string;
  context: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface RecurrenceSignal {
  patternKey: RecurrencePattern;
  patternName: string;
  firstSeenAt: string;
  lastSeenAt: string;
  recurrenceCount: number;
  totalSightings: RecurrenceSighting[];

  // Where pattern appears
  productsSeenIn: string[];
  teamsSeen: string[];
  contextTypes: string[];

  // Pattern severity and impact
  severity: "low" | "medium" | "high" | "critical";
  typicalConsequences: string[];

  // What to do about it
  recommendedIntervention: string;
  reasonItMatters: string;
  interventionLevel: "free_signal" | "diagnostic_deepening" | "governance_required";
}

/**
 * Recurrence Rules — the system learns these patterns over time
 */
export const RECURRENCE_PATTERNS: Record<RecurrencePattern, {
  name: string;
  description: string;
  dangerLevel: "low" | "medium" | "high" | "critical";
  typicalSymptoms: string[];
  previousOutcomes: string[];
}> = {
  mandate_without_execution_owner: {
    name: "Mandate Without Execution Owner",
    description: "Leadership mandates action but no specific person is responsible",
    dangerLevel: "high",
    typicalSymptoms: [
      "\"Team should...\", not \"Alice owns...\"",
      "Action in commitment but owner field empty",
      "Followup meeting happens but progress stalled",
    ],
    previousOutcomes: [
      "No one executes, mandate repeats next quarter",
      "Different team members each assume others will do it",
      "Work done inefficiently by multiple people",
    ],
  },
  urgency_without_evidence: {
    name: "Urgency Without Evidence",
    description: "High pressure to decide before evidence is available",
    dangerLevel: "critical",
    typicalSymptoms: [
      "\"We need to decide this week\"",
      "Missing data marked as \"will get later\"",
      "Authority claimed on partial information",
    ],
    previousOutcomes: [
      "Decision reversed after evidence arrives",
      "Resources spent on wrong priority",
      "Credibility damaged",
    ],
  },
  strategy_without_sequence: {
    name: "Strategy Without Sequence",
    description: "Multi-year strategy announced without quarterly execution path",
    dangerLevel: "high",
    typicalSymptoms: [
      "Annual plan exists but no Q1-Q4 gates",
      "\"We'll sequence it later\"",
      "No decision points between announcement and execution",
    ],
    previousOutcomes: [
      "Strategy stalls after Q2",
      "Teams renegotiate quarterly without strategy reference",
      "Drift from stated direction",
    ],
  },
  commitment_without_verification: {
    name: "Commitment Without Verification",
    description: "Action recorded but no plan to verify it actually happened",
    dangerLevel: "medium",
    typicalSymptoms: [
      "\"We will do X\" recorded",
      "No verification date set",
      "Outcome assumed, not checked",
    ],
    previousOutcomes: [
      "Commitment forgotten by next review",
      "Work silently deprioritized",
      "Trust eroded",
    ],
  },
  authority_claim_without_artifact: {
    name: "Authority Claim Without Artifact",
    description: "Product claims to be validated without evidence artifacts present",
    dangerLevel: "critical",
    typicalSymptoms: [
      "\"Product is ready\" announced",
      "No evidence package in registry",
      "Authority state higher than evidence supports",
    ],
    previousOutcomes: [
      "Deployment fails due to missing artifacts",
      "Customer dissatisfaction",
      "Governance framework broken",
    ],
  },
  decision_reopened_after_closure: {
    name: "Decision Reopened After Closure",
    description: "Closed decision debated again with same participants, same evidence",
    dangerLevel: "medium",
    typicalSymptoms: [
      "\"Can we revisit X?\" asked same quarter",
      "New participant, same arguments",
      "No new evidence, just new pressure",
    ],
    previousOutcomes: [
      "Decision cycle stalls",
      "Team loses confidence in process",
      "Time wasted",
    ],
  },
  same_risk_reappeared_after_warning: {
    name: "Same Risk Reappeared After Warning",
    description: "Warned risk materializes again, identical to previous instance",
    dangerLevel: "high",
    typicalSymptoms: [
      "\"This is the same issue as Q1\"",
      "Warning was documented and ignored",
      "No preventive action taken",
    ],
    previousOutcomes: [
      "Repeated impact",
      "Lost credibility of warning system",
      "Preventive investment deferred",
    ],
  },
  evidence_gap_repeated_after_alert: {
    name: "Evidence Gap Repeated After Alert",
    description: "Same missing evidence blocks decision in multiple cycles",
    dangerLevel: "medium",
    typicalSymptoms: [
      "\"We need data on X\" appears in multiple reports",
      "Data collection never prioritized",
      "Gap alerts fade without action",
    ],
    previousOutcomes: [
      "Repeated decision delays",
      "Low-confidence choices made to force progress",
      "Data investment never happens",
    ],
  },
  team_issue_in_individual_context: {
    name: "Team Issue in Individual Context",
    description: "Pattern typical of team dysfunction appearing in individual assessment",
    dangerLevel: "medium",
    typicalSymptoms: [
      "Individual exhibits team-level symptoms",
      "\"Feels like working in a dysfunctional team\"",
      "Individual can't fix structural problem alone",
    ],
    previousOutcomes: [
      "Individual changes nothing if team doesn't",
      "Unnecessary focus on individual coaching",
      "Real issue remains",
    ],
  },
  individual_issue_in_team_context: {
    name: "Individual Issue in Team Context",
    description: "Pattern typical of individual dysfunction appearing in team assessment",
    dangerLevel: "low",
    typicalSymptoms: [
      "Team describes individual behavior",
      "\"Person X always does Y\"",
      "Pattern centers on one person",
    ],
    previousOutcomes: [
      "Team change misses root cause",
      "Person never learns",
      "Unnecessary team restructuring",
    ],
  },
};

/**
 * Invariant: Memory Cannot Grant Authority
 *
 * Recurrence signals may inform intervention recommendations.
 * They cannot be used to grant authority or bypass governance.
 */
