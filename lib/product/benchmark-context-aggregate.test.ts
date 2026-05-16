/**
 * lib/product/benchmark-context-aggregate.test.ts
 *
 * Unit tests for the SQL aggregate helper.
 * No DB access — pure computation only.
 */

import { describe, it, expect } from "vitest";
import {
  normaliseAggregateRow,
  aggregateRowToBenchmarkContext,
  mergeAggregateRows,
  prismaRecordToAggregateRow,
  aggregateRowToPrismaData,
  BENCHMARK_AGGREGATE_GLOBAL_KEY,
  BENCHMARK_AGGREGATE_TTL_MS,
  type BenchmarkAggregateRow,
} from "./benchmark-context-aggregate";
import { BENCHMARK_MIN_N } from "./outcome-contribution-contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function zeroRow(overrides: Partial<BenchmarkAggregateRow> = {}): BenchmarkAggregateRow {
  return {
    assessmentKind: null,
    total: 0,
    improved: 0, resolved: 0, unchanged: 0, worsened: 0, abandoned: 0,
    immediate: 0, short: 0, medium: 0, long: 0, didNotAct: 0,
    findingAccurateTotal: 0, findingAccurateTrue: 0,
    recommendationUsefulTotal: 0, recommendationUsefulTrue: 0,
    ...overrides,
  };
}

function populatedRow(n: number, overrides: Partial<BenchmarkAggregateRow> = {}): BenchmarkAggregateRow {
  return zeroRow({
    total: n,
    improved: Math.floor(n * 0.4),
    resolved: Math.floor(n * 0.2),
    unchanged: Math.floor(n * 0.2),
    worsened: Math.floor(n * 0.1),
    abandoned: Math.floor(n * 0.1),
    immediate: Math.floor(n * 0.3),
    short: Math.floor(n * 0.4), // largest → most common
    medium: Math.floor(n * 0.2),
    long: Math.floor(n * 0.05),
    didNotAct: Math.floor(n * 0.05),
    findingAccurateTotal: n,
    findingAccurateTrue: Math.floor(n * 0.75),
    recommendationUsefulTotal: n,
    recommendationUsefulTrue: Math.floor(n * 0.70),
    ...overrides,
  });
}

// ─── normaliseAggregateRow ────────────────────────────────────────────────────

describe("normaliseAggregateRow", () => {
  it("converts bigint values to number", () => {
    const raw = { assessmentKind: "FAST_DIAGNOSTIC", total: 100n, improved: 40n, resolved: 20n, unchanged: 20n, worsened: 10n, abandoned: 10n, immediate: 30n, short: 40n, medium: 20n, long: 5n, didNotAct: 5n, findingAccurateTotal: 100n, findingAccurateTrue: 75n, recommendationUsefulTotal: 100n, recommendationUsefulTrue: 70n };
    const row = normaliseAggregateRow(raw as unknown as Record<string, unknown>);
    expect(typeof row.total).toBe("number");
    expect(row.total).toBe(100);
    expect(row.improved).toBe(40);
  });

  it("converts string numbers to number", () => {
    const raw = { assessmentKind: null, total: "50", improved: "20", resolved: "10", unchanged: "10", worsened: "5", abandoned: "5", immediate: "15", short: "20", medium: "10", long: "3", didNotAct: "2", findingAccurateTotal: "50", findingAccurateTrue: "40", recommendationUsefulTotal: "50", recommendationUsefulTrue: "35" };
    const row = normaliseAggregateRow(raw as Record<string, unknown>);
    expect(row.total).toBe(50);
    expect(row.short).toBe(20);
  });

  it("coerces missing fields to 0", () => {
    const raw = { assessmentKind: "KIND" };
    const row = normaliseAggregateRow(raw as Record<string, unknown>);
    expect(row.total).toBe(0);
    expect(row.improved).toBe(0);
    expect(row.findingAccurateTotal).toBe(0);
  });

  it("preserves null assessmentKind", () => {
    const row = normaliseAggregateRow({ assessmentKind: null, total: 1 });
    expect(row.assessmentKind).toBeNull();
  });

  it("preserves string assessmentKind", () => {
    const row = normaliseAggregateRow({ assessmentKind: "FAST_DIAGNOSTIC", total: 1 });
    expect(row.assessmentKind).toBe("FAST_DIAGNOSTIC");
  });
});

// ─── aggregateRowToBenchmarkContext — NO_DATA ─────────────────────────────────

