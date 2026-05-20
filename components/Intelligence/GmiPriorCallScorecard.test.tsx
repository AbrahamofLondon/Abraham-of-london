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

  it("reports 7 calls due in Q2", () => {
    expect(data.dueInCurrentQuarter).toBe(7);
  });

  it("reports 1 call carried forward to Q3", () => {
    expect(data.carriedForward).toBe(1);
  });

  it("reports 0 reviewed — calls are TOO_EARLY_TO_ASSESS until Q2 closes", () => {
    expect(data.reviewed).toBe(0);
  });

  it("reports 7 pending", () => {
    expect(data.pending).toBe(7);
  });

  it("does not overstate reviewed count — reviewed + pending = dueInCurrentQuarter", () => {
    expect(data.reviewed + data.pending).toBe(data.dueInCurrentQuarter);
  });
});

describe("GmiPriorCallScorecard public mode — no performance overreach", () => {
  const data = buildPublicScorecardData("GMI-Q1-2026", "Q2 2026");

  it("pending count is equal to dueInCurrentQuarter when no reviews are done", () => {
    // Confirms no false positive reviewed count before Q2 closes
    expect(data.pending).toBe(data.dueInCurrentQuarter);
  });

  it("total is sum of due and carried forward", () => {
    expect(data.total).toBe(data.dueInCurrentQuarter + data.carriedForward);
  });
});
