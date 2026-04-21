import { beforeEach, describe, expect, it } from "vitest";
import {
  buildObservedOutcomeEvidence,
  recordOutcomeSnapshot,
  resetOutcomeEvidenceForTests,
} from "./evidence";
import {
  getOutcomeFeedbackState,
  resetOutcomeFeedbackForTests,
} from "./feedback-loop";
import {
  classifyOutcome,
  createDecisionOutcomeLink,
  normalizeOutcomeSnapshot,
  type OutcomeSnapshot,
} from "./outcome-model";

function snapshot(
  overrides: Partial<OutcomeSnapshot> = {},
): OutcomeSnapshot {
  return normalizeOutcomeSnapshot({
    id: overrides.id ?? "out_1",
    sessionId: overrides.sessionId ?? "sr_1",
    organisation: overrides.organisation,
    baseline: overrides.baseline ?? {
      dissonance: 60,
      burnoutIndex: 65,
      sovereignCertainty: 40,
      escalationLevel: "STRATEGY",
    },
    followUp: overrides.followUp ?? {
      dissonance: 38,
      burnoutIndex: 50,
      sovereignCertainty: 58,
      escalationLevel: "none",
    },
    timeToOutcomeDays: overrides.timeToOutcomeDays ?? 28,
    createdAt: overrides.createdAt ?? new Date("2026-04-21T00:00:00.000Z"),
  });
}

describe("outcome intelligence", () => {
  beforeEach(() => {
    resetOutcomeEvidenceForTests();
    resetOutcomeFeedbackForTests();
  });

  it("classifies resolved outcomes when dissonance drops significantly and escalation clears", () => {
    expect(classifyOutcome(snapshot())).toBe("resolved");
  });

  it("classifies improved outcomes when dissonance drops but structural risk remains", () => {
    expect(
      classifyOutcome(
        snapshot({
          followUp: {
            dissonance: 50,
            burnoutIndex: 55,
            sovereignCertainty: 50,
            escalationLevel: "DIAGNOSTIC",
          },
        }),
      ),
    ).toBe("improved");
  });

  it("classifies stable outcomes when movement is not meaningful", () => {
    expect(
      classifyOutcome(
        snapshot({
          followUp: {
            dissonance: 60,
            burnoutIndex: 65,
            sovereignCertainty: 40,
            escalationLevel: "STRATEGY",
          },
        }),
      ),
    ).toBe("stable");
  });

  it("classifies deterioration when dissonance rises or escalation worsens", () => {
    expect(
      classifyOutcome(
        snapshot({
          followUp: {
            dissonance: 61,
            burnoutIndex: 70,
            sovereignCertainty: 35,
            escalationLevel: "STRATEGY",
          },
        }),
      ),
    ).toBe("deteriorated");

    expect(
      classifyOutcome(
        snapshot({
          baseline: {
            dissonance: 60,
            burnoutIndex: 65,
            sovereignCertainty: 40,
            escalationLevel: "DIAGNOSTIC",
          },
          followUp: {
            dissonance: 60,
            burnoutIndex: 65,
            sovereignCertainty: 40,
            escalationLevel: "CRITICAL",
          },
        }),
      ),
    ).toBe("deteriorated");
  });

  it("classifies invalid when follow-up data is insufficient", () => {
    expect(
      classifyOutcome(
        snapshot({
          followUp: {
            dissonance: Number.NaN,
            burnoutIndex: 65,
            sovereignCertainty: 40,
            escalationLevel: "STRATEGY",
          },
        }),
      ),
    ).toBe("invalid");
  });

  it("links decisions to intervention stack and outcome id", () => {
    expect(
      createDecisionOutcomeLink({
        decisionId: "decision_1",
        interventionStack: ["authority reset", "", "board cadence"],
        outcomeSnapshotId: "out_1",
      }),
    ).toEqual({
      decisionId: "decision_1",
      interventionStack: ["authority reset", "board cadence"],
      outcomeSnapshotId: "out_1",
    });
  });

  it("records feedback into tension weighting, escalation confidence, and trajectory calibration", () => {
    recordOutcomeSnapshot(
      snapshot({
        followUp: {
          dissonance: 70,
          burnoutIndex: 72,
          sovereignCertainty: 35,
          escalationLevel: "CRITICAL",
        },
      }),
    );

    const state = getOutcomeFeedbackState();
    expect(state.tensionWeighting.unmanaged_risk).toBeGreaterThan(1);
    expect(state.escalationConfidence).toBeGreaterThan(0.5);
    expect(state.trajectoryCalibration.deteriorated).toBe(1);
  });

  it("builds governed observed outcome evidence summaries", () => {
    recordOutcomeSnapshot(snapshot({ id: "out_1", timeToOutcomeDays: 28 }));
    recordOutcomeSnapshot(
      snapshot({
        id: "out_2",
        followUp: {
          dissonance: 52,
          burnoutIndex: 58,
          sovereignCertainty: 49,
          escalationLevel: "DIAGNOSTIC",
        },
        timeToOutcomeDays: 35,
      }),
    );
    recordOutcomeSnapshot(
      snapshot({
        id: "out_3",
        followUp: {
          dissonance: 68,
          burnoutIndex: 76,
          sovereignCertainty: 32,
          escalationLevel: "CRITICAL",
        },
        timeToOutcomeDays: 21,
      }),
    );

    const evidence = buildObservedOutcomeEvidence();
    expect(evidence.title).toBe("Observed Outcomes (System Evidence)");
    expect(evidence.processedDecisionCases).toBe(3);
    expect(evidence.improvedPercent).toBe(66.67);
    expect(evidence.failureRateWhenIgnored).toBe(33.33);
    expect(evidence.averageTimeToImprovementDays).toBe(31.5);
    expect(evidence.medianResolutionWindowDays).toBe(28);
  });
});
