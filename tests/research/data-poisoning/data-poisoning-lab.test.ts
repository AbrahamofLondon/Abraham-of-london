/**
 * tests/research/data-poisoning/data-poisoning-lab.test.ts
 *
 * Tests for the Data Poisoning Lab service.
 * Verifies: service structure, test manifest, output shape, security scoring,
 * and that the service correctly identifies vulnerable vs. clean adapters.
 */

import { describe, it, expect } from "vitest";
import { DataPoisoningService } from "@/lib/research/data-poisoning/data-poisoning-service";
import type { PoisonRunResult } from "@/lib/research/data-poisoning/data-poisoning-service";

// ─── Stub adapters ────────────────────────────────────────────────────────────

/** Clean adapter — never throws, returns valid output regardless of input */
const CLEAN_ADAPTER = {
  run: async (_input: { payload: unknown }) => ({
    findings: [],
    summary: "Handled adversarial input safely",
    severity: "INFO",
    engineVersion: "clean-1.0.0",
    durationMs: 1,
    limitations: [],
    rawOutput: {},
  }),
  getVersion: () => "clean-1.0.0",
};

/** Vulnerable adapter — throws on every input */
const VULNERABLE_ADAPTER = {
  run: async (_input: { payload: unknown }): Promise<never> => {
    throw new Error("Adapter leaked on adversarial input");
  },
  getVersion: () => "vulnerable-1.0.0",
};

// ─── Test manifest ────────────────────────────────────────────────────────────

describe("DataPoisoningService.getTestManifest()", () => {
  it("returns a non-empty manifest", () => {
    const manifest = DataPoisoningService.getTestManifest();
    expect(manifest.length).toBeGreaterThan(0);
  });

  it("includes all 10 test categories", () => {
    const manifest = DataPoisoningService.getTestManifest();
    const ids = manifest.map((m) => m.id);
    expect(ids).toContain("SQL_INJECTION");
    expect(ids).toContain("XSS_PAYLOAD");
    expect(ids).toContain("PATH_TRAVERSAL");
    expect(ids).toContain("TEMPLATE_INJECTION");
    expect(ids).toContain("OVERSIZED_ARRAY");
    expect(ids).toContain("DEEPLY_NESTED");
    expect(ids).toContain("UNICODE_POISON");
    expect(ids).toContain("NUMERIC_EXTREMES");
    expect(ids).toContain("PROTOTYPE_POLLUTION");
    expect(ids).toContain("CIRCULAR_STRUCTURE");
  });

  it("each entry has id, label, category, and notes", () => {
    const manifest = DataPoisoningService.getTestManifest();
    for (const entry of manifest) {
      expect(typeof entry.id).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.category).toBe("string");
      expect(typeof entry.notes).toBe("string");
      expect(entry.id.length).toBeGreaterThan(0);
    }
  });

  it("covers Injection category", () => {
    const manifest = DataPoisoningService.getTestManifest();
    const injectionTests = manifest.filter((m) => m.category === "Injection");
    expect(injectionTests.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── Clean adapter ────────────────────────────────────────────────────────────

describe("DataPoisoningService.runPoisonTests() — clean adapter", () => {
  let result: PoisonRunResult;

  it("runs without throwing", async () => {
    result = await DataPoisoningService.runPoisonTests("clean-engine", CLEAN_ADAPTER);
    expect(result).toBeDefined();
  });

  it("returns correct engineId", () => {
    expect(result.engineId).toBe("clean-engine");
  });

  it("runs all 10 tests", () => {
    expect(result.totalTests).toBe(10);
    expect(result.tests.length).toBe(10);
  });

  it("all tests are CLEAN", () => {
    expect(result.cleanCount).toBe(10);
    expect(result.vulnerableCount).toBe(0);
  });

  it("achieves 100% security score", () => {
    expect(result.securityScore).toBe(100);
  });

  it("each test has required fields", () => {
    for (const test of result.tests) {
      expect(typeof test.testId).toBe("string");
      expect(typeof test.label).toBe("string");
      expect(typeof test.category).toBe("string");
      expect(typeof test.threw).toBe("boolean");
      expect(typeof test.outputValid).toBe("boolean");
      expect(typeof test.durationMs).toBe("number");
      expect(["CLEAN", "VULNERABLE", "EXPECTED_ERROR"]).toContain(test.outcome);
    }
  });

  it("summary indicates no vulnerabilities", () => {
    expect(result.summary).toMatch(/passed all/i);
  });
});

// ─── Vulnerable adapter ───────────────────────────────────────────────────────

describe("DataPoisoningService.runPoisonTests() — vulnerable adapter", () => {
  let result: PoisonRunResult;

  it("runs without throwing (catches adapter crashes)", async () => {
    result = await DataPoisoningService.runPoisonTests("vulnerable-engine", VULNERABLE_ADAPTER);
    expect(result).toBeDefined();
  });

  it("records all tests as VULNERABLE", () => {
    expect(result.vulnerableCount).toBe(10);
    expect(result.cleanCount).toBe(0);
  });

  it("achieves 0% security score", () => {
    expect(result.securityScore).toBe(0);
  });

  it("records error messages for thrown tests", () => {
    for (const test of result.tests) {
      expect(test.threw).toBe(true);
      expect(test.errorMessage).not.toBeNull();
    }
  });

  it("summary indicates vulnerabilities", () => {
    expect(result.summary).toMatch(/vulnerabilit/i);
  });
});

// ─── Output contract ──────────────────────────────────────────────────────────

describe("PoisonRunResult contract", () => {
  it("result has all required top-level fields", async () => {
    const result = await DataPoisoningService.runPoisonTests("contract-engine", CLEAN_ADAPTER);
    expect(typeof result.engineId).toBe("string");
    expect(typeof result.engineVersion).toBe("string");
    expect(typeof result.totalTests).toBe("number");
    expect(typeof result.cleanCount).toBe("number");
    expect(typeof result.vulnerableCount).toBe("number");
    expect(typeof result.expectedErrorCount).toBe("number");
    expect(Array.isArray(result.tests)).toBe(true);
    expect(typeof result.securityScore).toBe("number");
    expect(typeof result.summary).toBe("string");
    expect(typeof result.durationMs).toBe("number");
  });

  it("securityScore is 0–100", async () => {
    const result = await DataPoisoningService.runPoisonTests("score-engine", CLEAN_ADAPTER);
    expect(result.securityScore).toBeGreaterThanOrEqual(0);
    expect(result.securityScore).toBeLessThanOrEqual(100);
  });

  it("totalTests = cleanCount + vulnerableCount + expectedErrorCount", async () => {
    const result = await DataPoisoningService.runPoisonTests("total-engine", CLEAN_ADAPTER);
    expect(result.totalTests).toBe(result.cleanCount + result.vulnerableCount + result.expectedErrorCount);
  });
});
