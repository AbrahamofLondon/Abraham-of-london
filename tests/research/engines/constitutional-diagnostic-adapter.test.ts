/**
 * Constitutional Diagnostic Adapter — proof tests.
 *
 * Proves that the adapter:
 *   1. Calls real production logic (deriveConstitutionalDiagnosticBundle)
 *   2. Returns structured findings with route decision
 *   3. Exposes formula trace steps
 *   4. Is honest about its limitations
 *   5. Does not expose customer-facing fields
 *   6. selfTest() passes with default answers
 */

import { describe, it, expect } from "vitest";
import {
  run,
  selfTest,
  getVersion,
  CONSTITUTIONAL_DIAGNOSTIC_ENGINE_ID,
  CONSTITUTIONAL_DIAGNOSTIC_VERSION,
} from "@/lib/research/engines/constitutional-diagnostic-adapter";

// ─── Identity ─────────────────────────────────────────────────────────────────

describe("Constitutional Diagnostic Adapter — identity", () => {
  it("engine ID is 'constitutional-diagnostic'", () => {
    expect(CONSTITUTIONAL_DIAGNOSTIC_ENGINE_ID).toBe("constitutional-diagnostic");
  });

  it("version is semver string", () => {
    expect(CONSTITUTIONAL_DIAGNOSTIC_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("getVersion() returns expected version", async () => {
    const { version } = await getVersion();
    expect(version).toBe(CONSTITUTIONAL_DIAGNOSTIC_VERSION);
  });
});

// ─── selfTest ─────────────────────────────────────────────────────────────────

describe("Constitutional Diagnostic Adapter — selfTest", () => {
  it("selfTest passes with default answers", async () => {
    const result = await selfTest();
    expect(result.ok).toBe(true);
    expect(result.detail).toBeTruthy();
  });

  it("selfTest detail mentions findings count", async () => {
    const result = await selfTest();
    expect(result.detail).toMatch(/findings/i);
  });
});

// ─── run() with useDefaults ───────────────────────────────────────────────────

describe("Constitutional Diagnostic Adapter — run with useDefaults", () => {
  it("returns findings array with at least one finding", async () => {
    const result = await run({ payload: { useDefaults: true } });
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("returns a known engineVersion", async () => {
    const result = await run({ payload: { useDefaults: true } });
    expect(result.engineVersion).toBe(CONSTITUTIONAL_DIAGNOSTIC_VERSION);
  });

  it("summary contains constitutional route keyword", async () => {
    const result = await run({ payload: { useDefaults: true } });
    expect(result.summary).toMatch(/REJECT|DIAGNOSTIC|STRATEGY/);
  });

  it("severity is a valid severity level", async () => {
    const result = await run({ payload: { useDefaults: true } });
    expect(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(result.severity);
  });

  it("durationMs is a non-negative number", async () => {
    const result = await run({ payload: { useDefaults: true } });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

// ─── Formula trace ────────────────────────────────────────────────────────────

describe("Constitutional Diagnostic Adapter — formula trace", () => {
  it("rawOutput contains formula steps", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const steps = raw["formulaSteps"] as Array<Record<string, unknown>>;
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("first formula step is domain-scores", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const steps = raw["formulaSteps"] as Array<Record<string, unknown>>;
    expect(steps[0]?.stepId).toBe("domain-scores");
  });

  it("second formula step is constitutional-routing", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const steps = raw["formulaSteps"] as Array<Record<string, unknown>>;
    expect(steps[1]?.stepId).toBe("constitutional-routing");
  });

  it("all formula steps have non-empty sourceRule", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const steps = raw["formulaSteps"] as Array<Record<string, unknown>>;
    for (const step of steps) {
      expect(typeof step.sourceRule).toBe("string");
      expect((step.sourceRule as string).trim().length).toBeGreaterThan(0);
    }
  });

  it("formula steps include real production function references", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const steps = raw["formulaSteps"] as Array<Record<string, unknown>>;
    const allSourceRules = steps.map((s) => s.sourceRule as string).join(" ");
    // Must reference real production files
    expect(allSourceRules).toMatch(/constitutional-diagnostic-derivation|rules\.ts/);
  });
});

// ─── Raw output domain scores ─────────────────────────────────────────────────

describe("Constitutional Diagnostic Adapter — rawOutput domain scores", () => {
  it("rawOutput exposes authorityScore as a number", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    expect(typeof raw["authorityScore"]).toBe("number");
  });

  it("rawOutput exposes coherenceScore as a number", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    expect(typeof raw["coherenceScore"]).toBe("number");
  });

  it("rawOutput exposes route as REJECT, DIAGNOSTIC, or STRATEGY", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    expect(["REJECT", "DIAGNOSTIC", "STRATEGY"]).toContain(raw["route"]);
  });

  it("rawOutput exposes confidence as a number in [0, 1]", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const confidence = raw["confidence"] as number;
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });
});

// ─── Limitations honesty ──────────────────────────────────────────────────────

describe("Constitutional Diagnostic Adapter — limitations honesty", () => {
  it("limitations array is non-empty", async () => {
    const result = await run({ payload: { useDefaults: true } });
    expect(result.limitations).toBeDefined();
    expect(result.limitations!.length).toBeGreaterThan(0);
  });

  it("promotionRequirements array is non-empty", async () => {
    const result = await run({ payload: { useDefaults: true } });
    expect(result.promotionRequirements).toBeDefined();
    expect(result.promotionRequirements!.length).toBeGreaterThan(0);
  });

  it("limitations mention no AI narrative generation", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const allLimitations = result.limitations!.join(" ").toLowerCase();
    expect(allLimitations).toMatch(/ai|narrative|synthesis/);
  });

  it("limitations mention no session persistence", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const allLimitations = result.limitations!.join(" ").toLowerCase();
    expect(allLimitations).toMatch(/persist|session|journey/);
  });
});

// ─── No customer-facing fields ────────────────────────────────────────────────

describe("Constitutional Diagnostic Adapter — no customer-facing fields", () => {
  it("result does not expose stateToken", async () => {
    const result = await run({ payload: { useDefaults: true } }) as Record<string, unknown>;
    expect(result["stateToken"]).toBeUndefined();
  });

  it("result does not expose caseRef", async () => {
    const result = await run({ payload: { useDefaults: true } }) as Record<string, unknown>;
    expect(result["caseRef"]).toBeUndefined();
  });

  it("result does not expose recoveryQuestion", async () => {
    const result = await run({ payload: { useDefaults: true } }) as Record<string, unknown>;
    expect(result["recoveryQuestion"]).toBeUndefined();
  });

  it("rawOutput does not expose spine", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    expect(raw?.["spine"]).toBeUndefined();
  });

  it("rawOutput does not expose anchorNarrative", async () => {
    const result = await run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    expect(raw?.["anchorNarrative"]).toBeUndefined();
  });
});

