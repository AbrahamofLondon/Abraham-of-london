import { describe, expect, it } from "vitest";

import { buildClientSafeOversightBrief } from "@/lib/product/client-safe-oversight-brief";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import { buildBehavioralTrendStructuredAction } from "@/lib/product/oversight-brief-composer";
import { buildRetainerCycleMemorySummary } from "@/lib/product/retainer-cycle-memory-engine";
import type {
  BehavioralTrendMetric,
  BehavioralTrendSummary,
} from "@/lib/behavioral/behavioral-trend-contract";

function makeMetric(overrides: Partial<BehavioralTrendMetric> = {}): BehavioralTrendMetric {
  return {
    signalKey: "meetingCancellationRate",
    source: "google_calendar",
    sourceLabel: "Google Calendar",
    currentValue: 0.45,
    previousValue: 0.2,
    delta: 0.25,
    direction: "DETERIORATING",
    evidencePosture: "snapshot",
    evidenceWindowStart: "2026-05-01T00:00:00.000Z",
    evidenceWindowEnd: "2026-05-14T00:00:00.000Z",
    previousWindowStart: "2026-04-17T00:00:00.000Z",
    previousWindowEnd: "2026-04-30T00:00:00.000Z",
    explanation: "meetingCancellationRate deteriorated again.",
    ...overrides,
  };
}

function makeTrendSummary(overrides: Partial<BehavioralTrendSummary> = {}): BehavioralTrendSummary {
  return {
    userId: "user_1",
    source: "behavioral",
    computedAt: "2026-05-14T00:00:00.000Z",
    overallDirection: "DETERIORATING",
    summary: "Behavioral signals are deteriorating across the current review window. Operating cadence appears to be weakening and should be reviewed.",
    hasDeterioration: true,
    hasRecurrence: false,
    repeatedDriftSignals: [],
    insufficientDataKeys: [],
    metrics: [makeMetric()],
    ...overrides,
  };
}

function makeBrief(retainerCycleMemory?: OversightBrief["retainerCycleMemory"]): OversightBrief {
  return {
    briefId: "brief_1",
    accountId: "acct_1",
    periodStart: "2026-05-01T00:00:00.000Z",
    periodEnd: "2026-05-14T00:00:00.000Z",
    executiveSummary: "Test brief.",
    activeCases: [],
    counsel: { reviewsTriggered: 0, requiredNow: 0 },
    boardroom: { dossiersAvailable: 0, exportsQueued: 0 },
    verification: { commitmentsDue: 0, commitmentsVerified: 0, unresolvedBreaches: 0 },
    requiredActions: [],
    structuredActions: [],
    retainerCycleMemory: retainerCycleMemory ?? null,
  };
}

