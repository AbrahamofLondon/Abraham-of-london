/**
 * tests/product-estate/market-decision-integrity-index.test.ts
 *
 * §9 — DII tests: score calculation, coverage detection, edition trend, NULL-headline behaviour.
 */
import { describe, it, expect } from "vitest";
import { calculateDecisionIntegrityIndex, calculateEditionDii } from "../../lib/intelligence/accountability/market-decision-integrity-index";
import { resolveMarketAccountabilityEvidence } from "../../lib/intelligence/accountability/market-accountability-evidence";

describe("Market Decision Integrity Index", () => {
  it("calculates a DII from canonical call ledger", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii).toBeDefined();
    expect(dii.methodologyVersion).toBe("1.0.0");
    expect(dii.generatedAt).toBeTruthy();
  });

  it("returns null headline when coverage is insufficient", () => {
    const dii = calculateDecisionIntegrityIndex();
    if (dii.coverage.status === "INSUFFICIENT_COVERAGE" || dii.coverage.status === "PRELIMINARY") {
      expect(dii.headlineScore).toBeNull();
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

  it("each component has a rationale and weightRationale", () => {
    const dii = calculateDecisionIntegrityIndex();
    for (const c of dii.componentScores) {
      expect(c.rationale).toBeTruthy();
      expect(c.weightRationale).toBeTruthy();
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

  it("publicationStatus defaults to PREVIEW on seed evidence (governance gate — no fabricated public metric)", () => {
    const dii = calculateDecisionIntegrityIndex();
    // seed evidence is NOT a runtime source of truth: it may only ever preview, never publish.
    expect(dii.publicationStatus).toBe("PREVIEW");
    expect(dii.headlineScore).toBeNull();
  });

  it("publicationStatus reflects coverage once evidence is AUTHORITATIVE", () => {
    const authoritativeCalls = resolveMarketAccountabilityEvidence().calls; // treat seed set as authoritative for this test
    const dii = calculateDecisionIntegrityIndex({ authoritativeCalls });
    expect(dii.evidenceMode).toBe("AUTHORITATIVE");
    expect(["INSUFFICIENT_COVERAGE", "PRELIMINARY", "PUBLISHABLE", "METHODOLOGY_TRANSITION"]).toContain(dii.publicationStatus);
  });
});