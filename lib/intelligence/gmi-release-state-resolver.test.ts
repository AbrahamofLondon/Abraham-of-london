import { describe, expect, it } from "vitest";
import { getGmiReportState } from "./gmi-intelligence-contract";
import { buildGmiQuarterlyReviewPack } from "./gmi-quarterly-review-pack";
import { resolveGmiReleaseState } from "./gmi-release-state-resolver";

describe("GMI release state resolver", () => {
  it("resolves Q1 as active until superseded", () => {
    expect(getGmiReportState("GMI-Q1-2026")).toBe("ACTIVE_UNTIL_SUPERSEDED");
  });

  it("resolves Q2 as draft with release blockers", () => {
    const result = resolveGmiReleaseState("GMI-Q2-2026");
    expect(result.releaseReady).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
    // Should have lifecycle state blocker (not in RELEASE_CANDIDATE)
    expect(result.blockers.some(b => b.includes("DRAFT") || b.includes("RELEASE_CANDIDATE") || b.includes("lifecycle"))).toBe(true);
  });

  it("does not create a release candidate if gates fail", () => {
    const result = resolveGmiReleaseState("GMI-Q2-2026");
    expect(result.nextEligibleTransition).toBeNull();
  });

  it("builds a review pack with Q1 calls pending review", () => {
    const pack = buildGmiQuarterlyReviewPack("GMI-Q2-2026");
    expect(pack.priorReportId).toBe("GMI-Q1-2026");
    expect(pack.callsPendingReview.length).toBeGreaterThanOrEqual(1);
    expect(pack.sourceCoverage.totalRows).toBeGreaterThan(0);
    expect(pack.monitoredSignals.length).toBeGreaterThan(0);
    expect(pack.releaseBlockers).toContain("Prior-quarter calls not reviewed");
  });
});