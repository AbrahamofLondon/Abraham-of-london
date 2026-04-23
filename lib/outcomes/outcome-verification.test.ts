import { describe, expect, it } from "vitest";

import type { OutcomeSnapshot } from "./outcome-model";
import { verifyOutcomeMovement } from "./outcome-verification";

function snapshot(overrides: Partial<OutcomeSnapshot> = {}): OutcomeSnapshot {
  return {
    id: "outcome",
    sessionId: "session-1",
    organisation: "AOL",
    baseline: {
      dissonance: 70,
      burnoutIndex: 60,
      sovereignCertainty: 35,
      escalationLevel: "high",
    },
    followUp: {
      dissonance: 70,
      burnoutIndex: 60,
      sovereignCertainty: 35,
      escalationLevel: "high",
    },
    delta: {
      dissonanceChange: 0,
      burnoutChange: 0,
      certaintyChange: 0,
    },
    outcomeClassification: "stable",
    timeToOutcomeDays: 30,
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("verifyOutcomeMovement", () => {
  it("distinguishes partial improvement with persistent contradiction from full resolution", () => {
    const result = verifyOutcomeMovement({
      baseline: snapshot(),
      followUp: snapshot({
        followUp: {
          dissonance: 54,
          burnoutIndex: 48,
          sovereignCertainty: 51,
          escalationLevel: "medium",
        },
      }),
      interventionPath: ["Clarify owner", "Remove constraint"],
      unresolvedContradictions: ["Authority remains informal"],
    });

    expect(result.outcomeClassification).toBe("improved");
    expect(result.unresolvedContradictionPersistence).toContain("Authority remains informal");
    expect(result.interventionEffectivenessScore).toBeLessThan(90);
    expect(result.evidenceNodes.some((node) => node.kind === "partial_resolution")).toBe(true);
    expect(result.evidenceNodes.some((node) => node.kind === "intervention_effectiveness")).toBe(true);
  });

  it("classifies full resolution without persistent root cause", () => {
    const result = verifyOutcomeMovement({
      baseline: snapshot(),
      followUp: snapshot({
        followUp: {
          dissonance: 45,
          burnoutIndex: 44,
          sovereignCertainty: 66,
          escalationLevel: "none",
        },
      }),
    });

    expect(result.outcomeClassification).toBe("resolved");
    expect(result.unresolvedContradictionPersistence).toEqual([]);
    expect(result.evidenceNodes.some((node) => node.kind === "resolved_condition")).toBe(true);
  });
});
