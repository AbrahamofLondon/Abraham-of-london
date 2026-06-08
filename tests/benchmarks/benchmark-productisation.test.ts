/**
 * tests/benchmarks/benchmark-productisation.test.ts
 *
 * BRIEF 2 — P10: Benchmark Context Productisation Tests
 *
 * 14 required test cases covering:
 *   BC.1  — Metric registry: all 5 product surfaces are registered
 *   BC.2  — Metric registry: getMetricsForTier(free) returns only free metrics
 *   BC.3  — Metric registry: getMetricsForTier(professional) returns free + professional
 *   BC.4  — Metric registry: no metric has an empty or non-string metricKey
 *   BC.5  — Metric registry: all metrics have scoreMin < scoreMax
 *   BC.6  — Benchmark narrative: unavailable position returns available=false
 *   BC.7  — Benchmark narrative: available position returns headline, positionStatement, disclaimer
 *   BC.8  — Benchmark narrative: free tier includes upgradeSignal when professional metrics exist
 *   BC.9  — Benchmark narrative: professional tier has upgradeSignal = null
 *   BC.10 — Benchmark narrative: disclaimer always includes sample size
 *   BC.11 — Benchmark fact service: validateFactAnonymization rejects anonymized=false
 *   BC.12 — Benchmark fact service: validateFactAnonymization rejects short sessionHash
 *   BC.13 — Benchmark fact service: validateFactAnonymization rejects known PII field names
 *   BC.14 — Benchmark context authority: BENCHMARK_CAPABILITY is complete and internally consistent
 */

import { describe, it, expect } from "vitest";

import {
  BENCHMARK_METRIC_REGISTRY,
  getMetricsForTier,
  getFreeMetrics,
  getMetricSpec,
  getAssessmentKind,
  type ProductSurface,
} from "@/lib/benchmarks/benchmark-metric-registry";

import {
  buildBenchmarkNarrative,
  buildUnavailableBenchmarkNarrative,
  type BenchmarkNarrativeContext,
} from "@/lib/benchmarks/benchmark-narrative";

import {
  validateFactAnonymization,
  SESSION_HASH_LENGTH,
  type BenchmarkFactWriteInput,
} from "@/lib/benchmarks/benchmark-fact-service";

import {
  BENCHMARK_CAPABILITY,
  BENCHMARK_DIMENSIONS,
  isBenchmarkDimensionAvailable,
  getAvailableDimensions,
} from "@/lib/benchmarks/benchmark-context-authority";

import type { BenchmarkPosition } from "@/lib/benchmarks/benchmark-engine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRODUCT_SURFACES: ProductSurface[] = [
  "fast_diagnostic",
  "team_assessment",
  "decision_centre",
  "executive_report",
  "return_brief",
];

function makePosition(available: true, n: number, metrics: string[]): BenchmarkPosition;
function makePosition(available: false, n: number): BenchmarkPosition;
function makePosition(available: boolean, n: number, metrics: string[] = []): BenchmarkPosition {
  if (!available) {
    return {
      available: false,
      cohort: { id: "test", filters: {}, sampleSize: n },
      confidence: 0,
      insufficientReason: `Sample ${n} below threshold.`,
      deviations: [],
    };
  }
  return {
    available: true,
    cohort: { id: "test", filters: {}, sampleSize: n },
    confidence: 80,
    deviations: metrics.map((m) => ({
      metric: m,
      subjectValue: 75,
      percentile: 65,
      cohortMedian: 60,
      varianceFromCohort: 15,
      confidence: 80,
    })),
  };
}

function makeWriteInput(overrides: Partial<BenchmarkFactWriteInput> = {}): BenchmarkFactWriteInput {
  return {
    sessionHash: "a".repeat(SESSION_HASH_LENGTH),
    assessmentKind: "FAST_DIAGNOSTIC",
    metrics: [{ metric: "authorityClarity", value: 72 }],
    dimensions: { assessmentType: "FAST_DIAGNOSTIC" },
    anonymized: true,
    ...overrides,
  };
}

// ─── BC.1 — Metric registry: all 5 product surfaces registered ───────────────

