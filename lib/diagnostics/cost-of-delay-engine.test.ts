import { describe, it, expect } from "vitest";
import {
  computeDelayExposureScore,
  classifyCostBand,
  estimateFinancialExposure,
  computeCostOfDelay,
  type CostOfDelayInput,
} from "./cost-of-delay-engine";

const low: CostOfDelayInput = { urgencyScore: 1, ownershipScore: 1, clarityScore: 1, accountabilityScore: 1, stateScore: 1 };
const moderate: CostOfDelayInput = { urgencyScore: 2, ownershipScore: 2, clarityScore: 2, accountabilityScore: 2, stateScore: 2 };
const high: CostOfDelayInput = { urgencyScore: 3, ownershipScore: 3, clarityScore: 3, accountabilityScore: 3, stateScore: 3 };
const critical: CostOfDelayInput = { urgencyScore: 4, ownershipScore: 4, clarityScore: 4, accountabilityScore: 4, stateScore: 4 };

describe("classifyCostBand", () => {
  it("classifies LOW correctly", () => {
    expect(classifyCostBand(computeDelayExposureScore(low))).toBe("LOW");
  });

  it("classifies MODERATE correctly", () => {
    expect(classifyCostBand(computeDelayExposureScore(moderate))).toBe("MODERATE");
  });

  it("classifies HIGH correctly", () => {
    expect(classifyCostBand(computeDelayExposureScore(high))).toBe("HIGH");
  });

  it("classifies CRITICAL correctly", () => {
    expect(classifyCostBand(computeDelayExposureScore(critical))).toBe("CRITICAL");
  });
});

describe("estimateFinancialExposure", () => {
  it("returns null when no financial input", () => {
    expect(estimateFinancialExposure(high)).toBeNull();
  });

  it("returns bounded estimate when financial input provided", () => {
    const input: CostOfDelayInput = { ...high, decisionValue: 100000 };
    const result = estimateFinancialExposure(input);
    expect(result).not.toBeNull();
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100000);
  });
});

describe("computeCostOfDelay", () => {
  it("always includes disclosure", () => {
    const result = computeCostOfDelay(low);
    expect(result.disclosure).toBeTruthy();
    expect(result.disclosure).toContain("not a confirmed financial loss");
  });

  it("includes all three horizons", () => {
    const result = computeCostOfDelay(high);
    expect(result.horizon["7_DAYS"]).toBeTruthy();
    expect(result.horizon["30_DAYS"]).toBeTruthy();
    expect(result.horizon["90_DAYS"]).toBeTruthy();
  });
});