// ─── Custom answers ───────────────────────────────────────────────────────────

describe("Constitutional Diagnostic Adapter — custom answers", () => {
  it("accepts explicit answers and returns findings", async () => {
    const result = await run({
      payload: {
        answers: {
          q1: { resonance: 8, certainty: 9 },
          q2: { resonance: 7, certainty: 8 },
          q3: { resonance: 6, certainty: 7 },
          q4: { resonance: 9, certainty: 8 },
          q5: { resonance: 7, certainty: 9 },
          q6: { resonance: 8, certainty: 6 },
          q7: { resonance: 9, certainty: 7 },
          q8: { resonance: 8, certainty: 9 },
          q9: { resonance: 7, certainty: 8 },
          q10: { resonance: 6, certainty: 9 },
        },
      },
    });
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.engineVersion).toBe(CONSTITUTIONAL_DIAGNOSTIC_VERSION);
  });

  it("high-friction answers produce a valid route decision", async () => {
    const result = await run({
      payload: {
        answers: {
          q1: { resonance: 1, certainty: 1 },
          q2: { resonance: 1, certainty: 1 },
          q3: { resonance: 2, certainty: 1 },
          q4: { resonance: 1, certainty: 2 },
          q5: { resonance: 1, certainty: 1 },
          q6: { resonance: 2, certainty: 1 },
          q7: { resonance: 1, certainty: 1 },
          q8: { resonance: 1, certainty: 2 },
          q9: { resonance: 2, certainty: 1 },
          q10: { resonance: 1, certainty: 1 },
        },
      },
    });
    const raw = result.rawOutput as Record<string, unknown>;
    expect(["REJECT", "DIAGNOSTIC", "STRATEGY"]).toContain(raw["route"]);
  });
});

// ─── Invalid input ────────────────────────────────────────────────────────────

describe("Constitutional Diagnostic Adapter — invalid input", () => {
  it("invalid answer shape returns a HIGH finding rather than throwing", async () => {
    const result = await run({
      payload: {
        answers: {
          q1: { resonance: 999, certainty: 999 }, // out of range
        },
      },
    });
    // Should return input-invalid finding, not throw
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.severity).toBe("HIGH");
  });
});
