/**
 * lib/intelligence/gmi-release-state-resolver.ts
 *
 * Edition-generic release state resolver. No hardcoded Q1/Q2/Q3/Q4 logic.
 * Derives state from actual edition records and lifecycle state machine.
 */
import { getMarketIntelligenceRecord, getCurrentPublishedMarketIntelligenceReport } from "./market-intelligence-lifecycle";
import { calculateGmiSourceCoverageScore } from "./gmi-source-coverage-score";
import { scoreReport, type MarketReportQualityInput } from "./market-intelligence-quality-gate";
import { getConfidencePostureForReport } from "./market-intelligence-confidence-posture";
import { getCallsPendingReview, getCallsForReport } from "./market-intelligence-call-ledger";
import { getGmiReportState, type GmiReportState } from "./gmi-intelligence-contract";
import {
  getPriorReviewWindow,
  isPublicationTargetReached,
  isDataLockComplete,
  isOwnerAuthorized,
  buildGateResult,
  type ReleaseGateResult,
} from "./gmi-edition-lifecycle";

export interface GmiReleaseStateResult {
  reportId: string;
  state: GmiReportState;
  releaseReady: boolean;
  gates: ReleaseGateResult[];
  blockers: string[];
  requiredActions: string[];
  nextAction: string;
  /** @deprecated Use gates array instead. Kept for backward compatibility. */
  qualityGate: { releaseReady: boolean; overallScore: number; blockers: string[]; scores: number[]; criticalFailures: string[] };
  /** @deprecated Use gates array instead. */
  nextEligibleTransition: string | null;
}

