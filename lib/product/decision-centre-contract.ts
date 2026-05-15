/**
 * lib/product/decision-centre-contract.ts — Decision Centre data contract.
 *
 * Defines the canonical types for the individual user Decision Centre.
 * Adapts to existing types: LivingCase, EvidenceTier, DiagnosticJourneyStage,
 * StageEntry, SignalContinuity, ProgressionCopy.
 *
 * The core object is the Living Case, not the diagnostic record.
 */

import type { LivingCase } from "@/lib/product/living-case-store";
import type { EvidenceTier } from "@/lib/product/living-intelligence-spine";
import type { StageEntry } from "@/lib/product/evidence-stage-contract";
import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import type { EfficacySurface, CheckpointResponseStatus } from "@/lib/product/efficacy-contract";
import type { DecisionVelocitySnapshot, DecisionVelocitySummary } from "@/lib/analytics/decision-velocity";
import type { WhatChangedSummary } from "@/lib/analytics/what-changed";
import type { CrossAssessmentIntelligence } from "@/lib/analytics/cross-assessment-intelligence";
import type { ContradictionMapView } from "@/lib/analytics/contradiction-graph-presenter";
import type { IntelligenceDataQuality, IntelligenceEmptyState, IntelligenceScope } from "@/lib/product/intelligence-contract";
import type { FieldProvenance } from "@/lib/product/field-provenance-contract";
import type {
  RetainerCycleMemoryEscalationLevel,
  RetainerCycleMemorySeverity,
  RetainerCycleMemoryStatus,
} from "@/lib/product/retainer-cycle-memory-contract";

// ─────────────────────────────────────────────────────────────────────────────
// COGNITIVE STATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The six cognitive states from the Intelligence Lifecycle.
 * Maps to product surfaces, not merely pages.
 */
export type CognitiveState =
  | "SIGNAL_DISCOVERY"
  | "STRUCTURAL_RECOGNITION"
  | "CONSEQUENCE_REALISATION"
  | "INTERVENTION_READINESS"
  | "EXECUTION_GOVERNANCE"
  | "INSTITUTIONAL_INTELLIGENCE";

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT ACCESS STATE
// ─────────────────────────────────────────────────────────────────────────────

export type ProductAccessState =
  | "OPEN"
  | "SUBSIDISED"
  | "PAID_REQUIRED"
  | "PURCHASED"
  | "ENTITLED"
  | "ADMITTED"
  | "RESTRICTED"
  | "EXPIRED"
  | "REVOKED"
  | "SPONSORED"
  | "ADMIN_GRANTED";

// ─────────────────────────────────────────────────────────────────────────────
// ADMISSION STATUS
// ─────────────────────────────────────────────────────────────────────────────

