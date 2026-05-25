/**
 * tests/research/engines/cost-of-delay-engine.test.ts
 *
 * Tests for the Cost of Delay engine and adapter.
 * Verifies: WSJF arithmetic, tier classification, financial exposure calculation,
 * escalation logic, recommendation generation, and adapter output contract.
 */

import { describe, it, expect } from "vitest";
import {
  computeWsjf,
  classifyWsjf,
  computeFinancialExposure,
  determineDelayEscalation,
  computeCostOfDelay,
  COST_OF_DELAY_ENGINE_ID,
  COST_OF_DELAY_VERSION,
} from "@/lib/research/engines/cost-of-delay-engine";
import { costOfDelayAdapter } from "@/lib/research/engines/cost-of-delay-adapter";

// ─── WSJF arithmetic ──────────────────────────────────────────────────────────

describe("computeWsjf()", () => {
  it("computes correct score: (13+21+13)/2 = 23.5", () => {
    const score = computeWsjf({ userBusinessValue: 13, timeCriticality: 21, riskReduction: 13, jobDuration: 2 });
    expect(score).toBe(23.5);
  });

  it("computes medium priority: (5+5+3)/5 = 2.6", () => {
    const score = computeWsjf({ userBusinessValue: 5, timeCriticality: 5, riskReduction: 3, jobDuration: 5 });
    expect(score).toBe(2.6);
  });

  it("computes low priority: (2+1+1)/13 ≈ 0.31", () => {
    const score = computeWsjf({ userBusinessValue: 2, timeCriticality: 1, riskReduction: 1, jobDuration: 13 });
    expect(score).toBeCloseTo(0.31, 1);
  });

  it("snaps non-Fibonacci inputs to nearest Fibonacci value", () => {
    // 4 → 3, 6 → 5, 4 → 3, 3 → 3 → (3+5+3)/3 = 3.67
    const score = computeWsjf({ userBusinessValue: 4, timeCriticality: 6, riskReduction: 4, jobDuration: 3 });
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThan(0);
  });

  it("handles NaN/Infinity inputs gracefully (snaps to 1)", () => {
    const score = computeWsjf({ userBusinessValue: NaN, timeCriticality: Infinity, riskReduction: -5, jobDuration: 1 });
    expect(isFinite(score)).toBe(true);
    expect(score).toBeGreaterThan(0);
  });
});

// ─── WSJF tier classification ─────────────────────────────────────────────────

describe("classifyWsjf()", () => {
  it("CRITICAL for score ≥ 10", () => {
    expect(classifyWsjf(10)).toBe("CRITICAL");
    expect(classifyWsjf(23.5)).toBe("CRITICAL");
    expect(classifyWsjf(100)).toBe("CRITICAL");
  });

  it("HIGH for score 5–10", () => {
    expect(classifyWsjf(5)).toBe("HIGH");
    expect(classifyWsjf(7)).toBe("HIGH");
    expect(classifyWsjf(9.99)).toBe("HIGH");
  });

  it("MEDIUM for score 2–5", () => {
    expect(classifyWsjf(2)).toBe("MEDIUM");
    expect(classifyWsjf(2.6)).toBe("MEDIUM");
    expect(classifyWsjf(4.99)).toBe("MEDIUM");
  });

  it("LOW for score < 2", () => {
    expect(classifyWsjf(0)).toBe("LOW");
    expect(classifyWsjf(0.31)).toBe("LOW");
    expect(classifyWsjf(1.99)).toBe("LOW");
  });
});

// ─── Financial exposure ───────────────────────────────────────────────────────

describe("computeFinancialExposure()", () => {
  it("computes total cost correctly", () => {
    const exposure = computeFinancialExposure({
      weeklyRevenueAtRisk: 28_000,
      weeksDelayed: 4,
      governancePenaltyPerWeek: 5_000,
      weeklyOpportunityCost: 12_000,
    });

    expect(exposure.revenueAtRisk).toBe(112_000);
    expect(exposure.governancePenalty).toBe(20_000);
    expect(exposure.opportunityCost).toBe(48_000);
    expect(exposure.totalCostOfDelay).toBe(180_000);
    expect(exposure.weeklyBurnRate).toBe(45_000);
    expect(exposure.currencyCode).toBe("GBP");
  });

  it("handles zero delay (no exposure)", () => {
    const exposure = computeFinancialExposure({
      weeklyRevenueAtRisk: 10_000,
      weeksDelayed: 0,
    });
    expect(exposure.totalCostOfDelay).toBe(0);
  });

  it("handles missing optional fields (defaults to 0)", () => {
    const exposure = computeFinancialExposure({
      weeklyRevenueAtRisk: 5_000,
      weeksDelayed: 3,
    });
    expect(exposure.governancePenalty).toBe(0);
    expect(exposure.opportunityCost).toBe(0);
    expect(exposure.totalCostOfDelay).toBe(15_000);
  });

  it("does not return negative values for negative inputs", () => {
    const exposure = computeFinancialExposure({
      weeklyRevenueAtRisk: -1_000,
      weeksDelayed: -5,
    });
    expect(exposure.totalCostOfDelay).toBeGreaterThanOrEqual(0);
  });
});

