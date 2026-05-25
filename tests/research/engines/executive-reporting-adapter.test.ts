/**
 * tests/research/engines/executive-reporting-adapter.test.ts
 *
 * Full test suite for the Executive Reporting Foundry adapter.
 * Tests all three state scenarios (DISORDERED, MISALIGNED, ORDERED),
 * formula step contract, findings shape, financial exposure, OGR auth,
 * adapter honesty (limitations), and self-test.
 */

import { executiveReportingAdapter, ER_ENGINE_ID, ER_VERSION } from "@/lib/research/engines/executive-reporting-adapter";
import type { FormulaStep } from "@/lib/research/foundry-contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function runDisordered() {
  return executiveReportingAdapter.run({ payload: { useDisorderedFixture: true } });
}

async function runMisaligned() {
  return executiveReportingAdapter.run({ payload: { useMisalignedFixture: true } });
}

async function runOrdered() {
  return executiveReportingAdapter.run({ payload: { useOrderedFixture: true } });
}

function getReport(result: Awaited<ReturnType<typeof runDisordered>>) {
  return (result.rawOutput as Record<string, unknown>).report as Record<string, unknown>;
}

function getFormulaSteps(result: Awaited<ReturnType<typeof runDisordered>>) {
  return (result.rawOutput as Record<string, unknown>).formulaSteps as FormulaStep[];
}

// ─── Self-test ────────────────────────────────────────────────────────────────

describe("executiveReportingAdapter.selfTest()", () => {
  it("passes", async () => {
    const result = await executiveReportingAdapter.selfTest();
    expect(result.passed).toBe(true);
  });

  it("reports 4 formula steps in pass message", async () => {
    const result = await executiveReportingAdapter.selfTest();
    expect(result.message).toMatch(/4 formula steps/);
  });

  it("reports DISORDERED state in pass message", async () => {
    const result = await executiveReportingAdapter.selfTest();
    expect(result.message).toMatch(/DISORDERED/);
  });

  it("reports finding count in pass message", async () => {
    const result = await executiveReportingAdapter.selfTest();
    expect(result.message).toMatch(/\d+ findings/);
  });
});

// ─── Engine identity ─────────────────────────────────────────────────────────

describe("engine identity", () => {
  it("has correct id", () => {
    expect(executiveReportingAdapter.id).toBe(ER_ENGINE_ID);
    expect(ER_ENGINE_ID).toBe("executive-reporting");
  });

  it("has correct version", () => {
    expect(executiveReportingAdapter.version).toBe(ER_VERSION);
    expect(ER_VERSION).toBe("2.0.0");
  });

  it("getVersion() returns version string", () => {
    expect(executiveReportingAdapter.getVersion()).toBe(ER_VERSION);
  });
});

// ─── EngineRunOutput contract ─────────────────────────────────────────────────

