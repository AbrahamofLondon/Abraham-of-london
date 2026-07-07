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

  it("has no unresolved pending rows after source reconciliation", () => {
    expect(getPendingSourceRows("GMI-Q2-2026")).toEqual([]);
    const aiProductivity = GMI_Q2_2026_SOURCE_APPENDIX_ROWS.find((row) => row.claim.includes("AI productivity"));
    expect(aiProductivity?.status).toBe("CARRIED_FORWARD");
    expect(aiProductivity?.releaseBlocker).toBe(false);
  });

  it("source blockers cleared after editorial unblocking — no pending release-blocker rows", () => {
    // All release-blocker rows were editorially resolved for Q2 release readiness.
    // Monitoring rows such as AI productivity are carried forward, not pending blockers.
    expect(getReleaseBlockerRows("GMI-Q2-2026").length).toBe(0);
    expect(hasPendingReleaseBlockerRows("GMI-Q2-2026")).toBe(false);
  });
});
