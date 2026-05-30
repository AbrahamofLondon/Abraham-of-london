/**
 * lib/product/output-adapters.ts
 *
 * Output adapters — transform a canonical DecisionCase into
 * tier-appropriate output for each product surface.
 *
 * Each adapter deliberately limits output according to ladder tier.
 * The same intelligence produces different views depending on who is looking.
 */

import type {
  DecisionCase,
  FreeDecisionOutput,
  PaidBriefOutput,
  ExecutiveReviewInput,
  ContinuityRecord,
  AdminQualitySignal,
} from "./decision-case-contract";

// ─── Demo ref generator ───────────────────────────────────────────────────────

function generateDemoRef(): string {
  return Date.now().toString(36).slice(-6).toUpperCase();
}

function formatTimestamp(): string {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Free Decision Output (teaser) ────────────────────────────────────────────
// Shows: primary failure point, directive, tension, limited recommended move
// Hides: full failure risk list, fallback path, escalation threshold, verification

export function toFreeDecisionOutput(caseData: DecisionCase): FreeDecisionOutput {
  return {
    primaryFailurePoint: caseData.primaryFailurePoint,
    secondaryFailurePoint: caseData.secondaryFailurePoint,
    directive: caseData.directive,
    decisionType: caseData.decisionType,
    situationSummary: caseData.situationSummary,
    primaryTension: caseData.primaryTension,
    whatMustNotBeDelayed: caseData.whatMustNotBeDelayed.slice(0, 2), // Limit to 2 items
    recommendedMove: caseData.recommendedMove,
    evidenceNeeded: caseData.evidenceNeeded.slice(0, 3), // Limit to 3 items
    confidence: caseData.confidence,
    demoRef: generateDemoRef(),
    timestamp: formatTimestamp(),
  };
}

// ─── Paid Brief Output ────────────────────────────────────────────────────────
// Shows: full failure map, viable moves, fallback, escalation threshold
// Hides: raw internal analysis, board-ready summary

export function toPaidBriefOutput(caseData: DecisionCase): PaidBriefOutput {
  return {
    reference: caseData.id,
    tier: caseData.tier,
    decisionType: caseData.decisionType,
    directive: caseData.directive,
    primaryFailurePoint: caseData.primaryFailurePoint,
    secondaryFailurePoint: caseData.secondaryFailurePoint,
    situationSummary: caseData.situationSummary,
    primaryTension: caseData.primaryTension,
    failureRisks: (caseData.failureMap?.failureRisks ?? []).map(r => ({
      point: r.point,
      severity: r.severity,
      label: r.label,
      description: r.description,
    })),
    constraintSignals: caseData.constraintSignals,
    exposureTypes: caseData.exposureTypes,
    whatMustNotBeDelayed: caseData.whatMustNotBeDelayed,
    recommendedMove: caseData.recommendedMove,
    fallbackPath: caseData.fallbackPath,
    viableMoves: caseData.viableMoves,
    evidenceNeeded: caseData.evidenceNeeded,
    escalationThreshold: caseData.failureMap?.escalationThreshold ?? "Standard review threshold applies.",
    verificationToken: caseData.verificationToken,
    confidence: caseData.confidence,
    requiresHumanReview: caseData.founderReviewRequired,
  };
}

// ─── Executive Review Input ───────────────────────────────────────────────────
// Transforms a DecisionCase into the data needed for an Executive Review qualification

export function toExecutiveReviewInput(
  caseData: DecisionCase,
  extra: {
    name: string;
    email: string;
    organisation: string;
    role: string;
    deadline: string;
    stakeholders: string;
    desiredOutcome: string;
  },
): ExecutiveReviewInput {
  return {
    name: extra.name,
    email: extra.email,
    organisation: extra.organisation,
    role: extra.role,
    decisionSummary: caseData.safeSummary,
    deadline: extra.deadline,
    stakeholders: extra.stakeholders,
    desiredOutcome: extra.desiredOutcome,
    decisionType: caseData.decisionType,
    primaryFailurePoint: caseData.primaryFailurePoint,
    directive: caseData.directive,
  };
}

// ─── Continuity Record ────────────────────────────────────────────────────────
// Creates a continuity record from a paid DecisionCase

export function toContinuityRecord(caseData: DecisionCase): ContinuityRecord {
  return {
    recordId: `REC-${caseData.id}`,
    verificationToken: caseData.verificationToken ?? `FDY-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    originalCaseId: caseData.id,
    tier: caseData.tier,
    decisionType: caseData.decisionType,
    primaryFailurePoint: caseData.primaryFailurePoint,
    directive: caseData.directive,
    situationSummary: caseData.situationSummary,
    recommendedMove: caseData.recommendedMove,
    createdAt: caseData.createdAt,
    updatedAt: caseData.updatedAt,
  };
}

// ─── Admin Quality Signal ─────────────────────────────────────────────────────
// Summarises a DecisionCase for the admin quality dashboard

export function toAdminQualitySignal(caseData: DecisionCase): AdminQualitySignal {
  return {
    caseId: caseData.id,
    tier: caseData.tier,
    source: caseData.source,
    decisionType: caseData.decisionType,
    directive: caseData.directive,
    primaryFailurePoint: caseData.primaryFailurePoint,
    qualityFlags: caseData.qualityFlags,
    founderReviewRequired: caseData.founderReviewRequired,
    hasVerificationToken: !!caseData.verificationToken,
    hasContinuityRecord: !!caseData.continuityRecordId,
    createdAt: caseData.createdAt,
    paidAt: null,
    deliveredAt: null,
  };
}
