import type { MarketCallRecord } from "./market-intelligence-call-ledger";

export const GMI_DII_V1_VERSION = "DII-1.0" as const;

export type GmiDiiDimensionKey =
  | "evidence_integrity"
  | "falsifiability_trigger_precision"
  | "calibration_accountability_discipline"
  | "decision_actionability"
  | "revision_uncertainty_discipline";

export type GmiDiiDimension = {
  key: GmiDiiDimensionKey;
  label: string;
  weight: 20;
  requiredFunction: string;
};

export type GmiDiiComponentScore = {
  key: GmiDiiDimensionKey;
  score: number;
  evidenceBasis: string;
  weaknessOrDeduction: string;
  methodologyVersion: typeof GMI_DII_V1_VERSION;
};

export type GmiDiiScorecard = {
  methodologyVersion: typeof GMI_DII_V1_VERSION;
  headlineScore: number;
  band: string;
  components: readonly GmiDiiComponentScore[];
  reconciles: boolean;
};

export const GMI_DII_V1_DIMENSIONS: readonly GmiDiiDimension[] = [
  {
    key: "evidence_integrity",
    label: "Evidence integrity",
    weight: 20,
    requiredFunction: "Evidence integrity",
  },
  {
    key: "falsifiability_trigger_precision",
    label: "Falsifiability and trigger precision",
    weight: 20,
    requiredFunction: "Falsifiability and trigger precision",
  },
  {
    key: "calibration_accountability_discipline",
    label: "Calibration and accountability discipline",
    weight: 20,
    requiredFunction: "Calibration and accountability discipline",
  },
  {
    key: "decision_actionability",
    label: "Decision actionability",
    weight: 20,
    requiredFunction: "Decision actionability",
  },
  {
    key: "revision_uncertainty_discipline",
    label: "Revision and uncertainty discipline",
    weight: 20,
    requiredFunction: "Revision and uncertainty discipline",
  },
] as const;

export function getGmiDiiBand(score: number): string {
  if (score >= 85) return "Strong decision integrity";
  if (score >= 70) return "Sound, with material uncertainties";
  if (score >= 55) return "Conditional; elevated integrity risk";
  return "Not publication-grade";
}

export const GMI_Q2_2026_DII_SCORECARD: GmiDiiScorecard = {
  methodologyVersion: GMI_DII_V1_VERSION,
  headlineScore: 74,
  band: getGmiDiiBand(74),
  components: [
    {
      key: "evidence_integrity",
      score: 15,
      evidenceBasis: "Source appendix covers the material claims and separates observed data from scenario assumptions.",
      weaknessOrDeduction: "Final post-8-July data lock remains open for IMF, IIF, India, and licensed market-data rechecks.",
      methodologyVersion: GMI_DII_V1_VERSION,
    },
    {
      key: "falsifiability_trigger_precision",
      score: 15,
      evidenceBasis: "Core regime thesis, watch signals, and downside scenario carry observable trigger language.",
      weaknessOrDeduction: "Some qualitative triggers still require adjudication rules rather than durable thresholds.",
      methodologyVersion: GMI_DII_V1_VERSION,
    },
    {
      key: "calibration_accountability_discipline",
      score: 15,
      evidenceBasis: "Q1 material calls are scored, include misses/too-early calls, and maintain review continuity.",
      weaknessOrDeduction: "Runtime persisted ledger must be checked against report wording at final data lock.",
      methodologyVersion: GMI_DII_V1_VERSION,
    },
    {
      key: "decision_actionability",
      score: 15,
      evidenceBasis: "Executive dashboard includes owners, deadlines, success metrics, and top decision actions.",
      weaknessOrDeduction: "Activation triggers are present in the action/exposure tables; next improvement is fuller review-date normalization across all board actions.",
      methodologyVersion: GMI_DII_V1_VERSION,
    },
    {
      key: "revision_uncertainty_discipline",
      score: 14,
      evidenceBasis: "The report states confidence classes, carried-forward calls, and source confidence posture.",
      weaknessOrDeduction: "Amendment log and cumulative track-record surface are prepared but not yet multi-edition live.",
      methodologyVersion: GMI_DII_V1_VERSION,
    },
  ],
  reconciles: true,
};