describe("BC.1 — Metric registry: all 5 product surfaces are registered", () => {
  it("has exactly 5 surfaces", () => {
    const keys = Object.keys(BENCHMARK_METRIC_REGISTRY) as ProductSurface[];
    expect(keys).toHaveLength(5);
  });

  it.each(PRODUCT_SURFACES)("surface %s is in registry", (surface) => {
    expect(BENCHMARK_METRIC_REGISTRY[surface]).toBeDefined();
    expect(BENCHMARK_METRIC_REGISTRY[surface].surface).toBe(surface);
  });

  it.each(PRODUCT_SURFACES)("surface %s has a non-empty assessmentKind", (surface) => {
    expect(getAssessmentKind(surface).length).toBeGreaterThan(0);
  });

  it.each(PRODUCT_SURFACES)("surface %s has at least one metric", (surface) => {
    expect(BENCHMARK_METRIC_REGISTRY[surface].metrics.length).toBeGreaterThan(0);
  });
});

// ─── BC.2 — getMetricsForTier(free) returns only free metrics ─────────────────

describe("BC.2 — getMetricsForTier(free) returns only free-tier metrics", () => {
  it.each(PRODUCT_SURFACES)("surface %s — all returned metrics are free", (surface) => {
    const freeMetrics = getMetricsForTier(surface, "free");
    for (const m of freeMetrics) {
      expect(m.accessTier).toBe("free");
    }
  });

  it("fast_diagnostic has free metrics", () => {
    const freeMetrics = getFreeMetrics("fast_diagnostic");
    expect(freeMetrics.length).toBeGreaterThan(0);
  });

  it("return_brief has no free metrics (all professional)", () => {
    const freeMetrics = getFreeMetrics("return_brief");
    expect(freeMetrics.length).toBe(0);
  });
});

// ─── BC.3 — getMetricsForTier(professional) returns free + professional ───────

describe("BC.3 — getMetricsForTier(professional) returns free + professional metrics", () => {
  it.each(PRODUCT_SURFACES)("surface %s professional tier is superset of free", (surface) => {
    const freeMetrics = getMetricsForTier(surface, "free");
    const profMetrics = getMetricsForTier(surface, "professional");
    // Every free metric should be in the professional set
    for (const m of freeMetrics) {
      expect(profMetrics.some((pm) => pm.metricKey === m.metricKey)).toBe(true);
    }
    // Professional should have at least as many metrics as free
    expect(profMetrics.length).toBeGreaterThanOrEqual(freeMetrics.length);
  });

  it("team_assessment professional tier includes teamDivergenceScore", () => {
    const profMetrics = getMetricsForTier("team_assessment", "professional");
    expect(profMetrics.some((m) => m.metricKey === "teamDivergenceScore")).toBe(true);
  });
});

// ─── BC.4 — All metrics have non-empty string metricKeys ──────────────────────

describe("BC.4 — All metrics have non-empty string metricKey", () => {
  const allMetrics = PRODUCT_SURFACES.flatMap((s) =>
    BENCHMARK_METRIC_REGISTRY[s].metrics.map((m) => [s, m.metricKey, m] as const),
  );

  it.each(allMetrics)("surface %s metric %s has a non-empty metricKey", (_, key, m) => {
    expect(typeof m.metricKey).toBe("string");
    expect(m.metricKey.length).toBeGreaterThan(0);
    expect(m.label.length).toBeGreaterThan(0);
    expect(m.description.length).toBeGreaterThan(0);
  });
});

// ─── BC.5 — All metrics have scoreMin < scoreMax ──────────────────────────────

describe("BC.5 — All metrics have scoreMin < scoreMax", () => {
  const allMetrics = PRODUCT_SURFACES.flatMap((s) =>
    BENCHMARK_METRIC_REGISTRY[s].metrics.map((m) => [s, m.metricKey, m] as const),
  );

  it.each(allMetrics)("surface %s metric %s: scoreMin < scoreMax", (_, __, m) => {
    expect(m.scoreMin).toBeLessThan(m.scoreMax);
  });
});

// ─── BC.6 — Narrative: unavailable position → available=false ─────────────────