// ─── Delay escalation ─────────────────────────────────────────────────────────

describe("determineDelayEscalation()", () => {
  it("CRITICAL level for CRITICAL tier + 2+ weeks delay", () => {
    const esc = determineDelayEscalation("CRITICAL", 2);
    expect(esc.level).toBe("CRITICAL");
  });

  it("ESCALATE for CRITICAL tier + 1 week delay", () => {
    const esc = determineDelayEscalation("CRITICAL", 1);
    expect(esc.level).toBe("ESCALATE");
  });

  it("ESCALATE for HIGH tier + 3+ weeks delay", () => {
    const esc = determineDelayEscalation("HIGH", 3);
    expect(esc.level).toBe("ESCALATE");
  });

  it("NONE for LOW tier with any delay", () => {
    const esc = determineDelayEscalation("LOW", 10);
    expect(esc.level).toBe("NONE");
  });

  it("NONE for MEDIUM tier with 0 weeks", () => {
    const esc = determineDelayEscalation("MEDIUM", 0);
    expect(esc.level).toBe("NONE");
  });

  it("escalation has signal string", () => {
    const esc = determineDelayEscalation("CRITICAL", 3);
    expect(typeof esc.signal).toBe("string");
    expect(esc.signal.length).toBeGreaterThan(0);
  });
});

// ─── computeCostOfDelay() ─────────────────────────────────────────────────────