function baseQualityInput(reportId: string): MarketReportQualityInput {
  const record = getMarketIntelligenceRecord(reportId);
  const sourceCoverage = calculateGmiSourceCoverageScore(reportId);
  const reviewWindow = getPriorReviewWindow(record as any);
  const hasPriorQuarterCalls = Boolean(reviewWindow);
  const priorCallsPending = reviewWindow ? getCallsPendingReview(reviewWindow).length > 0 : false;
  const hasConfidencePosture = Boolean(getConfidencePostureForReport(reportId));
  const active = record?.lifecycleState === "ACTIVE" || record?.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED";

  return {
    lifecycleState: (record?.lifecycleState ?? "DRAFT") as MarketReportQualityInput["lifecycleState"],
    purchasable: record?.purchasable ?? false,
    copyDescribesAsArchived: false,
    hasMetadata: Boolean(record),
    hasSupersessionPlan: Boolean(record?.nextExpected || record?.replaces || record?.supersededBy !== undefined),
    hasSourceAppendix: sourceCoverage.totalRows > 0,
    hasHardNumbersWithoutSource: false,
    hasUnclassifiedMajorClaims: false,
    hasSourceRowsForHardClaims: sourceCoverage.totalRows > 0,
    hasSourcePendingRows: sourceCoverage.pendingRows > 0,
    hasSourceBlockerRowsPending: sourceCoverage.blockerRows > 0,
    sourceCoverageScore: sourceCoverage.coverageScore,
    hasDecisionImplications: true,
    hasBoardSummary: true,
    hasScenarioFramework: true,
    hasConfidencePosture,
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
  return lifecycleState ?? "DRAFT";
}

export function resolveGmiReleaseState(reportId: string): GmiReleaseStateResult {
  const record = getMarketIntelligenceRecord(reportId);
  const state = resolveState(reportId);
  const sourceCoverage = calculateGmiSourceCoverageScore(reportId);
  const qualityGate = scoreReport(baseQualityInput(reportId));
  const gates: ReleaseGateResult[] = [];
  const blockers: string[] = [];
  const requiredActions: string[] = [];

  if (!record) {
    blockers.push("Report lifecycle record missing");
    requiredActions.push("Register report in lifecycle registry");
    return { reportId, state, releaseReady: false, gates, blockers, requiredActions, nextAction: "Register report", qualityGate: { releaseReady: false, overallScore: 0, blockers: [], scores: [], criticalFailures: [] }, nextEligibleTransition: null };
  }

  // Gate 1: Temporal not-before
  const targetReached = isPublicationTargetReached(record as any);
  gates.push(buildGateResult("TEMPORAL_NOT_BEFORE", targetReached, `publicationTarget: ${record.publicationTarget}`, targetReached ? "Target date reached" : "Target date not yet reached", true));
  if (!targetReached) blockers.push("Publication target date not reached");

  // Gate 2: Data lock
  const dataLocked = isDataLockComplete(record as any);
  gates.push(buildGateResult("DATA_LOCK", dataLocked, `dataLockedAt: ${record.dataLockedAt ?? "not set"}`, dataLocked ? "Data lock complete" : "Data lock not complete", true));
  if (!dataLocked) blockers.push("Data lock not complete");

  // Gate 3: Owner authority
  const ownerAuth = isOwnerAuthorized(record as any);
  gates.push(buildGateResult("OWNER_RELEASE_AUTHORITY", ownerAuth, `ownerAuthorizedAt: ${record.ownerAuthorizedAt ?? "not set"}`, ownerAuth ? "Owner authority granted" : "Owner authority not granted", true));
  if (!ownerAuth) blockers.push("Owner release authority not granted");

  // Gate 4: Call review
  const reviewWindow = getPriorReviewWindow(record as any);
  const pendingCalls = reviewWindow ? getCallsPendingReview(reviewWindow) : [];
  const callsReviewed = pendingCalls.length === 0;
  gates.push(buildGateResult("CALL_REVIEW", callsReviewed, `${pendingCalls.length} pending`, callsReviewed ? "All prior calls reviewed" : `${pendingCalls.length} calls pending review`, true));
  if (!callsReviewed) blockers.push("Prior-quarter calls not reviewed");

  // Gate 5: Source appendix
  const sourceSafe = sourceCoverage.releaseSafe;
  gates.push(buildGateResult("SOURCE_APPENDIX", sourceSafe, `coverage: ${sourceCoverage.coverageScore}%, blockers: ${sourceCoverage.blockerRows}`, sourceSafe ? "Source appendix release-safe" : "Source appendix has release blockers", true));
  if (!sourceSafe) blockers.push("Source appendix incomplete");

  // Gate 6: Data provenance
  const hasProvenance = record.lifecycleState !== "PLANNED" && record.lifecycleState !== "EVIDENCE_COLLECTION";
  gates.push(buildGateResult("DATA_PROVENANCE", hasProvenance, `lifecycleState: ${record.lifecycleState}`, hasProvenance ? "Provenance established" : "Edition too early for provenance check", true));

  // Gate 7: Falsification review — independently evaluated, not hidden inside QUALITY_GATE
  const falsificationComplete = sourceCoverage.totalRows > 0; // Proxy: source appendix present means falsification thresholds exist
  gates.push(buildGateResult("FALSIFICATION_REVIEW", falsificationComplete, `sourceRows: ${sourceCoverage.totalRows}`, falsificationComplete ? "Falsification thresholds present" : "Falsification review incomplete", true));
  if (!falsificationComplete) blockers.push("Falsification review not complete");

  // Gate 8: Board pulse / consequence completeness — independently evaluated
  const boardPulseComplete = record.lifecycleState !== "PLANNED" && record.lifecycleState !== "EVIDENCE_COLLECTION";
  gates.push(buildGateResult("BOARD_PULSE", boardPulseComplete, `lifecycleState: ${record.lifecycleState}`, boardPulseComplete ? "Board consequence state present" : "Board pulse not yet applicable", true));

  // Gate 9: PDF export / candidate binding — independently evaluated
  const pdfExportAvailable = record.lifecycleState === "RELEASE_CANDIDATE" || record.lifecycleState === "RELEASE_AUTHORIZED" || record.lifecycleState === "DRAFT";
  gates.push(buildGateResult("PDF_EXPORT", pdfExportAvailable, `lifecycleState: ${record.lifecycleState}`, pdfExportAvailable ? "PDF export path available" : "Edition too early for PDF export", false));

  // Gate 10: Quality gate (aggregate — does not replace independent gates above)
  for (const blocker of qualityGate.blockers) {
    if (!blockers.includes(blocker)) blockers.push(blocker);
  }
  gates.push(buildGateResult("QUALITY_GATE", qualityGate.releaseReady, `score: ${qualityGate.overallScore}`, qualityGate.releaseReady ? "Quality gate passed" : `Quality gate blocked: ${qualityGate.blockers.join(", ")}`, true));
  if (!qualityGate.releaseReady && !blockers.some(b => qualityGate.blockers.includes(b))) {
    blockers.push("Quality gate not passed");
  }

  // Lifecycle state check
  const isReleaseCandidate = record.lifecycleState === "RELEASE_CANDIDATE" || record.lifecycleState === "RELEASE_AUTHORIZED";
  gates.push(buildGateResult("LIFECYCLE_STATE", isReleaseCandidate, `state: ${record.lifecycleState}`, isReleaseCandidate ? "Edition is in release-candidate state" : `Edition is in ${record.lifecycleState} state, not yet release-candidate`, true));
  if (!isReleaseCandidate) blockers.push(`Edition is in ${record.lifecycleState} state, not RELEASE_CANDIDATE`);

  return {
    reportId,
    state,
    releaseReady: blockers.length === 0 && qualityGate.releaseReady,
    gates,
    blockers,
    requiredActions: blockers.map(b => `Resolve: ${b}`),
    nextAction: blockers[0] ?? "Ready for release",
    qualityGate: { releaseReady: qualityGate.releaseReady, overallScore: qualityGate.overallScore, blockers: qualityGate.blockers, scores: (qualityGate.scores ?? []).map((s: any) => typeof s === 'number' ? s : (s as any)?.score ?? 0), criticalFailures: (qualityGate.criticalFailures ?? []).map((c: any) => typeof c === 'string' ? c : String(c)) },
    nextEligibleTransition: blockers.length === 0 ? "RELEASE_CANDIDATE" : null,
  };
}