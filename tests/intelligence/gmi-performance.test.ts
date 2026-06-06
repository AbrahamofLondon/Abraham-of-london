import { describe, expect, it } from "vitest";

import { buildGmiPerformanceCentre } from "@/lib/intelligence/gmi-control-plane";
import type { PublicGmiCallLedgerEntry } from "@/lib/intelligence/gmi-instrument";

function call(callId: string, score: PublicGmiCallLedgerEntry["currentScore"]): PublicGmiCallLedgerEntry {
  return {
    callId,
    editionId: "GMI-Q1-2026",
    publicationDate: "2026-04-08",
    thesis: `${callId} thesis`,
    category: "PREDICTION",
    assetClass: "Macro",
    region: "Global",
    theme: "Track record",
    confidenceBand: "MEDIUM",
    scenarioLink: null,
    reviewWindow: "Q2 2026",
    currentStatus: score === 0 ? "DISCONFIRMED" : score === 2 ? "TOO_EARLY_TO_ASSESS" : "DIRECTIONALLY_CONFIRMED",
    currentScore: score,
    scoreLabel: score === null ? null : String(score),
    evidenceSources: score === null ? [] : ["SRC-1"],
    lastReviewedAt: score === null ? null : `2026-06-0${Math.max(score ?? 1, 1)}T00:00:00.000Z`,
    nextReviewDue: "2026-09-30T00:00:00.000Z",
    versionHistory: [{ version: "1", changedAt: "2026-06-01", note: "Reviewed." }],
  };
}

describe("GMI performance centre", () => {
  const performance = buildGmiPerformanceCentre([
    call("CALL-5", 5),
    call("CALL-4", 4),
    call("CALL-3", 3),
    call("CALL-2", 2),
    call("CALL-1", 1),
    call("CALL-0", 0),
    call("CALL-PENDING", null),
  ]);

  it("calculates score distribution correctly", () => {
    expect(performance.scoreDistribution).toEqual({
      5: 1,
      4: 1,
      3: 1,
      2: 1,
      1: 1,
      0: 1,
    });
    expect(performance.totalCallsIssued).toBe(7);
    expect(performance.totalCallsReviewed).toBe(6);
  });

  it("excludes score 2 from confirmed count", () => {
    expect(performance.confirmedCount).toBe(2);
    expect(performance.pendingCarryForwardCount).toBe(1);
  });

  it("keeps disconfirmed calls visible", () => {
    expect(performance.disconfirmedCalls.map((entry) => entry.callId)).toContain("CALL-0");
    expect(performance.weakDisconfirmedCount).toBe(2);
  });

  it("derives last updated timestamp from the ledger", () => {
    expect(performance.lastUpdatedTimestamp).toBe("2026-09-30T00:00:00.000Z");
  });
});