export function reconcileGmiDiiScorecard(scorecard: GmiDiiScorecard): boolean {
  const total = scorecard.components.reduce((sum, component) => sum + component.score, 0);
  const allDimensionsPresent = GMI_DII_V1_DIMENSIONS.every((dimension) =>
    scorecard.components.some((component) => component.key === dimension.key),
  );
  const allVersioned = scorecard.components.every(
    (component) => component.methodologyVersion === scorecard.methodologyVersion,
  );
  return allDimensionsPresent && allVersioned && total === scorecard.headlineScore;
}

export type GmiCumulativeTrackRecord = {
  editionCount: number;
  totalMaterialCallsIssued: number;
  resolvedCallCount: number;
  unresolvedCallCount: number;
  carriedForwardCount: number;
  confirmedStronglyCount: number;
  directionallyConfirmedCount: number;
  partiallyConfirmedCount: number;
  weaklySupportedCount: number;
  disconfirmedCount: number;
  withdrawnCount: number;
  supersededCount: number;
  meanResolvedCallScore: number | null;
  scoringMethodologyVersion: string;
  asOfDate: string;
};

export function buildGmiCumulativeTrackRecord(
  calls: readonly MarketCallRecord[],
  asOfDate = "2026-07-06",
): GmiCumulativeTrackRecord {
  const resolved = calls.filter((call) =>
    call.score !== null &&
    call.score !== undefined &&
    call.score !== 2 &&
    call.outcomeStatus !== "PENDING_REVIEW" &&
    call.outcomeStatus !== "TOO_EARLY_TO_ASSESS",
  );
  const carriedForward = calls.filter((call) =>
    call.outcomeStatus === "TOO_EARLY_TO_ASSESS" || call.score === 2,
  );
  const unresolved = calls.filter((call) =>
    call.score === null ||
    call.score === undefined ||
    call.outcomeStatus === "PENDING_REVIEW" ||
    call.outcomeStatus === "TOO_EARLY_TO_ASSESS",
  );
  const scoreSum = resolved.reduce((sum, call) => sum + (call.score ?? 0), 0);

  return {
    editionCount: new Set(calls.map((call) => call.reportId)).size,
    totalMaterialCallsIssued: calls.length,
    resolvedCallCount: resolved.length,
    unresolvedCallCount: unresolved.length,
    carriedForwardCount: carriedForward.length,
    confirmedStronglyCount: calls.filter((call) => call.outcomeStatus === "CONFIRMED_STRONGLY").length,
    directionallyConfirmedCount: calls.filter((call) => call.outcomeStatus === "DIRECTIONALLY_CONFIRMED").length,
    partiallyConfirmedCount: calls.filter((call) => call.outcomeStatus === "PARTIALLY_CONFIRMED").length,
    weaklySupportedCount: calls.filter((call) => call.outcomeStatus === "WEAKLY_SUPPORTED" || call.score === 1).length,
    disconfirmedCount: calls.filter((call) => call.outcomeStatus === "DISCONFIRMED" || call.score === 0).length,
    withdrawnCount: 0,
    supersededCount: 0,
    meanResolvedCallScore: resolved.length ? Math.round((scoreSum / resolved.length) * 10) / 10 : null,
    scoringMethodologyVersion: "GMI-RUBRIC-1.0.0",
    asOfDate,
  };
}

export function validateNoDisappearingCalls(
  previousCalls: readonly MarketCallRecord[],
  reviewedCalls: readonly MarketCallRecord[],
): string[] {
  const reviewedIds = new Set(reviewedCalls.map((call) => call.id));
  return previousCalls
    .filter((call) => !reviewedIds.has(call.id))
    .map((call) => call.id);
}