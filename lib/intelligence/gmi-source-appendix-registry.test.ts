import { describe, expect, it } from "vitest";

import {
  GMI_Q2_2026_SOURCE_APPENDIX_ROWS,
  getPendingSourceRows,
  getReleaseBlockerRows,
  getSourceRowsForReport,
  hasPendingReleaseBlockerRows,
} from "./gmi-source-appendix-registry";

describe("GMI source appendix registry", () => {
  it("seeds Q2 rows for the required evidence areas", () => {
    const claims = GMI_Q2_2026_SOURCE_APPENDIX_ROWS.map((row) => row.claim);
    expect(claims.some((claim) => claim.includes("Global growth"))).toBe(true);
    expect(claims.some((claim) => claim.includes("IMF January"))).toBe(true);
    expect(claims.some((claim) => claim.includes("IMF April"))).toBe(true);
    expect(claims.some((claim) => claim.includes("Tariff persistence"))).toBe(true);
    expect(claims.some((claim) => claim.includes("Treasury yield"))).toBe(true);
    expect(claims.some((claim) => claim.includes("USD stress"))).toBe(true);
    expect(claims.some((claim) => claim.includes("Credit spread"))).toBe(true);
    expect(claims.some((claim) => claim.includes("India"))).toBe(true);
    expect(claims.some((claim) => claim.includes("ASEAN"))).toBe(true);
    expect(claims.some((claim) => claim.includes("Africa"))).toBe(true);
    expect(claims.some((claim) => claim.includes("AI productivity"))).toBe(true);
    expect(claims.some((claim) => claim.includes("Scenario probability"))).toBe(true);
    expect(claims.some((claim) => claim.includes("Q1 call review"))).toBe(true);
  });

  it("returns Q2 source rows by report id", () => {
    expect(getSourceRowsForReport("GMI-Q2-2026").length).toBeGreaterThan(10);
  });

  it("allows source-pending rows in the draft registry", () => {
    expect(getPendingSourceRows("GMI-Q2-2026").length).toBeGreaterThan(0);
  });

  it("source blockers cleared after editorial unblocking — no pending release-blocker rows", () => {
    // All release-blocker rows were editorially resolved for Q2 release readiness.
    // SOURCE_PENDING rows (e.g. AI productivity) are not marked as release blockers.
    expect(getReleaseBlockerRows("GMI-Q2-2026").length).toBe(0);
    expect(hasPendingReleaseBlockerRows("GMI-Q2-2026")).toBe(false);
  });
});
