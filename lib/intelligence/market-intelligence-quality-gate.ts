export type QualityDimension =
  | "LIFECYCLE_CORRECTNESS"
  | "SOURCE_TRACEABILITY"
  | "DECISION_USEFULNESS"
  | "SCENARIO_DISCIPLINE"
  | "PAID_PUBLIC_SEPARATION"
  | "COMPLIANCE_BOUNDARY"
  | "BOARD_USABILITY"
  | "COMMERCIAL_READINESS"
  | "FRESHNESS_METADATA"
  | "DELIVERY_READINESS";

export type CriticalFailureCode =
  | "PURCHASABLE_DRAFT"
  | "ACTIVE_ARCHIVED_BY_COPY"
  | "HARD_NUMBERS_NO_SOURCE"
  | "INVESTMENT_ADVICE_LANGUAGE"
  | "PAID_SAME_AS_PUBLIC"
  | "MISSING_LIFECYCLE_METADATA"
  | "MISSING_SUPERSESSION_PLAN"
  | "PRIOR_QUARTER_CALLS_UNREVIEWED"
  | "UNCLASSIFIED_MAJOR_CLAIM"
  | "HARD_CLAIM_WITHOUT_SOURCE_ROW"
  | "SOURCE_PENDING_IN_ACTIVE_RELEASE"
  | "SOURCE_BLOCKER_ROWS_PENDING_IN_ACTIVE_RELEASE"
  | "SOURCE_COVERAGE_BELOW_RELEASE_THRESHOLD"
  | "CONFIDENCE_POSTURE_MISSING_FOR_PAID_EDITION"
  | "BOARD_SUMMARY_MISSING_FOR_PAID_EDITION"
  | "INTERNAL_WORKFLOW_VOCABULARY_EXPOSED";

export type QualityDimensionScore = {
  dimension: QualityDimension;
  score: number;
  notes: string[];
};

export type QualityGateResult = {
  scores: QualityDimensionScore[];
  overallScore: number;
  releaseReady: boolean;
  criticalFailures: CriticalFailureCode[];
  blockers: string[];
};

export type MarketReportQualityInput = {
  lifecycleState:
    | "DRAFT"
    | "SCHEDULED"
    | "ACTIVE"
    | "ACTIVE_UNTIL_SUPERSEDED"
    | "SUPERSEDED"
    | "ARCHIVED"
    | "RETIRED";
  purchasable: boolean;
  copyDescribesAsArchived: boolean;
  hasMetadata: boolean;
  hasSupersessionPlan: boolean;
  hasSourceAppendix: boolean;
  hasHardNumbersWithoutSource: boolean;
  hasUnclassifiedMajorClaims: boolean;
  hasSourceRowsForHardClaims: boolean;
  hasSourcePendingRows: boolean;
  hasSourceBlockerRowsPending: boolean;
  sourceCoverageScore: number;
  hasDecisionImplications: boolean;
  hasBoardSummary: boolean;
  hasScenarioFramework: boolean;
  hasConfidencePosture: boolean;
  paidEditionDifferentFromPublic: boolean;
  hasComplianceDisclaimer: boolean;
  hasInvestmentAdviceLanguage: boolean;
  hasInternalWorkflowVocabulary: boolean;
  deliveryRouteVerified: boolean;
  freshnessMetadataComplete: boolean;
  hasPriorQuarterCalls: boolean;
  priorQuarterCallsReviewed: boolean;
};

const DIMENSION_LABELS: Record<QualityDimension, string> = {
  LIFECYCLE_CORRECTNESS:  "Lifecycle Correctness",
  SOURCE_TRACEABILITY:    "Source Traceability",
  DECISION_USEFULNESS:    "Decision Usefulness",
  SCENARIO_DISCIPLINE:    "Scenario Discipline",
  PAID_PUBLIC_SEPARATION: "Paid/Public Separation",
  COMPLIANCE_BOUNDARY:    "Compliance Boundary",
  BOARD_USABILITY:        "Board Usability",
  COMMERCIAL_READINESS:   "Commercial Readiness",
  FRESHNESS_METADATA:     "Freshness Metadata",
  DELIVERY_READINESS:     "Delivery Readiness",
};

