/**
 * Strategic Twin Contract
 *
 * A living operational model for each user, team, or organisation.
 *
 * This is not a chatbot memory. It is a governed state machine
 * that tracks decision pressure, contradictions, evidence gaps,
 * commitments, and intervention readiness.
 *
 * Every product either reads the Strategic Twin, updates it,
 * or explicitly declares why it does not.
 *
 * This prevents fragmentation and ensures products build on
 * shared context instead of rediscovering the same patterns.
 */

export type SubjectType = "individual" | "team" | "organisation";

export type DecisionPressure = "low" | "medium" | "high" | "critical";

export type InterventionReadiness =
  | "not_ready"
  | "signal_detected"
  | "evidence_needed"
  | "intervention_ready"
  | "execution_governance_required";

export interface StrategicTwinState {
  // Identity
  caseId: string;
  subjectType: SubjectType;
  subjectName?: string;

  // Current decision context
  currentDecisionPressure: DecisionPressure;
  activeDecisionTheme?: string;

  // Pattern environment
  dominantContradictions: string[];
  activeEvidenceGaps: string[];
  unresolvedCommitments: string[];
  repeatedPatterns: string[];

  // Intervention readiness
  currentInterventionReadiness: InterventionReadiness;
  readinessReason: string;

  // State quality
  lastUpdatedAt: string;
  lastUpdatedByProductCode?: string;
  stateConfidence: "low" | "medium" | "high";
  confidenceReason: string;

  // History
  previousInterventionLevels: string[];
  previousOutcomes: string[];
}

/**
 * Strategic Twin Update — how products modify the shared state
 */
export interface StrategicTwinUpdate {
  caseId: string;
  updatingProductCode: string;
  updateAt: string;
  updateType:
    | "signal_detected"
    | "evidence_collected"
    | "commitment_added"
    | "commitment_verified"
    | "intervention_completed"
    | "pattern_detected"
    | "pressure_level_changed";

  // What changed
  contradictionChanges?: {
    added: string[];
    resolved: string[];
  };
  evidenceGapChanges?: {
    added: string[];
    resolved: string[];
  };
  commitmentChanges?: {
    added: string[];
    completed: string[];
    abandoned: string[];
  };

  // Context
  summary: string;
  reasoning: string;
}

/**
 * Strategic Twin Lineage — why the state is what it is
 */
export interface StrategicTwinLineageEntry {
  timestamp: string;
  updatingProductCode: string;
  updateType: string;
  change: string;
  reason: string;
}

/**
 * Strategic Twin Read Guard — products declare how they use the state
 */
export interface StrategicTwinReadIntent {
  productCode: string;
  caseId: string;
  readAt: string;
  intentType:
    | "contextual_awareness"
    | "pattern_detection"
    | "intervention_selection"
    | "readiness_assessment"
    | "governance_check";

  // What the product will do with the information
  intendedAction: string;

  // Does the product plan to update the state?
  willUpdateState: boolean;
}

/**
 * Strategic Twin Integration Rules
 *
 * 1. Every product that reads Strategic Twin must declare intent
 * 2. Updates must include reasoning, not just data
 * 3. If a product does not read Strategic Twin, it must declare why
 * 4. State changes must be traceable to source
 * 5. Contradictions in state are warnings, not errors
 */
export const STRATEGIC_TWIN_INVARIANTS = {
  NO_STATE_MODIFICATION_WITHOUT_INTENT: "Products must declare read intent before accessing state",
  NO_HIDDEN_UPDATES: "All state updates must be logged with reason and source",
  NO_AUTHORITY_GRANT_FROM_STATE: "Strategic Twin state informs but does not grant authority",
  NO_FRAGMENTED_STATE: "All products use the same Strategic Twin, never local copies",
  LINEAGE_IS_PERMANENT: "State history cannot be erased, only appended",
};

/**
 * Invariant: Strategic Twin Cannot Grant Authority
 *
 * The Strategic Twin state helps products understand context,
 * recognize patterns, and select appropriate interventions.
 *
 * The Strategic Twin cannot be used to grant authority or bypass
 * ProductAuthorityContract, ProductReleaseGovernance, or
 * EvidencePackageRegistry validation.
 *
 * A Strategic Twin state may inform which product to recommend.
 * It cannot authorize a product that governance marks unready.
 */
