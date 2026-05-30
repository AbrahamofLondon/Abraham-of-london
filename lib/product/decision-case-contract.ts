/**
 * lib/product/decision-case-contract.ts
 *
 * DecisionCase — the canonical product intelligence object.
 *
 * Every user interaction should produce or enrich this object.
 * Every surface reveals only the amount appropriate to its ladder tier.
 *
 * Product doctrine:
 *   Every serious decision fails in one of ten places.
 *   Abraham of London detects the failure point before the decision becomes damage.
 *
 * Five gates every surface must pass:
 *   1. Intelligence gate — uses canonical DecisionCase / Decision Failure Map
 *   2. Usefulness gate  — identifies failure point, tension, viable move, fallback, must-not-delay
 *   3. Coherence gate   — same input produces compatible analysis across all surfaces
 *   4. Premium gate     — output has judgement, restraint, specificity, confidence
 *   5. Commercial gate  — leads naturally to next paid/retained step without begging
 */

import type {
  DecisionFailureMapResult,
  FailurePoint,
} from "@/lib/decision/decision-failure-map";
import type {
  DecisionDomain,
  ConstraintSignal,
  PressureType,
  RiskDirective,
} from "@/lib/decision/constraint-reality-layer";

// ─── Source types ─────────────────────────────────────────────────────────────

export type DecisionCaseSource =
  | "decision_test"
  | "market_signal"
  | "release_risk"
  | "fast_diagnostic"
  | "brief_order"
  | "executive_review"
  | "interest_form"
  | "manual";

// ─── Tier types ───────────────────────────────────────────────────────────────

export type DecisionCaseTier =
  | "free"
  | "basic"
  | "full"
  | "urgent"
  | "executive"
  | "retainer";

// ─── Visibility levels ────────────────────────────────────────────────────────

export type DecisionCaseVisibility =
  | "teaser"     // Free public test — shows primary failure point, directive, tension
  | "brief"      // Paid brief — shows full failure map, viable moves, fallback
  | "record"     // Full/Urgent — adds verification token, continuity record
  | "boardroom"; // Executive — adds authority review, risk register, board-ready summary

// ─── Quality flags ────────────────────────────────────────────────────────────

export type ProductQualityFlag =
  | "FOUNDER_REVIEW_REQUIRED"
  | "REGULATED_ADVICE_BOUNDARY_CHECKED"
  | "IMPOSSIBLE_ADVICE_DETECTED"
  | "CONSTRAINED_RESCUE_PATH"
  | "EVIDENCE_GAP_IDENTIFIED"
  | "AUTHORITY_GAP_IDENTIFIED"
  | "VERIFICATION_TOKEN_ISSUED"
  | "CONTINUITY_RECORD_CREATED"
  | "HUMAN_REVIEW_COMPLETED"
  | "DELIVERED";

// ─── Ladder step ──────────────────────────────────────────────────────────────

export type LadderStep =
  | "test_a_decision"
  | "market_signal_check"
  | "release_risk_check"
  | "verify_a_record"
  | "continuity"
  | "decision_failure_brief_basic"
  | "decision_failure_brief_full"
  | "decision_failure_brief_urgent"
  | "executive_decision_review"
  | "retainer_continuity";

// ─── Product catalogue entry ──────────────────────────────────────────────────

export type ProductCatalogueEntry = {
  step: LadderStep;
  name: string;
  publicPromise: string;
  buyer: string;
  price: string;               // "Free", "£49", "£149", "£349", "From £2,500", "Retainer"
  qualificationRule?: string;  // "instant" | "qualified_interest" | "retainer_only"
  sourceEngine: string;        // Which engine powers this surface
  route: string;               // URL path
  fulfilmentPath: string;      // "self_service" | "founder_review" | "qualified_delivery"
  nextAction: string;          // Where the user goes next
  visibility: DecisionCaseVisibility;
  qualityGates: ProductQualityFlag[];
  forbiddenClaims: string[];   // Claims this surface must never make
};

// ─── DecisionCase — the canonical object ──────────────────────────────────────

