import { describe, expect, it, vi } from "vitest";

import {
  buildCallReviewedEvent,
  buildLifecycleTransitionProposedEvent,
  buildQualityGateRunEvent,
  buildReleaseBlockedEvent,
  buildSourceRowVerifiedEvent,
  buildOutboundGateRunEvent,
  sanitizeGmiReleaseMetadata,
} from "./gmi-release-events";
import { recordGmiReleaseEventWithSink } from "./gmi-release-event-recorder";

describe("GMI release events", () => {
  it("builds quality gate events with report id and score summary", () => {
    const event = buildQualityGateRunEvent({
      reportId: "GMI-Q2-2026",
      occurredAt: "2026-05-20T10:00:00.000Z",
      qualityGate: {
        overallScore: 7.4,
        releaseReady: false,
        criticalFailures: ["PRIOR_QUARTER_CALLS_UNREVIEWED"],
        blockers: ["Critical failure: PRIOR_QUARTER_CALLS_UNREVIEWED"],
      },
    });

    expect(event.eventType).toBe("GMI_QUALITY_GATE_RUN");
    expect(event.reportId).toBe("GMI-Q2-2026");
    expect(event.safeMetadata.overallScore).toBe(7.4);
    expect(event.safeMetadata.criticalFailureCount).toBe(1);
    expect(event.safeMetadata.blockerCount).toBe(1);
  });

  it("builds release blocked events with blocker count and reason codes", () => {
    const event = buildReleaseBlockedEvent({
      reportId: "GMI-Q2-2026",
      blockers: ["Prior-quarter calls not reviewed", "Source appendix incomplete"],
    });

    expect(event.eventType).toBe("GMI_RELEASE_BLOCKED");
    expect(event.severity).toBe("BLOCKER");
    expect(event.safeMetadata.blockerCount).toBe(2);
    expect(event.safeMetadata.primaryReason).toBe("Prior-quarter calls not reviewed");
  });

  it("source row events include source row id but not source text", () => {
    const event = buildSourceRowVerifiedEvent({
      reportId: "GMI-Q2-2026",
      sourceRowId: "GMI-Q2-SRC-003",
      evidenceClass: "INSTITUTIONAL_SOURCE",
      confidence: "HIGH",
    });

    expect(event.sourceRowId).toBe("GMI-Q2-SRC-003");
    expect(event.safeMetadata.sourceRowId).toBe("GMI-Q2-SRC-003");
    expect(JSON.stringify(event)).not.toContain("sourceText");
    expect(JSON.stringify(event)).not.toContain("full text");
  });

  it("call reviewed events include call id and score but not raw notes", () => {
    const event = buildCallReviewedEvent({
      reportId: "GMI-Q2-2026",
      relatedReportId: "GMI-Q1-2026",
      callId: "GMI-Q1-2026-CALL-001",
      outcomeStatus: "DIRECTIONALLY_CONFIRMED",
      score: 4,
    });

    expect(event.callId).toBe("GMI-Q1-2026-CALL-001");
    expect(event.safeMetadata.score).toBe(4);
    expect(event.safeMetadata.outcomeStatus).toBe("DIRECTIONALLY_CONFIRMED");
    expect(JSON.stringify(event)).not.toContain("rawNotes");
  });

  it("sanitises unsafe metadata keys", () => {
    const metadata = sanitizeGmiReleaseMetadata({
      reportId: "GMI-Q2-2026",
      rawBody: "unpublished body",
      secretToken: "token",
      sourceFullText: "full source text",
      score: 9,
    });

    expect(metadata.reportId).toBe("GMI-Q2-2026");
    expect(metadata.score).toBe(9);
    expect(metadata.rawBody).toBeUndefined();
    expect(metadata.secretToken).toBeUndefined();
    expect(metadata.sourceFullText).toBeUndefined();
  });

  it("lifecycle and outbound event builders carry safe metadata only", () => {
    const lifecycle = buildLifecycleTransitionProposedEvent({
      reportId: "GMI-Q2-2026",
      fromState: "DRAFT",
      toState: "ACTIVE_UNTIL_SUPERSEDED",
      reasonCode: "release_candidate_passed",
    });
    const outbound = buildOutboundGateRunEvent({
      reportId: "GMI-Q2-2026",
      channel: "linkedin",
      assetId: "q2-market-reality",
      status: "draft",
      publishable: false,
      lifecycleGated: true,
    });

    expect(lifecycle.safeMetadata.fromState).toBe("DRAFT");
    expect(lifecycle.safeMetadata.toState).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect(outbound.safeMetadata.publishable).toBe(false);
    expect(outbound.safeMetadata.lifecycleGated).toBe(true);
  });

  it("recorder catches sink failure safely", async () => {
    const event = buildReleaseBlockedEvent({
      reportId: "GMI-Q2-2026",
      blockers: ["Prior-quarter calls not reviewed"],
    });
    const sink = vi.fn().mockRejectedValue(new Error("audit down"));

    const result = await recordGmiReleaseEventWithSink(event, sink);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.warning).toContain("could not be recorded");
    }
  });
});
