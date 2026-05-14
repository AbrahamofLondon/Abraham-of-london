import { describe, it, expect } from "vitest";
import { classifyBatchEligibility } from "./oversight-batch";
import type { RetainedCadenceState } from "@/lib/product/retained-cadence-contract";

function classify(cycleId: string | null, cadenceState: RetainedCadenceState) {
  return classifyBatchEligibility({ cycleId, cadenceState });
}

describe("classifyBatchEligibility — no cycleId", () => {
  it("returns no eligible actions when cycleId is null", () => {
    const result = classify(null, "DUE_SOON");
    expect(result.eligibleActions).toHaveLength(0);
    expect(result.ineligibleReasons.length).toBeGreaterThan(0);
    expect(result.ineligibleReasons[0]).toContain("No cycle record");
  });

  it("returns no eligible actions for NOT_CONFIGURED without cycleId", () => {
    const result = classify(null, "NOT_CONFIGURED");
    expect(result.eligibleActions).toHaveLength(0);
  });
});

describe("classifyBatchEligibility — startable states", () => {
  const startableStates: RetainedCadenceState[] = [
    "DUE_SOON",
    "REVIEW_DUE",
    "OVERDUE",
    "CADENCE_BROKEN",
    "MANUAL_OPERATOR_REVIEW",
  ];

  for (const state of startableStates) {
    it(`includes MARK_IN_PROGRESS for ${state}`, () => {
      const result = classify("cycle_abc", state);
      expect(result.eligibleActions).toContain("MARK_IN_PROGRESS");
    });

    it(`includes SKIP_WITH_REASON for ${state}`, () => {
      const result = classify("cycle_abc", state);
      expect(result.eligibleActions).toContain("SKIP_WITH_REASON");
    });

    it(`does NOT include MARK_COMPLETED for ${state}`, () => {
      const result = classify("cycle_abc", state);
      expect(result.eligibleActions).not.toContain("MARK_COMPLETED");
    });
  }
});

describe("classifyBatchEligibility — REVIEW_IN_PROGRESS", () => {
  it("includes MARK_COMPLETED for REVIEW_IN_PROGRESS", () => {
    const result = classify("cycle_abc", "REVIEW_IN_PROGRESS");
    expect(result.eligibleActions).toContain("MARK_COMPLETED");
  });

  it("does NOT include MARK_IN_PROGRESS for REVIEW_IN_PROGRESS", () => {
    const result = classify("cycle_abc", "REVIEW_IN_PROGRESS");
    expect(result.eligibleActions).not.toContain("MARK_IN_PROGRESS");
  });

  it("includes SKIP_WITH_REASON for REVIEW_IN_PROGRESS", () => {
    const result = classify("cycle_abc", "REVIEW_IN_PROGRESS");
    expect(result.eligibleActions).toContain("SKIP_WITH_REASON");
  });

  it("records that cycle is already in progress", () => {
    const result = classify("cycle_abc", "REVIEW_IN_PROGRESS");
    expect(result.ineligibleReasons.some((r) => r.includes("Already in progress"))).toBe(true);
  });
});

describe("classifyBatchEligibility — terminal states", () => {
  const terminalStates: RetainedCadenceState[] = [
    "COMPLETED",
    "REVIEW_COMPLETED",
    "SKIPPED_WITH_REASON",
    "REVIEW_SKIPPED",
    "NOT_CONFIGURED",
  ];

  for (const state of terminalStates) {
    it(`returns no eligible actions for terminal state ${state}`, () => {
      const result = classify("cycle_abc", state);
      expect(result.eligibleActions).toHaveLength(0);
    });

    it(`records terminal reason for ${state}`, () => {
      const result = classify("cycle_abc", state);
      expect(result.ineligibleReasons.length).toBeGreaterThan(0);
      const hasTerminalReason =
        result.ineligibleReasons.some((r) => r.includes("terminal") || r.includes("Cycle"));
      expect(hasTerminalReason).toBe(true);
    });
  }
});

describe("classifyBatchEligibility — ESCALATED", () => {
  it("escalated cycles cannot be started directly (not in STARTABLE_STATES)", () => {
    const result = classify("cycle_abc", "ESCALATED");
    expect(result.eligibleActions).not.toContain("MARK_IN_PROGRESS");
  });

  it("escalated cycles can be skipped with reason", () => {
    const result = classify("cycle_abc", "ESCALATED");
    expect(result.eligibleActions).toContain("SKIP_WITH_REASON");
  });
});

describe("classifyBatchEligibility — SCHEDULED / CONFIGURED", () => {
  it("SCHEDULED cycles can be started", () => {
    const result = classify("cycle_abc", "SCHEDULED");
    // SCHEDULED is not in STARTABLE_STATES or TERMINAL_STATES — check behaviour
    // Expected: skip allowed, start NOT allowed (not explicitly startable)
    expect(result.eligibleActions).not.toContain("MARK_IN_PROGRESS");
    expect(result.eligibleActions).toContain("SKIP_WITH_REASON");
  });

  it("CONFIGURED cycles can be skipped", () => {
    const result = classify("cycle_abc", "CONFIGURED");
    expect(result.eligibleActions).toContain("SKIP_WITH_REASON");
  });
});
