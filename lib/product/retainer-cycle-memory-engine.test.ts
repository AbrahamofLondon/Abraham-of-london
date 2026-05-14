import { describe, expect, it } from "vitest";

import type {
  BehavioralTrendDirection,
  BehavioralTrendMetric,
  BehavioralTrendSummary,
} from "@/lib/behavioral/behavioral-trend-contract";
import { buildRetainerCycleMemorySummary } from "@/lib/product/retainer-cycle-memory-engine";
import type {
  PriorBehavioralActionRecord,
  PriorBehavioralTrendCycle,
  RetainedEnforcementCycleRecord,
  RetainerCycleMemorySummary,
} from "@/lib/product/retainer-cycle-memory-contract";

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

function makeTrendSummary(overrides: Partial<BehavioralTrendSummary> = {}): BehavioralTrendSummary {
  return {
    userId: "user_1",
    source: "google_calendar",
    computedAt: "2026-05-14T00:00:00.000Z",
    overallDirection: "INSUFFICIENT_EVIDENCE",
    summary: "Behavioral trend evidence is insufficient for a cycle-over-cycle reading.",
    hasDeterioration: false,
    hasRecurrence: false,
    repeatedDriftSignals: [],
    insufficientDataKeys: [],
    metrics: [],
    ...overrides,
  };
}

function makeCycle(input: {
  direction: BehavioralTrendDirection;
  observedAt: string;
  signalKey?: string;
  source?: string | null;
}): PriorBehavioralTrendCycle {
  const signalKey = input.signalKey ?? "meetingCancellationRate";
  const source = input.source === undefined ? "google_calendar" : input.source;
  return {
    observedAt: input.observedAt,
    behavioralEvidenceStatus: "snapshot",
    behavioralTrends: makeTrendSummary({
      source: source ?? "behavioral",
      overallDirection: input.direction,
      hasDeterioration: input.direction === "DETERIORATING" || input.direction === "RECURRING",
      metrics: source
        ? [
            makeMetric({
              signalKey,
              source,
              sourceLabel: source === "slack" ? "Slack" : "Google Calendar",
              currentValue: input.direction === "IMPROVING" ? 0.1 : 0.4,
              previousValue: 0.2,
              delta: input.direction === "IMPROVING" ? -0.1 : input.direction === "STABLE" ? 0 : 0.2,
              direction: input.direction,
              explanation: `${source}.${signalKey} ${input.direction.toLowerCase()}`,
            }),
          ]
        : [
            makeMetric({
              signalKey,
              source: null,
              sourceLabel: null,
              direction: input.direction,
              explanation: `${signalKey} ${input.direction.toLowerCase()}`,
            }),
          ],
    }),
  };
}

function makeWarning(overrides: Partial<PriorBehavioralActionRecord> = {}): PriorBehavioralActionRecord {
  return {
    actionType: "REVIEW_OPERATING_CADENCE",
    targetScope: "SOURCE_SIGNAL",
    source: "google_calendar",
    signalKey: "meetingCancellationRate",
    createdAt: "2026-04-15T00:00:00.000Z",
    ...overrides,
  };
}

function makeIntervention(
  overrides: Partial<RetainedEnforcementCycleRecord> = {},
): RetainedEnforcementCycleRecord {
  return {
    cycleId: "rrc_1",
    targetScope: "SOURCE_SIGNAL",
    targetSource: "google_calendar",
    targetSignalKey: "meetingCancellationRate",
    cadenceState: "COMPLETED",
    completedAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    ...overrides,
  };
}

function buildSummary(
  overrides: Partial<Parameters<typeof buildRetainerCycleMemorySummary>[0]> = {},
): RetainerCycleMemorySummary {
  return buildRetainerCycleMemorySummary({
    generatedAt: "2026-05-14T00:00:00.000Z",
    accountId: "acct_1",
    userId: "user_1",
    currentBehavioralEvidenceStatus: "snapshot",
    currentBehavioralTrends: makeTrendSummary(),
    priorBehavioralTrends: [],
    ...overrides,
  });
}

