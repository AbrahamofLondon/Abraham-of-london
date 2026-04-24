import { describe, it, expect } from "vitest";
import { comparePredictionToOutcome, proposeCalibrationAdjustment } from "./calibration-engine";

describe("comparePredictionToOutcome", () => {
  it("returns low error for accurate prediction", () => {
    const result = comparePredictionToOutcome({
      prediction: { classification: "IMPROVED", severity: 3, effectiveness: 70 },
      outcome: { classification: "IMPROVED", observedAt: new Date().toISOString() },
    });
    expect(result.predictionError).toBeLessThan(0.15);
    expect(result.biasDirection).toBe("ACCURATE");
  });

  it("detects overstated prediction", () => {
    const result = comparePredictionToOutcome({
      prediction: { classification: "DETERIORATED", severity: 8, effectiveness: 20 },
      outcome: { classification: "IMPROVED", observedAt: new Date().toISOString() },
    });
    expect(result.predictionError).toBeGreaterThan(0.3);
    expect(result.biasDirection).toBe("OVERSTATED");
  });

  it("detects understated prediction", () => {
    const result = comparePredictionToOutcome({
      prediction: { classification: "RESOLVED", severity: 1, effectiveness: 90 },
      outcome: { classification: "DETERIORATED", observedAt: new Date().toISOString() },
    });
    expect(result.predictionError).toBeGreaterThan(0.3);
    expect(result.biasDirection).toBe("UNDERSTATED");
  });
});

describe("proposeCalibrationAdjustment", () => {
  const makeEvents = (count: number, error: number) =>
    Array.from({ length: count }, (_, i) => ({
      predictionError: error,
      predictionSnapshot: { severity: 5 } as Record<string, unknown>,
      outcomeSnapshot: { classification: "UNCHANGED" } as Record<string, unknown>,
      createdAt: new Date(Date.now() - i * 86400000),
    }));

  it("refuses adjustment with fewer than 5 outcomes", () => {
    const result = proposeCalibrationAdjustment({
      events: makeEvents(3, 0.2),
      currentState: { outcomeCount: 3, accuracyScore: null, biasScore: null, calibrationData: {} },
    });
    expect(result.shouldApply).toBe(false);
    expect(result.reason).toContain("Insufficient outcomes");
  });

  it("proposes adjustment with 5+ outcomes and significant error", () => {
    const result = proposeCalibrationAdjustment({
      events: makeEvents(7, 0.4),
      currentState: { outcomeCount: 7, accuracyScore: 0.5, biasScore: null, calibrationData: {} },
    });
    expect(result.adjustment.outcomeCount).toBe(7);
    expect(result.adjustment.avgError).toBeGreaterThan(0);
  });

  it("caps adjustment at 10%", () => {
    const result = proposeCalibrationAdjustment({
      events: makeEvents(10, 0.9),
      currentState: { outcomeCount: 10, accuracyScore: 0.1, biasScore: null, calibrationData: {} },
    });
    expect(Math.abs(result.adjustment.severityBiasCorrection)).toBeLessThanOrEqual(0.10);
    expect(Math.abs(result.adjustment.confidenceAdjustment)).toBeLessThanOrEqual(0.10);
  });

  it("does not apply when model is already accurate", () => {
    const result = proposeCalibrationAdjustment({
      events: makeEvents(8, 0.05),
      currentState: { outcomeCount: 8, accuracyScore: 0.95, biasScore: 0, calibrationData: {} },
    });
    // With very low error, adjustment should be minimal
    expect(Math.abs(result.adjustment.severityBiasCorrection)).toBeLessThan(0.05);
  });
});