describe("computeCostOfDelay()", () => {
  it("returns CRITICAL tier for high-priority inputs", () => {
    const result = computeCostOfDelay(
      { userBusinessValue: 13, timeCriticality: 21, riskReduction: 13, jobDuration: 2 },
    );
    expect(result.wsjfTier).toBe("CRITICAL");
    expect(result.validationErrors).toEqual([]);
  });

  it("returns financial exposure when financialInputs provided", () => {
    const result = computeCostOfDelay(
      { userBusinessValue: 13, timeCriticality: 21, riskReduction: 13, jobDuration: 2 },
      { weeklyRevenueAtRisk: 28_000, weeksDelayed: 4, governancePenaltyPerWeek: 5_000, weeklyOpportunityCost: 12_000 },
    );
    expect(result.financialExposure).not.toBeNull();
    expect(result.financialExposure!.totalCostOfDelay).toBe(180_000);
  });

  it("returns null financialExposure when no financialInputs", () => {
    const result = computeCostOfDelay(
      { userBusinessValue: 5, timeCriticality: 5, riskReduction: 3, jobDuration: 5 },
    );
    expect(result.financialExposure).toBeNull();
  });

  it("returns validation errors for invalid inputs", () => {
    const result = computeCostOfDelay(
      { userBusinessValue: -1, timeCriticality: 0, riskReduction: 0, jobDuration: -5 },
    );
    expect(result.validationErrors.length).toBeGreaterThan(0);
  });

  it("has a recommendation string", () => {
    const result = computeCostOfDelay(
      { userBusinessValue: 5, timeCriticality: 5, riskReduction: 3, jobDuration: 5 },
    );
    expect(typeof result.recommendation).toBe("string");
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});

// ─── Adapter ──────────────────────────────────────────────────────────────────

describe("costOfDelayAdapter identity", () => {
  it("has correct id", () => {
    expect(costOfDelayAdapter.id).toBe(COST_OF_DELAY_ENGINE_ID);
    expect(COST_OF_DELAY_ENGINE_ID).toBe("cost-of-delay");
  });

  it("getVersion() returns version string", () => {
    expect(costOfDelayAdapter.getVersion()).toBe(COST_OF_DELAY_VERSION);
    expect(COST_OF_DELAY_VERSION).toBe("1.0.0");
  });
});

describe("costOfDelayAdapter.selfTest()", () => {
  it("passes", async () => {
    const result = await costOfDelayAdapter.selfTest();
    expect(result.ok).toBe(true);
  });

  it("describes CRITICAL, MEDIUM, LOW tiers in message", async () => {
    const result = await costOfDelayAdapter.selfTest();
    expect(result.message).toMatch(/CRITICAL/);
    expect(result.message).toMatch(/MEDIUM/);
    expect(result.message).toMatch(/LOW/);
  });
});

describe("costOfDelayAdapter.run() — EngineRunOutput contract", () => {
  it("returns valid EngineRunOutput for critical fixture", async () => {
    const output = await costOfDelayAdapter.run({ payload: { useCriticalFixture: true } });
    expect(typeof output.summary).toBe("string");
    expect(typeof output.severity).toBe("string");
    expect(typeof output.engineVersion).toBe("string");
    expect(typeof output.durationMs).toBe("number");
    expect(Array.isArray(output.findings)).toBe(true);
    expect(output.engineVersion).toBe(COST_OF_DELAY_VERSION);
  });

  it("CRITICAL fixture returns CRITICAL severity", async () => {
    const output = await costOfDelayAdapter.run({ payload: { useCriticalFixture: true } });
    expect(output.severity).toBe("CRITICAL");
  });

  it("LOW fixture returns INFO severity", async () => {
    const output = await costOfDelayAdapter.run({ payload: { useLowFixture: true } });
    expect(output.severity).toBe("INFO");
  });

  it("critical fixture has findings", async () => {
    const output = await costOfDelayAdapter.run({ payload: { useCriticalFixture: true } });
    expect(output.findings.length).toBeGreaterThan(0);
  });

  it("has limitations", async () => {
    const output = await costOfDelayAdapter.run({ payload: { useMediumFixture: true } });
    expect(Array.isArray(output.limitations)).toBe(true);
    expect(output.limitations!.length).toBeGreaterThan(0);
  });

  it("rawOutput contains formulaSteps", async () => {
    const output = await costOfDelayAdapter.run({ payload: { useCriticalFixture: true } });
    const raw = output.rawOutput as Record<string, unknown>;
    expect(Array.isArray(raw.formulaSteps)).toBe(true);
    expect((raw.formulaSteps as unknown[]).length).toBeGreaterThan(0);
  });

  it("rawOutput contains wsjfScore and wsjfTier", async () => {
    const output = await costOfDelayAdapter.run({ payload: { useCriticalFixture: true } });
    const raw = output.rawOutput as Record<string, unknown>;
    expect(typeof raw.wsjfScore).toBe("number");
    expect(typeof raw.wsjfTier).toBe("string");
  });

  it("each finding has required fields", async () => {
    const output = await costOfDelayAdapter.run({ payload: { useCriticalFixture: true } });
    for (const finding of output.findings) {
      expect(typeof finding.id).toBe("string");
      expect(typeof finding.title).toBe("string");
      expect(typeof finding.description).toBe("string");
      expect(typeof finding.severity).toBe("string");
      expect(typeof finding.source).toBe("string");
    }
  });
});

describe("costOfDelayAdapter.run() — custom payload", () => {
  it("accepts custom WSJF inputs", async () => {
    const output = await costOfDelayAdapter.run({
      payload: {
        userBusinessValue: 8,
        timeCriticality: 13,
        riskReduction: 5,
        jobDuration: 3,
      },
    });
    expect(output.findings.length).toBeGreaterThan(0);
  });

  it("accepts financial inputs alongside WSJF", async () => {
    const output = await costOfDelayAdapter.run({
      payload: {
        userBusinessValue: 8,
        timeCriticality: 13,
        riskReduction: 5,
        jobDuration: 3,
        weeklyRevenueAtRisk: 15_000,
        weeksDelayed: 3,
      },
    });
    const raw = output.rawOutput as Record<string, unknown>;
    expect(raw.financialExposure).not.toBeNull();
  });

  it("validation errors from invalid inputs produce HIGH severity", async () => {
    const output = await costOfDelayAdapter.run({
      payload: {
        userBusinessValue: -999,
        timeCriticality: 0,
        riskReduction: 0,
        jobDuration: -1,
      },
    });
    expect(output.severity).toBe("HIGH");
    expect(output.findings.some((f) => f.title.includes("validation error"))).toBe(true);
  });
});
