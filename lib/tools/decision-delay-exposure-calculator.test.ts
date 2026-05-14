import { describe, expect, it } from "vitest";

import {
  computeDecisionDelayExposure,
  formatGbp,
  CTA_HREF,
} from "./decision-delay-exposure-calculator";

// ─── Calculation correctness ──────────────────────────────────────────────────

describe("computeDecisionDelayExposure — calculation", () => {
  it("7-day exposure equals weekly cost (one week of daily rate × 7)", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 700,
      delayWeeks: 2,
      exposureType: "revenue",
      estimateConfidence: "known",
    });
    expect(result.sevenDayExposure).toBe(700);
  });

  it("30-day exposure is daily rate × 30", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 700,
      delayWeeks: 0,
      exposureType: "revenue",
      estimateConfidence: "known",
    });
    // 700 / 7 * 30 = 3000 exactly
    expect(result.thirtyDayExposure).toBe(3000);
  });

  it("90-day exposure is daily rate × 90", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 700,
      delayWeeks: 0,
      exposureType: "revenue",
      estimateConfidence: "known",
    });
    // 700 / 7 * 90 = 9000 exactly
    expect(result.ninetyDayExposure).toBe(9000);
  });

  it("30-day is greater than 7-day, 90-day is greater than 30-day", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 5000,
      delayWeeks: 1,
      exposureType: "operating_cost",
      estimateConfidence: "board_estimate",
    });
    expect(result.sevenDayExposure).toBeLessThan(result.thirtyDayExposure);
    expect(result.thirtyDayExposure).toBeLessThan(result.ninetyDayExposure);
  });

  it("delayWeeks does not affect the exposure amounts — only the statement framing", () => {
    const withDelay = computeDecisionDelayExposure({
      weeklyCost: 1000,
      delayWeeks: 4,
      exposureType: "compliance",
      estimateConfidence: "rough",
    });
    const noDelay = computeDecisionDelayExposure({
      weeklyCost: 1000,
      delayWeeks: 0,
      exposureType: "compliance",
      estimateConfidence: "rough",
    });
    expect(withDelay.sevenDayExposure).toBe(noDelay.sevenDayExposure);
    expect(withDelay.thirtyDayExposure).toBe(noDelay.thirtyDayExposure);
    expect(withDelay.ninetyDayExposure).toBe(noDelay.ninetyDayExposure);
    // Statement framing differs
    expect(withDelay.exposureStatement).not.toBe(noDelay.exposureStatement);
  });
});

// ─── Zero and negative values ─────────────────────────────────────────────────

describe("computeDecisionDelayExposure — zero and negative handling", () => {
  it("zero weeklyCost produces zero exposure on all bands", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 0,
      delayWeeks: 0,
      exposureType: "revenue",
      estimateConfidence: "rough",
    });
    expect(result.sevenDayExposure).toBe(0);
    expect(result.thirtyDayExposure).toBe(0);
    expect(result.ninetyDayExposure).toBe(0);
  });

  it("negative weeklyCost is treated as zero", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: -500,
      delayWeeks: 3,
      exposureType: "opportunity",
      estimateConfidence: "known",
    });
    expect(result.sevenDayExposure).toBe(0);
    expect(result.thirtyDayExposure).toBe(0);
    expect(result.ninetyDayExposure).toBe(0);
  });

  it("negative delayWeeks is treated as zero without throwing", () => {
    expect(() =>
      computeDecisionDelayExposure({
        weeklyCost: 1000,
        delayWeeks: -5,
        exposureType: "execution",
        estimateConfidence: "rough",
      }),
    ).not.toThrow();
  });
});

// ─── Large value formatting ───────────────────────────────────────────────────

describe("formatGbp — large values", () => {
  it("formats 100000 as £100,000", () => {
    expect(formatGbp(100000)).toBe("£100,000");
  });

  it("formats 1000000 as £1,000,000", () => {
    expect(formatGbp(1000000)).toBe("£1,000,000");
  });

  it("formats zero as £0", () => {
    expect(formatGbp(0)).toBe("£0");
  });

  it("negative input is floored to £0", () => {
    expect(formatGbp(-500)).toBe("£0");
  });

  it("large weeklyCost produces correctly formatted outputs", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 100000,
      delayWeeks: 1,
      exposureType: "revenue",
      estimateConfidence: "board_estimate",
    });
    expect(result.sevenDayFormatted).toBe("£100,000");
    // 100000 / 7 * 30 = 428,571
    expect(result.thirtyDayFormatted).toMatch(/^£[0-9,]+$/);
    expect(result.ninetyDayFormatted).toMatch(/^£[0-9,]+$/);
  });
});

// ─── Disclaimer and CTA ───────────────────────────────────────────────────────

describe("computeDecisionDelayExposure — disclaimer and CTA", () => {
  it("result includes a non-empty disclaimer", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 2000,
      delayWeeks: 1,
      exposureType: "reputation",
      estimateConfidence: "rough",
    });
    expect(result.disclaimer).toBeTruthy();
    expect(result.disclaimer.length).toBeGreaterThan(20);
  });

  it("disclaimer mentions scenario or estimate (not financial advice)", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 2000,
      delayWeeks: 1,
      exposureType: "reputation",
      estimateConfidence: "rough",
    });
    expect(result.disclaimer.toLowerCase()).toContain("scenario");
  });

  it("disclaimer does not make exaggerated claims", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 2000,
      delayWeeks: 1,
      exposureType: "reputation",
      estimateConfidence: "rough",
    });
    const lower = result.disclaimer.toLowerCase();
    expect(lower).not.toContain("guaranteed");
    expect(lower).not.toContain("certain");
    expect(lower).not.toContain("always");
  });

  it("CTA href points to /diagnostics/fast", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 1000,
      delayWeeks: 0,
      exposureType: "execution",
      estimateConfidence: "known",
    });
    expect(result.ctaHref).toBe("/diagnostics/fast");
  });

  it("exported CTA_HREF constant is /diagnostics/fast", () => {
    expect(CTA_HREF).toBe("/diagnostics/fast");
  });
});

// ─── Exposure type coverage ───────────────────────────────────────────────────

describe("computeDecisionDelayExposure — all exposure types produce output", () => {
  const types = ["revenue", "operating_cost", "compliance", "opportunity", "reputation", "execution"] as const;
  for (const exposureType of types) {
    it(`${exposureType} produces a non-empty structural consequence`, () => {
      const result = computeDecisionDelayExposure({
        weeklyCost: 3000,
        delayWeeks: 2,
        exposureType,
        estimateConfidence: "known",
      });
      expect(result.structuralConsequence).toBeTruthy();
      expect(result.structuralConsequence.length).toBeGreaterThan(20);
    });
  }
});

// ─── Confidence framing ───────────────────────────────────────────────────────

describe("computeDecisionDelayExposure — confidence qualifier in statement", () => {
  it("rough confidence uses 'rough estimate' in statement", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 1000,
      delayWeeks: 0,
      exposureType: "revenue",
      estimateConfidence: "rough",
    });
    expect(result.exposureStatement).toContain("rough estimate");
  });

  it("board_estimate confidence uses 'board estimate' in statement", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 1000,
      delayWeeks: 0,
      exposureType: "revenue",
      estimateConfidence: "board_estimate",
    });
    expect(result.exposureStatement).toContain("board estimate");
  });
});
