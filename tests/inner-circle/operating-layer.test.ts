import { describe, expect, it } from "vitest";
import {
  evaluatePressureSignal,
  readingPaths,
  scoreRiseDecay,
} from "@/lib/inner-circle/operating-layer";

describe("Inner Circle operating layer", () => {
  it("keeps only Founder Under Pressure active at MVP launch", () => {
    const active = readingPaths.filter((path) => path.status === "active");

    expect(active).toHaveLength(1);
    expect(active[0].slug).toBe("founder-under-pressure");
  });

  it("routes severe public pressure into Strategy Room without returning raw input", () => {
    const result = evaluatePressureSignal(
      "We need to decide whether to approve the enterprise rollout this week, but the board is split, legal risk is unclear, cash runway is tightening, and the founder is waiting for more evidence.",
    );

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.pressureLevel).toBe("RED");
    expect(result.route.productKey).toBe("strategy-room");
    expect(JSON.stringify(result)).not.toMatch(/enterprise rollout this week/);
  });

  it("routes high Rise-Decay risk into Boardroom Brief and repeated high risk into Council Candidate", () => {
    const result = scoreRiseDecay(
      {
        authorityClarity: 5,
        decisionLatency: 5,
        founderDependency: 4,
        evidenceQuality: 4,
        operatingCadence: 4,
        capitalConstraint: 3,
        cultureUnderPressure: 4,
        recoveryReadiness: 4,
      },
      1,
    );

    expect(result.riskLevel === "High" || result.riskLevel === "Critical").toBe(true);
    expect(["boardroom-brief", "strategy-room"]).toContain(result.route.productKey);
    expect(result.councilCandidate).toBe(true);
  });
});
