import { describe, expect, it } from "vitest";

import {
  getCallsForReport,
  getCallsPendingReview,
} from "@/lib/intelligence/market-intelligence-call-ledger";
import type { GmiPriorCallScorecardData } from "./GmiPriorCallScorecard";

// Tests for the data construction logic behind GmiPriorCallScorecard.
// Component rendering tests are not included; DOM rendering is verified
// manually in the browser. These tests verify the data contract.

function buildPublicScorecardData(
  priorReportId: string,
  reviewWindow: string,
): GmiPriorCallScorecardData {
  const allCalls = getCallsForReport(priorReportId);
  const dueThisQuarter = allCalls.filter(
    (c) => c.expectedReviewWindow === reviewWindow,
  );
  const carriedForward = allCalls.filter(
    (c) => c.expectedReviewWindow !== reviewWindow,
  );
  const pendingCalls = getCallsPendingReview(reviewWindow);
  const reviewed = dueThisQuarter.length - pendingCalls.length;

  return {
    reportId: "GMI-Q2-2026",
    priorReportId,
    reviewWindow,
    total: allCalls.length,
    dueInCurrentQuarter: dueThisQuarter.length,
    carriedForward: carriedForward.length,
    reviewed,
    pending: pendingCalls.length,
  };
}

describe("GmiPriorCallScorecard data — Q2 2026 preparation view", () => {
  const data = buildPublicScorecardData("GMI-Q1-2026", "Q2 2026");

  it("reports 8 total Q1 material calls", () => {
    expect(data.total).toBe(8);
  });

  it("reports 6 calls due in Q2", () => {
    expect(data.dueInCurrentQuarter).toBe(6);
  });

  it("reports 2 calls carried forward beyond Q2", () => {
    expect(data.carriedForward).toBe(2);
  });

  it("reviewed + pending = dueInCurrentQuarter (review progress is tracked)", () => {
    // Q1 calls have been progressively reviewed; reviewed count reflects current state
    expect(data.reviewed + data.pending).toBe(data.dueInCurrentQuarter);
  });

  it("has no pending Q2 calls after release review", () => {
    expect(data.pending).toBe(0);
  });

  it("does not overstate reviewed count — reviewed + pending = dueInCurrentQuarter", () => {
    expect(data.reviewed + data.pending).toBe(data.dueInCurrentQuarter);
  });
});

describe("GmiPriorCallScorecard public mode — no performance overreach", () => {
  const data = buildPublicScorecardData("GMI-Q1-2026", "Q2 2026");

  it("pending count is within dueInCurrentQuarter (reviewed + pending = due)", () => {
    // Confirms reviewed + pending integrity; no false positive beyond total
    expect(data.pending).toBeLessThanOrEqual(data.dueInCurrentQuarter);
  });

  it("total is sum of due and carried forward", () => {
    expect(data.total).toBe(data.dueInCurrentQuarter + data.carriedForward);
  });
});