describe("EngineRunOutput contract (DISORDERED)", () => {
  let result: Awaited<ReturnType<typeof runDisordered>>;
  beforeAll(async () => { result = await runDisordered(); });

  it("has findings array", () => {
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("has summary string", () => {
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("has severity", () => {
    expect(["CRITICAL", "HIGH", "MEDIUM", "INFO"]).toContain(result.severity);
  });

  it("has engineVersion", () => {
    expect(result.engineVersion).toBe(ER_VERSION);
  });

  it("has durationMs >= 0", () => {
    expect(typeof result.durationMs).toBe("number");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("has rawOutput object", () => {
    expect(result.rawOutput).toBeTruthy();
    expect(typeof result.rawOutput).toBe("object");
  });

  it("has limitations array", () => {
    expect(Array.isArray(result.limitations)).toBe(true);
    expect((result.limitations ?? []).length).toBeGreaterThan(0);
  });

  it("has promotionRequirements array", () => {
    expect(Array.isArray(result.promotionRequirements)).toBe(true);
    expect((result.promotionRequirements ?? []).length).toBeGreaterThan(0);
  });
});

// ─── DISORDERED state ────────────────────────────────────────────────────────

describe("DISORDERED fixture — state and findings", () => {
  let result: Awaited<ReturnType<typeof runDisordered>>;
  beforeAll(async () => { result = await runDisordered(); });

  it("produces DISORDERED state", () => {
    const report = getReport(result);
    expect(report.state).toBe("DISORDERED");
  });

  it("summary contains DISORDERED", () => {
    expect(result.summary).toContain("DISORDERED");
  });

  it("severity is CRITICAL (DISORDERED state finding)", () => {
    expect(result.severity).toBe("CRITICAL");
  });

  it("narrative headline is set", () => {
    const report = getReport(result);
    const narrative = report.narrative as Record<string, string>;
    expect(typeof narrative.headline).toBe("string");
    expect(narrative.headline.length).toBeGreaterThan(0);
  });

  it("narrative mandate is set", () => {
    const report = getReport(result);
    const narrative = report.narrative as Record<string, string>;
    expect(typeof narrative.mandate).toBe("string");
    expect(narrative.mandate.length).toBeGreaterThan(0);
  });

  it("resonance averageDissonance > 30 (DISORDERED threshold)", () => {
    const report = getReport(result);
    const resonance = report.resonance as Record<string, unknown>;
    expect(resonance.averageDissonance as number).toBeGreaterThan(30);
  });

  it("HCD aggregate has riskScore CRITICAL", () => {
    const report = getReport(result);
    const hcdAgg = report.hcdAggregate as Record<string, unknown>;
    expect(hcdAgg.riskScore).toBe("CRITICAL");
  });

  it("HCD criticalCount >= 1", () => {
    const report = getReport(result);
    const hcdAgg = report.hcdAggregate as Record<string, unknown>;
    expect(hcdAgg.criticalCount as number).toBeGreaterThanOrEqual(1);
  });

  it("OGR sovereignCertainty < 90 (not authorized)", () => {
    const report = getReport(result);
    const ogr = report.ogr as Record<string, unknown>;
    expect(ogr.sovereignCertainty as number).toBeLessThan(90);
    expect(ogr.isAuthorizedToExecute).toBe(false);
  });

  it("financialExposure.totalExposure > 0", () => {
    const report = getReport(result);
    const fe = report.financialExposure as Record<string, number>;
    expect(fe.totalExposure).toBeGreaterThan(0);
  });

  it("priorityStack is non-empty", () => {
    const report = getReport(result);
    expect(Array.isArray(report.priorityStack)).toBe(true);
    expect((report.priorityStack as unknown[]).length).toBeGreaterThan(0);
  });

  it("findings include state finding with CRITICAL severity", () => {
    const stateFinding = result.findings.find((f) => f.source.includes("::state"));
    expect(stateFinding).toBeDefined();
    expect(stateFinding?.severity).toBe("CRITICAL");
  });

  it("findings include OGR finding", () => {
    const ogrFinding = result.findings.find((f) => f.source.includes("::ogr"));
    expect(ogrFinding).toBeDefined();
    expect(ogrFinding?.title).toContain("NOT VERIFIED");
  });
});

// ─── MISALIGNED state ─────────────────────────────────────────────────────────

describe("MISALIGNED fixture — state and findings", () => {
  let result: Awaited<ReturnType<typeof runMisaligned>>;
  beforeAll(async () => { result = await runMisaligned(); });

  it("produces MISALIGNED state", () => {
    const report = getReport(result);
    expect(report.state).toBe("MISALIGNED");
  });

  it("summary contains MISALIGNED", () => {
    expect(result.summary).toContain("MISALIGNED");
  });

  it("severity is HIGH (MISALIGNED state finding)", () => {
    expect(result.severity).toBe("HIGH");
  });

  it("resonance averageDissonance > 12 but <= 30", () => {
    const report = getReport(result);
    const resonance = report.resonance as Record<string, unknown>;
    const dissonance = resonance.averageDissonance as number;
    expect(dissonance).toBeGreaterThan(12);
    expect(dissonance).toBeLessThanOrEqual(30);
  });

  it("OGR not authorized (sovereignCertainty < 90)", () => {
    const report = getReport(result);
    const ogr = report.ogr as Record<string, unknown>;
    expect(ogr.isAuthorizedToExecute).toBe(false);
  });

  it("HCD riskScore is not CRITICAL", () => {
    const report = getReport(result);
    const hcdAgg = report.hcdAggregate as Record<string, unknown>;
    expect(hcdAgg.riskScore).not.toBe("CRITICAL");
  });

  it("findings include state finding with HIGH severity", () => {
    const stateFinding = result.findings.find((f) => f.source.includes("::state"));
    expect(stateFinding?.severity).toBe("HIGH");
  });
});

// ─── ORDERED state ────────────────────────────────────────────────────────────

describe("ORDERED fixture — state and findings", () => {
  let result: Awaited<ReturnType<typeof runOrdered>>;
  beforeAll(async () => { result = await runOrdered(); });

  it("produces ORDERED state", () => {
    const report = getReport(result);
    expect(report.state).toBe("ORDERED");
  });

  it("summary contains ORDERED", () => {
    expect(result.summary).toContain("ORDERED");
  });

  it("resonance averageDissonance <= 12", () => {
    const report = getReport(result);
    const resonance = report.resonance as Record<string, unknown>;
    expect(resonance.averageDissonance as number).toBeLessThanOrEqual(12);
  });

  it("OGR authorized (sovereignCertainty >= 90)", () => {
    const report = getReport(result);
    const ogr = report.ogr as Record<string, unknown>;
    expect(ogr.isAuthorizedToExecute).toBe(true);
    expect(ogr.sovereignCertainty as number).toBeGreaterThanOrEqual(90);
  });

  it("HCD riskScore is LOW or OPTIMAL", () => {
    const report = getReport(result);
    const hcdAgg = report.hcdAggregate as Record<string, unknown>;
    expect(["LOW", "OPTIMAL"]).toContain(hcdAgg.riskScore);
  });

  it("findings include state finding with INFO severity", () => {
    const stateFinding = result.findings.find((f) => f.source.includes("::state"));
    expect(stateFinding?.severity).toBe("INFO");
  });

  it("OGR finding title says VERIFIED", () => {
    const ogrFinding = result.findings.find((f) => f.source.includes("::ogr"));
    expect(ogrFinding?.title).toContain("VERIFIED");
    expect(ogrFinding?.title).not.toContain("NOT");
  });
});

// ─── Default fixture (no flag set) ───────────────────────────────────────────

describe("default fixture (no flag)", () => {
  it("defaults to DISORDERED scenario", async () => {
    const result = await executiveReportingAdapter.run({ payload: {} });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    expect(rawOutput.fixtureKey).toBe("disordered");
  });
});

// ─── Formula steps contract ───────────────────────────────────────────────────

describe("formula steps — DISORDERED", () => {
  let steps: FormulaStep[];
  beforeAll(async () => {
    const result = await runDisordered();
    steps = getFormulaSteps(result);
  });

  it("returns exactly 4 formula steps", () => {
    expect(steps).toHaveLength(4);
  });

  it("step 1 is resonance-derivation", () => {
    expect(steps[0]?.stepId).toBe("resonance-derivation");
  });

  it("step 2 is hcd-analysis", () => {
    expect(steps[1]?.stepId).toBe("hcd-analysis");
  });

  it("step 3 is ogr-computation", () => {
    expect(steps[2]?.stepId).toBe("ogr-computation");
  });

  it("step 4 is state-classification", () => {
    expect(steps[3]?.stepId).toBe("state-classification");
  });

  it("every step has string | number inputs only", () => {
    for (const step of steps) {
      for (const [key, val] of Object.entries(step.inputs)) {
        const valid = typeof val === "string" || typeof val === "number";
        if (!valid) throw new Error(`step ${step.stepId} input "${key}" is ${typeof val}`);
        expect(valid).toBe(true);
      }
    }
  });

  it("every step has string | number intermediate values only", () => {
    for (const step of steps) {
      if (!step.intermediate) continue;
      for (const [key, val] of Object.entries(step.intermediate)) {
        const valid = typeof val === "string" || typeof val === "number";
        if (!valid) throw new Error(`step ${step.stepId} intermediate "${key}" is ${typeof val}`);
        expect(valid).toBe(true);
      }
    }
  });

  it("every step output is string | number", () => {
    for (const step of steps) {
      const valid = typeof step.output === "string" || typeof step.output === "number";
      if (!valid) throw new Error(`step ${step.stepId} output is ${typeof step.output}`);
      expect(valid).toBe(true);
    }
  });

  it("every step has a sourceRule string", () => {
    for (const step of steps) {
      expect(typeof step.sourceRule).toBe("string");
      expect(step.sourceRule.length).toBeGreaterThan(0);
    }
  });

  it("every step has engineVersion matching ER_VERSION", () => {
    for (const step of steps) {
      expect(step.engineVersion).toBe(ER_VERSION);
    }
  });

  it("resonance step output is a number (averageDissonance)", () => {
    expect(typeof steps[0]?.output).toBe("number");
    expect(steps[0]?.output as number).toBeGreaterThan(30); // DISORDERED
  });

  it("ogr step output is a number (sovereignCertainty)", () => {
    expect(typeof steps[2]?.output).toBe("number");
  });

  it("state-classification step output is DISORDERED", () => {
    expect(steps[3]?.output).toBe("DISORDERED");
  });

  it("resonance step sourceRule references derive-resonance-metrics.ts", () => {
    expect(steps[0]?.sourceRule).toContain("derive-resonance-metrics.ts");
  });

  it("hcd step sourceRule references human-capital-delta.ts", () => {
    expect(steps[1]?.sourceRule).toContain("human-capital-delta.ts");
  });

  it("ogr step sourceRule references manifest-engine.ts", () => {
    expect(steps[2]?.sourceRule).toContain("manifest-engine.ts");
  });

  it("state step sourceRule references executive-report-builder.ts", () => {
    expect(steps[3]?.sourceRule).toContain("executive-report-builder.ts");
  });
});

// ─── Formula steps — all three scenarios ─────────────────────────────────────

describe("formula steps state output per scenario", () => {
  it("MISALIGNED: state-classification output is MISALIGNED", async () => {
    const result = await runMisaligned();
    const steps = getFormulaSteps(result);
    expect(steps[3]?.output).toBe("MISALIGNED");
  });

  it("ORDERED: state-classification output is ORDERED", async () => {
    const result = await runOrdered();
    const steps = getFormulaSteps(result);
    expect(steps[3]?.output).toBe("ORDERED");
  });
});

// ─── Findings shape ───────────────────────────────────────────────────────────

describe("findings shape (DISORDERED)", () => {
  let result: Awaited<ReturnType<typeof runDisordered>>;
  beforeAll(async () => { result = await runDisordered(); });

  it("every finding has id, title, description, severity, source", () => {
    for (const finding of result.findings) {
      expect(typeof finding.id).toBe("string");
      expect(typeof finding.title).toBe("string");
      expect(typeof finding.description).toBe("string");
      expect(["CRITICAL", "HIGH", "MEDIUM", "INFO"]).toContain(finding.severity);
      expect(typeof finding.source).toBe("string");
    }
  });

  it("state finding has remediation when DISORDERED", () => {
    const stateFinding = result.findings.find((f) => f.source.includes("::state"));
    expect(typeof stateFinding?.remediation).toBe("string");
    expect(stateFinding?.remediation?.length).toBeGreaterThan(0);
  });

  it("financial exposure finding is present", () => {
    const feFinding = result.findings.find((f) => f.source.includes("::financialExposure"));
    expect(feFinding).toBeDefined();
  });

  it("priority stack finding is present", () => {
    const priorityFinding = result.findings.find((f) => f.source.includes("::priorityStack"));
    expect(priorityFinding).toBeDefined();
  });
});

// ─── Limitations honesty ──────────────────────────────────────────────────────

describe("limitations honesty", () => {
  it("declares synthetic fixtures limitation", () => {
    const hasRawExec = executiveReportingAdapter.limitations.some((l) =>
      l.toLowerCase().includes("synthetic"),
    );
    expect(hasRawExec).toBe(true);
  });

  it("declares no DB writes limitation", () => {
    const hasNoDB = executiveReportingAdapter.limitations.some((l) =>
      l.toLowerCase().includes("no db") || l.toLowerCase().includes("no database") || l.toLowerCase().includes("persist"),
    );
    expect(hasNoDB).toBe(true);
  });

  it("declares executive-report-service.ts limitation", () => {
    const hasService = executiveReportingAdapter.limitations.some((l) =>
      l.includes("executive-report-service.ts"),
    );
    expect(hasService).toBe(true);
  });

  it("has at least 6 limitations", () => {
    expect(executiveReportingAdapter.limitations.length).toBeGreaterThanOrEqual(6);
  });

  it("has at least 4 promotion requirements", () => {
    expect(executiveReportingAdapter.promotionRequirements.length).toBeGreaterThanOrEqual(4);
  });

  it("limitations appear in rawOutput.limitations", async () => {
    const result = await runDisordered();
    expect(Array.isArray(result.limitations)).toBe(true);
    expect((result.limitations ?? []).length).toBeGreaterThanOrEqual(6);
  });
});

// ─── Production functions called audit ───────────────────────────────────────

describe("production functions called audit", () => {
  it("declares buildExecutiveReport() in productionFunctionsCalled", () => {
    const hasBuildER = executiveReportingAdapter.productionFunctionsCalled.some((fn) =>
      fn.includes("buildExecutiveReport"),
    );
    expect(hasBuildER).toBe(true);
  });

  it("declares deriveResonanceMetricsFromResponses() in productionFunctionsCalled", () => {
    const hasResonance = executiveReportingAdapter.productionFunctionsCalled.some((fn) =>
      fn.includes("deriveResonanceMetricsFromResponses"),
    );
    expect(hasResonance).toBe(true);
  });

  it("declares calculateHCDelta() in productionFunctionsCalled", () => {
    const hasHCD = executiveReportingAdapter.productionFunctionsCalled.some((fn) =>
      fn.includes("calculateHCDelta"),
    );
    expect(hasHCD).toBe(true);
  });

  it("declares calculateDerived() in productionFunctionsCalled", () => {
    const hasOGR = executiveReportingAdapter.productionFunctionsCalled.some((fn) =>
      fn.includes("calculateDerived"),
    );
    expect(hasOGR).toBe(true);
  });

  it("does NOT call executive-report-service.ts (DB-bound)", () => {
    const inProduction = executiveReportingAdapter.productionFunctionsCalled.some((fn) =>
      fn.includes("executive-report-service"),
    );
    expect(inProduction).toBe(false);
  });

  it("productionFunctionsCalled appear in rawOutput", async () => {
    const result = await runDisordered();
    const raw = result.rawOutput as Record<string, unknown>;
    expect(Array.isArray(raw.productionFunctionsCalled)).toBe(true);
    expect((raw.productionFunctionsCalled as string[]).length).toBeGreaterThan(0);
  });
});

// ─── rawOutput shape ──────────────────────────────────────────────────────────

describe("rawOutput shape", () => {
  let raw: Record<string, unknown>;
  beforeAll(async () => {
    const result = await runDisordered();
    raw = result.rawOutput as Record<string, unknown>;
  });

  it("has engineId", () => {
    expect(raw.engineId).toBe(ER_ENGINE_ID);
  });

  it("has runAt ISO timestamp", () => {
    expect(typeof raw.runAt).toBe("string");
    expect(() => new Date(raw.runAt as string)).not.toThrow();
  });

  it("has fixtureKey", () => {
    expect(raw.fixtureKey).toBe("disordered");
  });

  it("has report object with state", () => {
    const report = raw.report as Record<string, unknown>;
    expect(report?.state).toBe("DISORDERED");
  });

  it("has formulaSteps array", () => {
    expect(Array.isArray(raw.formulaSteps)).toBe(true);
    expect((raw.formulaSteps as FormulaStep[]).length).toBe(4);
  });

  it("has pipelineStagesNotCalled array", () => {
    expect(Array.isArray(raw.pipelineStagesNotCalled)).toBe(true);
  });
});

// ─── No DB / No AI / No PDF audit ────────────────────────────────────────────

describe("dry-run compliance — no DB, no AI, no external calls", () => {
  it("pipelineStagesNotCalled declares executive-report-service.ts", () => {
    const hasService = executiveReportingAdapter.pipelineStagesNotCalled.some((s) =>
      s.includes("executive-report-service.ts"),
    );
    expect(hasService).toBe(true);
  });

  it("pipelineStagesNotCalled declares no DB writes", () => {
    const hasNoDB = executiveReportingAdapter.pipelineStagesNotCalled.some((s) =>
      s.toLowerCase().includes("db") || s.toLowerCase().includes("persist"),
    );
    expect(hasNoDB).toBe(true);
  });

  it("adapter completes in < 5000ms (no external calls)", async () => {
    const result = await runDisordered();
    expect(result.durationMs).toBeLessThan(5000);
  });
});
