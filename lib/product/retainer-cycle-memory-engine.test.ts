import { describe, expect, it } from "vitest";

import type { BehavioralTrendSummary } from "@/lib/behavioral/behavioral-trend-contract";
import {
  buildRetainerCycleMemorySummary,
} from "@/lib/product/retainer-cycle-memory-engine";
import type {
  PriorBehavioralActionRecord,
  PriorBehavioralTrendCycle,
  RetainedEnforcementCycleRecord,
} from "@/lib/product/retainer-cycle-memory-contract";

function makeTrendSummary(overrides: Partial<BehavioralTrendSummary> = {}): BehavioralTrendSummary {
  return {
    userId: "user_1",
    source: "calendar",
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

function makeCycle(
  direction: "DETERIORATING" | "IMPROVING" | "STABLE" | "INSUFFICIENT_EVIDENCE",
  observedAt: string,
  signalKey = "meetingCancellationRate",
  source = "calendar",
): PriorBehavioralTrendCycle {
  return {
    observedAt,
    behavioralEvidenceStatus: "snapshot",
    behavioralTrends: makeTrendSummary({
      source,
      overallDirection: direction,
      hasDeterioration: direction === "DETERIORATING",
      metrics: [{
        signalKey,
        currentValue: direction === "IMPROVING" ? 0.1 : 0.4,
        previousValue: 0.2,
        delta: direction === "IMPROVING" ? -0.1 : direction === "DETERIORATING" ? 0.2 : 0,
        direction,
        evidencePosture: "snapshot",
        explanation: `${signalKey} ${direction.toLowerCase()}`,
      }],
    }),
  };
}

function makeWarning(signalKey = "meetingCancellationRate", source = "calendar"): PriorBehavioralActionRecord {
  return {
    actionType: "REVIEW_OPERATING_CADENCE",
    signalKey,
    source,
    createdAt: "2026-04-15T00:00:00.000Z",
  };
}

function makeIntervention(): RetainedEnforcementCycleRecord {
  return {
    cycleId: "rrc_1",
    cadenceState: "COMPLETED",
    completedAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
  };
}

describe("retainer cycle memory engine", () => {
  it("treats first-time deterioration as NEW_SIGNAL rather than recurrence", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      accountId: "acct_1",
      userId: "user_1",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        source: "calendar",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [{
          signalKey: "meetingCancellationRate",
          currentValue: 0.4,
          previousValue: 0.2,
          delta: 0.2,
          direction: "DETERIORATING",
          evidencePosture: "snapshot",
          explanation: "meetingCancellationRate deteriorated.",
        }],
      }),
      priorBehavioralTrends: [],
    });

    expect(summary.findings[0]?.status).toBe("NEW_SIGNAL");
    expect(summary.escalationLevel).toBe("NONE");
  });

  it("marks two consecutive deteriorations as REPEATED_SIGNAL", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        source: "calendar",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [{
          signalKey: "meetingCancellationRate",
          currentValue: 0.4,
          previousValue: 0.2,
          delta: 0.2,
          direction: "DETERIORATING",
          evidencePosture: "snapshot",
          explanation: "meetingCancellationRate deteriorated.",
        }],
      }),
      priorBehavioralTrends: [makeCycle("DETERIORATING", "2026-04-01T00:00:00.000Z")],
    });

    expect(summary.findings[0]?.status).toBe("REPEATED_SIGNAL");
    expect(summary.escalationLevel).toBe("OPERATING_CADENCE_RESET");
  });

  it("marks deterioration after prior warning distinctly", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        source: "calendar",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [{
          signalKey: "meetingCancellationRate",
          currentValue: 0.45,
          previousValue: 0.2,
          delta: 0.25,
          direction: "DETERIORATING",
          evidencePosture: "snapshot",
          explanation: "meetingCancellationRate deteriorated again.",
        }],
      }),
      priorBehavioralTrends: [makeCycle("DETERIORATING", "2026-04-01T00:00:00.000Z")],
      priorStructuredActions: [makeWarning()],
    });

    expect(summary.findings[0]?.status).toBe("DETERIORATED_AFTER_WARNING");
    expect(summary.escalationLevel).toBe("RETAINED_INTERVENTION");
  });

  it("marks deterioration after intervention distinctly", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        source: "calendar",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [{
          signalKey: "meetingCancellationRate",
          currentValue: 0.45,
          previousValue: 0.2,
          delta: 0.25,
          direction: "DETERIORATING",
          evidencePosture: "snapshot",
          explanation: "meetingCancellationRate deteriorated again.",
        }],
      }),
      priorBehavioralTrends: [makeCycle("DETERIORATING", "2026-04-01T00:00:00.000Z")],
      priorStructuredActions: [makeWarning()],
      retainedEnforcementCycles: [makeIntervention()],
    });

    expect(summary.findings[0]?.status).toBe("DETERIORATED_AFTER_INTERVENTION");
    expect(summary.escalationLevel).toBe("BOARDROOM_REVIEW");
  });

  it("recognises improvement after intervention", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        source: "calendar",
        overallDirection: "IMPROVING",
        metrics: [{
          signalKey: "meetingCancellationRate",
          currentValue: 0.1,
          previousValue: 0.4,
          delta: -0.3,
          direction: "IMPROVING",
          evidencePosture: "snapshot",
          explanation: "meetingCancellationRate improved.",
        }],
      }),
      priorBehavioralTrends: [makeCycle("DETERIORATING", "2026-04-01T00:00:00.000Z")],
      priorStructuredActions: [makeWarning()],
      retainedEnforcementCycles: [makeIntervention()],
    });

    expect(summary.findings[0]?.status).toBe("IMPROVED_AFTER_INTERVENTION");
    expect(summary.escalationLevel).toBe("NONE");
  });

  it("tracks unavailable evidence separately from deterioration", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      currentBehavioralEvidenceStatus: "unavailable",
      currentBehavioralTrends: null,
      priorBehavioralTrends: [
        {
          observedAt: "2026-04-01T00:00:00.000Z",
          behavioralEvidenceStatus: "snapshot",
          behavioralTrends: makeTrendSummary({
            source: "calendar",
            overallDirection: "STABLE",
            metrics: [{
              signalKey: "meetingCancellationRate",
              currentValue: 0.2,
              previousValue: 0.2,
              delta: 0,
              direction: "STABLE",
              evidencePosture: "snapshot",
              explanation: "stable",
            }],
          }),
        },
      ],
    });

    expect(summary.findings.some((finding) => finding.status === "EVIDENCE_UNAVAILABLE")).toBe(true);
    expect(summary.findings.some((finding) => finding.status === "REPEATED_SIGNAL")).toBe(false);
  });

  it("gently escalates repeated unavailable evidence without claiming deterioration", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      currentBehavioralEvidenceStatus: "unavailable",
      currentBehavioralTrends: null,
      priorBehavioralTrends: [
        { observedAt: "2026-04-20T00:00:00.000Z", behavioralEvidenceStatus: "unavailable", behavioralTrends: null },
        { observedAt: "2026-04-01T00:00:00.000Z", behavioralEvidenceStatus: "snapshot", behavioralTrends: makeTrendSummary() },
      ],
    });

    const finding = summary.findings.find((item) => item.status === "EVIDENCE_UNAVAILABLE");
    expect(finding?.cyclesUnavailable).toBe(2);
    expect(summary.escalationLevel).toBe("OPERATING_CADENCE_RESET");
    expect(summary.findings.some((item) => item.status === "REPEATED_SIGNAL")).toBe(false);
  });

  it("marks stable current behavior with prior deterioration as STABLE_UNRESOLVED", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        source: "calendar",
        overallDirection: "STABLE",
        metrics: [{
          signalKey: "meetingCancellationRate",
          currentValue: 0.2,
          previousValue: 0.2,
          delta: 0,
          direction: "STABLE",
          evidencePosture: "snapshot",
          explanation: "stable",
        }],
      }),
      priorBehavioralTrends: [makeCycle("DETERIORATING", "2026-04-01T00:00:00.000Z")],
    });

    expect(summary.findings[0]?.status).toBe("STABLE_UNRESOLVED");
  });

  it("returns INSUFFICIENT_HISTORY when no baseline exists", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        source: "calendar",
        overallDirection: "INSUFFICIENT_EVIDENCE",
      }),
      priorBehavioralTrends: [],
    });

    expect(summary.findings[0]?.status).toBe("INSUFFICIENT_HISTORY");
    expect(summary.status).toBe("insufficient");
  });

  it("requires stronger evidence for counsel escalation", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        source: "calendar",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [{
          signalKey: "meetingCancellationRate",
          currentValue: 0.45,
          previousValue: 0.2,
          delta: 0.25,
          direction: "DETERIORATING",
          evidencePosture: "snapshot",
          explanation: "meetingCancellationRate deteriorated again.",
        }],
      }),
      priorBehavioralTrends: [makeCycle("DETERIORATING", "2026-04-01T00:00:00.000Z")],
      priorStructuredActions: [makeWarning()],
      retainedEnforcementCycles: [makeIntervention()],
      governanceFlags: { counselReviewRequired: true },
    });

    expect(summary.escalationLevel).toBe("COUNSEL_REVIEW");
  });

  it("does not compare unrelated signal keys or sources", () => {
    const summary = buildRetainerCycleMemorySummary({
      generatedAt: "2026-05-14T00:00:00.000Z",
      currentBehavioralEvidenceStatus: "snapshot",
      currentBehavioralTrends: makeTrendSummary({
        source: "slack",
        overallDirection: "DETERIORATING",
        hasDeterioration: true,
        metrics: [{
          signalKey: "slackResponsiveness",
          currentValue: 8,
          previousValue: 4,
          delta: 4,
          direction: "DETERIORATING",
          evidencePosture: "snapshot",
          explanation: "slack responsiveness deteriorated.",
        }],
      }),
      priorBehavioralTrends: [makeCycle("DETERIORATING", "2026-04-01T00:00:00.000Z", "meetingCancellationRate", "calendar")],
      priorStructuredActions: [makeWarning("meetingCancellationRate", "calendar")],
    });

    expect(summary.findings[0]?.status).toBe("NEW_SIGNAL");
    expect(summary.findings[0]?.source).toBe("slack");
  });

  it("client-facing summary uses governance language, not surveillance language", () => {
    const testScenarios: Array<{
      name: string;
      input: Parameters<typeof buildRetainerCycleMemorySummary>[0];
    }> = [
      {
        name: "NEW_SIGNAL",
        input: {
          generatedAt: "2026-05-14T00:00:00.000Z",
          currentBehavioralEvidenceStatus: "snapshot",
          currentBehavioralTrends: makeTrendSummary({
            source: "calendar",
            overallDirection: "DETERIORATING",
            hasDeterioration: true,
            metrics: [{
              signalKey: "meetingCancellationRate",
              currentValue: 0.4,
              previousValue: 0.2,
              delta: 0.2,
              direction: "DETERIORATING",
              evidencePosture: "snapshot",
              explanation: "meetingCancellationRate deteriorated.",
            }],
          }),
          priorBehavioralTrends: [],
        },
      },
      {
        name: "REPEATED_SIGNAL",
        input: {
          generatedAt: "2026-05-14T00:00:00.000Z",
          currentBehavioralEvidenceStatus: "snapshot",
          currentBehavioralTrends: makeTrendSummary({
            source: "calendar",
            overallDirection: "DETERIORATING",
            hasDeterioration: true,
            metrics: [{
              signalKey: "meetingCancellationRate",
              currentValue: 0.4,
              previousValue: 0.2,
              delta: 0.2,
              direction: "DETERIORATING",
              evidencePosture: "snapshot",
              explanation: "meetingCancellationRate deteriorated.",
            }],
          }),
          priorBehavioralTrends: [makeCycle("DETERIORATING", "2026-04-01T00:00:00.000Z")],
        },
      },
      {
        name: "EVIDENCE_UNAVAILABLE",
        input: {
          generatedAt: "2026-05-14T00:00:00.000Z",
          currentBehavioralEvidenceStatus: "unavailable",
          currentBehavioralTrends: null,
          priorBehavioralTrends: [
            {
              observedAt: "2026-04-01T00:00:00.000Z",
              behavioralEvidenceStatus: "snapshot",
              behavioralTrends: makeTrendSummary({
                source: "calendar",
                overallDirection: "STABLE",
                metrics: [{
                  signalKey: "meetingCancellationRate",
                  currentValue: 0.2,
                  previousValue: 0.2,
                  delta: 0,
                  direction: "STABLE",
                  evidencePosture: "snapshot",
                  explanation: "stable",
                }],
              }),
            },
          ],
        },
      },
      {
        name: "INSUFFICIENT_HISTORY",
        input: {
          generatedAt: "2026-05-14T00:00:00.000Z",
          currentBehavioralEvidenceStatus: "snapshot",
          currentBehavioralTrends: makeTrendSummary({
            source: "calendar",
            overallDirection: "INSUFFICIENT_EVIDENCE",
          }),
          priorBehavioralTrends: [],
        },
      },
      {
        name: "STABLE_UNRESOLVED",
        input: {
          generatedAt: "2026-05-14T00:00:00.000Z",
          currentBehavioralEvidenceStatus: "snapshot",
          currentBehavioralTrends: makeTrendSummary({
            source: "calendar",
            overallDirection: "STABLE",
            metrics: [{
              signalKey: "meetingCancellationRate",
              currentValue: 0.2,
              previousValue: 0.2,
              delta: 0,
              direction: "STABLE",
              evidencePosture: "snapshot",
              explanation: "stable",
            }],
          }),
          priorBehavioralTrends: [makeCycle("DETERIORATING", "2026-04-01T00:00:00.000Z")],
        },
      },
    ];

    const prohibitedPhrases = [
      "you keep", "you failed", "you are", "your fault",
      "you always", "you never", "you refuse", "you did",
      "you have not", "you cannot",
    ];

    const governanceTerms = [
      "cycle", "evidence", "signal", "pattern", "prior",
      "intervention", "baseline", "operating", "governance",
      "retained", "behavioral",
    ];

    for (const scenario of testScenarios) {
      const summary = buildRetainerCycleMemorySummary(scenario.input);

      expect(summary.summary).toBeTruthy();
      expect(summary.summary.length).toBeGreaterThan(10);

      for (const phrase of prohibitedPhrases) {
        expect(summary.summary.toLowerCase()).not.toContain(phrase);
      }

      const hasGovernanceTerm = governanceTerms.some((term) =>
        summary.summary.toLowerCase().includes(term),
      );
      expect(hasGovernanceTerm).toBe(true);

      for (const finding of summary.findings) {
        for (const phrase of prohibitedPhrases) {
          expect(finding.explanation.toLowerCase()).not.toContain(phrase);
        }
      }
    }
  });
});