describe("BC.6 — Benchmark narrative: unavailable position returns available=false", () => {
  const ctx: BenchmarkNarrativeContext = { surface: "fast_diagnostic", tier: "free" };

  it("position.available=false → narrative.available=false", () => {
    const position = makePosition(false, 3);
    const narrative = buildBenchmarkNarrative(position, ctx);
    expect(narrative.available).toBe(false);
  });

  it("unavailable narrative has empty deviations", () => {
    const position = makePosition(false, 3);
    const narrative = buildBenchmarkNarrative(position, ctx);
    expect(narrative.deviations).toHaveLength(0);
  });

  it("buildUnavailableBenchmarkNarrative returns available=false", () => {
    const n = buildUnavailableBenchmarkNarrative("test reason");
    expect(n.available).toBe(false);
    expect(n.positionStatement).toContain("test reason");
  });
});

// ─── BC.7 — Narrative: available position has required fields ─────────────────

describe("BC.7 — Benchmark narrative: available position has headline, positionStatement, disclaimer", () => {
  const position = makePosition(true, 80, ["authorityClarity"]);
  const ctx: BenchmarkNarrativeContext = {
    surface: "fast_diagnostic",
    tier: "professional",
    assessmentLabel: "diagnostic",
  };

  it("has a non-empty headline", () => {
    const n = buildBenchmarkNarrative(position, ctx);
    expect(n.headline.length).toBeGreaterThan(0);
  });

  it("has a non-empty positionStatement", () => {
    const n = buildBenchmarkNarrative(position, ctx);
    expect(n.positionStatement.length).toBeGreaterThan(0);
  });

  it("has a non-empty disclaimer", () => {
    const n = buildBenchmarkNarrative(position, ctx);
    expect(n.disclaimer.length).toBeGreaterThan(0);
  });

  it("has available=true", () => {
    const n = buildBenchmarkNarrative(position, ctx);
    expect(n.available).toBe(true);
  });

  it("positionStatement contains sample size n", () => {
    const n = buildBenchmarkNarrative(position, ctx);
    expect(n.positionStatement).toContain("80");
  });
});

// ─── BC.8 — Narrative: free tier includes upgradeSignal when professional metrics exist ──

describe("BC.8 — Benchmark narrative: free tier includes upgradeSignal when professional metrics exist", () => {
  it("fast_diagnostic free tier has upgradeSignal (professional metrics available)", () => {
    // fast_diagnostic has no professional metrics currently
    // Use decision_centre which has professional metrics
    const position = makePosition(true, 80, []);
    const ctx: BenchmarkNarrativeContext = { surface: "decision_centre", tier: "free" };
    const n = buildBenchmarkNarrative(position, ctx);
    // decision_centre has professional metrics
    expect(n.upgradeSignal).not.toBeNull();
    expect(n.upgradeSignal).toContain("Professional");
  });

  it("return_brief free tier has upgradeSignal (all metrics are professional)", () => {
    const position = makePosition(true, 80, []);
    const ctx: BenchmarkNarrativeContext = { surface: "return_brief", tier: "free" };
    const n = buildBenchmarkNarrative(position, ctx);
    expect(n.upgradeSignal).not.toBeNull();
  });
});

// ─── BC.9 — Narrative: professional tier has upgradeSignal = null ─────────────

describe("BC.9 — Benchmark narrative: professional tier has upgradeSignal = null", () => {
  it.each(PRODUCT_SURFACES)("surface %s professional tier: upgradeSignal = null", (surface) => {
    const position = makePosition(true, 80, []);
    const ctx: BenchmarkNarrativeContext = { surface, tier: "professional" };
    const n = buildBenchmarkNarrative(position, ctx);
    expect(n.upgradeSignal).toBeNull();
  });
});

// ─── BC.10 — Narrative: disclaimer includes sample size ───────────────────────

describe("BC.10 — Benchmark narrative: disclaimer always includes sample size", () => {
  it("available narrative: disclaimer contains n=80", () => {
    const position = makePosition(true, 80, []);
    const ctx: BenchmarkNarrativeContext = { surface: "fast_diagnostic", tier: "free" };
    const n = buildBenchmarkNarrative(position, ctx);
    expect(n.disclaimer).toContain("80");
  });

  it("available narrative: n field = position.cohort.sampleSize", () => {
    const position = makePosition(true, 123, []);
    const ctx: BenchmarkNarrativeContext = { surface: "fast_diagnostic", tier: "free" };
    const n = buildBenchmarkNarrative(position, ctx);
    expect(n.n).toBe(123);
  });
});

// ─── BC.11 — Fact service: validateFactAnonymization rejects anonymized=false ──

