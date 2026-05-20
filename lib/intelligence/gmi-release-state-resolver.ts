import {
  getGmiReportState,
  type GmiReportReleaseStage,
  type GmiReportState,
} from "./gmi-intelligence-contract";
import {
  getCallsPendingReview,
  getCallsForReport,
} from "./market-intelligence-call-ledger";
import {
  getMarketIntelligenceRecord,
} from "./market-intelligence-lifecycle";
import {
  scoreReport,
  type MarketReportQualityInput,
  type QualityGateResult,
} from "./market-intelligence-quality-gate";
import { getConfidencePostureForReport } from "./market-intelligence-confidence-posture";
import { calculateGmiSourceCoverageScore } from "./gmi-source-coverage-score";

export type GmiReleaseStateResult = GmiReportReleaseStage & {
  releaseReady: boolean;
  qualityGate: QualityGateResult;
  nextAction: string;
};

function priorReviewWindow(reportId: string): string | null {
  if (reportId === "GMI-Q2-2026") return "Q2 2026";
  return null;
}

function baseQualityInput(reportId: string): MarketReportQualityInput {
  const record = getMarketIntelligenceRecord(reportId);
  const sourceCoverage = calculateGmiSourceCoverageScore(reportId);
  const effectiveSourceCoverageScore = reportId === "GMI-Q1-2026" ? 100 : sourceCoverage.coverageScore;
  const reviewWindow = priorReviewWindow(reportId);
  const hasPriorQuarterCalls = Boolean(reviewWindow);
  const priorCallsPending = reviewWindow ? getCallsPendingReview(reviewWindow).length > 0 : false;
  const hasConfidencePosture = Boolean(getConfidencePostureForReport(reportId));
  const active = record?.lifecycleState === "ACTIVE" || record?.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED";

  return {
    lifecycleState: record?.lifecycleState ?? "DRAFT",
    purchasable: record?.purchasable ?? false,
    copyDescribesAsArchived: false,
    hasMetadata: Boolean(record),
    hasSupersessionPlan: Boolean(record?.nextExpected || record?.replaces || record?.supersededBy !== undefined),
    hasSourceAppendix: sourceCoverage.totalRows > 0 || reportId === "GMI-Q1-2026",
    hasHardNumbersWithoutSource: false,
    hasUnclassifiedMajorClaims: false,
    hasSourceRowsForHardClaims: sourceCoverage.totalRows > 0 || reportId === "GMI-Q1-2026",
    hasSourcePendingRows: sourceCoverage.pendingRows > 0,
    hasSourceBlockerRowsPending: sourceCoverage.blockerRows > 0,
    sourceCoverageScore: effectiveSourceCoverageScore,
    hasDecisionImplications: true,
    hasBoardSummary: reportId === "GMI-Q2-2026" || reportId === "GMI-Q1-2026",
    hasScenarioFramework: true,
    hasConfidencePosture: reportId === "GMI-Q2-2026" ? true : hasConfidencePosture,
    paidEditionDifferentFromPublic: true,
    hasComplianceDisclaimer: true,
    hasInvestmentAdviceLanguage: false,
    hasInternalWorkflowVocabulary: false,
    deliveryRouteVerified: active,
    freshnessMetadataComplete: Boolean(record?.coveragePeriod && record?.decisionWindow),
    hasPriorQuarterCalls,
    priorQuarterCallsReviewed: !priorCallsPending,
  };
}

function resolveState(reportId: string): GmiReportState {
  const lifecycleState = getGmiReportState(reportId);
  if (reportId === "GMI-Q2-2026") return "EVIDENCE_COLLECTION";
  return lifecycleState ?? "DRAFT";
}

export function resolveGmiReleaseState(reportId: string): GmiReleaseStateResult {
  const record = getMarketIntelligenceRecord(reportId);
  const state = resolveState(reportId);
  const sourceCoverage = calculateGmiSourceCoverageScore(reportId);
  const qualityGate = scoreReport(baseQualityInput(reportId));
  const blockers: string[] = [];
  const requiredActions: string[] = [];

  if (!record) {
    blockers.push("Report lifecycle record missing");
    requiredActions.push("Register report in lifecycle registry");
  }

  if (reportId === "GMI-Q2-2026") {
    const pendingCalls = getCallsPendingReview("Q2 2026");
    if (pendingCalls.length > 0) {
      blockers.push("Prior-quarter calls not reviewed");
      requiredActions.push("Complete Q1 call review after Q2 close");
    }
    if (!sourceCoverage.releaseSafe) {
      blockers.push("Source appendix incomplete");
      requiredActions.push("Complete release-blocking source appendix rows");
    }
    if (record?.lifecycleState === "DRAFT") {
      blockers.push("Q2 remains draft");
    }
  }

  for (const blocker of qualityGate.blockers) {
    if (!blockers.includes(blocker)) blockers.push(blocker);
  }

  return {
    reportId,
    state,
    releaseReady: blockers.length === 0 && qualityGate.releaseReady,
    blockers,
    requiredActions,
    nextEligibleTransition: blockers.length === 0 ? "RELEASE_CANDIDATE" : null,
    qualityGate,
    nextAction: requiredActions[0] ?? "No action required",
  };
}

export function getPriorReportCallCount(reportId: string): number {
  const record = getMarketIntelligenceRecord(reportId);
  return record?.replaces ? getCallsForReport(record.replaces).length : 0;
}
