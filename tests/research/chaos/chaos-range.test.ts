/**
 * tests/research/chaos/chaos-range.test.ts
 *
 * Tests for the Chaos Range service.
 * Verifies: service structure, test manifest, output shape, resilience scoring,
 * and that the service handles adapters returning valid output on adversarial input.
 */

import { describe, it, expect } from "vitest";
import { ChaosRangeService } from "@/lib/research/chaos/chaos-range-service";
import type { ChaosTestResult, ChaosRunResult } from "@/lib/research/chaos/chaos-range-service";

// ─── Stub adapter ─────────────────────────────────────────────────────────────

/** A resilient adapter that never throws and always returns valid EngineRunOutput */
const RESILIENT_ADAPTER = {
  run: async (_input: { payload: unknown }) => ({
    findings: [],
    summary: "Handled gracefully",
    severity: "INFO",
    engineVersion: "test-1.0.0",
    durationMs: 1,
    limitations: [],
    rawOutput: {},
  }),
  getVersion: () => "test-1.0.0",
};

/** A fragile adapter that throws on any input */
const FRAGILE_ADAPTER = {
  run: async (_input: { payload: unknown }): Promise<never> => {
    throw new Error("Adapter crashed on adversarial input");
  },
  getVersion: () => "fragile-1.0.0",
};

/** An adapter that returns malformed output (no findings array) */
const MALFORMED_ADAPTER = {
  run: async (_input: { payload: unknown }) => ({
    // Missing: findings, summary, severity, engineVersion, durationMs
    result: "something",
  }),
  getVersion: () => "malformed-1.0.0",
};

// ─── Test manifest ────────────────────────────────────────────────────────────

describe("ChaosRangeService.getTestManifest()", () => {
  it("returns a non-empty manifest", () => {
    const manifest = ChaosRangeService.getTestManifest();
    expect(manifest.length).toBeGreaterThan(0);
  });

  it("includes required test IDs", () => {
    const manifest = ChaosRangeService.getTestManifest();
    const ids = manifest.map((m) => m.id);
    expect(ids).toContain("NULL_INPUT");
    expect(ids).toContain("EMPTY_OBJECT");
    expect(ids).toContain("MISSING_FIELDS");
    expect(ids).toContain("TYPE_VIOLATION");
    expect(ids).toContain("BOUNDARY_MIN");
    expect(ids).toContain("BOUNDARY_MAX");
    expect(ids).toContain("EXTREME_STRING");
    expect(ids).toContain("NEGATIVE_VALUES");
  });

  it("each manifest entry has id, label, and notes", () => {
    const manifest = ChaosRangeService.getTestManifest();
    for (const entry of manifest) {
      expect(typeof entry.id).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.notes).toBe("string");
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ─── Resilient adapter ────────────────────────────────────────────────────────

describe("ChaosRangeService.runChaosTests() — resilient adapter", () => {
  let result: ChaosRunResult;

  it("runs without throwing", async () => {
    result = await ChaosRangeService.runChaosTests("test-engine", RESILIENT_ADAPTER);
    expect(result).toBeDefined();
  });

  it("returns correct engineId", () => {
    expect(result.engineId).toBe("test-engine");
  });

  it("returns engine version from adapter", () => {
    expect(result.engineVersion).toBe("test-1.0.0");
  });

  it("runs all 8 tests", () => {
    expect(result.totalTests).toBe(8);
    expect(result.tests.length).toBe(8);
  });

  it("all tests pass for resilient adapter", () => {
    expect(result.passCount).toBe(8);
    expect(result.failCount).toBe(0);
  });

  it("achieves 100% resilience score", () => {
    expect(result.resilienceScore).toBe(100);
  });

  it("each test has required fields", () => {
    for (const test of result.tests) {
      expect(typeof test.testId).toBe("string");
      expect(typeof test.label).toBe("string");
      expect(typeof test.threw).toBe("boolean");
      expect(typeof test.outputValid).toBe("boolean");
      expect(typeof test.durationMs).toBe("number");
      expect(["PASS", "FAIL", "EXPECTED_THROW"]).toContain(test.outcome);
    }
  });

  it("resilient adapter tests all have PASS outcome", () => {
    for (const test of result.tests) {
      expect(test.outcome).toBe("PASS");
    }
  });

  it("summary indicates resilience", () => {
    expect(result.summary).toMatch(/fully resilient/i);
  });

  it("has positive total durationMs", () => {
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

// ─── Fragile adapter ──────────────────────────────────────────────────────────

describe("ChaosRangeService.runChaosTests() — fragile adapter", () => {
  let result: ChaosRunResult;

  it("runs without throwing (catches adapter crashes)", async () => {
    result = await ChaosRangeService.runChaosTests("fragile-engine", FRAGILE_ADAPTER);
    expect(result).toBeDefined();
  });

  it("records all tests as FAIL", () => {
    expect(result.failCount).toBe(8);
    expect(result.passCount).toBe(0);
  });

  it("achieves 0% resilience score", () => {
    expect(result.resilienceScore).toBe(0);
  });

  it("each FAIL test records the error message", () => {
    for (const test of result.tests) {
      expect(test.threw).toBe(true);
      expect(test.errorMessage).toContain("Adapter crashed");
    }
  });

  it("summary indicates resilience failure", () => {
    expect(result.summary).toMatch(/resilience failure/i);
  });
});

// ─── Malformed adapter ────────────────────────────────────────────────────────

describe("ChaosRangeService.runChaosTests() — malformed output adapter", () => {
  let result: ChaosRunResult;

  it("runs without throwing", async () => {
    result = await ChaosRangeService.runChaosTests("malformed-engine", MALFORMED_ADAPTER);
    expect(result).toBeDefined();
  });

  it("records tests as FAIL (invalid output shape)", () => {
    expect(result.failCount).toBe(8);
    expect(result.resilienceScore).toBe(0);
  });

  it("all tests have outputValid: false", () => {
    for (const test of result.tests) {
      expect(test.outputValid).toBe(false);
    }
  });
});

// ─── Output contract ──────────────────────────────────────────────────────────

describe("ChaosRunResult contract", () => {
  it("result has all required top-level fields", async () => {
    const result = await ChaosRangeService.runChaosTests("contract-engine", RESILIENT_ADAPTER);
    expect(typeof result.engineId).toBe("string");
    expect(typeof result.engineVersion).toBe("string");
    expect(typeof result.totalTests).toBe("number");
    expect(typeof result.passCount).toBe("number");
    expect(typeof result.failCount).toBe("number");
    expect(typeof result.expectedThrowCount).toBe("number");
    expect(Array.isArray(result.tests)).toBe(true);
    expect(typeof result.resilienceScore).toBe("number");
    expect(typeof result.summary).toBe("string");
    expect(typeof result.durationMs).toBe("number");
  });

  it("resilienceScore is 0–100", async () => {
    const result = await ChaosRangeService.runChaosTests("score-engine", RESILIENT_ADAPTER);
    expect(result.resilienceScore).toBeGreaterThanOrEqual(0);
    expect(result.resilienceScore).toBeLessThanOrEqual(100);
  });

  it("totalTests = passCount + failCount + expectedThrowCount", async () => {
    const result = await ChaosRangeService.runChaosTests("total-engine", RESILIENT_ADAPTER);
    expect(result.totalTests).toBe(result.passCount + result.failCount + result.expectedThrowCount);
  });
});