export type SurfaceAdmissionStatus = {
  surface: string;
  status: "ADMITTED" | "RESTRICTED" | "PAY_REQUIRED" | "NOT_EVALUATED";
  reasons?: string[];
  repairActions?: string[];
  returnPath?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTINUITY
// ─────────────────────────────────────────────────────────────────────────────

export type CaseContinuity = {
  status: "NEW" | "REPEATED" | "WORSENING" | "IMPROVING" | "RESOLVED" | "VERIFIED_PATTERN" | "UNKNOWN";
  priorOccurrences?: number;
  trend?: "stable" | "escalating" | "de-escalating" | "unknown";
  summary?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// DECISION CREDIT
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionCreditSummary = {
  score: number;
  trend: "improving" | "stable" | "declining";
  fulfilled: number;
  breached: number;
  disputed: number;
};

export type RetainerReadiness = {
  level: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  signals?: string[];
  cadenceStatus?: string;
};

export type PatternRecurrenceSummary = {
  status: "NO_PRIOR_PATTERN" | "POSSIBLE_RECURRENCE" | "VERIFIED_RECURRENCE" | "INSUFFICIENT_HISTORY";
  priorCount: number;
  explanation: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGY ROOM SESSION RECORD REFERENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Client-safe reference to a persisted Strategy Room execution session.
 * The session is SERVER_PERSISTED in StrategyRoomExecutionSession.
 * The full record is accessible at the href route.
 */
export type StrategyRoomSessionRef = {
  sessionId: string;
  href: string;
  provenanceStatus: "available" | "not_available";
  provenanceHref?: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// RETURN BRIEF REFERENCE
// ─────────────────────────────────────────────────────────────────────────────

export type ReturnBriefReference = {
  sessionId: string;
  sessionKey: string;
  /** Derived from the SR session's decision state at query time */
  status: "ACTIVE" | "RESOLVED" | "INSUFFICIENT_EVIDENCE" | "UNKNOWN";
  trajectory: string;
  /** ISO timestamp of the SR session that produced this brief (createdAt or updatedAt) */
  generatedAt: string;
  /** Canonical link: /briefing/return/[sessionKey] */
  href: string;
  outcomeClassification?: string | null;
};

export type DecisionCentreCheckpointItem = {
  id: string;
  sourceSurface: EfficacySurface;
  sourceLabel: string;
  evidencePosture: string;
  commandTitle: string;
  verificationQuestion: string;
  dueAt: string;
  status: string;
  responseStatus?: CheckpointResponseStatus | null;
  respondedAt?: string | null;
  evidenceNote?: string | null;
};

export type DecisionCentreIrreversibility = {
  level: string;
  score: number;
  summary: string;
  windowRemaining?: string | null;
  evidencePosture: "SYSTEM_INFERRED" | "PARTIAL";
  sourceLabel: string;
  computedAt: string | null;
  evidenceBasis: string;
  nextAction?: string | null;
};

export type DecisionCentreRetainerMemoryPreview = {
  status: "available" | "partial" | "insufficient" | "unavailable";
  escalationLevel: RetainerCycleMemoryEscalationLevel;
  escalationRequired: boolean;
  summary: string;
  findings: Array<{
    status: RetainerCycleMemoryStatus;
    severity: RetainerCycleMemorySeverity;
    signalKey: string;
    source?: string | null;
    sourceLabel?: string | null;
    explanation: string;
    recommendedAction: string;
  }>;
};

// ─────────────────────────────────────────────────────────────────────────────
// DECISION CENTRE CASE — the primary card model
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionCentreCase = {
  /** Living Case ID (journeyKey) */
  caseId: string;
  /** Intelligence scope for all shared cards tied to this case */
  scope: IntelligenceScope;
  /** User-stated decision or generated title */
  title: string;
  /** Full decision text from canonical decision object */
  decisionText?: string | null;
  /** Which product surface originated this case */
  sourceType?: string | null;
  /** Primary finding or condition classification */
  primaryFinding?: string | null;
  /** Governance implication summary */
  governanceImplication?: string | null;
  /** Current cognitive state */
  cognitiveState: CognitiveState;
  /** Evidence tier */
  evidenceTier: EvidenceTier;
  /** Bespoke stage checklist with contributions */
  completedStages: StageEntry[];
  /** Admission status per deep surface */
  admission: {
    executiveReporting?: SurfaceAdmissionStatus;
    strategyRoom?: SurfaceAdmissionStatus;
  };
  /** Continuity status */
  continuity?: CaseContinuity | null;
  /** Commercial status */
  commercial: {
    ownedProducts: string[];
    eligibleProducts: string[];
    paymentRequiredFor: string[];
    restrictedProducts: string[];
  };
  /** Cost-of-inaction clock — delay is not neutral */
  costOfInaction?: {
    accumulatedCost: number;
    daysElapsed: number;
    basis: string;
  } | null;
  /** What this case would lose if the user stopped here */
  valueAtRisk?: string | null;
  /** Next required action — the single most important thing to do */
  nextRequiredAction?: string | null;
  /** Unresolved contradictions count */
  unresolvedContradictions: number;
  /** Latest directive */
  latestDirective?: string | null;
  /** Outcome status */
  outcomeStatus?: string | null;
  /** Pattern recurrence */
  patternRecurrence?: PatternRecurrenceSummary | null;
  /** Retainer oversight potential */
  retainerReadiness?: RetainerReadiness | null;
  /** Boardroom Mode eligibility */
  boardroom?: {
    qualified: boolean;
    reason?: string;
    href?: string | null;
    historyCount?: number;
  } | null;
  /** Strategy Room is currently active for this case */
  strategyRoomActive?: boolean;
  /** Counsel escalation is currently warranted */
  counselWarranted?: boolean;
  /** Return Brief has been triggered for this case */
  returnBriefTriggered?: boolean;
  /** Explicit urgency reasons used for ranking */
  urgencyReasons?: string[];
  /** Optional decision velocity from Agent 1 */
  decisionVelocity?: DecisionVelocitySnapshot | null;
  /** Aggregate decision movement summary */
  decisionVelocitySummary?: DecisionVelocitySummary | null;
  /** Optional prior-vs-current comparison from Agent 1 */
  whatChanged?: WhatChangedSummary | null;
  /** Optional cross-assessment intelligence from Agent 1 */
  crossAssessmentIntelligence?: CrossAssessmentIntelligence | null;
  /** Optional contradiction presentation from Agent 1 */
  contradictionMap?: ContradictionMapView | null;
  /** Safe irreversibility estimate */
  irreversibility?: DecisionCentreIrreversibility | null;
  /** Available Return Briefs */
  returnBriefs: ReturnBriefReference[];
  /**
   * Latest Strategy Room execution session for this case, if any.
   * Persisted server-side — the full record is at strategyRoomRecord.href.
   */
  strategyRoomRecord?: StrategyRoomSessionRef | null;
  /** Governed memory carried with explicit source, date, and evidence posture */
  governedMemory?: GovernedMemoryItem[] | null;
  /** Last activity timestamp */
  updatedAt: string;
  /** Latest evidence timestamp used for freshness/provenance */
  lastEvidenceAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionCentreResponse = {
  ok: true;
  generatedAt: string;
  dataQuality: IntelligenceDataQuality;
  evidencePosture?: string;
  scope?: IntelligenceScope;
  provenance?: FieldProvenance[];
  emptyState?: IntelligenceEmptyState;
  retainerMemoryPreview?: DecisionCentreRetainerMemoryPreview | null;
  cases: DecisionCentreCase[];
  mostUrgentCase?: {
    caseId: string;
    reasons: string[];
  } | null;
  checkpoints: {
    requiresResponse: DecisionCentreCheckpointItem[];
    recentResponses: DecisionCentreCheckpointItem[];
  };
  commercial: {
    ownedProducts: string[];
    eligibleProducts: string[];
    restrictedProducts: string[];
  };
  credit: DecisionCreditSummary | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// COGNITIVE STATE DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive cognitive state from a Living Case.
 * Maps evidence tier + completed stages + admission to the six lifecycle states.
 */
export function deriveCognitiveState(livingCase: LivingCase): CognitiveState {
  // Stage 6: Institutional Intelligence — outcome verified
  if (livingCase.evidenceTier === "outcome_verified" || livingCase.evidenceTier === "human_reviewed") {
    return "INSTITUTIONAL_INTELLIGENCE";
  }

  // Stage 5: Execution Governance — Strategy Room active
  if (livingCase.completedStages.includes("strategy_room")) {
    return "EXECUTION_GOVERNANCE";
  }

  // Stage 4: Intervention Readiness — ER completed or SR admitted
  if (livingCase.completedStages.includes("executive_reporting")) {
    return "INTERVENTION_READINESS";
  }

  // Stage 3: Consequence Realisation — multi-source evidence with exposure
  if (livingCase.evidenceTier === "multi_source") {
    return "CONSEQUENCE_REALISATION";
  }

  // Stage 2: Structural Recognition — at least one diagnostic with route decision
  if (livingCase.routeDecisions.length > 0 || livingCase.completedStages.length >= 2) {
    return "STRUCTURAL_RECOGNITION";
  }

  // Stage 1: Signal Discovery — initial diagnostic started
  return "SIGNAL_DISCOVERY";
}
