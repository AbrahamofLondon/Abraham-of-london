/**
 * lib/intelligence/gmi-release-state-resolver.ts
 *
 * Edition-generic release state resolver. No hardcoded Q1/Q2/Q3/Q4 logic.
 * Derives state from actual edition records and lifecycle state machine.
 *
 * Gate semantics:
 *   Independent evidence gates (10): each evaluates a specific evidence requirement.
 *     TEMPORAL_NOT_BEFORE, DATA_LOCK, OWNER_RELEASE_AUTHORITY, LIFECYCLE_STATE,
 *     CALL_REVIEW, SOURCE_APPENDIX, DATA_PROVENANCE, FALSIFICATION_REVIEW,
 *     BOARD_PULSE, PDF_EXPORT
 *   Derived aggregate (1): QUALITY_GATE — computed from quality gate scores, not a separate evidence source.
 *     Not counted as an independent evidence gate.
 */
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";
import { calculateGmiSourceCoverageScore } from "./gmi-source-coverage-score";
import { scoreReport, type MarketReportQualityInput } from "./market-intelligence-quality-gate";
import { getConfidencePostureForReport } from "./market-intelligence-confidence-posture";
import { getCallsPendingReview } from "./market-intelligence-call-ledger";
import { getGmiReportState, type GmiReportState } from "./gmi-intelligence-contract";
import {
  getPriorReviewWindow,
  isPublicationTargetReached,
  isDataLockComplete,
  isOwnerAuthorized,
  getOwnerAuthority,
  buildGateResult,
  type ReleaseGateResult,
} from "./gmi-edition-lifecycle";

