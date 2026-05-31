/**
 * lib/intelligence/living-case-events.ts
 *
 * Append-only event ledger for Living Decision Cases.
 *
 * Rules:
 *   - Events are append-only. No silent overwrite.
 *   - Every amendment is a new event with the previous state preserved.
 *   - Every human review intervention is a HUMAN_REVIEW_AMENDMENT event.
 *   - No untracked founder override.
 *
 * The ledger is the institutional memory.
 */

import type { DecisionClass } from "./decision-class-taxonomy";
import type { DisclosureTier } from "./decision-class-taxonomy";

// ─── Event type enum ──────────────────────────────────────────────────────────

export type LivingCaseEventType =
  | "CASE_CREATED"
  | "TRANSLATION_COMPLETED"
  | "CLARIFICATION_REQUESTED"
  | "CLARIFICATION_RECEIVED"
  | "CASE_CLASSIFIED"
  | "LENS_APPLIED"
  | "SELF_ADVERSARIAL_COMPLETED"
  | "ADVERSARIAL_CHALLENGE_ADDED"
  | "REGULATED_BOUNDARY_HIT"
  | "PROFESSIONAL_BRIEF_GENERATED"
  | "TIER_DISCLOSED"
  | "PAYMENT_RECEIVED"
  | "ENTITLEMENT_GRANTED"
  | "HUMAN_REVIEW_TRIGGERED"
  | "HUMAN_REVIEW_AMENDMENT"
  | "HUMAN_REVIEW_COMPLETED"
  | "QUALITY_STANDARD_FAILED"
  | "QUALITY_STANDARD_PASSED"
  | "DOSSIER_GENERATED"
  | "STRATEGY_ROOM_SESSION_STARTED"
  | "STRATEGY_ROOM_UPDATE"
  | "STRATEGY_ROOM_SESSION_COMPLETED"
  | "VERIFICATION_REFERENCE_ISSUED"
  | "OUTCOME_RECORDED"
  | "DRIFT_DETECTED"
  | "CALIBRATION_UPDATED"
  | "CASE_CLOSED";

// ─── Event payload shapes ─────────────────────────────────────────────────────

export type CaseCreatedPayload = {
  sourceAperture: string;
  rawInputHash: string;   // SHA-256 of raw input — never the input itself
  inputLength: number;
  consentState: ConsentState;
  organisationId?: string;
  actorId?: string;
};

export type TranslationCompletedPayload = {
  vocabularyState: 1 | 2 | 3 | 4 | 5;
  decisionClass: DecisionClass;
  translationConfidence: ConfidenceLevel;
  hiddenStakesDetected: boolean;
  ambiguitiesPreserved: number;
};

export type CaseClassifiedPayload = {
  primaryClass: DecisionClass;
  alternativeClasses: DecisionClass[];
  confidence: ConfidenceLevel;
};

export type LensAppliedPayload = {
  lensId: string;
  lensVersion: string;
  findingCount: number;
  contradictionCount: number;
  confidence: ConfidenceLevel;
};

export type RegulatedBoundaryHitPayload = {
  boundaryType: string;
  triggerText: string;  // The category, not the raw input
  outputSuppressed: string[];
};

export type TierDisclosedPayload = {
  tier: DisclosureTier;
  entitlementId?: string;
};

export type PaymentReceivedPayload = {
  tier: DisclosureTier;
  amount: number;
  currency: string;
  stripePaymentIntentId: string;
};

export type EntitlementGrantedPayload = {
  tier: DisclosureTier;
  grantedAt: string;
  expiresAt?: string;
};

export type HumanReviewTriggeredPayload = {
  trigger: string;
  reviewTier: "STANDARD" | "URGENT" | "EXECUTIVE" | "FOUNDER";
  assignedTo?: string;
};

export type HumanReviewAmendmentPayload = {
  amendmentType: string;
  fieldAmended: string;
  previousValueSummary: string;  // Summary, not raw content
  reviewerId: string;
  rationale: string;
};

export type HumanReviewCompletedPayload = {
  reviewerId: string;
  outcome: "APPROVED" | "AMENDED" | "REJECTED";
  amendmentCount: number;
};

export type QualityStandardPayload = {
  checkId: string;
  checkName: string;
  result: "PASS" | "FAIL";
  detail: string;
};

export type DossierGeneratedPayload = {
  tier: DisclosureTier;
  sectionCount: number;
  wordCount: number;
  selfAdversarialPresent: boolean;
  humanReviewState: string;
};

export type StrategyRoomSessionPayload = {
  sessionId: string;
  openQuestionCount: number;
  updateCount?: number;
};

