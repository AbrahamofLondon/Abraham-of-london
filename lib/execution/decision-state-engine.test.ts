import { describe, expect, it } from "vitest";

import {
  computeDynamicConsequence,
  evaluateStateTransition,
  type SessionExecutionState,
} from "./decision-state-engine";

function state(overrides: Partial<SessionExecutionState> = {}): SessionExecutionState {
  return {
    sessionId: "sr_1",
    systemState: "PENDING",
    actions: [],
    escalationTriggers: [],
    consequenceScore: 0,
    lastEscalationCheck: new Date().toISOString(),
    avoidancePatterns: [],
    directive: null,
    ...overrides,
  };
}

describe("decision-state-engine", () => {
  it("escalates when repeated action deadlines are missed", () => {
    const past = new Date(Date.now() - 3 * 86400000).toISOString();
    const result = evaluateStateTransition(state({
      actions: [
        { id: "a", text: "Assign owner", status: "PENDING", deadline: past, createdAt: past, updatedAt: past, avoidanceCount: 0 },
        { id: "b", text: "Remove constraint", status: "PENDING", deadline: past, createdAt: past, updatedAt: past, avoidanceCount: 0 },
      ],
    }));

    expect(result.newState).toBe("ESCALATED");
    expect(result.triggers).toContain("ACTIONS_SKIPPED");
    expect(result.directive).toContain("passed their deadlines");
  });

  it("prices consequence from delay, blockage, and failure state", () => {
    const past = new Date(Date.now() - 4 * 86400000).toISOString();
    const result = computeDynamicConsequence(state({
      actions: [
        { id: "a", text: "Assign owner", status: "PENDING", deadline: past, createdAt: past, updatedAt: past, avoidanceCount: 0 },
        { id: "b", text: "Remove constraint", status: "BLOCKED", deadline: past, createdAt: past, updatedAt: past, avoidanceCount: 0 },
        { id: "c", text: "Confirm move", status: "FAILED", deadline: past, createdAt: past, updatedAt: past, avoidanceCount: 0 },
      ],
    }));

    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(["ESCALATING", "CRITICAL"]).toContain(result.trend);
  });
});