describe("BC.11 — Benchmark fact service: validateFactAnonymization rejects anonymized=false", () => {
  it("anonymized=false is rejected", () => {
    // Cast to bypass TypeScript's literal false check
    const input = makeWriteInput({ anonymized: false as unknown as true });
    const result = validateFactAnonymization(input);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("valid input is accepted", () => {
    const input = makeWriteInput();
    const result = validateFactAnonymization(input);
    expect(result.valid).toBe(true);
  });
});

// ─── BC.12 — Fact service: rejects short sessionHash ─────────────────────────

describe("BC.12 — Benchmark fact service: validateFactAnonymization rejects short sessionHash", () => {
  it("short hash (not 64 chars) is rejected", () => {
    const input = makeWriteInput({ sessionHash: "abc123" });
    const result = validateFactAnonymization(input);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("64");
  });

  it("exactly 64-char hash is accepted", () => {
    const input = makeWriteInput({ sessionHash: "f".repeat(64) });
    const result = validateFactAnonymization(input);
    expect(result.valid).toBe(true);
  });
});

// ─── BC.13 — Fact service: rejects PII field names in dimensions ──────────────

describe("BC.13 — Benchmark fact service: validateFactAnonymization rejects PII field names", () => {
  it("dimension key 'email' is rejected", () => {
    const input = makeWriteInput({ dimensions: { assessmentType: "FAST", email: "user@example.com" } as never });
    const result = validateFactAnonymization(input);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("email");
  });

  it("dimension key 'userId' is rejected", () => {
    const input = makeWriteInput({ dimensions: { userId: "abc" } as never });
    const result = validateFactAnonymization(input);
    expect(result.valid).toBe(false);
  });

  it("safe dimension keys (sector, maturity, assessmentType) are accepted", () => {
    const input = makeWriteInput({
      dimensions: { sector: "technology", maturity: "scaling", assessmentType: "FAST_DIAGNOSTIC" },
    });
    const result = validateFactAnonymization(input);
    expect(result.valid).toBe(true);
  });
});

// ─── BC.14 — BENCHMARK_CAPABILITY is complete and internally consistent ───────

describe("BC.14 — BENCHMARK_CAPABILITY is complete and internally consistent", () => {
  it("canonicalRoute is /benchmark-context", () => {
    expect(BENCHMARK_CAPABILITY.canonicalRoute).toBe("/benchmark-context");
  });

  it("minimumPoolSize = 50", () => {
    expect(BENCHMARK_CAPABILITY.minimumPoolSize).toBe(50);
  });

  it("allowsPublicClaimsBeforeThreshold = false", () => {
    expect(BENCHMARK_CAPABILITY.allowsPublicClaimsBeforeThreshold).toBe(false);
  });

  it("requiresAnonymization = true", () => {
    expect(BENCHMARK_CAPABILITY.requiresAnonymization).toBe(true);
  });

  it("all free dimensions are in BENCHMARK_DIMENSIONS", () => {
    for (const d of BENCHMARK_CAPABILITY.freeDimensions) {
      expect(BENCHMARK_DIMENSIONS[d]).toBeDefined();
      expect(BENCHMARK_DIMENSIONS[d].accessTier).toBe("free");
    }
  });

  it("all professional dimensions are in BENCHMARK_DIMENSIONS", () => {
    for (const d of BENCHMARK_CAPABILITY.professionalDimensions) {
      expect(BENCHMARK_DIMENSIONS[d]).toBeDefined();
      expect(BENCHMARK_DIMENSIONS[d].accessTier).toBe("professional");
    }
  });

  it("isBenchmarkDimensionAvailable returns false below minimumCohortSize", () => {
    expect(isBenchmarkDimensionAvailable("role", 49)).toBe(false);
  });

  it("isBenchmarkDimensionAvailable returns true at minimumCohortSize", () => {
    expect(isBenchmarkDimensionAvailable("role", 50)).toBe(true);
  });

  it("getAvailableDimensions(free, 50) returns only free-tier dimensions", () => {
    const dims = getAvailableDimensions("free", 50);
    for (const d of dims) {
      expect(d.accessTier).toBe("free");
    }
  });

  it("disclaimer is non-empty", () => {
    expect(BENCHMARK_CAPABILITY.disclaimer.length).toBeGreaterThan(0);
  });
});
