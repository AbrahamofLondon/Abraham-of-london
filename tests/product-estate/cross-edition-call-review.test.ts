/**
 * tests/product-estate/cross-edition-call-review.test.ts
 *
 * §12 — Cross-Edition Call Review tests: call lineage, carry-forward, confidence movement.
 */
import { describe, it, expect } from "vitest";
import { getCrossEditionReview, getCrossEditionSummary, buildCallLineage } from "../../lib/intelligence/accountability/cross-edition-call-review";
import { MARKET_CALL_LEDGER } from "../../lib/intelligence/market-intelligence-call-ledger";

describe("Cross-Edition Call Review", () => {
  it("returns lineage for all calls", () => {
    const review = getCrossEditionReview();
    expect(review.length).toBe(MARKET_CALL_LEDGER.length);
  });

  it("every lineage has required fields", () => {
    const review = getCrossEditionReview();
    for (const l of review) {
      expect(l.originalCallId).toBeTruthy();
      expect(l.originalStatement).toBeTruthy();
      expect(l.firstEdition).toBeTruthy();
      expect(l.lineageStatus).toBeTruthy();
      expect(["improved", "stable", "declined", "insufficient_data"]).toContain(l.confidenceMovement);
    }
  });

  it("summary returns aggregated counts", () => {
    const summary = getCrossEditionSummary();
    expect(summary.totalCalls).toBeGreaterThan(0);
    const statusSum = summary.originated + summary.carriedForward + summary.revised + summary.superseded + summary.closed + summary.falsified + summary.unresolved;
    expect(statusSum).toBe(summary.totalCalls);
    expect(summary.byEdition.length).toBeGreaterThan(0);
  });

  it("buildCallLineage handles call with no version history", () => {
    const call = { id: "test-no-history", reportId: "TEST", callType: "PREDICTION" as const, statement: "Test", originalConfidence: "MEDIUM" as const, expectedReviewWindow: "2026-Q3" };
    const lineage = buildCallLineage(call as any);
    expect(lineage.firstEdition).toBe("TEST");
    expect(lineage.lineageStatus).toBe("ORIGINATED");
    expect(lineage.confidenceMovement).toBe("insufficient_data");
  });

  it("buildCallLineage detects falsification trigger", () => {
    const call = { id: "test-falsified", reportId: "TEST", callType: "PREDICTION" as const, statement: "Test", originalConfidence: "HIGH" as const, expectedReviewWindow: "2026-Q3", outcomeStatus: "DISCONFIRMED" as const, score: 0 };
    const lineage = buildCallLineage(call as any);
    expect(lineage.falsificationConditionTriggered).toBe(true);
    expect(lineage.lineageStatus).toBe("FALSIFIED");
    expect(lineage.confidenceMovement).toBe("declined");
  });

  it("buildCallLineage detects carried-forward call", () => {
    const call = { id: "test-carried", reportId: "TEST", callType: "PREDICTION" as const, statement: "Test", originalConfidence: "MEDIUM" as const, expectedReviewWindow: "2026-Q4", outcomeStatus: "TOO_EARLY_TO_ASSESS" as const, carryForwardJustification: "Awaiting Q3 data" };
    const lineage = buildCallLineage(call as any);
    expect(lineage.lineageStatus).toBe("CARRIED_FORWARD");
    expect(["stable", "insufficient_data"]).toContain(lineage.confidenceMovement);
  });
});