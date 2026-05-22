// lib/intelligence/gmi-publication-service.ts
// Governs GMI release events: quality gate runs, call reviews, release decisions.
// All writes are fire-and-forget safe via recordGmiReleaseEventSafe.
import {
  recordGmiReleaseEventSafe,
  type GmiReleaseEventRecordResult,
} from "./gmi-release-event-recorder";
import {
  buildQualityGateRunEvent,
  buildCallReviewedEvent,
  buildCallCarriedForwardEvent,
  buildReleaseBlockedEvent,
  buildLifecycleTransitionProposedEvent,
  type GmiReleaseActor,
} from "./gmi-release-events";
import { resolveGmiReleaseState } from "./gmi-release-state-resolver";
import {
  getCallsForReport,
  type MarketCallOutcomeStatus,
} from "./market-intelligence-call-ledger";

export type QualityGateRunResult = GmiReleaseEventRecordResult & {
  releaseReady: boolean;
  blockers: string[];
  overallScore: number;
};

export type CallReviewInput = {
  reportId: string;
  callId: string;
  outcomeStatus: MarketCallOutcomeStatus;
  score: 0 | 1 | 2 | 3 | 4 | 5 | null;
  actor?: GmiReleaseActor;
  requestId?: string;
};

export type CallCarryForwardInput = {
  reportId: string;
  callId: string;
  nextReviewWindow: string;
  actor?: GmiReleaseActor;
  requestId?: string;
};

// Run the release quality gate and record the result.
export async function runGmiQualityGateAndRecord(
  reportId: string,
  actor: GmiReleaseActor = "ADMIN",
  requestId?: string,
): Promise<QualityGateRunResult> {
  const state = resolveGmiReleaseState(reportId);
  const event = buildQualityGateRunEvent({
    reportId,
    actor,
    requestId,
    qualityGate: {
      overallScore: state.qualityGate.overallScore,
      releaseReady: state.qualityGate.releaseReady,
      criticalFailures: state.qualityGate.criticalFailures,
      blockers: state.blockers,
    },
  });

  const result = await recordGmiReleaseEventSafe(event);

  // If the gate is blocked, also record the blocked event
  if (!state.releaseReady && state.blockers.length > 0) {
    const blockedEvent = buildReleaseBlockedEvent({
      reportId,
      actor,
      requestId,
      blockers: state.blockers,
    });
    await recordGmiReleaseEventSafe(blockedEvent);
  }

  return {
    ...result,
    releaseReady: state.releaseReady,
    blockers: state.blockers,
    overallScore: state.qualityGate.overallScore,
  };
}

// Record a prior-quarter call review decision.
export async function recordGmiCallReview(
  input: CallReviewInput,
): Promise<GmiReleaseEventRecordResult> {
  // Verify call exists in the ledger
  const calls = getCallsForReport(input.reportId.replace("GMI-Q", "GMI-Q").trim());
  const matchingCall = calls.find((c) => c.id === input.callId) ??
    // Also search Q1 calls when reviewing for Q2
    getCallsForReport("GMI-Q1-2026").find((c) => c.id === input.callId);

  if (!matchingCall) {
    return {
      ok: false,
      warning: `Call ${input.callId} not found in the call ledger. Event not recorded.`,
    };
  }

  const event = buildCallReviewedEvent({
    reportId: input.reportId,
    callId: input.callId,
    outcomeStatus: input.outcomeStatus,
    score: input.score,
    actor: input.actor ?? "ADMIN",
    requestId: input.requestId,
  });

  return recordGmiReleaseEventSafe(event);
}

// Record a call being carried forward to the next review window.
export async function recordGmiCallCarryForward(
  input: CallCarryForwardInput,
): Promise<GmiReleaseEventRecordResult> {
  const event = buildCallCarriedForwardEvent({
    reportId: input.reportId,
    callId: input.callId,
    nextReviewWindow: input.nextReviewWindow,
    actor: input.actor ?? "ADMIN",
    requestId: input.requestId,
  });
  return recordGmiReleaseEventSafe(event);
}

// Propose a lifecycle transition. Records the governance event.
// Does NOT change the lifecycle record (that is static config controlled separately).
export async function proposeGmiLifecycleTransition(
  reportId: string,
  fromState: string,
  toState: string,
  actor: GmiReleaseActor = "ADMIN",
  requestId?: string,
): Promise<GmiReleaseEventRecordResult> {
  const state = resolveGmiReleaseState(reportId);

  if (!state.releaseReady) {
    const blockedEvent = buildReleaseBlockedEvent({
      reportId,
      actor,
      requestId,
      blockers: state.blockers,
      primaryReason: state.blockers[0],
    });
    await recordGmiReleaseEventSafe(blockedEvent);
    return {
      ok: false,
      warning: `Transition blocked: ${state.blockers[0] ?? "Release conditions not satisfied"}. Blocked event recorded.`,
    };
  }

  const event = buildLifecycleTransitionProposedEvent({
    reportId,
    fromState,
    toState,
    actor,
    requestId,
  });
  return recordGmiReleaseEventSafe(event);
}

// Get a summary of all pending call reviews for a report's prior-quarter calls.
export function getPendingCallReviews(
  reportId: string,
): ReturnType<typeof getCallsForReport> {
  const record = (() => {
    try {
      const { getMarketIntelligenceRecord } = require("./market-intelligence-lifecycle");
      return getMarketIntelligenceRecord(reportId);
    } catch {
      return null;
    }
  })();
  const priorReportId = record?.replaces ?? null;
  if (!priorReportId) return [];
  return getCallsForReport(priorReportId).filter(
    (c) =>
      !c.outcomeStatus ||
      c.outcomeStatus === "PENDING_REVIEW" ||
      c.outcomeStatus === "TOO_EARLY_TO_ASSESS",
  );
}
