import { describe, expect, it } from "vitest";

import {
  getCallScoreLabel,
  getCallsForReport,
  getCallsPendingReview,
  getMarketLearningSignals,
  GMI_Q1_2026_CALLS,
  MARKET_CALL_LEDGER,
  summariseCallReview,
  type MarketCallRecord,
} from "./market-intelligence-call-ledger";

// ─────────────────────────────────────────────────────────────────────────────
// Registry integrity
// ─────────────────────────────────────────────────────────────────────────────

describe("GMI Q1 2026 call registry", () => {
  it("contains exactly 8 calls", () => {
    expect(GMI_Q1_2026_CALLS).toHaveLength(8);
  });

  it("every call links to GMI-Q1-2026", () => {
    for (const call of GMI_Q1_2026_CALLS) {
      expect(call.reportId).toBe("GMI-Q1-2026");
    }
  });

  it("every call has a non-empty id, statement, and expectedReviewWindow", () => {
    for (const call of GMI_Q1_2026_CALLS) {
      expect(call.id.length).toBeGreaterThan(0);
      expect(call.statement.length).toBeGreaterThan(0);
      expect(call.expectedReviewWindow.length).toBeGreaterThan(0);
    }
  });

  it("call IDs are unique", () => {
    const ids = GMI_Q1_2026_CALLS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes a STRUCTURAL_THESIS call", () => {
    expect(GMI_Q1_2026_CALLS.some((c) => c.callType === "STRUCTURAL_THESIS")).toBe(true);
  });

  it("includes a SCENARIO_PROBABILITY call for managed fragmentation", () => {
    const sc = GMI_Q1_2026_CALLS.find((c) => c.callType === "SCENARIO_PROBABILITY");
    expect(sc).toBeDefined();
    expect(sc?.statement.toLowerCase()).toContain("managed fragmentation");
  });

  it("includes at least one BOARD_INSTRUCTION call", () => {
    expect(GMI_Q1_2026_CALLS.filter((c) => c.callType === "BOARD_INSTRUCTION").length).toBeGreaterThan(0);
  });

  it("includes at least one RISK_WARNING call", () => {
    expect(GMI_Q1_2026_CALLS.filter((c) => c.callType === "RISK_WARNING").length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCallsForReport
// ─────────────────────────────────────────────────────────────────────────────

describe("getCallsForReport", () => {
  it("returns all 8 Q1 2026 calls for GMI-Q1-2026", () => {
    expect(getCallsForReport("GMI-Q1-2026")).toHaveLength(8);
  });

  it("returns empty array for a report not in the ledger", () => {
    expect(getCallsForReport("GMI-Q9-9999")).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCallsPendingReview
// ─────────────────────────────────────────────────────────────────────────────

describe("getCallsPendingReview", () => {
  it("returns Q2 2026 calls that are still pending", () => {
    const pending = getCallsPendingReview("Q2 2026");
    expect(pending.length).toBeGreaterThan(0);
    for (const call of pending) {
      expect(call.expectedReviewWindow).toBe("Q2 2026");
    }
  });

  it("excludes calls expected for a different window", () => {
    const pending = getCallsPendingReview("Q2 2026");
    for (const call of pending) {
      expect(call.expectedReviewWindow).not.toBe("Q3 2026");
    }
  });

  it("does not return calls that have been reviewed with a confirmed outcome", () => {
    const confirmedRecord: MarketCallRecord = {
      id: "TEST-001",
      reportId: "GMI-Q1-2026",
      callType: "PREDICTION",
      statement: "Test prediction.",
      originalConfidence: "HIGH",
      expectedReviewWindow: "Q2 2026",
      outcomeStatus: "CONFIRMED_STRONGLY",
      score: 5,
      outcomeSummary: "Strong confirmation.",
      learning: "Confirmed as expected.",
    };
    const records: MarketCallRecord[] = [
      ...getCallsForReport("GMI-Q1-2026"),
      confirmedRecord,
    ];
    const pending = records.filter(
      (c) =>
        c.expectedReviewWindow === "Q2 2026" &&
        (!c.outcomeStatus ||
          c.outcomeStatus === "PENDING_REVIEW" ||
          c.outcomeStatus === "TOO_EARLY_TO_ASSESS"),
    );
    expect(pending.every((c) => c.id !== "TEST-001")).toBe(true);
  });

  it("returns empty for a window with no calls due", () => {
    expect(getCallsPendingReview("Q4 2099")).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCallScoreLabel
// ─────────────────────────────────────────────────────────────────────────────

describe("getCallScoreLabel", () => {
  it("returns 'Confirmed strongly' for score 5", () => {
    expect(getCallScoreLabel(5)).toBe("Confirmed strongly");
  });

  it("returns 'Directionally confirmed' for score 4", () => {
    expect(getCallScoreLabel(4)).toBe("Directionally confirmed");
  });

  it("returns 'Partially confirmed' for score 3", () => {
    expect(getCallScoreLabel(3)).toBe("Partially confirmed");
  });

  it("returns 'Weakly supported' for score 2", () => {
    expect(getCallScoreLabel(2)).toBe("Weakly supported");
  });

  it("returns 'Not confirmed' for score 1", () => {
    expect(getCallScoreLabel(1)).toBe("Not confirmed");
  });

  it("returns 'Disconfirmed' for score 0", () => {
    expect(getCallScoreLabel(0)).toBe("Disconfirmed");
  });

  it("returns 'Not yet assessable' for null", () => {
    expect(getCallScoreLabel(null)).toBe("Not yet assessable");
  });

  it("returns 'Not yet assessable' for undefined", () => {
    expect(getCallScoreLabel(undefined)).toBe("Not yet assessable");
  });

  it("does not claim confirmation for scores below 4", () => {
    for (const score of [0, 1, 2, 3] as const) {
      const label = getCallScoreLabel(score);
      expect(label.toLowerCase()).not.toContain("confirmed strongly");
      expect(label.toLowerCase()).not.toContain("directionally confirmed");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// summariseCallReview
// ─────────────────────────────────────────────────────────────────────────────

describe("summariseCallReview", () => {
  it("counts all Q1 calls as pending when none have outcomes", () => {
    const calls = getCallsForReport("GMI-Q1-2026");
    const summary = summariseCallReview(calls);
    expect(summary.totalCalls).toBe(8);
    expect(summary.reviewed).toBe(0);
    expect(summary.pending).toBe(8);
  });

  it("returns null averageScore when no calls have scores", () => {
    const calls = getCallsForReport("GMI-Q1-2026");
    const summary = summariseCallReview(calls);
    expect(summary.averageScore).toBeNull();
  });

  it("confirmed count is 0 before any reviews", () => {
    const summary = summariseCallReview(getCallsForReport("GMI-Q1-2026"));
    expect(summary.confirmed).toBe(0);
  });

  it("correctly counts a reviewed + confirmed call", () => {
    const records: MarketCallRecord[] = [
      {
        id: "TEST-001",
        reportId: "GMI-Q1-2026",
        callType: "PREDICTION",
        statement: "Test.",
        originalConfidence: "HIGH",
        expectedReviewWindow: "Q2 2026",
        outcomeStatus: "DIRECTIONALLY_CONFIRMED",
        score: 4,
        outcomeSummary: "Direction confirmed.",
        learning: "Policy transmission was faster than modelled.",
      },
      {
        id: "TEST-002",
        reportId: "GMI-Q1-2026",
        callType: "WATCH_SIGNAL",
        statement: "Watch.",
        originalConfidence: "MONITORING",
        expectedReviewWindow: "Q2 2026",
        outcomeStatus: "TOO_EARLY_TO_ASSESS",
      },
    ];
    const summary = summariseCallReview(records);
    expect(summary.totalCalls).toBe(2);
    expect(summary.reviewed).toBe(1);
    expect(summary.pending).toBe(1);
    expect(summary.confirmed).toBe(1);
    expect(summary.averageScore).toBe(4);
  });

  it("does not count tooEarly calls as confirmed", () => {
    const records: MarketCallRecord[] = [
      {
        id: "TEST-001",
        reportId: "GMI-Q1-2026",
        callType: "STRUCTURAL_THESIS",
        statement: "Thesis.",
        originalConfidence: "HIGH",
        expectedReviewWindow: "Q2 2026",
        outcomeStatus: "TOO_EARLY_TO_ASSESS",
      },
    ];
    const summary = summariseCallReview(records);
    expect(summary.confirmed).toBe(0);
    expect(summary.tooEarly).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getMarketLearningSignals
// ─────────────────────────────────────────────────────────────────────────────

describe("getMarketLearningSignals", () => {
  it("returns no learning signals from unreviewed Q1 calls", () => {
    const calls = getCallsForReport("GMI-Q1-2026");
    const signals = getMarketLearningSignals(calls);
    expect(signals).toHaveLength(0);
  });

  it("returns learning signal only from a reviewed call with learning set", () => {
    const records: MarketCallRecord[] = [
      {
        id: "TEST-001",
        reportId: "GMI-Q1-2026",
        callType: "PREDICTION",
        statement: "Test.",
        originalConfidence: "MEDIUM",
        expectedReviewWindow: "Q2 2026",
        outcomeStatus: "PARTIALLY_CONFIRMED",
        score: 3,
        outcomeSummary: "Partially borne out.",
        learning: "Inflation transmission was faster via goods than via services.",
      },
      {
        id: "TEST-002",
        reportId: "GMI-Q1-2026",
        callType: "WATCH_SIGNAL",
        statement: "Watch.",
        originalConfidence: "MONITORING",
        expectedReviewWindow: "Q2 2026",
        outcomeStatus: "TOO_EARLY_TO_ASSESS",
        learning: "This should NOT appear — call not yet reviewed.",
      },
    ];
    const signals = getMarketLearningSignals(records);
    expect(signals).toHaveLength(1);
    expect(signals[0]).toContain("Inflation transmission");
  });

  it("does not surface learning from pending or too-early calls", () => {
    const calls = MARKET_CALL_LEDGER;
    const signals = getMarketLearningSignals(calls);
    expect(signals).toHaveLength(0);
  });
});
