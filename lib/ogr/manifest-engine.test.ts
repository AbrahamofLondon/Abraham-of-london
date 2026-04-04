import { describe, it, expect } from "vitest";
import {
  calculateDerived,
  sanitizeResonance,
  sanitizeFriction,
  sanitizeRevenue,
  sanitizeMetrics,
  roundTo,
  OGR_CONSTANTS,
} from "./manifest-engine";

describe("CANONICAL OGR MATH ENGINE: INTEGRITY AUDIT", () => {
  describe("sanitization boundaries", () => {
    it("should clamp resonance strictly to 0..100", () => {
      expect(sanitizeResonance(150)).toBe(100);
      expect(sanitizeResonance(-50)).toBe(0);
      expect(sanitizeResonance(92.5)).toBe(92.5);
    });

    it("should clamp friction strictly to 0..99.99", () => {
      expect(sanitizeFriction(100)).toBe(99.99);
      expect(sanitizeFriction(-5)).toBe(0);
      expect(sanitizeFriction(65)).toBe(65);
    });

    it("should clamp revenue to >= 0", () => {
      expect(sanitizeRevenue(-100)).toBe(0);
      expect(sanitizeRevenue(0)).toBe(0);
      expect(sanitizeRevenue(250.125)).toBe(250.125);
    });

    it("should sanitize a mixed metrics payload deterministically", () => {
      const sanitized = sanitizeMetrics({
        resonanceScore: "92.5" as unknown as number,
        marketFriction: " 65.0 " as unknown as number,
        targetRevenue: "100" as unknown as number,
      });

      expect(sanitized).toEqual({
        resonanceScore: 92.5,
        marketFriction: 65,
        targetRevenue: 100,
      });
    });

    it("should degrade poisoned numeric inputs to safe defaults", () => {
      const sanitized = sanitizeMetrics({
        resonanceScore: "abc" as unknown as number,
        marketFriction: null as unknown as number,
        targetRevenue: undefined as unknown as number,
      });

      expect(sanitized).toEqual({
        resonanceScore: 0,
        marketFriction: 0,
        targetRevenue: 0,
      });
    });
  });

  describe("rounding utility", () => {
    it("should round deterministically", () => {
      expect(roundTo(0.123456789, 4)).toBe(0.1235);
      expect(roundTo(99.9999, 2)).toBe(100);
      expect(roundTo(-1.23456, 3)).toBe(-1.235);
    });
  });

  describe("formula integrity", () => {
    it("should calculate Integration Tax correctly", () => {
      const result = calculateDerived({
        resonanceScore: 80,
        marketFriction: 40,
        targetRevenue: 100,
      });

      // ((100 - 80) * 1.25) + (40 * 0.05) = 25 + 2 = 27
      expect(result.integrationTax).toBe(27);
    });

    it("should calculate Velocity Multiplier correctly", () => {
      const result = calculateDerived({
        resonanceScore: 80,
        marketFriction: 40,
        targetRevenue: 100,
      });

      // 80 / (100 - 40) = 80 / 60 = 1.333... => 1.33
      expect(result.velocityMultiplier).toBe(1.33);
    });

    it("should calculate Resonance Alpha correctly", () => {
      const alphaTest = calculateDerived({
        resonanceScore: 100,
        marketFriction: 100,
        targetRevenue: 100,
      });

      // friction clamps to 99.99
      // 100 * ((99.99/100) - ((100-100)/100)) = 99.99
      expect(alphaTest.resonanceAlpha).toBe(99.99);
    });

    it("should calculate negative alpha correctly when OGR drag exceeds market drag", () => {
      const result = calculateDerived({
        resonanceScore: 40,
        marketFriction: 10,
        targetRevenue: 200,
      });

      // 200 * (0.10 - 0.60) = -100
      expect(result.resonanceAlpha).toBe(-100);
    });

    it("should calculate Sovereign Certainty correctly", () => {
      const result = calculateDerived({
        resonanceScore: 92.5,
        marketFriction: 65,
        targetRevenue: 100,
      });

      // (92.5 * 0.7) + (35 * 0.3) = 64.75 + 10.5 = 75.25
      expect(result.sovereignCertainty).toBe(75.25);
    });
  });

  describe("threshold governance", () => {
    it("should enforce the Sovereign Threshold (90.0) with mathematical precision", () => {
      const highCertainty = calculateDerived({
        resonanceScore: 95,
        marketFriction: 10,
        targetRevenue: 100,
      });

      const lowCertainty = calculateDerived({
        resonanceScore: 80,
        marketFriction: 40,
        targetRevenue: 100,
      });

      expect(highCertainty.sovereignCertainty).toBeGreaterThanOrEqual(90);
      expect(highCertainty.isAuthorizedToExecute).toBe(true);

      expect(lowCertainty.sovereignCertainty).toBeLessThan(90);
      expect(lowCertainty.isAuthorizedToExecute).toBe(false);
    });

    it("should expose the configured sovereign threshold", () => {
      expect(OGR_CONSTANTS.SOVEREIGN_THRESHOLD).toBe(90);
    });

    it("should authorize exactly at threshold", () => {
      const result = calculateDerived({
        resonanceScore: 90,
        marketFriction: 10,
        targetRevenue: 100,
      });

      // (90 * 0.7) + (90 * 0.3) = 63 + 27 = 90
      expect(result.sovereignCertainty).toBe(90);
      expect(result.isAuthorizedToExecute).toBe(true);
    });

    it("should deny just below threshold", () => {
      const result = calculateDerived({
        resonanceScore: 89.99,
        marketFriction: 10,
        targetRevenue: 100,
      });

      expect(result.sovereignCertainty).toBeLessThan(90);
      expect(result.isAuthorizedToExecute).toBe(false);
    });
  });

  describe("edge-case resilience", () => {
    it("should prevent division by zero via Friction Ceiling (99.99)", () => {
      const sanitized = sanitizeMetrics({
        resonanceScore: 100,
        marketFriction: 100,
        targetRevenue: 100,
      });

      const edgeCase = calculateDerived({
        resonanceScore: 100,
        marketFriction: 100,
        targetRevenue: 100,
      });

      expect(sanitized.marketFriction).toBe(99.99);
      expect(Number.isFinite(edgeCase.velocityMultiplier)).toBe(true);
      expect(edgeCase.velocityMultiplier).toBeCloseTo(10000, 0);
    });

    it("should maintain idempotency with string-poisoned inputs", () => {
      const rawInput = {
        resonanceScore: "92.5" as unknown as number,
        marketFriction: " 65.0 " as unknown as number,
        targetRevenue: "100" as unknown as number,
      };

      const cleanInput = {
        resonanceScore: 92.5,
        marketFriction: 65.0,
        targetRevenue: 100,
      };

      const resultA = calculateDerived(rawInput);
      const resultB = calculateDerived(cleanInput);

      expect(resultA).toEqual(resultB);
      expect(resultA.sovereignCertainty).toBe(75.25);
    });

    it("should remain finite under zero revenue", () => {
      const result = calculateDerived({
        resonanceScore: 88,
        marketFriction: 22,
        targetRevenue: 0,
      });

      expect(Number.isFinite(result.integrationTax)).toBe(true);
      expect(Number.isFinite(result.velocityMultiplier)).toBe(true);
      expect(Number.isFinite(result.resonanceAlpha)).toBe(true);
      expect(Number.isFinite(result.sovereignCertainty)).toBe(true);
      expect(result.resonanceAlpha).toBe(0);
    });

    it("should be deterministic across repeated execution", () => {
      const input = {
        resonanceScore: 91.25,
        marketFriction: 37.75,
        targetRevenue: 250,
      };

      const a = calculateDerived(input);
      const b = calculateDerived(input);
      const c = calculateDerived(input);

      expect(a).toEqual(b);
      expect(b).toEqual(c);
    });
  });

  describe("business logic posture", () => {
    it("should show better certainty when resonance rises holding friction constant", () => {
      const lowR = calculateDerived({
        resonanceScore: 60,
        marketFriction: 30,
        targetRevenue: 100,
      });

      const highR = calculateDerived({
        resonanceScore: 90,
        marketFriction: 30,
        targetRevenue: 100,
      });

      expect(highR.sovereignCertainty).toBeGreaterThan(lowR.sovereignCertainty);
      expect(highR.integrationTax).toBeLessThan(lowR.integrationTax);
    });

    it("should show lower certainty when friction rises holding resonance constant", () => {
      const lowF = calculateDerived({
        resonanceScore: 90,
        marketFriction: 10,
        targetRevenue: 100,
      });

      const highF = calculateDerived({
        resonanceScore: 90,
        marketFriction: 70,
        targetRevenue: 100,
      });

      expect(highF.sovereignCertainty).toBeLessThan(lowF.sovereignCertainty);
      expect(highF.velocityMultiplier).toBeGreaterThan(lowF.velocityMultiplier);
    });
  });
});