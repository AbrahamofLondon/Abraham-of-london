import { describe, expect, it } from "vitest";

import { getGmiReportState } from "./gmi-intelligence-contract";
import { buildGmiQuarterlyReviewPack } from "./gmi-quarterly-review-pack";
import { resolveGmiReleaseState } from "./gmi-release-state-resolver";

describe("GMI release state resolver", () => {
  it("resolves Q1 as active until superseded", () => {
    expect(getGmiReportState("GMI-Q1-2026")).toBe("ACTIVE_UNTIL_SUPERSEDED");
  });

  it("resolves Q2 as evidence collection with release blockers", () => {
    const result = resolveGmiReleaseState("GMI-Q2-2026");
    expect(result.state).toBe("EVIDENCE_COLLECTION");
    expect(result.releaseReady).toBe(false);
    expect(result.blockers).toContain("Prior-quarter calls not reviewed");
    expect(result.blockers).toContain("Source appendix incomplete");
    expect(result.blockers).toContain("Q2 remains draft");
    expect(result.nextAction).toBe("Complete Q1 call review after Q2 close");
  });

  it("does not create a release candidate if prior-quarter call review is missing", () => {
    const result = resolveGmiReleaseState("GMI-Q2-2026");
    expect(result.nextEligibleTransition).toBeNull();
    expect(result.qualityGate.criticalFailures).toContain("PRIOR_QUARTER_CALLS_UNREVIEWED");
  });

  it("builds a review pack with Q1 calls pending review", () => {
    const pack = buildGmiQuarterlyReviewPack("GMI-Q2-2026");
    expect(pack.priorReportId).toBe("GMI-Q1-2026");
    expect(pack.callsPendingReview.length).toBe(7);
    expect(pack.sourceCoverage.releaseSafe).toBe(false);
    expect(pack.monitoredSignals.length).toBeGreaterThan(0);
    expect(pack.releaseBlockers).toContain("Prior-quarter calls not reviewed");
  });
});