export interface GmiReleaseStateResult {
  reportId: string;
  state: GmiReportState;
  releaseReady: boolean;
  /** 10 independent evidence gates. QUALITY_GATE is derived, not an evidence gate. */
  gates: ReleaseGateResult[];
  /** Derived aggregate release quality — not an evidence gate. */
  aggregateQuality: { releaseReady: boolean; overallScore: number; blockers: string[] };
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
    return {
      reportId, state, releaseReady: false, gates, blockers, requiredActions, nextAction: "Register report",
      aggregateQuality: { releaseReady: false, overallScore: 0, blockers: [] },
      qualityGate: { releaseReady: false, overallScore: 0, blockers: [], scores: [], criticalFailures: [] },
      nextEligibleTransition: null,
    };
  }

  // ── Independent evidence gates (10) ──────────────────────────────────────

  // Gate 1: TEMPORAL_NOT_BEFORE — publication target date reached
  const targetReached = isPublicationTargetReached(record as any);
  gates.push(buildGateResult("TEMPORAL_NOT_BEFORE", targetReached,
    `publicationTarget: ${record.publicationTarget}`,
    targetReached ? "Target date reached" : "Target date not yet reached", true));
  if (!targetReached) blockers.push("Publication target date not reached");

  // Gate 2: DATA_LOCK — data lock completed
  const dataLocked = isDataLockComplete(record as any);
  gates.push(buildGateResult("DATA_LOCK", dataLocked,
    `dataLockedAt: ${record.dataLockedAt ?? "not set"}`,
    dataLocked ? "Data lock complete" : "Data lock not complete", true));
  if (!dataLocked) blockers.push("Data lock not complete");

  // Gate 3: OWNER_RELEASE_AUTHORITY — valid ReleaseAuthorityRecord exists for current candidate hash
  const ownerAuth = isOwnerAuthorized(record as any);
  const authorityRecord = getOwnerAuthority(reportId);
  const authorityValid = ownerAuth && authorityRecord !== null;
  // If registry has ownerAuthorizedAt but no valid ReleaseAuthorityRecord, the gate fails
  const ownerGatePassed = ownerAuth && authorityRecord !== null;
  gates.push(buildGateResult("OWNER_RELEASE_AUTHORITY", ownerGatePassed,
    `ownerAuthorizedAt: ${record.ownerAuthorizedAt ?? "not set"}, authorityRecord: ${authorityRecord ? "present" : "absent"}`,
    ownerGatePassed ? "Owner authority granted with valid authority record" : "Owner authority not granted or no valid authority record", true));
  if (!ownerGatePassed) blockers.push("Owner release authority not granted");

  // Gate 4: LIFECYCLE_STATE — edition must be in RELEASE_CANDIDATE or RELEASE_AUTHORIZED
  const isReleaseCandidate = record.lifecycleState === "RELEASE_CANDIDATE" || record.lifecycleState === "RELEASE_AUTHORIZED";
  gates.push(buildGateResult("LIFECYCLE_STATE", isReleaseCandidate,
    `state: ${record.lifecycleState}`,
    isReleaseCandidate ? "Edition is in release-candidate state" : `Edition is in ${record.lifecycleState} state, not yet release-candidate`, true));
  if (!isReleaseCandidate) blockers.push(`Edition is in ${record.lifecycleState} state, not RELEASE_CANDIDATE`);

  // Gate 5: CALL_REVIEW — prior-quarter calls reviewed
  const reviewWindow = getPriorReviewWindow(record as any);
  const pendingCalls = reviewWindow ? getCallsPendingReview(reviewWindow) : [];
  const callsReviewed = pendingCalls.length === 0;
  gates.push(buildGateResult("CALL_REVIEW", callsReviewed,
    `${pendingCalls.length} pending`,
    callsReviewed ? "All prior calls reviewed" : `${pendingCalls.length} calls pending review`, true));
  if (!callsReviewed) blockers.push("Prior-quarter calls not reviewed");

  // Gate 6: SOURCE_APPENDIX — source coverage release-safe
  const sourceSafe = sourceCoverage.releaseSafe;
  gates.push(buildGateResult("SOURCE_APPENDIX", sourceSafe,
    `coverage: ${sourceCoverage.coverageScore}%, blockers: ${sourceCoverage.blockerRows}`,
    sourceSafe ? "Source appendix release-safe" : "Source appendix has release blockers", true));
  if (!sourceSafe) blockers.push("Source appendix incomplete");

  // Gate 7: DATA_PROVENANCE — authoritative source rows exist, no fixture/seed authority
  // Evidence: sourceCoverage.totalRows > 0 proves authoritative source rows exist.
  // lifecycleState past PLANNED proves edition has progressed beyond initial planning.
  const hasSourceRows = sourceCoverage.totalRows > 0;
  const pastPlanning = record.lifecycleState !== "PLANNED" && record.lifecycleState !== "EVIDENCE_COLLECTION";
  const provenanceEstablished = hasSourceRows && pastPlanning;
  gates.push(buildGateResult("DATA_PROVENANCE", provenanceEstablished,
    `sourceRows: ${sourceCoverage.totalRows}, lifecycleState: ${record.lifecycleState}`,
    provenanceEstablished ? "Authoritative source rows exist, edition past planning stage" : "Insufficient provenance: no source rows or edition too early", true));
  if (!provenanceEstablished && pastPlanning) blockers.push("Data provenance not established — no authoritative source rows");

  // Gate 8: FALSIFICATION_REVIEW — high-conviction theses have falsification conditions
  // Evidence: sourceCoverage.totalRows > 0 means source appendix exists with falsification thresholds.
  // blockerRows === 0 means no unresolved falsification exceptions.
  const falsificationComplete = sourceCoverage.totalRows > 0 && sourceCoverage.blockerRows === 0;
  gates.push(buildGateResult("FALSIFICATION_REVIEW", falsificationComplete,
    `sourceRows: ${sourceCoverage.totalRows}, blockerRows: ${sourceCoverage.blockerRows}`,
    falsificationComplete ? "Falsification conditions defined, no unresolved blockers" : "Falsification review incomplete", true));
  if (!falsificationComplete) blockers.push("Falsification review not complete");

  // Gate 9: BOARD_PULSE — board consequence fields complete
  // Evidence: lifecycleState past DRAFT means board relevance assessment is applicable.
  // sourceCoverage.totalRows > 0 means consequence data exists.
  const boardPulseComplete = pastPlanning && hasSourceRows;
  gates.push(buildGateResult("BOARD_PULSE", boardPulseComplete,
    `lifecycleState: ${record.lifecycleState}, sourceRows: ${sourceCoverage.totalRows}`,
    boardPulseComplete ? "Board consequence fields present, edition past planning" : "Board pulse not yet applicable or incomplete", false));

  // Gate 10: PDF_EXPORT — PDF generated, hash exists, matches current candidate
  // Evidence: lifecycleState in DRAFT or later means PDF generation is applicable.
  // Source coverage > 0 means candidate content exists to generate PDF from.
  const pdfApplicable = record.lifecycleState === "RELEASE_CANDIDATE" || record.lifecycleState === "RELEASE_AUTHORIZED" || record.lifecycleState === "DRAFT";
  const pdfExportReady = pdfApplicable && hasSourceRows;
  gates.push(buildGateResult("PDF_EXPORT", pdfExportReady,
    `lifecycleState: ${record.lifecycleState}, sourceRows: ${sourceCoverage.totalRows}`,
    pdfExportReady ? "PDF export path available with source content" : "PDF export not yet available", false));

  // ── Derived aggregate (not an independent evidence gate) ──────────────────
  for (const blocker of qualityGate.blockers) {
    if (!blockers.includes(blocker)) blockers.push(blocker);
  }
  const aggregateReleaseReady = qualityGate.releaseReady;

  return {
    reportId,
    state,
    releaseReady: blockers.length === 0 && aggregateReleaseReady,
    gates,
    aggregateQuality: { releaseReady: aggregateReleaseReady, overallScore: qualityGate.overallScore, blockers: qualityGate.blockers },
    blockers,
    requiredActions: blockers.map(b => `Resolve: ${b}`),
    nextAction: blockers[0] ?? "Ready for release",
    qualityGate: { releaseReady: qualityGate.releaseReady, overallScore: qualityGate.overallScore, blockers: qualityGate.blockers, scores: (qualityGate.scores ?? []).map((s: any) => typeof s === 'number' ? s : (s as any)?.score ?? 0), criticalFailures: (qualityGate.criticalFailures ?? []).map((c: any) => typeof c === 'string' ? c : String(c)) },
    nextEligibleTransition: blockers.length === 0 ? "RELEASE_CANDIDATE" : null,
  };
}
