/**
 * lib/product/decision-case-composer.ts
 *
 * DecisionCase composer — accepts input from any product surface and
 * produces a canonical DecisionCase object.
 *
 * Every surface must use this composer, not build its own analysis model.
 *
 * The composer:
 *   1. Calls the Decision Failure Map for full analysis
 *   2. Sets visibility level based on source and tier
 *   3. Determines withheld insights (what is hidden at free tier)
 *   4. Sets quality flags
 *   5. Returns the canonical DecisionCase
 */

import { analyzeDecisionFailureMap } from "@/lib/decision/decision-failure-map";
import type {
  DecisionCase,
  DecisionCaseSource,
  DecisionCaseTier,
  DecisionCaseVisibility,
  ProductQualityFlag,
  LadderStep,
} from "./decision-case-contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `CASE-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function sourceToLadderStep(source: DecisionCaseSource): LadderStep {
  switch (source) {
    case "decision_test": return "test_a_decision";
    case "market_signal": return "market_signal_check";
    case "release_risk": return "release_risk_check";
    case "brief_order": return "decision_failure_brief_basic";
    case "executive_review": return "executive_decision_review";
    case "interest_form": return "decision_failure_brief_basic";
    case "fast_diagnostic": return "test_a_decision";
    case "manual": return "test_a_decision";
  }
}

function sourceToVisibility(source: DecisionCaseSource, tier: DecisionCaseTier): DecisionCaseVisibility {
  if (tier === "executive" || tier === "retainer") return "boardroom";
  if (tier === "full" || tier === "urgent") return "record";
  if (tier === "basic") return "brief";
  if (source === "decision_test" || source === "market_signal" || source === "release_risk") return "teaser";
  return "brief";
}

function determineWithheldInsights(visibility: DecisionCaseVisibility): string[] {
  switch (visibility) {
    case "teaser":
      return [
        "Full failure risk list (only primary shown)",
        "Complete viable move set (only first shown)",
        "Fallback path",
        "Escalation threshold detail",
        "Verification token",
      ];
    case "brief":
      return [
        "Verification token (Full/Urgent only)",
        "Continuity record reference",
        "Board-ready summary",
      ];
    case "record":
      return [
        "Board-ready summary (Executive only)",
        "Raw internal analysis data",
      ];
    case "boardroom":
      return [];
  }
}

function determineQualityFlags(
  source: DecisionCaseSource,
  tier: DecisionCaseTier,
  analysis: ReturnType<typeof analyzeDecisionFailureMap>,
): ProductQualityFlag[] {
  const flags: ProductQualityFlag[] = [];

  if (analysis.impossibleAdvice.length > 0) flags.push("IMPOSSIBLE_ADVICE_DETECTED");
  if (analysis.directive === "CONSTRAINED_RESCUE") flags.push("CONSTRAINED_RESCUE_PATH");
  if (analysis.evidenceState === "absent" || analysis.evidenceState === "assumed") flags.push("EVIDENCE_GAP_IDENTIFIED");
  if (analysis.authorityState === "absent" || analysis.authorityState === "unclear") flags.push("AUTHORITY_GAP_IDENTIFIED");

  if (tier === "basic" || tier === "full" || tier === "urgent") flags.push("FOUNDER_REVIEW_REQUIRED");
  if (tier === "full" || tier === "urgent" || tier === "executive") flags.push("REGULATED_ADVICE_BOUNDARY_CHECKED");
  if (tier === "full" || tier === "urgent") flags.push("VERIFICATION_TOKEN_ISSUED");

  return flags;
}

// ─── Main composer ────────────────────────────────────────────────────────────

export type ComposeInput = {
  source: DecisionCaseSource;
  tier: DecisionCaseTier;
  rawInput?: string;
  safeSummary: string;
  userEmail?: string;
  userName?: string;
  orderId?: string;
};

export function composeDecisionCase(input: ComposeInput): DecisionCase {
  const analysis = analyzeDecisionFailureMap(input.rawInput || input.safeSummary);
  const visibility = sourceToVisibility(input.source, input.tier);
  const ladderStep = sourceToLadderStep(input.source);

  const now = new Date().toISOString();

  const decisionCase: DecisionCase = {
    id: input.orderId || generateId(),
    source: input.source,
    tier: input.tier,
    ladderStep,

    safeSummary: input.safeSummary,

    decisionType: analysis.decisionType,
    primaryFailurePoint: analysis.primaryFailurePoint,
    secondaryFailurePoint: analysis.secondaryFailurePoint,
    directive: analysis.directive,

    failureMap: analysis,
    constraintSignals: analysis.constraintSignals,
    pressureTypes: analysis.pressureTypes,

    obligationState: analysis.obligations,
    authorityState: analysis.authorityState,
    evidenceState: analysis.evidenceState,
    consequenceState: analysis.consequenceSeverity,
    reversibilityState: analysis.reversibility,
    dependencyRisks: analysis.dependencyRisks,
    exposureTypes: analysis.exposureTypes,
    viabilityBlocked: analysis.viabilityBlocked,
    continuityAtRisk: analysis.continuityAtRisk,

    visibility,
    withheldInsights: determineWithheldInsights(visibility),

    situationSummary: analysis.situationSummary,
    primaryTension: analysis.primaryTension,
    recommendedMove: analysis.minimumViableNextMove,
    fallbackPath: analysis.fallbackPath,
    whatMustNotBeDelayed: analysis.whatMustNotBeDelayed,
    evidenceNeeded: analysis.evidenceNeeded,
    viableMoves: analysis.viableMoves,

    qualityFlags: determineQualityFlags(input.source, input.tier, analysis),
    founderReviewRequired: input.tier !== "free",
    confidence: analysis.confidence,

    createdAt: now,
    updatedAt: now,
  };

  return decisionCase;
}
