/**
 * lib/product/outcome-contribution-contract.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  computeBenchmarkContext,
  buildEmptyBenchmarkContext,
  BENCHMARK_MIN_N,
  type AnonymisedOutcomeContribution,
} from "./outcome-contribution-contract";

function makeContrib(
  overrides: Partial<AnonymisedOutcomeContribution> = {},
  i = 0,
): AnonymisedOutcomeContribution {
  return {
    contributionId: `contrib-${i}`,
    assessmentBand: "ALERT",
    assessmentKind: "FAST_DIAGNOSTIC",
    outcomeState: "IMPROVED",
    timeToAct: "SHORT",
    findingAccurate: true,
    recommendationUseful: true,
    contributedAt: new Date().toISOString(),
    retracted: false,
    ...overrides,
  };
}

function makeN(n: number, overrides: Partial<AnonymisedOutcomeContribution> = {}): AnonymisedOutcomeContribution[] {
  return Array.from({ length: n }, (_, i) => makeContrib(overrides, i));
}

// ─── BENCHMARK_MIN_N ──────────────────────────────────────────────────────────

describe("BENCHMARK_MIN_N", () => {
  it("is 50", () => {
    expect(BENCHMARK_MIN_N).toBe(50);
  });
});

// ─── buildEmptyBenchmarkContext ───────────────────────────────────────────────

describe("buildEmptyBenchmarkContext", () => {
  it("returns NO_DATA with zero rates", () => {
    const ctx = buildEmptyBenchmarkContext("NO_DATA", 0);
    expect(ctx.availability).toBe("NO_DATA");
    expect(ctx.n).toBe(0);
    expect(ctx.improvementRate).toBeNull();
    expect(ctx.findingAccuracyRate).toBeNull();
    expect(ctx.recommendationUsefulRate).toBeNull();
    expect(ctx.mostCommonTimeToAct).toBeNull();
  });

  it("includes sourceLabel and disclaimer always", () => {
    const ctx = buildEmptyBenchmarkContext("BUILDING", 10);
    expect(ctx.sourceLabel).toBeTruthy();
    expect(ctx.disclaimer).toBeTruthy();
  });
});

// ─── computeBenchmarkContext ──────────────────────────────────────────────────

describe("computeBenchmarkContext", () => {
  it("returns NO_DATA for empty array", () => {
    const ctx = computeBenchmarkContext([]);
    expect(ctx.availability).toBe("NO_DATA");
    expect(ctx.n).toBe(0);
  });

  it("returns BUILDING for n < 50", () => {
    const ctx = computeBenchmarkContext(makeN(49));
    expect(ctx.availability).toBe("BUILDING");
    expect(ctx.n).toBe(49);
    expect(ctx.improvementRate).toBeNull();
  });

  it("returns AVAILABLE for n >= 50", () => {
    const ctx = computeBenchmarkContext(makeN(50));
    expect(ctx.availability).toBe("AVAILABLE");
    expect(ctx.n).toBe(50);
  });

  it("excludes retracted contributions from n", () => {
    const contributions = [
      ...makeN(49),
      makeContrib({ retracted: true }, 99),
    ];
    const ctx = computeBenchmarkContext(contributions);
    expect(ctx.availability).toBe("BUILDING");
    expect(ctx.n).toBe(49);
  });

  it("computes 100% improvement rate when all IMPROVED", () => {
    const ctx = computeBenchmarkContext(makeN(50, { outcomeState: "IMPROVED" }));
    expect(ctx.improvementRate).toBe(100);
  });

  it("counts RESOLVED as improved", () => {
    const contributions = [
      ...makeN(25, { outcomeState: "IMPROVED" }),
      ...makeN(25, { outcomeState: "RESOLVED" }),
    ];
    const ctx = computeBenchmarkContext(contributions);
    expect(ctx.improvementRate).toBe(100);
  });

  it("computes 0% improvement rate when all UNCHANGED", () => {
    const ctx = computeBenchmarkContext(makeN(50, { outcomeState: "UNCHANGED" }));
    expect(ctx.improvementRate).toBe(0);
  });

  it("computes improvement rate correctly for mixed outcomes", () => {
    const contributions = [
      ...makeN(25, { outcomeState: "IMPROVED" }),
      ...makeN(25, { outcomeState: "UNCHANGED" }),
    ];
    const ctx = computeBenchmarkContext(contributions);
    expect(ctx.improvementRate).toBe(50);
  });

  it("computes findingAccuracyRate excluding null answers", () => {
    const contributions = [
      ...makeN(40, { findingAccurate: true }),
      ...makeN(10, { findingAccurate: null }),
    ];
    const ctx = computeBenchmarkContext(contributions);
    // 40 accurate out of 40 answered = 100%
    expect(ctx.findingAccuracyRate).toBe(100);
  });

  it("returns null findingAccuracyRate when all answers are null", () => {
    const ctx = computeBenchmarkContext(makeN(50, { findingAccurate: null }));
    expect(ctx.findingAccuracyRate).toBeNull();
  });

  it("computes most common time-to-act band", () => {
    const contributions = [
      ...makeN(30, { timeToAct: "IMMEDIATE" }),
      ...makeN(20, { timeToAct: "SHORT" }),
    ];
    const ctx = computeBenchmarkContext(contributions);
    expect(ctx.mostCommonTimeToAct).toBe("IMMEDIATE");
  });

  it("sourceLabel always contains n", () => {
    const ctx = computeBenchmarkContext(makeN(50));
    expect(ctx.sourceLabel).toContain("50");
  });

  it("disclaimer always included", () => {
    const ctx = computeBenchmarkContext(makeN(50));
    expect(ctx.disclaimer.length).toBeGreaterThan(10);
    expect(ctx.disclaimer).toContain("self-reported");
  });

  it("improvement rate is a whole number percentage", () => {
    const contributions = [
      ...makeN(33, { outcomeState: "IMPROVED" }),
      ...makeN(17, { outcomeState: "UNCHANGED" }),
    ];
    const ctx = computeBenchmarkContext(contributions);
    expect(Number.isInteger(ctx.improvementRate)).toBe(true);
  });
});
