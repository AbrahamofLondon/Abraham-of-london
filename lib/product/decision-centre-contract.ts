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
// RETURN BRIEF REFERENCE
// ─────────────────────────────────────────────────────────────────────────────

export type ReturnBriefReference = {
  sessionId: string;
  sessionKey: string;
  trajectory: string;
  generatedAt: string;
  outcomeClassification?: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// DECISION CENTRE CASE — the primary card model
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionCentreCase = {
  /** Living Case ID (journeyKey) */
  caseId: string;
  /** User-stated decision or generated title */
  title: string;
  /** Full decision text from canonical decision object */
  decisionText?: string | null;
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
  /** Available Return Briefs */
  returnBriefs: ReturnBriefReference[];
  /** Last activity timestamp */
  updatedAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionCentreResponse = {
  ok: true;
  cases: DecisionCentreCase[];
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
