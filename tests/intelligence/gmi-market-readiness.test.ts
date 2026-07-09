import { describe, expect, it } from "vitest";

import { GMI_Q1_2026_CALLS } from "@/lib/intelligence/market-intelligence-call-ledger";
import {
  GMI_DII_V1_DIMENSIONS,
  GMI_Q2_2026_DII_SCORECARD,
  buildGmiCumulativeTrackRecord,
  getGmiDiiBand,
  reconcileGmiDiiScorecard,
  validateNoDisappearingCalls,
} from "@/lib/intelligence/gmi-market-readiness";

describe("GMI market readiness invariants", () => {
  it("defines DII v1.0 as five equally weighted process-integrity dimensions", () => {
    expect(GMI_DII_V1_DIMENSIONS).toHaveLength(5);
    expect(GMI_DII_V1_DIMENSIONS.map((dimension) => dimension.weight)).toEqual([20, 20, 20, 20, 20]);
    expect(GMI_DII_V1_DIMENSIONS.map((dimension) => dimension.label)).toEqual([
      "Evidence integrity",
      "Falsifiability and trigger precision",
      "Calibration and accountability discipline",
      "Decision actionability",
      "Revision and uncertainty discipline",
    ]);
  });

  it("reconciles the Q2 DII headline score to its components", () => {
    expect(GMI_Q2_2026_DII_SCORECARD.headlineScore).toBe(74);
    expect(GMI_Q2_2026_DII_SCORECARD.band).toBe("Sound, with material uncertainties");
    expect(reconcileGmiDiiScorecard(GMI_Q2_2026_DII_SCORECARD)).toBe(true);
  });

  it("uses v1.0 bands without false precision", () => {
    expect(getGmiDiiBand(90)).toBe("Strong decision integrity");
    expect(getGmiDiiBand(74)).toBe("Sound, with material uncertainties");
    expect(getGmiDiiBand(60)).toBe("Conditional; elevated integrity risk");
    expect(getGmiDiiBand(54)).toBe("Not publication-grade");
  });

  it("builds a cumulative track record without counting too-early calls as resolved successes", () => {
    const record = buildGmiCumulativeTrackRecord(GMI_Q1_2026_CALLS, "2026-07-06");
    expect(record.totalMaterialCallsIssued).toBe(8);
    expect(record.resolvedCallCount).toBe(6);
    expect(record.unresolvedCallCount).toBe(2);
    expect(record.carriedForwardCount).toBe(2);
    expect(record.directionallyConfirmedCount).toBe(3);
    expect(record.partiallyConfirmedCount).toBe(3);
    expect(record.meanResolvedCallScore).toBe(3.5);
    expect(record.scoringMethodologyVersion).toBe("GMI-RUBRIC-1.0.0");
  });

  it("detects disappearing prior material calls", () => {
    const reviewed = GMI_Q1_2026_CALLS.slice(0, -1);
    expect(validateNoDisappearingCalls(GMI_Q1_2026_CALLS, reviewed)).toEqual(["GMI-Q1-2026-CALL-008"]);
    expect(validateNoDisappearingCalls(GMI_Q1_2026_CALLS, GMI_Q1_2026_CALLS)).toEqual([]);
  });
});