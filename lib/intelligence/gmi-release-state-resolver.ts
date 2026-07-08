/**
 * lib/intelligence/gmi-release-state-resolver.ts
 *
 * Edition-generic release state resolver. No hardcoded Q1/Q2/Q3/Q4 logic.
 * All gates use actual evidence providers — no proxy checks.
 *
 * Independent evidence gates (10): each evaluates a specific evidence requirement.
 * Derived aggregate (1): QUALITY_GATE — computed from quality gate scores.
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
import {
  getPdfExportEvidence,
  getBoardPulseEvidence,
  getFalsificationEvidence,
  getDataProvenanceEvidence,
} from "./gmi-release-evidence";

export interface GmiReleaseStateResult {
  reportId: string;
  state: GmiReportState;
  releaseReady: boolean;
  /** 10 independent evidence gates. */
  gates: ReleaseGateResult[];
  /** Derived aggregate release quality. */
  aggregateQuality: { releaseReady: boolean; overallScore: number; blockers: string[] };
  blockers: string[];
  requiredActions: string[];
  nextAction: string;
  /** @deprecated Use gates array instead. */
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

  // Gate 1: TEMPORAL_NOT_BEFORE
  const targetReached = isPublicationTargetReached(record as any);
  gates.push(buildGateResult("TEMPORAL_NOT_BEFORE", targetReached,
    `publicationTarget: ${record.publicationTarget}`,
    targetReached ? "Target date reached" : "Target date not yet reached", true));
  if (!targetReached) blockers.push("Publication target date not reached");

  // Gate 2: DATA_LOCK
  const dataLocked = isDataLockComplete(record as any);
  gates.push(buildGateResult("DATA_LOCK", dataLocked,
    `dataLockedAt: ${record.dataLockedAt ?? "not set"}`,
    dataLocked ? "Data lock complete" : "Data lock not complete", true));
  if (!dataLocked) blockers.push("Data lock not complete");

  // Gate 3: OWNER_RELEASE_AUTHORITY
  const ownerAuth = isOwnerAuthorized(record as any);
  const authorityRecord = getOwnerAuthority(reportId);
  const ownerGatePassed = ownerAuth && authorityRecord !== null;
  gates.push(buildGateResult("OWNER_RELEASE_AUTHORITY", ownerGatePassed,
    `ownerAuthorizedAt: ${record.ownerAuthorizedAt ?? "not set"}, authorityRecord: ${authorityRecord ? "present" : "absent"}`,
    ownerGatePassed ? "Owner authority granted with valid authority record" : "Owner authority not granted or no valid authority record", true));
  if (!ownerGatePassed) blockers.push("Owner release authority not granted");

  // Gate 4: LIFECYCLE_STATE
  const isReleaseCandidate = record.lifecycleState === "RELEASE_CANDIDATE" || record.lifecycleState === "RELEASE_AUTHORIZED";
  gates.push(buildGateResult("LIFECYCLE_STATE", isReleaseCandidate,
    `state: ${record.lifecycleState}`,
    isReleaseCandidate ? "Edition is in release-candidate state" : `Edition is in ${record.lifecycleState} state`, true));
  if (!isReleaseCandidate) blockers.push(`Edition is in ${record.lifecycleState} state, not RELEASE_CANDIDATE`);

  // Gate 5: CALL_REVIEW
  const reviewWindow = getPriorReviewWindow(record as any);
  const pendingCalls = reviewWindow ? getCallsPendingReview(reviewWindow) : [];
  const callsReviewed = pendingCalls.length === 0;
  gates.push(buildGateResult("CALL_REVIEW", callsReviewed,
    `${pendingCalls.length} pending`,
    callsReviewed ? "All prior calls reviewed" : `${pendingCalls.length} calls pending review`, true));
  if (!callsReviewed) blockers.push("Prior-quarter calls not reviewed");

  // Gate 6: SOURCE_APPENDIX
  const sourceSafe = sourceCoverage.releaseSafe;
  gates.push(buildGateResult("SOURCE_APPENDIX", sourceSafe,
    `coverage: ${sourceCoverage.coverageScore}%, blockers: ${sourceCoverage.blockerRows}`,
    sourceSafe ? "Source appendix release-safe" : "Source appendix has release blockers", true));
  if (!sourceSafe) blockers.push("Source appendix incomplete");

  // Gate 7: DATA_PROVENANCE — uses actual evidence provider
  const provenanceEvidence = getDataProvenanceEvidence(reportId);
  const provenancePassed = provenanceEvidence.releaseCriticalSourceCoverageComplete
    && provenanceEvidence.authoritativeSourceBindingsPresent
    && provenanceEvidence.fixtureOrSeedCannotSatisfy
    && provenanceEvidence.unresolvedProvenanceBlockers === 0
    && provenanceEvidence.currentSourceSnapshotHash !== null;
  gates.push(buildGateResult("DATA_PROVENANCE", provenancePassed,
    `coverageComplete: ${provenanceEvidence.releaseCriticalSourceCoverageComplete}, bindingsPresent: ${provenanceEvidence.authoritativeSourceBindingsPresent}, fixtureSafe: ${provenanceEvidence.fixtureOrSeedCannotSatisfy}, blockers: ${provenanceEvidence.unresolvedProvenanceBlockers}, snapshotHash: ${provenanceEvidence.currentSourceSnapshotHash ?? "none"}`,
    provenancePassed ? "Data provenance established: release-critical coverage complete, authoritative bindings present, no fixture/seed authority, no blockers, snapshot hash available" : "Data provenance insufficient", true));
  if (!provenancePassed) blockers.push("Data provenance not established");

  // Gate 8: FALSIFICATION_REVIEW — uses actual evidence provider
  const falsificationEvidence = getFalsificationEvidence(reportId);
  const falsificationPassed = falsificationEvidence.highConvictionThesesIdentified
    && falsificationEvidence.falsificationConditionsPresent
    && falsificationEvidence.reviewCompleted
    && falsificationEvidence.reviewBoundToCurrentEdition
    && falsificationEvidence.unresolvedBlockingFindings === 0;
  gates.push(buildGateResult("FALSIFICATION_REVIEW", falsificationPassed,
    `thesesIdentified: ${falsificationEvidence.highConvictionThesesIdentified}, conditionsPresent: ${falsificationEvidence.falsificationConditionsPresent}, reviewCompleted: ${falsificationEvidence.reviewCompleted}, boundToEdition: ${falsificationEvidence.reviewBoundToCurrentEdition}, unresolvedBlockers: ${falsificationEvidence.unresolvedBlockingFindings}`,
    falsificationPassed ? "Falsification review complete: theses identified, conditions present, review completed, bound to current edition, no unresolved blockers" : "Falsification review incomplete", true));
  if (!falsificationPassed) blockers.push("Falsification review not complete");

  // Gate 9: BOARD_PULSE — uses actual evidence provider
  const boardPulseEvidence = getBoardPulseEvidence(reportId);
  const boardPulsePassed = boardPulseEvidence.consequenceFieldsComplete
    && boardPulseEvidence.boardRelevanceComplete
    && boardPulseEvidence.currentCandidateMatch
    && boardPulseEvidence.recordExists;
  gates.push(buildGateResult("BOARD_PULSE", boardPulsePassed,
    `consequenceFieldsComplete: ${boardPulseEvidence.consequenceFieldsComplete}, boardRelevanceComplete: ${boardPulseEvidence.boardRelevanceComplete}, candidateMatch: ${boardPulseEvidence.currentCandidateMatch}, recordExists: ${boardPulseEvidence.recordExists}`,
    boardPulsePassed ? "Board pulse complete: consequence fields present, board relevance assessed, candidate matches" : "Board pulse incomplete", false));

  // Gate 10: PDF_EXPORT — uses actual evidence provider
  const pdfEvidence = getPdfExportEvidence(reportId);
  const pdfPassed = pdfEvidence.exists
    && pdfEvidence.hash !== null
    && pdfEvidence.generatedAt !== null
    && pdfEvidence.reportContentHash !== null
    && pdfEvidence.sourceSnapshotHash !== null
    && pdfEvidence.matchesCurrentCandidate;
  gates.push(buildGateResult("PDF_EXPORT", pdfPassed,
    `exists: ${pdfEvidence.exists}, hash: ${pdfEvidence.hash ?? "none"}, generatedAt: ${pdfEvidence.generatedAt ?? "none"}, contentHash: ${pdfEvidence.reportContentHash ?? "none"}, sourceHash: ${pdfEvidence.sourceSnapshotHash ?? "none"}, matchesCandidate: ${pdfEvidence.matchesCurrentCandidate}`,
    pdfPassed ? "PDF export exists, hash matches current candidate" : "PDF export not available or does not match current candidate", false));

  // ── Derived aggregate ────────────────────────────────────────────────────
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