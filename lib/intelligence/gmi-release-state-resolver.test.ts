import { describe, expect, it } from "vitest";
import { getGmiReportState } from "./gmi-intelligence-contract";
import { buildGmiQuarterlyReviewPack } from "./gmi-quarterly-review-pack";
import { resolveGmiReleaseState } from "./gmi-release-state-resolver";

describe("GMI release state resolver", () => {
  it("resolves Q1 as superseded by the released Q2 edition", () => {
    expect(getGmiReportState("GMI-Q1-2026")).toBe("SUPERSEDED");
  });

  it("resolves released Q2 as not re-releasable (already ACTIVE_UNTIL_SUPERSEDED)", () => {
    const result = resolveGmiReleaseState("GMI-Q2-2026");
    // A released edition is not release-ready again: the lifecycle gate only
    // passes for RELEASE_CANDIDATE, which protects against double release.
    expect(result.releaseReady).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.blockers.some(b => b.includes("RELEASE_CANDIDATE") || b.includes("lifecycle") || b.includes("ACTIVE"))).toBe(true);
  });

  it("does not create a release candidate if gates fail", () => {
    const result = resolveGmiReleaseState("GMI-Q2-2026");
    expect(result.nextEligibleTransition).toBeNull();
  });

  it("builds a review pack with zero pending prior calls after the release review", () => {
    const pack = buildGmiQuarterlyReviewPack("GMI-Q2-2026");
    expect(pack.priorReportId).toBe("GMI-Q1-2026");
    // Every Q2-window call was scored or formally carried forward at the
    // 2026-07-08 release review; nothing release-blocking remains pending.
    expect(pack.callsPendingReview.length).toBe(0);
    expect(pack.sourceCoverage.totalRows).toBeGreaterThan(0);
    expect(pack.monitoredSignals.length).toBeGreaterThan(0);
    expect(pack.releaseBlockers).not.toContain("Prior-quarter calls not reviewed");
  });
});