describe("aggregateRowToBenchmarkContext — NO_DATA", () => {
  it("returns NO_DATA when total is 0", () => {
    const ctx = aggregateRowToBenchmarkContext(zeroRow());
    expect(ctx.availability).toBe("NO_DATA");
    expect(ctx.n).toBe(0);
    expect(ctx.improvementRate).toBeNull();
    expect(ctx.findingAccuracyRate).toBeNull();
    expect(ctx.recommendationUsefulRate).toBeNull();
    expect(ctx.mostCommonTimeToAct).toBeNull();
  });

  it("always includes sourceLabel and disclaimer", () => {
    const ctx = aggregateRowToBenchmarkContext(zeroRow());
    expect(ctx.sourceLabel).toBeTruthy();
    expect(ctx.disclaimer).toBeTruthy();
  });
});

// ─── aggregateRowToBenchmarkContext — BUILDING ────────────────────────────────

describe("aggregateRowToBenchmarkContext — BUILDING", () => {
  it("returns BUILDING when total < BENCHMARK_MIN_N", () => {
    const ctx = aggregateRowToBenchmarkContext(zeroRow({ total: BENCHMARK_MIN_N - 1, improved: 5 }));
    expect(ctx.availability).toBe("BUILDING");
    expect(ctx.n).toBe(BENCHMARK_MIN_N - 1);
    expect(ctx.improvementRate).toBeNull();
  });

  it("returns BUILDING at n=1", () => {
    const ctx = aggregateRowToBenchmarkContext(zeroRow({ total: 1, improved: 1 }));
    expect(ctx.availability).toBe("BUILDING");
  });

  it("boundary: BUILDING at n=49", () => {
    const ctx = aggregateRowToBenchmarkContext(zeroRow({ total: 49 }));
    expect(ctx.availability).toBe("BUILDING");
  });
});

// ─── aggregateRowToBenchmarkContext — AVAILABLE ───────────────────────────────

describe("aggregateRowToBenchmarkContext — AVAILABLE", () => {
  it("returns AVAILABLE at exactly BENCHMARK_MIN_N", () => {
    const ctx = aggregateRowToBenchmarkContext(populatedRow(BENCHMARK_MIN_N));
    expect(ctx.availability).toBe("AVAILABLE");
    expect(ctx.n).toBe(BENCHMARK_MIN_N);
  });

  it("computes improvementRate as (improved + resolved) / total", () => {
    const row = zeroRow({ total: 100, improved: 40, resolved: 20 });
    const ctx = aggregateRowToBenchmarkContext(row);
    expect(ctx.improvementRate).toBe(60);
  });

  it("rounds improvement rate", () => {
    const row = zeroRow({ total: 100, improved: 33, resolved: 0 });
    const ctx = aggregateRowToBenchmarkContext(row);
    expect(ctx.improvementRate).toBe(33);
  });

  it("computes findingAccuracyRate correctly", () => {
    const row = zeroRow({ total: 100, findingAccurateTotal: 80, findingAccurateTrue: 60 });
    const ctx = aggregateRowToBenchmarkContext(row);
    expect(ctx.findingAccuracyRate).toBe(75);
  });

  it("returns null findingAccuracyRate when denominator is 0", () => {
    const row = zeroRow({ total: 100, findingAccurateTotal: 0, findingAccurateTrue: 0 });
    const ctx = aggregateRowToBenchmarkContext(row);
    expect(ctx.findingAccuracyRate).toBeNull();
  });

  it("computes recommendationUsefulRate correctly", () => {
    const row = zeroRow({ total: 100, recommendationUsefulTotal: 50, recommendationUsefulTrue: 40 });
    const ctx = aggregateRowToBenchmarkContext(row);
    expect(ctx.recommendationUsefulRate).toBe(80);
  });

  it("returns null recommendationUsefulRate when denominator is 0", () => {
    const row = zeroRow({ total: 100, recommendationUsefulTotal: 0 });
    const ctx = aggregateRowToBenchmarkContext(row);
    expect(ctx.recommendationUsefulRate).toBeNull();
  });

  it("identifies most common time-to-act band", () => {
    const row = zeroRow({
      total: 100,
      immediate: 10,
      short: 60, // largest
      medium: 20,
      long: 5,
      didNotAct: 5,
    });
    const ctx = aggregateRowToBenchmarkContext(row);
    expect(ctx.mostCommonTimeToAct).toBe("SHORT");
  });

  it("returns null mostCommonTimeToAct when all band counts are 0", () => {
    const row = zeroRow({ total: 100 });
    const ctx = aggregateRowToBenchmarkContext(row);
    expect(ctx.mostCommonTimeToAct).toBeNull();
  });

  it("mostCommonTimeToAct picks highest count (tie goes to first)", () => {
    const row = zeroRow({
      total: 100,
      immediate: 40, // first, tied winner
      short: 40,
      medium: 20,
    });
    const ctx = aggregateRowToBenchmarkContext(row);
    // IMMEDIATE comes first in iteration, wins tie
    expect(ctx.mostCommonTimeToAct).toBe("IMMEDIATE");
  });

  it("includes sourceLabel with n in it", () => {
    const row = populatedRow(100);
    const ctx = aggregateRowToBenchmarkContext(row);
    expect(ctx.sourceLabel).toContain("100");
  });
});