describe("retainer cycle memory engine", () => {
  it("treats first-time deterioration as NEW_SIGNAL rather than recurrence", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric()],
      }),
    });

    expect(summary.findings[0]?.status).toBe("NEW_SIGNAL");
    expect(summary.escalationLevel).toBe("NONE");
  });

  it("marks same source plus signal across cycles as REPEATED_SIGNAL", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric()],
      }),
      priorBehavioralTrends: [makeCycle({ direction: "DETERIORATING", observedAt: "2026-04-01T00:00:00.000Z" })],
    });

    expect(summary.findings[0]?.status).toBe("REPEATED_SIGNAL");
    expect(summary.findings[0]?.source).toBe("google_calendar");
    expect(summary.escalationLevel).toBe("OPERATING_CADENCE_RESET");
  });

  it("does not compare the same signal key across different sources", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric({ source: "slack", sourceLabel: "Slack" })],
      }),
      priorBehavioralTrends: [makeCycle({ direction: "DETERIORATING", observedAt: "2026-04-01T00:00:00.000Z" })],
    });

    expect(summary.findings[0]?.status).toBe("NEW_SIGNAL");
    expect(summary.findings[0]?.source).toBe("slack");
  });

  it("downgrades safely when prior archived data lacks source identity", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric()],
      }),
      priorBehavioralTrends: [makeCycle({
        direction: "DETERIORATING",
        observedAt: "2026-04-01T00:00:00.000Z",
        source: null,
      })],
    });

    expect(summary.findings[0]?.status).toBe("NEW_SIGNAL");
  });

  it("does not turn a generic account warning into every metric's warning history", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric()],
      }),
      priorBehavioralTrends: [makeCycle({ direction: "DETERIORATING", observedAt: "2026-04-01T00:00:00.000Z" })],
      priorStructuredActions: [makeWarning({
        targetScope: "ACCOUNT",
        source: null,
        signalKey: null,
      })],
    });

    expect(summary.findings[0]?.status).toBe("REPEATED_SIGNAL");
  });

  it("marks deterioration after matching targeted warning distinctly", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric()],
      }),
      priorBehavioralTrends: [makeCycle({ direction: "DETERIORATING", observedAt: "2026-04-01T00:00:00.000Z" })],
      priorStructuredActions: [makeWarning()],
    });

    expect(summary.findings[0]?.status).toBe("DETERIORATED_AFTER_WARNING");
    expect(summary.escalationLevel).toBe("RETAINED_INTERVENTION");
  });

  it("does not trigger warning lineage for a non-matching targeted warning", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric()],
      }),
      priorBehavioralTrends: [makeCycle({ direction: "DETERIORATING", observedAt: "2026-04-01T00:00:00.000Z" })],
      priorStructuredActions: [makeWarning({
        source: "slack",
        signalKey: "meetingCancellationRate",
      })],
    });

    expect(summary.findings[0]?.status).toBe("REPEATED_SIGNAL");
  });

  it("marks deterioration after matching targeted intervention distinctly", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric()],
      }),
      priorBehavioralTrends: [makeCycle({ direction: "DETERIORATING", observedAt: "2026-04-01T00:00:00.000Z" })],
      priorStructuredActions: [makeWarning()],
      retainedEnforcementCycles: [makeIntervention()],
    });

    expect(summary.findings[0]?.status).toBe("DETERIORATED_AFTER_INTERVENTION");
    expect(summary.escalationLevel).toBe("BOARDROOM_REVIEW");
  });

  it("recognises improvement after matching targeted intervention", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "IMPROVING",
        metrics: [makeMetric({
          currentValue: 0.1,
          previousValue: 0.4,
          delta: -0.3,
          direction: "IMPROVING",
          explanation: "meetingCancellationRate improved.",
        })],
      }),
      priorBehavioralTrends: [makeCycle({ direction: "DETERIORATING", observedAt: "2026-04-01T00:00:00.000Z" })],
      priorStructuredActions: [makeWarning()],
      retainedEnforcementCycles: [makeIntervention()],
    });

    expect(summary.findings[0]?.status).toBe("IMPROVED_AFTER_INTERVENTION");
    expect(summary.escalationLevel).toBe("NONE");
  });

  it("keeps account-wide intervention account-wide rather than fabricating signal-specific failure", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric()],
      }),
      priorBehavioralTrends: [makeCycle({ direction: "DETERIORATING", observedAt: "2026-04-01T00:00:00.000Z" })],
      priorStructuredActions: [makeWarning({
        targetScope: "ACCOUNT",
        source: null,
        signalKey: null,
      })],
      retainedEnforcementCycles: [makeIntervention({
        targetScope: "ACCOUNT",
        targetSource: null,
        targetSignalKey: null,
      })],
    });

    expect(summary.findings.some((finding) =>
      finding.signalKey === "meetingCancellationRate"
      && finding.status === "DETERIORATED_AFTER_INTERVENTION"
    )).toBe(false);
    expect(summary.findings.some((finding) =>
      finding.signalKey === "behavioralOperatingCadence"
      && finding.status === "DETERIORATED_AFTER_INTERVENTION"
    )).toBe(true);
  });

  it("tracks unavailable evidence separately from deterioration", () => {
    const summary = buildSummary({
      currentBehavioralEvidenceStatus: "unavailable",
      currentBehavioralTrends: null,
      priorBehavioralTrends: [
        {
          observedAt: "2026-04-01T00:00:00.000Z",
          behavioralEvidenceStatus: "snapshot",
          behavioralTrends: makeTrendSummary({
            source: "google_calendar",
            overallDirection: "STABLE",
            metrics: [makeMetric({
              currentValue: 0.2,
              previousValue: 0.2,
              delta: 0,
              direction: "STABLE",
              explanation: "stable",
            })],
          }),
        },
      ],
    });

    expect(summary.findings.some((finding) => finding.status === "EVIDENCE_UNAVAILABLE")).toBe(true);
    expect(summary.findings.some((finding) => finding.status === "REPEATED_SIGNAL")).toBe(false);
  });

  it("returns INSUFFICIENT_HISTORY when no baseline exists", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "google_calendar",
        overallDirection: "INSUFFICIENT_EVIDENCE",
      }),
      priorBehavioralTrends: [],
    });

    expect(summary.findings[0]?.status).toBe("INSUFFICIENT_HISTORY");
    expect(summary.status).toBe("insufficient");
  });

  it("propagates sourceLabel from BehavioralTrendMetric onto RetainerCycleMemoryFinding", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric({ source: "google_calendar", sourceLabel: "Google Calendar" })],
      }),
    });

    expect(summary.findings[0]?.sourceLabel).toBe("Google Calendar");
  });

  it("keeps source as the lineage key independent of sourceLabel", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric({ source: "google_calendar", sourceLabel: "Google Calendar" })],
      }),
    });

    expect(summary.findings[0]?.source).toBe("google_calendar");
    expect(summary.findings[0]?.sourceLabel).toBe("Google Calendar");
  });

  it("allows sourceLabel to differ from source without affecting recurrence logic", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric({ source: "google_calendar", sourceLabel: "Calendar" })],
      }),
      priorBehavioralTrends: [makeCycle({ direction: "DETERIORATING", observedAt: "2026-04-01T00:00:00.000Z" })],
    });

    expect(summary.findings[0]?.status).toBe("REPEATED_SIGNAL");
    expect(summary.findings[0]?.sourceLabel).toBe("Calendar");
  });

  it("sets sourceLabel to null when BehavioralTrendMetric provides no sourceLabel", () => {
    const summary = buildSummary({
      currentBehavioralTrends: makeTrendSummary({
        source: "behavioral",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [makeMetric({ source: "google_calendar", sourceLabel: undefined })],
      }),
    });

    expect(summary.findings[0]?.sourceLabel).toBeNull();
  });
});
