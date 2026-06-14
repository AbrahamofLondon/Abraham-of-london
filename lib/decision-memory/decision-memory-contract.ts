/**
 * Decision Memory Contract
 *
 * Governs all decision-memory events recorded in the system.
 * Every meaningful product interaction creates a memory event that:
 * - Records what was said and what was avoided
 * - Documents contradictions and evidence gaps
 * - Tracks commitments and consequences
 * - Enables the system to recognize patterns across time
 *
 * Memory informs recommendations but does not grant authority.
 */

export type DecisionMemoryEventType =
  | "intake_submitted"
  | "contradiction_detected"
  | "evidence_gap_identified"
  | "warning_issued"
  | "decision_path_recommended"
  | "commitment_recorded"
  | "followup_due"
  | "outcome_reported"
  | "outcome_unverified"
  | "pattern_repeated"
  | "pattern_improved"
  | "pattern_deteriorated";

export interface DecisionMemoryEvent {
  eventId: string;
  productCode: string;
  caseId: string;
  actorType: "individual" | "team" | "organisation" | "operator";
  timestamp: string;
  eventType: DecisionMemoryEventType;

  // Where this event came from
  sourceSurface: string;
  sourceArtifactPath?: string;

  // Authority and readiness state at moment of event
  authorityStateAtEvent: string;
  readinessStatusAtEvent: string;

  // Evidence boundary enforcement
  evidenceBoundaryAccepted: boolean;
  claimBoundary: string;

  // Event content
  summary: string;

  // Pattern references
  contradictionKeys: string[];
  evidenceGapKeys: string[];
  commitmentKeys: string[];
  consequenceKeys: string[];
}

/**
 * Contradiction Key — uniquely identifies a type of organizational pattern
 * that repeats across contexts.
 *
 * Examples:
 * - "mandate_without_execution_owner"
 * - "urgency_without_evidence"
 * - "strategy_without_sequence"
 */
export interface ContradictionDefinition {
  key: string;
  name: string;
  description: string;
  dangerLevel: "low" | "medium" | "high" | "critical";
  typicalSymptoms: string[];
  recommendedInterventionLevel: string;
}

/**
 * Evidence Gap — identifies a specific missing evidence category
 * that blocks higher-confidence decision-making.
 */
export interface EvidenceGapDefinition {
  key: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high";
  blocksReadiness: boolean;
  approximateTimeToResolve: string;
}

/**
 * Commitment — a specific decision or action that was recorded
 * and should be tracked through to outcome.
 */
export interface CommitmentRecord {
  commitmentId: string;
  caseId: string;
  madeAt: string;
  commitment: string;
  ownerType: "individual" | "team" | "organisation";
  ownerName?: string;
  dueAt?: string;
  verificationDueAt?: string;
  verificationStatus: "not_due" | "pending" | "verified" | "failed" | "abandoned";
}

/**
 * Consequence — an outcome that was predicted or warned about,
 * now recorded for pattern matching and learning.
 */
export interface ConsequenceRecord {
  consequenceId: string;
  caseId: string;
  relatedEventId: string;
  prediction: string;
  predictedAt: string;
  consequenceOccurredAt?: string;
  consequenceOccurred: boolean;
  severity: "low" | "medium" | "high" | "critical";
  learningFromConsequence: string;
}

/**
 * Memory Query Types — how the system accesses what it remembers
 */
export interface MemoryQuery {
  caseId?: string;
  productCode?: string;
  timeRange?: {
    from: string;
    to: string;
  };
  eventTypes?: DecisionMemoryEventType[];
  contradictionKeys?: string[];
}

export interface MemoryQueryResult {
  events: DecisionMemoryEvent[];
  contradictions: ContradictionDefinition[];
  evidenceGaps: EvidenceGapDefinition[];
  commitments: CommitmentRecord[];
  consequences: ConsequenceRecord[];
  patternsDetected: string[];
}

/**
 * Invariant: Memory Cannot Grant Authority
 *
 * Decision memory events record what happened and what patterns
 * emerge, but they CANNOT be used to grant authority or bypass
 * ProductAuthorityContract, ProductReleaseGovernance, or
 * EvidencePackageRegistry validation.
 *
 * Memory informs intervention recommendations.
 * Memory does not grant release-ready status.
 * Memory does not restore authority.
 */
