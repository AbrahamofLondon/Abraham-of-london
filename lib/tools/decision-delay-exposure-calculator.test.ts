import { describe, expect, it } from "vitest";

import {
  buildDecisionDelaySendToSelfPayload,
  classifyDecisionState,
  classifyGovernancePressure,
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
      decisionState: "not_yet_decided",
    });
    expect(result.sevenDayExposure).toBe(700);
  });

  it("30-day exposure is daily rate × 30", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 700,
      delayWeeks: 0,
      exposureType: "revenue",
      estimateConfidence: "known",
      decisionState: "not_yet_decided",
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
      decisionState: "not_yet_decided",
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
      decisionState: "not_yet_decided",
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
      decisionState: "not_yet_decided",
    });
    const noDelay = computeDecisionDelayExposure({
      weeklyCost: 1000,
      delayWeeks: 0,
      exposureType: "compliance",
      estimateConfidence: "rough",
      decisionState: "not_yet_decided",
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
      decisionState: "not_yet_decided",
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
      decisionState: "not_yet_decided",
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
        decisionState: "not_yet_decided",
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
      decisionState: "not_yet_decided",
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
      decisionState: "not_yet_decided",
    });
    expect(result.disclaimer).toBeTruthy();
    expect(result.disclaimer.length).toBeGreaterThan(20);
  });

  it("disclaimer preserves the scenario estimate and no-financial-advice boundary", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 2000,
      delayWeeks: 1,
      exposureType: "reputation",
      estimateConfidence: "rough",
      decisionState: "not_yet_decided",
    });
    expect(result.disclaimer.toLowerCase()).toContain("scenario");
    expect(result.disclaimer.toLowerCase()).toContain("not be treated as financial advice");
  });

  it("disclaimer does not make exaggerated claims", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 2000,
      delayWeeks: 1,
      exposureType: "reputation",
      estimateConfidence: "rough",
      decisionState: "not_yet_decided",
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
      decisionState: "not_yet_decided",
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
        decisionState: "not_yet_decided",
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
      decisionState: "not_yet_decided",
    });
    expect(result.exposureStatement).toContain("rough estimate");
  });

  it("board_estimate confidence uses 'board estimate' in statement", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 1000,
      delayWeeks: 0,
      exposureType: "revenue",
      estimateConfidence: "board_estimate",
      decisionState: "not_yet_decided",
    });
    expect(result.exposureStatement).toContain("board estimate");
  });
});

// ─── Decision state and governance pressure ───────────────────────────────────

describe("decision state classification", () => {
  it("classifies an authority block as Authority-blocked", () => {
    expect(classifyDecisionState("blocked_by_authority")).toBe("Authority-blocked");
  });

  it("classifies a decided-but-unexecuted decision as Execution-stalled", () => {
    expect(classifyDecisionState("decided_not_executed")).toBe("Execution-stalled");
  });
});

describe("governance pressure band", () => {
  it("keeps a low-cost new deferral in LOW", () => {
    expect(
      classifyGovernancePressure({
        thirtyDayExposure: 1000,
        delayWeeks: 0,
        decisionState: "not_yet_decided",
      }),
    ).toBe("LOW");
  });

  it("elevates a costly, long-running authority block to CRITICAL", () => {
    expect(
      classifyGovernancePressure({
        thirtyDayExposure: 150000,
        delayWeeks: 10,
        decisionState: "blocked_by_authority",
      }),
    ).toBe("CRITICAL");
  });

  it("returns a governed reading with visible state and record status", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 3000,
      delayWeeks: 4,
      exposureType: "execution",
      estimateConfidence: "known",
      decisionState: "blocked_by_authority",
    });

    expect(result.decisionStateLabel).toBe("Authority-blocked");
    expect(result.governancePressureBand).toBe("PRESSURE");
    expect(result.recordStatus).toBe("Not yet governed");
  });
});

// ─── Send-to-self payload safety ──────────────────────────────────────────────

describe("buildDecisionDelaySendToSelfPayload", () => {
  it("keeps send-to-self available from the result model without raw or internal fields", () => {
    const result = computeDecisionDelayExposure({
      weeklyCost: 5000,
      delayWeeks: 3,
      exposureType: "revenue",
      estimateConfidence: "rough",
      decisionState: "repeatedly_revisited",
    });

    const payload = buildDecisionDelaySendToSelfPayload({
      weeklyCost: 5000,
      delayWeeks: 3,
      exposureType: "revenue",
      result,
    });

    expect(Object.keys(payload).sort()).toEqual([
      "exposureSummary",
      "nextMove",
      "summary",
      "title",
    ]);
    expect(payload.exposureSummary).toContain("Decision state:");
    expect(payload).not.toHaveProperty("decisionLabel");
    expect(payload).not.toHaveProperty("rawDecisionText");
    expect(payload).not.toHaveProperty("internalNotes");
  });
});
