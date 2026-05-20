import { describe, expect, it } from "vitest";

import {
  buildQualityGateRunEvent,
  buildReleaseBlockedEvent,
  buildSourceRowVerifiedEvent,
  buildCallReviewedEvent,
  buildOutboundGateRunEvent,
} from "./gmi-release-events";
import { buildGmiReleaseEventSummary } from "./gmi-release-event-summary";

describe("GMI release event summary", () => {
  it("handles no events", () => {
    const summary = buildGmiReleaseEventSummary("GMI-Q2-2026");

    expect(summary.totalEvents).toBe(0);
    expect(summary.emptyState).toBe("No release events recorded yet.");
    expect(summary.lastQualityGateRun).toBeNull();
    expect(summary.lastReleaseBlockedReason).toBeNull();
    expect(summary.lastSourceVerification).toBeNull();
    expect(summary.lastCallReview).toBeNull();
  });

  it("summarises latest event by category for a report", () => {
    const events = [
      buildQualityGateRunEvent({
        reportId: "GMI-Q2-2026",
        occurredAt: "2026-05-20T10:00:00.000Z",
        qualityGate: {
          overallScore: 7.2,
          releaseReady: false,
          criticalFailures: [],
          blockers: [],
        },
      }),
      buildReleaseBlockedEvent({
        reportId: "GMI-Q2-2026",
        occurredAt: "2026-05-20T11:00:00.000Z",
        blockers: ["Source appendix incomplete"],
      }),
      buildSourceRowVerifiedEvent({
        reportId: "GMI-Q2-2026",
        occurredAt: "2026-05-20T12:00:00.000Z",
        sourceRowId: "GMI-Q2-SRC-002",
      }),
      buildCallReviewedEvent({
        reportId: "GMI-Q2-2026",
        occurredAt: "2026-05-20T13:00:00.000Z",
        callId: "GMI-Q1-2026-CALL-001",
        outcomeStatus: "PARTIALLY_CONFIRMED",
        score: 3,
      }),
      buildOutboundGateRunEvent({
        reportId: "GMI-Q2-2026",
        occurredAt: "2026-05-20T14:00:00.000Z",
        channel: "linkedin",
        status: "draft",
        publishable: false,
        lifecycleGated: true,
      }),
      buildReleaseBlockedEvent({
        reportId: "GMI-Q3-2026",
        occurredAt: "2026-05-20T15:00:00.000Z",
        blockers: ["Other report"],
      }),
    ];

    const summary = buildGmiReleaseEventSummary("GMI-Q2-2026", events);

    expect(summary.totalEvents).toBe(5);
    expect(summary.emptyState).toBeNull();
    expect(summary.lastQualityGateRun).toContain("Quality gate run");
    expect(summary.lastReleaseBlockedReason).toContain("Source appendix incomplete");
    expect(summary.lastSourceVerification).toContain("GMI-Q2-SRC-002");
    expect(summary.lastCallReview).toContain("GMI-Q1-2026-CALL-001");
    expect(summary.lastOutboundGateCheck).toContain("not publishable");
  });
});
