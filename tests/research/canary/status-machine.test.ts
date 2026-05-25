/**
 * Canary: Status state machine is exhaustive and ARCHIVED is terminal.
 */

import { describe, it, expect } from "vitest";
import { assertTransitionAllowed, isTerminal, allowedTransitions, StatusTransitionError } from "@/lib/research/status-state-machine";
import type { RunStatus } from "@/lib/research/foundry-contract";

const ALL_STATUSES: RunStatus[] = [
  "PENDING", "PROCESSING", "IN_PROGRESS", "COMPLETE", "RECORDED",
  "ACTION_REQUIRED", "OWNER_DECISION_REQUIRED", "REVIEWED",
  "IMPLEMENTED", "DEFERRED", "FAILED", "ARCHIVED",
];

describe("StatusStateMachine", () => {
  it("ARCHIVED is terminal — no transitions out", () => {
    expect(allowedTransitions("ARCHIVED")).toEqual([]);
    expect(isTerminal("ARCHIVED")).toBe(true);
  });

  it("non-ARCHIVED statuses are not terminal", () => {
    for (const status of ALL_STATUSES.filter((s) => s !== "ARCHIVED")) {
      expect(isTerminal(status), `${status} should not be terminal`).toBe(false);
    }
  });

  it("ARCHIVED→any throws StatusTransitionError", () => {
    for (const to of ALL_STATUSES.filter((s) => s !== "ARCHIVED")) {
      expect(() => assertTransitionAllowed("ARCHIVED", to)).toThrow(StatusTransitionError);
    }
  });

  it("valid transitions don't throw", () => {
    const validPairs: [RunStatus, RunStatus][] = [
      ["PENDING", "IN_PROGRESS"],
      ["IN_PROGRESS", "COMPLETE"],
      ["COMPLETE", "ACTION_REQUIRED"],
      ["ACTION_REQUIRED", "IMPLEMENTED"],
      ["COMPLETE", "ARCHIVED"],
      ["IMPLEMENTED", "ARCHIVED"],
    ];
    for (const [from, to] of validPairs) {
      expect(() => assertTransitionAllowed(from, to), `${from}→${to} should be valid`).not.toThrow();
    }
  });

  it("invalid transitions throw StatusTransitionError", () => {
    const invalidPairs: [RunStatus, RunStatus][] = [
      ["IMPLEMENTED", "PENDING"],
      ["ARCHIVED", "PENDING"],
      ["DEFERRED", "PROCESSING"],
    ];
    for (const [from, to] of invalidPairs) {
      expect(() => assertTransitionAllowed(from, to), `${from}→${to} should be invalid`).toThrow(StatusTransitionError);
    }
  });
});