describe("retainer cycle memory operating loop", () => {
  it("supports a two-cycle targeted warning operating loop without cross-source contamination", () => {
    const cycleOne = buildRetainerCycleMemorySummary({
      generatedAt: "2026-04-15T00:00:00.000Z",
      accountId: "acct_1",
      userId: "user_1",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        metrics: [makeMetric({
          currentValue: 0.35,
          previousValue: 0.2,
          delta: 0.15,
          direction: "DETERIORATING",
          explanation: "meetingCancellationRate deteriorated.",
        })],
      }),
      priorBehavioralTrends: [],
    });

    expect(cycleOne.findings[0]?.status).toBe("NEW_SIGNAL");

    const targetedWarning = buildBehavioralTrendStructuredAction(makeTrendSummary({
      metrics: [makeMetric({
        direction: "RECURRING",
        explanation: "meetingCancellationRate has repeatedly deteriorated across windows.",
      })],
      repeatedDriftSignals: ["meetingCancellationRate"],
      hasRecurrence: true,
    }));

    expect(targetedWarning?.targetScope).toBe("SOURCE_SIGNAL");
    expect(targetedWarning?.targetSource).toBe("google_calendar");
    expect(targetedWarning?.targetSignalKey).toBe("meetingCancellationRate");
    expect(targetedWarning?.caseId).toBeUndefined();

    const cycleTwo = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      accountId: "acct_1",
      userId: "user_1",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary(),
      priorBehavioralTrends: [{
        observedAt: "2026-04-15T00:00:00.000Z",
        behavioralEvidenceStatus: "snapshot",
        behavioralTrends: makeTrendSummary({
          metrics: [makeMetric({
            currentValue: 0.35,
            previousValue: 0.2,
            delta: 0.15,
            direction: "DETERIORATING",
            explanation: "meetingCancellationRate deteriorated.",
          })],
        }),
      }],
      priorStructuredActions: [{
        actionType: "REVIEW_OPERATING_CADENCE",
        targetScope: "SOURCE_SIGNAL",
        source: "google_calendar",
        signalKey: "meetingCancellationRate",
        createdAt: "2026-04-15T00:00:00.000Z",
      }],
    });

    expect(cycleTwo.findings[0]?.status).toBe("DETERIORATED_AFTER_WARNING");

    const slackNegative = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      accountId: "acct_1",
      userId: "user_1",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        metrics: [makeMetric({
          source: "slack",
          sourceLabel: "Slack",
          currentValue: 8,
          previousValue: 4,
          delta: 4,
          signalKey: "meetingCancellationRate",
          direction: "DETERIORATING",
          explanation: "Slack responsiveness deteriorated.",
        })],
      }),
      priorBehavioralTrends: [{
        observedAt: "2026-04-15T00:00:00.000Z",
        behavioralEvidenceStatus: "snapshot",
        behavioralTrends: makeTrendSummary({
          metrics: [makeMetric({
            currentValue: 0.35,
            previousValue: 0.2,
            delta: 0.15,
            direction: "DETERIORATING",
            explanation: "meetingCancellationRate deteriorated.",
          })],
        }),
      }],
      priorStructuredActions: [{
        actionType: "REVIEW_OPERATING_CADENCE",
        targetScope: "SOURCE_SIGNAL",
        source: "google_calendar",
        signalKey: "meetingCancellationRate",
        createdAt: "2026-04-15T00:00:00.000Z",
      }],
    });

    expect(slackNegative.findings[0]?.status).toBe("NEW_SIGNAL");
  });

  it("keeps client-safe retainer cycle memory output summarized without provider payload fields", () => {
    const retainerCycleMemory = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      accountId: "acct_1",
      userId: "user_1",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary(),
      priorBehavioralTrends: [{
        observedAt: "2026-04-15T00:00:00.000Z",
        behavioralEvidenceStatus: "snapshot",
        behavioralTrends: makeTrendSummary({
          metrics: [makeMetric({
            currentValue: 0.35,
            previousValue: 0.2,
            delta: 0.15,
            direction: "DETERIORATING",
            explanation: "meetingCancellationRate deteriorated.",
          })],
        }),
      }],
      priorStructuredActions: [{
        actionType: "REVIEW_OPERATING_CADENCE",
        targetScope: "SOURCE_SIGNAL",
        source: "google_calendar",
        signalKey: "meetingCancellationRate",
        createdAt: "2026-04-15T00:00:00.000Z",
      }],
    });

    const safe = buildClientSafeOversightBrief({
      brief: makeBrief(retainerCycleMemory),
      access: {
        allowed: true,
        role: "SPONSOR",
        scopes: ["CONTROL_ROOM_VIEW", "CAMPAIGN_VIEW_AGGREGATE"],
        reason: "test",
        privacyBoundary: {
          canViewRawResponses: false,
          canViewNamedRespondents: true,
          canViewAggregates: true,
          smallSampleSuppressionApplies: false,
        },
      },
      audience: "CLIENT_SPONSOR",
    });

    expect(safe.brief.retainerCycleMemory?.status).toBe("available");
    expect(safe.brief.retainerCycleMemory?.escalationLevel).toBe("RETAINED_INTERVENTION");
    expect(safe.brief.retainerCycleMemory?.findings[0]?.explanation).toContain("google_calendar.meetingCancellationRate");
    expect("rawCountBasis" in (safe.brief.retainerCycleMemory?.findings[0] ?? {})).toBe(false);
    expect("metadata" in (safe.brief.retainerCycleMemory?.findings[0] ?? {})).toBe(false);
    expect("attendees" in (safe.brief.retainerCycleMemory?.findings[0] ?? {})).toBe(false);
    expect("payload" in (safe.brief.retainerCycleMemory?.findings[0] ?? {})).toBe(false);
  });
});