export type OutcomeRecordedPayload = {
  outcomeType: "RESOLVED" | "PARTIALLY_RESOLVED" | "ESCALATED" | "ABANDONED";
  outcomeNotes: string;
  driftDetected: boolean;
};

export type VerificationReferencePayload = {
  referenceToken: string;  // Public-safe reference, not a signing key
  tier: DisclosureTier;
};

export type DriftDetectedPayload = {
  driftType: "ASSUMPTION_FAILED" | "CONTEXT_CHANGED" | "OUTCOME_DIVERGED";
  originalAssumption: string;
  observedDrift: string;
};

// ─── Shared enums ─────────────────────────────────────────────────────────────

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type ConsentState =
  | "explicit_consent"
  | "implicit_consent_public"
  | "no_consent_recorded";

export type SourceAperture =
  | "public_decision_test"
  | "public_market_signal"
  | "public_release_risk"
  | "public_interest_form"
  | "strategy_room"
  | "admin_intake"
  | "api";

// ─── Event envelope ───────────────────────────────────────────────────────────

export type LivingCaseEvent<T extends LivingCaseEventType = LivingCaseEventType> = {
  id: string;
  caseId: string;
  eventType: T;
  kernelVersion: string;
  createdAt: string;   // ISO 8601
  actorId?: string;    // Human actor if triggered by a person
  payload: LivingCaseEventPayloadMap[T];
};

export type LivingCaseEventPayloadMap = {
  CASE_CREATED:                  CaseCreatedPayload;
  TRANSLATION_COMPLETED:         TranslationCompletedPayload;
  CLARIFICATION_REQUESTED:       { questions: string[]; fieldsNeeded: string[] };
  CLARIFICATION_RECEIVED:        { answered: number; remaining: number };
  CASE_CLASSIFIED:               CaseClassifiedPayload;
  LENS_APPLIED:                  LensAppliedPayload;
  SELF_ADVERSARIAL_COMPLETED:    { assumptionCount: number; gapCount: number };
  ADVERSARIAL_CHALLENGE_ADDED:   { challengeCount: number; severity: string };
  REGULATED_BOUNDARY_HIT:        RegulatedBoundaryHitPayload;
  PROFESSIONAL_BRIEF_GENERATED:  { briefType: string; sectionCount: number };
  TIER_DISCLOSED:                TierDisclosedPayload;
  PAYMENT_RECEIVED:              PaymentReceivedPayload;
  ENTITLEMENT_GRANTED:           EntitlementGrantedPayload;
  HUMAN_REVIEW_TRIGGERED:        HumanReviewTriggeredPayload;
  HUMAN_REVIEW_AMENDMENT:        HumanReviewAmendmentPayload;
  HUMAN_REVIEW_COMPLETED:        HumanReviewCompletedPayload;
  QUALITY_STANDARD_FAILED:       QualityStandardPayload;
  QUALITY_STANDARD_PASSED:       QualityStandardPayload;
  DOSSIER_GENERATED:             DossierGeneratedPayload;
  STRATEGY_ROOM_SESSION_STARTED: StrategyRoomSessionPayload;
  STRATEGY_ROOM_UPDATE:          StrategyRoomSessionPayload;
  STRATEGY_ROOM_SESSION_COMPLETED: StrategyRoomSessionPayload;
  VERIFICATION_REFERENCE_ISSUED: VerificationReferencePayload;
  OUTCOME_RECORDED:              OutcomeRecordedPayload;
  DRIFT_DETECTED:                DriftDetectedPayload;
  CALIBRATION_UPDATED:           { version: string; changeCount: number };
  CASE_CLOSED:                   { reason: string; outcomeState: string };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isHumanTriggeredEvent(eventType: LivingCaseEventType): boolean {
  return [
    "CLARIFICATION_RECEIVED",
    "HUMAN_REVIEW_AMENDMENT",
    "HUMAN_REVIEW_COMPLETED",
    "STRATEGY_ROOM_UPDATE",
    "STRATEGY_ROOM_SESSION_COMPLETED",
    "OUTCOME_RECORDED",
  ].includes(eventType);
}

export function isPaymentEvent(eventType: LivingCaseEventType): boolean {
  return eventType === "PAYMENT_RECEIVED" || eventType === "ENTITLEMENT_GRANTED";
}

export function requiresAdminAuth(eventType: LivingCaseEventType): boolean {
  return [
    "HUMAN_REVIEW_AMENDMENT",
    "HUMAN_REVIEW_COMPLETED",
    "QUALITY_STANDARD_FAILED",
    "QUALITY_STANDARD_PASSED",
    "CALIBRATION_UPDATED",
  ].includes(eventType);
}
