// lib/intelligence/generate-gmi-digest.ts
// Generates a structured GMI intelligence digest from the call ledger and release events.
// Distinct from generate-weekly-digest.ts (which targets framework engagement and outputs PDF).
// This digest is data-structured for admin display, API responses, and weekly review.
import {
  getCallsForReport,
  summariseCallReview,
  getMarketLearningSignals,
  getCallsPendingReview,
} from "./market-intelligence-call-ledger";
import { buildGmiQuarterlyReviewPack } from "./gmi-quarterly-review-pack";
import { resolveGmiReleaseState } from "./gmi-release-state-resolver";
import { getGmiEventsForReport } from "./gmi-event-store";
import { buildGmiReleaseEventSummary } from "./gmi-release-event-summary";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";

export type GmiCallDigestEntry = {
  callId: string;
  callType: string;
  statement: string;
  originalConfidence: string;
  expectedReviewWindow: string;
  outcomeStatus: string;
  outcomeSummary: string | undefined;
  score: number | null | undefined;
  learning: string | undefined;
};

export type GmiIntelligenceDigest = {
  generatedAt: string;
  reportId: string;
  priorReportId: string | null;
  title: string;
  reviewWindow: string;
  callSummary: {
    totalCalls: number;
    reviewed: number;
    pending: number;
    averageScore: number | null;
    confirmed: number;
    partiallyConfirmed: number;
    notConfirmed: number;
    tooEarly: number;
  };
  pendingCallsList: GmiCallDigestEntry[];
  learningSignals: string[];
  releaseStatus: {
    state: string;
    releaseReady: boolean;
    blockerCount: number;
    qualityScore: number;
  };
  eventSummary: {
    totalEvents: number;
    lastQualityGateRun: string | null;
    lastCallReview: string | null;
    lastReleaseBlockedReason: string | null;
  };
  verificationDisciplineStatement: string;
};

export async function generateGmiIntelligenceDigest(
  reportId = "GMI-Q2-2026",
): Promise<GmiIntelligenceDigest> {
  const record = getMarketIntelligenceRecord(reportId);
  const priorReportId = record?.replaces ?? null;

  // Call ledger data
  const allCalls = priorReportId ? getCallsForReport(priorReportId) : [];
  const reviewSummary = summariseCallReview(allCalls);
  const learningSignals = getMarketLearningSignals(allCalls);

  // Determine review window
  const reviewWindow = reportId === "GMI-Q2-2026" ? "Q2 2026"
    : reportId === "GMI-Q3-2026" ? "Q3 2026"
    : "";

  const pendingCalls = reviewWindow ? getCallsPendingReview(reviewWindow) : [];

  const pendingCallsList: GmiCallDigestEntry[] = pendingCalls.map((c) => ({
    callId: c.id,
    callType: c.callType,
    statement: c.statement,
    originalConfidence: c.originalConfidence,
    expectedReviewWindow: c.expectedReviewWindow,
    outcomeStatus: c.outcomeStatus ?? "PENDING_REVIEW",
    outcomeSummary: c.outcomeSummary,
    score: c.score,
    learning: c.learning,
  }));

  // Release state
  const releaseState = resolveGmiReleaseState(reportId);

  // Persisted events from the audit log
  const events = await getGmiEventsForReport(reportId);
  const eventSummaryFull = buildGmiReleaseEventSummary(reportId, events);

  return {
    generatedAt: new Date().toISOString(),
    reportId,
    priorReportId,
    title: record?.title ?? reportId,
    reviewWindow,
    callSummary: reviewSummary,
    pendingCallsList,
    learningSignals,
    releaseStatus: {
      state: releaseState.state,
      releaseReady: releaseState.releaseReady,
      blockerCount: releaseState.blockers.length,
      qualityScore: releaseState.qualityGate.overallScore,
    },
    eventSummary: {
      totalEvents: eventSummaryFull.totalEvents,
      lastQualityGateRun: eventSummaryFull.lastQualityGateRun,
      lastCallReview: eventSummaryFull.lastCallReview,
      lastReleaseBlockedReason: eventSummaryFull.lastReleaseBlockedReason,
    },
    // Canonical phrasing — do not alter
    verificationDisciplineStatement:
      "Every quarterly report reviews the material calls from the previous quarter before issuing the next one. This intelligence line compounds through verification, not just publication.",
  };
}
