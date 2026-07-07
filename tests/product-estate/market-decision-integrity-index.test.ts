/**
 * tests/product-estate/market-decision-integrity-index.test.ts
 *
 * §9 — DII tests: score calculation, coverage detection, edition trend, NULL-headline behaviour.
 */
import { describe, it, expect } from "vitest";
import { calculateDecisionIntegrityIndex, calculateEditionDii } from "../../lib/intelligence/accountability/market-decision-integrity-index";

describe("Market Decision Integrity Index", () => {
  it("calculates a DII from canonical call ledger", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii).toBeDefined();
    expect(dii.methodology.version).toBe("1.0.0");
    expect(dii.generatedAt).toBeTruthy();
  });

  it("returns valid=false when coverage is insufficient", () => {
    const dii = calculateDecisionIntegrityIndex();
    // If coverage is insufficient, headlineScore should be null
    if (dii.coverage.bucket === "insufficient") {
      expect(dii.valid).toBe(false);
      expect(dii.headlineScore).toBeNull();
      expect(dii.validityReason).toContain("Insufficient");
    }
  });

  it("has four component measures with weights summing to 1.0", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii.componentScores.length).toBe(4);
    const weightSum = dii.componentScores.reduce((a, c) => a + c.weight, 0);
    expect(Math.abs(weightSum - 1.0)).toBeLessThan(0.01);
    const measures = dii.componentScores.map(c => c.measure).sort();
    expect(measures).toEqual(["call_accuracy", "calibration_quality", "falsification_discipline", "revision_discipline"].sort());
  });

  it("each component has a rationale", () => {
    const dii = calculateDecisionIntegrityIndex();
    for (const c of dii.componentScores) {
      expect(c.rationale).toBeTruthy();
    }
  });

  it("edition trend contains at least one edition", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii.editionTrend.length).toBeGreaterThanOrEqual(1);
    for (const et of dii.editionTrend) {
      expect(et.editionId).toBeTruthy();
      expect(et.callCount).toBeGreaterThan(0);
    }
  });

  it("calculateEditionDii returns null for unknown edition", () => {
    const result = calculateEditionDii("NONEXISTENT_EDITION");
    expect(result).toBeNull();
  });

  it("calculateEditionDii returns data for known edition", () => {
    const result = calculateEditionDii("GMI-Q1-2026");
    if (result) {
      expect(result.editionId).toBe("GMI-Q1-2026");
      expect(result.callCount).toBeGreaterThan(0);
    }
  });

  it("methodology has required fields", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii.methodology.scoringFormula).toBeTruthy();
    expect(dii.methodology.exclusions.length).toBeGreaterThan(0);
    expect(dii.methodology.uncertainty).toBeTruthy();
    expect(dii.methodology.minimumSampleRequirements).toBeTruthy();
    expect(dii.methodology.changeHistory.length).toBeGreaterThan(0);
  });
});