export type DecisionCase = {
  // Identity
  id: string;
  source: DecisionCaseSource;
  tier: DecisionCaseTier;
  ladderStep: LadderStep;

  // Input (minimised — never raw full text unless consented)
  safeSummary: string;

  // Classification
  decisionType: DecisionDomain;
  primaryFailurePoint: FailurePoint;
  secondaryFailurePoint: FailurePoint | null;
  directive: RiskDirective;

  // Full engine output (populated by composer)
  failureMap: DecisionFailureMapResult | null;
  constraintSignals: ConstraintSignal[];
  pressureTypes: PressureType[];

  // Dimension states
  obligationState: string;
  authorityState: string;
  evidenceState: string;
  consequenceState: string;
  reversibilityState: string;
  dependencyRisks: string[];
  exposureTypes: string[];
  viabilityBlocked: boolean;
  continuityAtRisk: boolean;

  // Output control
  visibility: DecisionCaseVisibility;
  withheldInsights: string[];  // What is deliberately hidden at this tier

  // Actionable output
  situationSummary: string;
  primaryTension: string | null;
  recommendedMove: string;
  fallbackPath: string;
  whatMustNotBeDelayed: string[];
  evidenceNeeded: string[];
  viableMoves: Array<{ label: string; description: string; accessibility: string; requiresFunds: boolean; priority: string }>;

  // Record
  verificationToken?: string;
  continuityRecordId?: string;

  // Quality
  qualityFlags: ProductQualityFlag[];
  founderReviewRequired: boolean;
  confidence: "low" | "medium" | "high";

  // Timestamps
  createdAt: string;
  updatedAt: string;
};

// ─── Adapter output types ─────────────────────────────────────────────────────

export type FreeDecisionOutput = {
  primaryFailurePoint: FailurePoint;
  secondaryFailurePoint: FailurePoint | null;
  directive: RiskDirective;
  decisionType: DecisionDomain;
  situationSummary: string;
  primaryTension: string | null;
  whatMustNotBeDelayed: string[];
  recommendedMove: string;
  evidenceNeeded: string[];
  confidence: "low" | "medium" | "high";
  demoRef: string;
  timestamp: string;
};

export type PaidBriefOutput = {
  reference: string;
  tier: DecisionCaseTier;
  decisionType: DecisionDomain;
  directive: RiskDirective;
  primaryFailurePoint: FailurePoint;
  secondaryFailurePoint: FailurePoint | null;
  situationSummary: string;
  primaryTension: string | null;
  failureRisks: Array<{ point: FailurePoint; severity: string; label: string; description: string }>;
  constraintSignals: ConstraintSignal[];
  exposureTypes: string[];
  whatMustNotBeDelayed: string[];
  recommendedMove: string;
  fallbackPath: string;
  viableMoves: Array<{ label: string; description: string; accessibility: string; requiresFunds: boolean; priority: string }>;
  evidenceNeeded: string[];
  escalationThreshold: string;
  verificationToken?: string;
  confidence: "low" | "medium" | "high";
  requiresHumanReview: boolean;
};

export type ExecutiveReviewInput = {
  name: string;
  email: string;
  organisation: string;
  role: string;
  decisionSummary: string;
  deadline: string;
  stakeholders: string;
  desiredOutcome: string;
  decisionType: DecisionDomain;
  primaryFailurePoint: FailurePoint;
  directive: RiskDirective;
};

export type ContinuityRecord = {
  recordId: string;
  verificationToken: string;
  originalCaseId: string;
  tier: DecisionCaseTier;
  decisionType: DecisionDomain;
  primaryFailurePoint: FailurePoint;
  directive: RiskDirective;
  situationSummary: string;
  recommendedMove: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminQualitySignal = {
  caseId: string;
  tier: DecisionCaseTier;
  source: DecisionCaseSource;
  decisionType: DecisionDomain;
  directive: RiskDirective;
  primaryFailurePoint: FailurePoint;
  qualityFlags: ProductQualityFlag[];
  founderReviewRequired: boolean;
  hasVerificationToken: boolean;
  hasContinuityRecord: boolean;
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
};
