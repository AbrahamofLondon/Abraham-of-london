/**
 * Fast Diagnostic Adapter — proof tests.
 *
 * Verifies:
 * - Valid fixture passes and produces findings
 * - Invalid fixture fails gracefully
 * - Scoring functions are actually called (not mocked)
 * - Limitations are structurally visible
 * - AI synthesis is NOT falsely claimed
 * - Engine version is present in all output
 */

import { describe, it, expect } from "vitest";
import {
  run,
  selfTest,
  getVersion,
  FAST_DIAGNOSTIC_VERSION,
} from "@/lib/research/engines/fast-diagnostic-adapter";

const VALID_FIXTURE = {
  fixture: {
    answers: [
      { sectionId: "authority", questionId: "q1", prompt: "Decision clarity?", value: 4 },
      { sectionId: "authority", questionId: "q2", prompt: "Ownership clear?", value: 3 },
      { sectionId: "execution", questionId: "q3", prompt: "Prior attempt?", value: 2 },
      { sectionId: "governance", questionId: "q4", prompt: "Controls in place?", value: 3 },
    ],
  },
};

const LOW_SCORE_FIXTURE = {
  fixture: {
    answers: [
      { sectionId: "authority", questionId: "q1", prompt: "Decision clarity?", value: 1 },
      { sectionId: "authority", questionId: "q2", prompt: "Ownership clear?", value: 1 },
      { sectionId: "execution", questionId: "q3", prompt: "Prior attempt?", value: 1 },
    ],
  },
};

describe("Fast Diagnostic Adapter — valid fixture", () => {
  it("produces findings from a valid fixture", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("includes engine version on all output", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    expect(result.engineVersion).toBe(FAST_DIAGNOSTIC_VERSION);
  });

  it("returns a non-empty summary", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("records duration", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("all findings have a non-empty source (Law 3)", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    for (const f of result.findings) {
      expect(f.source.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("Fast Diagnostic Adapter — invalid fixture", () => {
  it("returns a finding when no input is provided", async () => {
    const result = await run({ payload: {} });
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.severity).toBe("HIGH");
  });

  it("returns a finding when answers array is empty", async () => {
    const result = await run({ payload: { fixture: { answers: [] } } });
    expect(result.findings.some((f) => f.severity === "HIGH")).toBe(true);
  });

  it("does not throw — always returns EngineRunOutput", async () => {
    await expect(run({ payload: null as unknown as object })).resolves.toBeDefined();
  });
});

describe("Fast Diagnostic Adapter — scoring functions are called", () => {
  it("rawOutput includes score computed from answers", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    expect(result.rawOutput).toBeDefined();
    expect(typeof (result.rawOutput as Record<string, unknown>)["score"]).toBe("number");
  });

  it("score decreases with lower answer values", async () => {
    const high = await run({ payload: VALID_FIXTURE });
    const low = await run({ payload: LOW_SCORE_FIXTURE });
    const highScore = (high.rawOutput as Record<string, unknown>)["score"] as number;
    const lowScore = (low.rawOutput as Record<string, unknown>)["score"] as number;
    expect(lowScore).toBeLessThan(highScore);
  });

  it("formula steps are included in rawOutput", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    const steps = (result.rawOutput as Record<string, unknown>)["formulaSteps"] as unknown[];
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });
});

describe("Fast Diagnostic Adapter — limitation visibility", () => {
  it("includes a limitation-note finding", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    const limFinding = result.findings.find((f) => f.source.includes("limitation-note"));
    expect(limFinding).toBeDefined();
  });

  it("limitation finding explicitly states AI synthesis not wrapped", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    const limFinding = result.findings.find((f) => f.source.includes("limitation-note"));
    expect(limFinding?.description).toMatch(/AI synthesis/i);
  });

  it("returns structured limitations array on output", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    expect(Array.isArray(result.limitations)).toBe(true);
    expect(result.limitations!.length).toBeGreaterThan(0);
  });

  it("limitations explicitly name what is NOT covered", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    const limitationText = result.limitations!.join(" ");
    expect(limitationText).toMatch(/AI synthesis/i);
    expect(limitationText).toMatch(/pipeline/i);
  });

  it("returns structured promotionRequirements array", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    expect(Array.isArray(result.promotionRequirements)).toBe(true);
    expect(result.promotionRequirements!.length).toBeGreaterThan(0);
  });

  it("rawOutput lists productionFunctionsCalled", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    const raw = result.rawOutput as Record<string, unknown>;
    const called = raw["productionFunctionsCalled"] as string[];
    expect(Array.isArray(called)).toBe(true);
    expect(called.length).toBeGreaterThan(0);
    expect(called.some((f) => f.includes("scoring"))).toBe(true);
  });

  it("rawOutput lists pipelineStagesNotCalled", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    const raw = result.rawOutput as Record<string, unknown>;
    const notCalled = raw["pipelineStagesNotCalled"] as string[];
    expect(Array.isArray(notCalled)).toBe(true);
    expect(notCalled.some((f) => f.includes("synthesise"))).toBe(true);
  });

  it("summary does not claim full FastDiagnosticResult", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    expect(result.summary).not.toMatch(/synthesis/i);
    expect(result.summary).not.toMatch(/narrative/i);
    expect(result.summary).not.toMatch(/forecast/i);
  });

  it("rawOutput does not contain synthesis field", async () => {
    const result = await run({ payload: VALID_FIXTURE });
    const raw = result.rawOutput as Record<string, unknown>;
    expect(raw["synthesis"]).toBeUndefined();
    expect(raw["anchorNarrative"]).toBeUndefined();
    expect(raw["detectedSignals"]).toBeUndefined();
  });
});

describe("Fast Diagnostic Adapter — selfTest and getVersion", () => {
  it("selfTest returns ok: true with a valid detail", async () => {
    const result = await selfTest();
    expect(result.ok).toBe(true);
    expect(result.detail).toBeDefined();
  });

  it("getVersion returns the expected version string", async () => {
    const v = await getVersion();
    expect(v.version).toBe(FAST_DIAGNOSTIC_VERSION);
  });
});
