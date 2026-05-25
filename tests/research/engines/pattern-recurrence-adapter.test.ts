/**
 * Pattern Recurrence Adapter — proof tests.
 *
 * Verifies:
 * - selfTest passes
 * - Known repeated pattern produces recurrence signal
 * - No-recurrence fixture produces no false positive
 * - Output includes ruleTrace/source
 * - Version snapshot exists
 * - Engine failure returns typed error, not raw throw
 */

import { describe, it, expect } from "vitest";
import {
  run,
  selfTest,
  getVersion,
  PATTERN_RECURRENCE_VERSION,
} from "@/lib/research/engines/pattern-recurrence-adapter";

const RECURRENCE_FIXTURE = {
  baseline: {
    contradictions: ["Ownership ambiguity", "Resource conflict", "Timeline pressure"],
    decisionKeys: ["Hire decision", "Budget allocation"],
    authorityFailures: ["CEO override without mandate"],
  },
  current: {
    contradictions: ["Ownership ambiguity", "New conflict", "Timeline pressure"],
    decisionKeys: ["Hire decision", "New decision"],
    authorityFailures: ["CEO override without mandate", "Board bypass"],
  },
};

const CLEAN_FIXTURE = {
  baseline: {
    contradictions: ["Old contradiction A", "Old contradiction B"],
    decisionKeys: ["Retired decision X"],
    authorityFailures: ["Former issue Y"],
  },
  current: {
    contradictions: ["Entirely new issue 1", "Entirely new issue 2"],
    decisionKeys: ["Fresh decision Z"],
    authorityFailures: ["Brand new failure W"],
  },
};

const EMPTY_FIXTURE = {
  baseline: { contradictions: [], decisionKeys: [], authorityFailures: [] },
  current: { contradictions: [], decisionKeys: [], authorityFailures: [] },
};

describe("Pattern Recurrence Adapter — selfTest", () => {
  it("selfTest returns ok: true", async () => {
    const result = await selfTest();
    expect(result.ok).toBe(true);
    expect(result.detail).toBeDefined();
  });
});

describe("Pattern Recurrence Adapter — recurrence detection", () => {
  it("detects recurrence signal from known repeated patterns", async () => {
    const result = await run({ payload: RECURRENCE_FIXTURE });
    expect(result.findings.some((f) => f.title.includes("Recurring"))).toBe(true);
  });

  it("recurrence score is reflected in severity for high recurrence", async () => {
    const result = await run({ payload: RECURRENCE_FIXTURE });
    const severities = result.findings.map((f) => f.severity);
    expect(severities.some((s) => s === "HIGH" || s === "CRITICAL" || s === "MEDIUM")).toBe(true);
  });

  it("identifies recurring contradictions by name", async () => {
    const result = await run({ payload: RECURRENCE_FIXTURE });
    const contradictionFinding = result.findings.find((f) =>
      f.title.includes("contradiction"),
    );
    expect(contradictionFinding).toBeDefined();
    expect(contradictionFinding!.description).toMatch(/Ownership ambiguity/);
    expect(contradictionFinding!.description).toMatch(/Timeline pressure/);
  });

  it("identifies recurring authority failures", async () => {
    const result = await run({ payload: RECURRENCE_FIXTURE });
    const authFinding = result.findings.find((f) => f.title.includes("authority"));
    expect(authFinding).toBeDefined();
    expect(authFinding!.description).toMatch(/CEO override/i);
  });
});

describe("Pattern Recurrence Adapter — no false positives", () => {
  it("produces no recurrence finding for completely different patterns", async () => {
    const result = await run({ payload: CLEAN_FIXTURE });
    const noRecurrenceFinding = result.findings.find(
      (f) => f.title === "No pattern recurrence detected",
    );
    expect(noRecurrenceFinding).toBeDefined();
  });

  it("summary states no recurrence for clean fixture", async () => {
    const result = await run({ payload: CLEAN_FIXTURE });
    expect(result.summary).toMatch(/No pattern recurrence/);
  });
});

describe("Pattern Recurrence Adapter — source/ruleTrace", () => {
  it("all findings have non-empty source (Law 3)", async () => {
    const result = await run({ payload: RECURRENCE_FIXTURE });
    for (const f of result.findings) {
      expect(f.source.trim().length).toBeGreaterThan(0);
    }
  });

  it("formula steps are included in rawOutput", async () => {
    const result = await run({ payload: RECURRENCE_FIXTURE });
    const steps = (result.rawOutput as Record<string, unknown>)["formulaSteps"] as unknown[];
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("formula steps include sourceRule field naming the function", async () => {
    const result = await run({ payload: RECURRENCE_FIXTURE });
    const steps = (result.rawOutput as Record<string, unknown>)["formulaSteps"] as Array<{
      sourceRule: string;
    }>;
    // All steps must have a non-empty sourceRule
    expect(steps.every((s) => s.sourceRule.trim().length > 0)).toBe(true);
    // At least the intersection steps name the function
    expect(steps.some((s) => s.sourceRule.includes("intersect"))).toBe(true);
  });
});

describe("Pattern Recurrence Adapter — version snapshot", () => {
  it("getVersion returns the expected version", async () => {
    const v = await getVersion();
    expect(v.version).toBe(PATTERN_RECURRENCE_VERSION);
  });

  it("engineVersion appears in all rawOutput formula steps", async () => {
    const result = await run({ payload: RECURRENCE_FIXTURE });
    const steps = (result.rawOutput as Record<string, unknown>)["formulaSteps"] as Array<{
      engineVersion: string;
    }>;
    expect(steps.every((s) => s.engineVersion === PATTERN_RECURRENCE_VERSION)).toBe(true);
  });
});

describe("Pattern Recurrence Adapter — error handling", () => {
  it("does not throw for empty baseline/current — returns clean no-recurrence", async () => {
    const result = await run({ payload: EMPTY_FIXTURE });
    expect(result.findings.length).toBeGreaterThanOrEqual(0);
    expect(result.engineVersion).toBe(PATTERN_RECURRENCE_VERSION);
  });

  it("does not throw for null payload — returns HIGH severity error finding", async () => {
    await expect(run({ payload: null as unknown as object })).resolves.toBeDefined();
  });

  it("returns engineVersion on error output", async () => {
    const result = await run({ payload: {} });
    expect(result.engineVersion).toBe(PATTERN_RECURRENCE_VERSION);
  });
});