export function getDimensionLabel(dimension: QualityDimension): string {
  return DIMENSION_LABELS[dimension];
}

function isActiveState(
  state: MarketReportQualityInput["lifecycleState"],
): boolean {
  return state === "ACTIVE" || state === "ACTIVE_UNTIL_SUPERSEDED";
}

function dim(
  dimension: QualityDimension,
  score: number,
  notes: string[],
): QualityDimensionScore {
  return { dimension, score, notes };
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual dimension scorers
// ─────────────────────────────────────────────────────────────────────────────

function scoreLifecycleCorrectness(
  input: MarketReportQualityInput,
): QualityDimensionScore {
  if (input.lifecycleState === "DRAFT" && input.purchasable)
    return dim("LIFECYCLE_CORRECTNESS", 0, ["Draft report must not be purchasable."]);

  if (isActiveState(input.lifecycleState) && !input.purchasable)
    return dim("LIFECYCLE_CORRECTNESS", 0, ["Active report must be purchasable."]);

  if (isActiveState(input.lifecycleState) && input.copyDescribesAsArchived)
    return dim("LIFECYCLE_CORRECTNESS", 0, [
      "Page copy describes this active report as archived, superseded, or unavailable.",
    ]);

  if (!input.hasMetadata)
    return dim("LIFECYCLE_CORRECTNESS", 5, [
      "Lifecycle metadata (coverage period, decision window, version) is incomplete.",
    ]);

  if (!input.hasSupersessionPlan)
    return dim("LIFECYCLE_CORRECTNESS", 8, [
      "No supersession plan documented. Q-next record should be registered.",
    ]);

  if (input.hasPriorQuarterCalls && !input.priorQuarterCallsReviewed)
    return dim("LIFECYCLE_CORRECTNESS", 8, [
      "Prior quarter material calls have not been reviewed and scored before this report's release.",
    ]);

  return dim("LIFECYCLE_CORRECTNESS", 10, []);
}

function scoreSourceTraceability(
  input: MarketReportQualityInput,
): QualityDimensionScore {
  if (input.hasHardNumbersWithoutSource)
    return dim("SOURCE_TRACEABILITY", 0, [
      "Hard numbers present without source reference or method label.",
    ]);

  if (!input.hasSourceRowsForHardClaims)
    return dim("SOURCE_TRACEABILITY", 0, [
      "Hard quantitative or market-condition claims do not have source appendix rows.",
    ]);

  if (isActiveState(input.lifecycleState) && input.hasSourcePendingRows)
    return dim("SOURCE_TRACEABILITY", 0, [
      "Active paid release still contains source-pending rows.",
    ]);

  if (isActiveState(input.lifecycleState) && input.hasSourceBlockerRowsPending)
    return dim("SOURCE_TRACEABILITY", 0, [
      "Active paid release still has pending source appendix blocker rows.",
    ]);

  if (isActiveState(input.lifecycleState) && input.sourceCoverageScore < 80)
    return dim("SOURCE_TRACEABILITY", 0, [
      "Source coverage score is below the 80 release threshold.",
    ]);

  if (!input.hasSourceAppendix)
    return dim("SOURCE_TRACEABILITY", 7, [
      "No source and confidence appendix. All evidence classes must be disclosed.",
    ]);

  return dim("SOURCE_TRACEABILITY", 10, []);
}

function scoreDecisionUsefulness(
  input: MarketReportQualityInput,
): QualityDimensionScore {
  if (!input.hasDecisionImplications)
    return dim("DECISION_USEFULNESS", 6, [
      "No decision implications section. Report must specify immediate operating choices.",
    ]);

  if (!input.hasBoardSummary)
    return dim("DECISION_USEFULNESS", 8, [
      "No board summary. Report must include non-optional operating decisions.",
    ]);

  return dim("DECISION_USEFULNESS", 10, []);
}

function scoreScenarioDiscipline(
  input: MarketReportQualityInput,
): QualityDimensionScore {
  if (!input.hasScenarioFramework)
    return dim("SCENARIO_DISCIPLINE", 5, [
      "No scenario framework. All forward-looking analysis must use the scenario model.",
    ]);

  if (!input.hasConfidencePosture)
    return dim("SCENARIO_DISCIPLINE", isActiveState(input.lifecycleState) ? 0 : 8, [
      "No confidence posture. Evidence classes must be assigned HIGH/MEDIUM/LOW/MONITORING.",
    ]);

  if (input.hasUnclassifiedMajorClaims)
    return dim("SCENARIO_DISCIPLINE", 0, [
      "A major macro, regional, FX, credit, growth, or scenario claim lacks evidence posture classification.",
    ]);

  return dim("SCENARIO_DISCIPLINE", 10, []);
}

function scorePaidPublicSeparation(
  input: MarketReportQualityInput,
): QualityDimensionScore {
  if (!input.paidEditionDifferentFromPublic)
    return dim("PAID_PUBLIC_SEPARATION", 0, [
      "Paid edition must differ materially from public edition.",
    ]);

  return dim("PAID_PUBLIC_SEPARATION", 10, []);
}

function scoreComplianceBoundary(
  input: MarketReportQualityInput,
): QualityDimensionScore {
  if (input.hasInvestmentAdviceLanguage)
    return dim("COMPLIANCE_BOUNDARY", 0, [
      "Report contains language that implies regulated investment advice.",
    ]);

  if (!input.hasComplianceDisclaimer)
    return dim("COMPLIANCE_BOUNDARY", 7, [
      "No compliance disclaimer. 'Not investment advice' boundary must be visible.",
    ]);

  if (isActiveState(input.lifecycleState) && input.hasInternalWorkflowVocabulary)
    return dim("COMPLIANCE_BOUNDARY", 0, [
      "External-facing paid report contains internal workflow vocabulary.",
    ]);

  return dim("COMPLIANCE_BOUNDARY", 10, []);
}

function scoreBoardUsability(
  input: MarketReportQualityInput,
): QualityDimensionScore {
  if (!input.hasBoardSummary)
    return dim("BOARD_USABILITY", isActiveState(input.lifecycleState) ? 0 : 4, [
      "No board summary. Paid report must include 5 operating decisions, 3 risks, 3 watch signals.",
    ]);

  return dim("BOARD_USABILITY", 10, []);
}

function scoreCommercialReadiness(
  input: MarketReportQualityInput,
): QualityDimensionScore {
  if (isActiveState(input.lifecycleState) && !input.purchasable)
    return dim("COMMERCIAL_READINESS", 0, [
      "Active report must be purchasable. Check catalog active flag and entitlement route.",
    ]);

  if (!input.deliveryRouteVerified)
    return dim("COMMERCIAL_READINESS", 6, [
      "Delivery route not verified. Entitlement slug, catalog price code, and download route must resolve.",
    ]);

  return dim("COMMERCIAL_READINESS", 10, []);
}

function scoreFreshnessMetadata(
  input: MarketReportQualityInput,
): QualityDimensionScore {
  if (!input.freshnessMetadataComplete)
    return dim("FRESHNESS_METADATA", 4, [
      "Freshness metadata incomplete. Coverage period, decision window, updated date, and version required.",
    ]);

  return dim("FRESHNESS_METADATA", 10, []);
}

function scoreDeliveryReadiness(
  input: MarketReportQualityInput,
): QualityDimensionScore {
  if (input.lifecycleState === "DRAFT" && input.purchasable)
    return dim("DELIVERY_READINESS", 0, [
      "Draft must not be purchasable or deliverable.",
    ]);

  if (!input.deliveryRouteVerified)
    return dim("DELIVERY_READINESS", 6, [
      "Download route not verified. No direct PDF links permitted.",
    ]);

  if (!input.hasMetadata)
    return dim("DELIVERY_READINESS", 7, [
      "Missing lifecycle metadata blocks delivery classification.",
    ]);

  return dim("DELIVERY_READINESS", 10, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Critical failure detection
// ─────────────────────────────────────────────────────────────────────────────

function detectCriticalFailures(
  input: MarketReportQualityInput,
): CriticalFailureCode[] {
  const failures: CriticalFailureCode[] = [];

  if (input.lifecycleState === "DRAFT" && input.purchasable)
    failures.push("PURCHASABLE_DRAFT");

  if (isActiveState(input.lifecycleState) && input.copyDescribesAsArchived)
    failures.push("ACTIVE_ARCHIVED_BY_COPY");

  if (input.hasHardNumbersWithoutSource)
    failures.push("HARD_NUMBERS_NO_SOURCE");

  if (input.hasInvestmentAdviceLanguage)
    failures.push("INVESTMENT_ADVICE_LANGUAGE");

  if (!input.paidEditionDifferentFromPublic)
    failures.push("PAID_SAME_AS_PUBLIC");

  if (!input.hasMetadata)
    failures.push("MISSING_LIFECYCLE_METADATA");

  if (!input.hasSupersessionPlan)
    failures.push("MISSING_SUPERSESSION_PLAN");

  if (input.hasPriorQuarterCalls && !input.priorQuarterCallsReviewed)
    failures.push("PRIOR_QUARTER_CALLS_UNREVIEWED");

  if (input.hasUnclassifiedMajorClaims)
    failures.push("UNCLASSIFIED_MAJOR_CLAIM");

  if (!input.hasSourceRowsForHardClaims)
    failures.push("HARD_CLAIM_WITHOUT_SOURCE_ROW");

  if (isActiveState(input.lifecycleState) && input.hasSourcePendingRows)
    failures.push("SOURCE_PENDING_IN_ACTIVE_RELEASE");

  if (isActiveState(input.lifecycleState) && input.hasSourceBlockerRowsPending)
    failures.push("SOURCE_BLOCKER_ROWS_PENDING_IN_ACTIVE_RELEASE");

  if (isActiveState(input.lifecycleState) && input.sourceCoverageScore < 80)
    failures.push("SOURCE_COVERAGE_BELOW_RELEASE_THRESHOLD");

  if (isActiveState(input.lifecycleState) && !input.hasConfidencePosture)
    failures.push("CONFIDENCE_POSTURE_MISSING_FOR_PAID_EDITION");

  if (isActiveState(input.lifecycleState) && !input.hasBoardSummary)
    failures.push("BOARD_SUMMARY_MISSING_FOR_PAID_EDITION");

  if (isActiveState(input.lifecycleState) && input.hasInternalWorkflowVocabulary)
    failures.push("INTERNAL_WORKFLOW_VOCABULARY_EXPOSED");

  return failures;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gate
// ─────────────────────────────────────────────────────────────────────────────

export function scoreReport(input: MarketReportQualityInput): QualityGateResult {
  const scores = [
    scoreLifecycleCorrectness(input),
    scoreSourceTraceability(input),
    scoreDecisionUsefulness(input),
    scoreScenarioDiscipline(input),
    scorePaidPublicSeparation(input),
    scoreComplianceBoundary(input),
    scoreBoardUsability(input),
    scoreCommercialReadiness(input),
    scoreFreshnessMetadata(input),
    scoreDeliveryReadiness(input),
  ];

  const total = scores.reduce((sum, s) => sum + s.score, 0);
  const overallScore = Math.round((total / scores.length) * 10) / 10;
  const minScore = Math.min(...scores.map((s) => s.score));
  const criticalFailures = detectCriticalFailures(input);

  const releaseReady =
    overallScore >= 9.0 &&
    minScore >= 8.0 &&
    criticalFailures.length === 0;

  const blockers = [
    ...criticalFailures.map((code) => `Critical failure: ${code}`),
    ...scores
      .filter((s) => s.score < 8.0)
      .map((s) => `Dimension ${s.dimension} scored ${s.score}/10 (minimum 8.0 required)`),
    ...(overallScore < 9.0
      ? [`Overall score ${overallScore}/10 (minimum 9.0 required)`]
      : []),
  ];

  return { scores, overallScore, releaseReady, criticalFailures, blockers };
}
