import { vi, describe, expect, it } from "vitest";
vi.mock("server-only", () => ({}));

import type {
  BehavioralTrendMetric,
  BehavioralTrendSummary,
} from "@/lib/behavioral/behavioral-trend-contract";
import type { RetainerCycleMemorySummary } from "@/lib/product/retainer-cycle-memory-contract";
import {
  aggregateBehavioralTrendSummaries,
  buildBehavioralTrendStructuredAction,
  buildRetainerCycleMemoryStructuredAction,
  hasBehavioralTrendRecurrenceEvidence,
} from "./oversight-brief-composer";

function makeMetric(overrides: Partial<BehavioralTrendMetric> = {}): BehavioralTrendMetric {
  return {
    signalKey: "meetingCancellationRate",
    source: "google_calendar",
    sourceLabel: "Google Calendar",
    currentValue: 0.4,
    previousValue: 0.2,
    delta: 0.2,
    direction: "DETERIORATING",
    evidencePosture: "snapshot",
    evidenceWindowStart: "2026-05-01T00:00:00.000Z",
    evidenceWindowEnd: "2026-05-14T00:00:00.000Z",
    previousWindowStart: "2026-04-17T00:00:00.000Z",
    previousWindowEnd: "2026-04-30T00:00:00.000Z",
    explanation: "meetingCancellationRate deteriorated.",
    ...overrides,
  };
}

function makeSummary(overrides: Partial<BehavioralTrendSummary> = {}): BehavioralTrendSummary {
  return {
    userId: "user_1",
    source: "google_calendar",
    computedAt: "2026-05-14T00:00:00.000Z",
    metrics: [],
    overallDirection: "INSUFFICIENT_EVIDENCE",
    summary: "Behavioral trend evidence is insufficient for a cycle-over-cycle reading.",
    hasDeterioration: false,
    hasRecurrence: false,
    repeatedDriftSignals: [],
    insufficientDataKeys: [],
    ...overrides,
  };
}

function makeCycleMemorySummary(
  overrides: Partial<RetainerCycleMemorySummary> = {},
): RetainerCycleMemorySummary {
  return {
    status: "available",
    generatedAt: "2026-05-14T00:00:00.000Z",
    accountId: "acct_1",
    userId: "user_1",
    findings: [],
    escalationRequired: false,
    escalationLevel: "NONE",
    summary: "Retained cycle memory is available but does not yet support stronger recurrence claims.",
    ...overrides,
  };
}

describe("behavioral trend recurrence action gate", () => {
  it("suppresses the recurring action for first-time deterioration from one previous/current comparison", () => {
    const summary = makeSummary({
      overallDirection: "DETERIORATING",
      hasDeterioration: true,
      metrics: [makeMetric({
        signalKey: "meetingCompletion",
        currentValue: 0.6,
        previousValue: 0.8,
        delta: -0.2,
        direction: "DETERIORATING",
        explanation: "meetingCompletion has deteriorated from 0.80 to 0.60.",
      })],
      summary: "Behavioral signals are deteriorating across the current review window. Operating cadence appears to be weakening and should be reviewed.",
    });

    expect(hasBehavioralTrendRecurrenceEvidence(summary)).toBe(false);
    expect(buildBehavioralTrendStructuredAction(summary)).toBeNull();
  });

  it("creates a targeted cadence action when recurrence evidence points to one source plus signal", () => {
    const summary = makeSummary({
      source: "behavioral",
      overallDirection: "DETERIORATING",
      hasDeterioration: true,
      metrics: [makeMetric({
        signalKey: "meetingCompletion",
        direction: "RECURRING",
        currentValue: 0.6,
        previousValue: 0.8,
        delta: -0.2,
        explanation: "meetingCompletion has repeatedly deteriorated across windows.",
      })],
      repeatedDriftSignals: ["meetingCompletion"],
      summary: "Behavioral signals are deteriorating across the current review window. Operating cadence appears to be weakening and should be reviewed.",
    });

    const action = buildBehavioralTrendStructuredAction(summary);
    expect(action).not.toBeNull();
    expect(action?.targetScope).toBe("SOURCE_SIGNAL");
    expect(action?.targetSource).toBe("google_calendar");
    expect(action?.targetSignalKey).toBe("meetingCompletion");
    expect(action?.caseId).toBeUndefined();
  });

  it("falls back to an explicit account-wide cadence action when recurrence spans multiple targets", () => {
    const summary = makeSummary({
      source: "behavioral",
      overallDirection: "DETERIORATING",
      hasDeterioration: true,
      metrics: [
        makeMetric({
          signalKey: "meetingCompletion",
          direction: "RECURRING",
          explanation: "Google Calendar recurrence.",
        }),
        makeMetric({
          signalKey: "slackResponsiveness",
          source: "slack",
          sourceLabel: "Slack",
          currentValue: 8,
          previousValue: 4,
          delta: 4,
          direction: "RECURRING",
          explanation: "Slack responsiveness recurrence.",
        }),
      ],
      summary: "Behavioral signals are deteriorating across the current review window. Operating cadence appears to be weakening and should be reviewed.",
    });

    const action = buildBehavioralTrendStructuredAction(summary);
    expect(action).not.toBeNull();
    expect(action?.targetScope).toBe("ACCOUNT");
    expect(action?.targetSource).toBeNull();
    expect(action?.targetSignalKey).toBeNull();
  });

  it("aggregated multi-source summaries preserve per-metric source identity", () => {
    const aggregate = aggregateBehavioralTrendSummaries("user_1", [
      makeSummary({
        source: "google_calendar",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric({
          signalKey: "meetingCompletion",
          direction: "DETERIORATING",
        })],
      }),
      makeSummary({
        source: "slack",
        overallDirection: "STABLE",
        metrics: [makeMetric({
          signalKey: "slackResponsiveness",
          source: "slack",
          sourceLabel: "Slack",
          currentValue: 3,
          previousValue: 3,
          delta: 0,
          direction: "STABLE",
          explanation: "Slack responsiveness is stable.",
        })],
      }),
    ]);

    expect(aggregate?.source).toBe("behavioral");
    expect(aggregate?.metrics.map((metric) => `${metric.source}:${metric.signalKey}`)).toEqual([
      "google_calendar:meetingCompletion",
      "slack:slackResponsiveness",
    ]);
  });

  it("builds an account-scoped retained memory action without a fake caseId", () => {
    const action = buildRetainerCycleMemoryStructuredAction(makeCycleMemorySummary({
      findings: [{
        id: "retainer_memory_google_calendar_meetingCancellationRate_repeated_signal",
        signalKey: "meetingCancellationRate",
        source: "google_calendar",
        status: "REPEATED_SIGNAL",
        severity: "HIGH",
        currentDirection: "DETERIORATING",
        priorDirections: ["DETERIORATING"],
        cyclesObserved: 2,
        cyclesDeteriorating: 2,
        cyclesUnavailable: 0,
        explanation: "google_calendar.meetingCancellationRate has deteriorated across 2 retained cycles.",
        recommendedAction: "Review operating cadence and unresolved commitments before the next retained cycle closes.",
      }],
      escalationRequired: true,
      escalationLevel: "OPERATING_CADENCE_RESET",
      summary: "1 behavioral signal shows repeated deterioration across retained oversight cycles.",
    }));

    expect(action).not.toBeNull();
    expect(action?.scopeType).toBe("ACCOUNT");
    expect(action?.caseId).toBeUndefined();
    expect(action?.actionType).toBe("REVIEW_OPERATING_CADENCE");
  });
});