// ─── mergeAggregateRows ───────────────────────────────────────────────────────

describe("mergeAggregateRows", () => {
  it("sums all numeric fields", () => {
    const a = zeroRow({ total: 30, improved: 10, short: 15 });
    const b = zeroRow({ total: 70, improved: 30, short: 35 });
    const merged = mergeAggregateRows([a, b]);
    expect(merged.total).toBe(100);
    expect(merged.improved).toBe(40);
    expect(merged.short).toBe(50);
  });

  it("returns zero row for empty array", () => {
    const merged = mergeAggregateRows([]);
    expect(merged.total).toBe(0);
  });

  it("sets assessmentKind to null (merged is unfiltered)", () => {
    const a = zeroRow({ assessmentKind: "KIND_A", total: 30 });
    const b = zeroRow({ assessmentKind: "KIND_B", total: 70 });
    const merged = mergeAggregateRows([a, b]);
    expect(merged.assessmentKind).toBeNull();
  });

  it("single row merge is identity", () => {
    const row = populatedRow(80);
    const merged = mergeAggregateRows([row]);
    expect(merged.total).toBe(row.total);
    expect(merged.improved).toBe(row.improved);
    expect(merged.findingAccurateTrue).toBe(row.findingAccurateTrue);
  });
});

// ─── prismaRecordToAggregateRow ───────────────────────────────────────────────

describe("prismaRecordToAggregateRow", () => {
  it("maps Prisma field names to BenchmarkAggregateRow field names", () => {
    const record = {
      assessmentKind: "FAST_DIAGNOSTIC",
      n: 80,
      improved: 30, resolved: 20, unchanged: 15, worsened: 10, abandoned: 5,
      timeImmediate: 25, timeShort: 30, timeMedium: 15, timeLong: 5, timeDidNotAct: 5,
      findingAccurateTotal: 80, findingAccurateTrue: 60,
      recommendationUsefulTotal: 80, recommendationUsefulTrue: 55,
    };
    const row = prismaRecordToAggregateRow(record);
    expect(row.total).toBe(80);
    expect(row.immediate).toBe(25);
    expect(row.short).toBe(30);
    expect(row.long).toBe(5);
    expect(row.didNotAct).toBe(5);
    expect(row.assessmentKind).toBe("FAST_DIAGNOSTIC");
  });
});

// ─── aggregateRowToPrismaData ─────────────────────────────────────────────────

describe("aggregateRowToPrismaData", () => {
  it("maps BenchmarkAggregateRow to Prisma field names", () => {
    const row = zeroRow({ total: 80, improved: 30, immediate: 25, short: 30 });
    const data = aggregateRowToPrismaData(row, "FAST_DIAGNOSTIC");
    expect(data.n).toBe(80);
    expect(data.improved).toBe(30);
    expect(data.timeImmediate).toBe(25);
    expect(data.timeShort).toBe(30);
    expect(data.key).toBe("FAST_DIAGNOSTIC");
  });

  it("sets computedAt to approximately now", () => {
    const before = Date.now();
    const data = aggregateRowToPrismaData(zeroRow(), "__ALL__");
    const after = Date.now();
    expect(data.computedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(data.computedAt.getTime()).toBeLessThanOrEqual(after + 10);
  });
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe("Constants", () => {
  it("BENCHMARK_AGGREGATE_GLOBAL_KEY is __ALL__", () => {
    expect(BENCHMARK_AGGREGATE_GLOBAL_KEY).toBe("__ALL__");
  });

  it("BENCHMARK_AGGREGATE_TTL_MS is 1 hour", () => {
    expect(BENCHMARK_AGGREGATE_TTL_MS).toBe(3_600_000);
  });
});

// ─── Leakage guard ───────────────────────────────────────────────────────────

describe("Leakage guard — public response fields", () => {
  it("BenchmarkContext does not contain email, caseId, actorId, or rawDecision", () => {
    const ctx = aggregateRowToBenchmarkContext(populatedRow(100));
    const json = JSON.stringify(ctx);
    expect(json).not.toContain("email");
    expect(json).not.toContain("caseId");
    expect(json).not.toContain("actorId");
    expect(json).not.toContain("rawDecision");
    expect(json).not.toContain("decisionText");
    expect(json).not.toContain("contributionId");
  });

  it("BenchmarkContext does not expose individual timeToAct values (only aggregate)", () => {
    const ctx = aggregateRowToBenchmarkContext(populatedRow(100));
    // The response must not include a list of individual band values
    expect(Array.isArray(ctx.mostCommonTimeToAct)).toBe(false);
  });
});
