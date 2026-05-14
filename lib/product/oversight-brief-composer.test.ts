import { describe, expect, it } from "vitest";
import type { BehavioralTrendSummary } from "@/lib/behavioral/behavioral-trend-contract";
import type { RetainerCycleMemorySummary } from "@/lib/product/retainer-cycle-memory-contract";
import {
  aggregateBehavioralTrendSummaries,
  buildBehavioralTrendStructuredAction,
  buildRetainerCycleMemoryStructuredAction,
  hasBehavioralTrendRecurrenceEvidence,
} from "./oversight-brief-composer";

function makeSummary(
  overrides: Partial<BehavioralTrendSummary> = {},
): BehavioralTrendSummary {
  return {
    userId: "user_1",
    source: "calendar",
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
      metrics: [{
        signalKey: "meetingCompletion",
        currentValue: 0.6,
        previousValue: 0.8,
        delta: -0.2,
        direction: "DETERIORATING",
        evidencePosture: "snapshot",
        explanation: "meetingCompletion has deteriorated from 0.80 to 0.60.",
      }],
      summary: "Behavioral signals are deteriorating across the current review window. Operating cadence appears to be weakening and should be reviewed.",
    });

    expect(hasBehavioralTrendRecurrenceEvidence(summary)).toBe(false);
    expect(buildBehavioralTrendStructuredAction(summary)).toBeNull();
  });

  it("does not create an action for insufficient evidence", () => {
    const summary = makeSummary();
    expect(hasBehavioralTrendRecurrenceEvidence(summary)).toBe(false);
    expect(buildBehavioralTrendStructuredAction(summary)).toBeNull();
  });

  it("does not create an action for stable trend", () => {
    const summary = makeSummary({
      overallDirection: "STABLE",
      metrics: [{
        signalKey: "meetingCompletion",
        currentValue: 0.8,
        previousValue: 0.78,
        delta: 0.02,
        direction: "STABLE",
        evidencePosture: "snapshot",
        explanation: "meetingCompletion is stable.",
      }],
      summary: "Behavioral signals are stable across the current review window. No material movement is visible from the current evidence.",
    });

    expect(buildBehavioralTrendStructuredAction(summary)).toBeNull();
  });

  it("does not create an action for improving trend", () => {
    const summary = makeSummary({
      overallDirection: "IMPROVING",
      metrics: [{
        signalKey: "meetingCompletion",
        currentValue: 0.9,
        previousValue: 0.7,
        delta: 0.2,
        direction: "IMPROVING",
        evidencePosture: "snapshot",
        explanation: "meetingCompletion has improved from 0.70 to 0.90.",
      }],
      summary: "Behavioral signals are improving across the current review window. Recent operating patterns are moving in a healthier direction.",
    });

    expect(buildBehavioralTrendStructuredAction(summary)).toBeNull();
  });

  it("creates the action when repeatedDriftSignals is populated", () => {
    const summary = makeSummary({
      overallDirection: "DETERIORATING",
      hasDeterioration: true,
      repeatedDriftSignals: ["meetingCompletion"],
      summary: "Behavioral signals are deteriorating across the current review window. Operating cadence appears to be weakening and should be reviewed.",
    });

    const action = buildBehavioralTrendStructuredAction(summary);
    expect(action).not.toBeNull();
    expect(action?.actionType).toBe("REVIEW_OPERATING_CADENCE");
    expect(action?.severity).toBe("HIGH");
    expect(action?.caseId).toBeUndefined();
  });

  it("creates the action when a metric is explicitly marked RECURRING", () => {
    const summary = makeSummary({
      overallDirection: "DETERIORATING",
      hasDeterioration: true,
      metrics: [{
        signalKey: "meetingCompletion",
        currentValue: 0.6,
        previousValue: 0.8,
        delta: -0.2,
        direction: "RECURRING",
        evidencePosture: "snapshot",
        explanation: "meetingCompletion has repeatedly deteriorated across windows.",
      }],
      summary: "Behavioral signals are deteriorating across the current review window. Operating cadence appears to be weakening and should be reviewed.",
    });

    const action = buildBehavioralTrendStructuredAction(summary);
    expect(action).not.toBeNull();
    expect(action?.caseId).toBeUndefined();
  });

  it("aggregated summaries do not invent recurrence from first-time deterioration", () => {
    const aggregate = aggregateBehavioralTrendSummaries("user_1", [
      makeSummary({
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [{
          signalKey: "meetingCompletion",
          currentValue: 0.6,
          previousValue: 0.8,
          delta: -0.2,
          direction: "DETERIORATING",
          evidencePosture: "snapshot",
          explanation: "meetingCompletion has deteriorated from 0.80 to 0.60.",
        }],
        summary: "Behavioral signals are deteriorating across the current review window. Operating cadence appears to be weakening and should be reviewed.",
      }),
    ]);

    expect(aggregate?.hasRecurrence).toBe(false);
    expect(aggregate?.repeatedDriftSignals).toEqual([]);
    expect(buildBehavioralTrendStructuredAction(aggregate)).toBeNull();
  });

  it("builds an account-scoped retained memory action without a fake caseId", () => {
    const action = buildRetainerCycleMemoryStructuredAction(makeCycleMemorySummary({
      findings: [{
        id: "retainer_memory_calendar_meetingCancellationRate_repeated_signal",
        signalKey: "meetingCancellationRate",
        source: "calendar",
        status: "REPEATED_SIGNAL",
        severity: "HIGH",
        currentDirection: "DETERIORATING",
        priorDirections: ["DETERIORATING"],
        cyclesObserved: 2,
        cyclesDeteriorating: 2,
        cyclesUnavailable: 0,
        explanation: "calendar.meetingCancellationRate has deteriorated across 2 retained cycles.",
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
