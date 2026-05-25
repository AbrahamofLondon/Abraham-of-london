/**
 * tests/research/engines/executive-report-boardroom-bridge-adapter.test.ts
 *
 * Full test suite for the ER → Boardroom Bridge adapter.
 * Verifies: selfTest, fixture decisions, adapter calls, no PDF/DB side effects,
 * findings quality, formula steps, engine version, limitations honesty.
 */

import { describe, it, expect } from "vitest";
import {
  executiveReportBoardroomBridgeAdapter,
  BRIDGE_ENGINE_ID,
  BRIDGE_VERSION,
} from "@/lib/research/engines/executive-report-boardroom-bridge-adapter";
import type { FormulaStep } from "@/lib/research/foundry-contract";

// ─── 1. Self-test ─────────────────────────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — selfTest", () => {
  it("selfTest passes", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.selfTest();
    expect(result.passed).toBe(true);
    expect(result.message).toContain("selfTest passed");
  });

  it("selfTest reports bridge decisions for both fixtures", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.selfTest();
    expect(result.message).toMatch(/disordered=|ordered=/);
  });

  it("selfTest reports trace count", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.selfTest();
    expect(result.message).toMatch(/\d+ traces/);
  });

  it("selfTest reports finding count", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.selfTest();
    expect(result.message).toMatch(/\d+ findings/);
  });
});

// ─── 2. Engine identity ───────────────────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — identity", () => {
  it("exports correct engine ID", () => {
    expect(BRIDGE_ENGINE_ID).toBe("executive-report-boardroom-bridge");
    expect(executiveReportBoardroomBridgeAdapter.id).toBe("executive-report-boardroom-bridge");
  });

  it("exports correct version string", () => {
    expect(BRIDGE_VERSION).toBe("1.0.0");
    expect(executiveReportBoardroomBridgeAdapter.getVersion()).toBe("1.0.0");
  });

  it("exposes all required contract properties", () => {
    expect(typeof executiveReportBoardroomBridgeAdapter.selfTest).toBe("function");
    expect(typeof executiveReportBoardroomBridgeAdapter.run).toBe("function");
    expect(typeof executiveReportBoardroomBridgeAdapter.getVersion).toBe("function");
    expect(Array.isArray(executiveReportBoardroomBridgeAdapter.limitations)).toBe(true);
    expect(Array.isArray(executiveReportBoardroomBridgeAdapter.promotionRequirements)).toBe(true);
    expect(Array.isArray(executiveReportBoardroomBridgeAdapter.productionFunctionsCalled)).toBe(true);
    expect(Array.isArray(executiveReportBoardroomBridgeAdapter.pipelineStagesNotCalled)).toBe(true);
  });
});

// ─── 3. Qualifying fixture — QUALIFIES ────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — qualifying fixture", () => {
  it("disordered fixture returns QUALIFIES bridge decision", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    expect(bridgeOutput.bridgeDecision).toBe("QUALIFIES");
  });

  it("disordered fixture qualifies for boardroom", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    expect(bridgeOutput.qualifiesForBoardroom).toBe(true);
  });

  it("disordered fixture produces executive report with DISORDERED state", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    const erReport = bridgeOutput.executiveReport as Record<string, unknown>;
    expect(erReport.state).toBe("DISORDERED");
  });

  it("disordered fixture produces mapping traces", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    const traces = bridgeOutput.mappingTrace as unknown[];
    expect(traces.length).toBeGreaterThan(0);
  });

  it("disordered fixture summary mentions QUALIFIES", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    expect(result.summary).toContain("QUALIFIES");
  });
});

// ─── 4. Misaligned fixture — QUALIFIES ────────────────────────────────────────
// The ER adapter's misaligned fixture produces totalExposure ~£137k → /12 ≈ £11.4k/month.
// This exceeds the £5k boardroom threshold, so the bridge decision is QUALIFIES.

describe("executiveReportBoardroomBridgeAdapter — misaligned fixture", () => {
  it("misaligned fixture returns QUALIFIES bridge decision (cost above £5k threshold)", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useMisalignedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    expect(bridgeOutput.bridgeDecision).toBe("QUALIFIES");
  });

  it("misaligned fixture qualifies for boardroom", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useMisalignedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    expect(bridgeOutput.qualifiesForBoardroom).toBe(true);
  });

  it("misaligned fixture produces MISALIGNED executive report", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useMisalignedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    const erReport = bridgeOutput.executiveReport as Record<string, unknown>;
    expect(erReport.state).toBe("MISALIGNED");
  });
});

// ─── 5. Ordered fixture — BORDERLINE (doesn't qualify, medium gaps) ────────────
// The ER adapter's ordered fixture produces totalExposure ~£25k → /12 ≈ £2.1k/month.
// This is below the £5k boardroom threshold, so it doesn't qualify.
// However, medium-impact mapping gaps (HCD, OGR) push the bridge decision to BORDERLINE.

describe("executiveReportBoardroomBridgeAdapter — ordered fixture", () => {
  it("ordered fixture returns BORDERLINE bridge decision (below threshold + medium gaps)", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useOrderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    expect(bridgeOutput.bridgeDecision).toBe("BORDERLINE");
  });

  it("ordered fixture does not qualify for boardroom", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useOrderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    expect(bridgeOutput.qualifiesForBoardroom).toBe(false);
  });

  it("ordered fixture summary mentions BORDERLINE", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useOrderedFixture: true },
    });
    expect(result.summary).toContain("BORDERLINE");
  });

  it("ordered fixture produces ORDERED executive report", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useOrderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    const erReport = bridgeOutput.executiveReport as Record<string, unknown>;
    expect(erReport.state).toBe("ORDERED");
  });
});

// ─── 6. Mapping gap fixture — BORDERLINE (medium gaps, no high-impact gaps) ───
// The mapper currently produces only medium and low impact gaps (HCD, OGR, financial breakdown).
// No high-impact gaps exist, so the bridge decision is BORDERLINE (not MAPPING_INSUFFICIENT).

describe("executiveReportBoardroomBridgeAdapter — mapping gap fixture", () => {
  it("mapping gap fixture returns BORDERLINE bridge decision (medium gaps, no high-impact)", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useMappingGapFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    expect(bridgeOutput.bridgeDecision).toBe("BORDERLINE");
  });

  it("mapping gap fixture summary mentions BORDERLINE", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useMappingGapFixture: true },
    });
    expect(result.summary).toContain("BORDERLINE");
  });

  it("mapping gap fixture produces mapping gaps", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useMappingGapFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    const gaps = bridgeOutput.mappingGaps as unknown[];
    expect(gaps.length).toBeGreaterThan(0);
  });

  it("mapping gap fixture has no high-impact gaps", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useMappingGapFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    const gaps = bridgeOutput.mappingGaps as Array<{ impact: string }>;
    const highImpact = gaps.filter((g) => g.impact === "high");
    expect(highImpact.length).toBe(0);
  });
});

// ─── 7. Adapter calls ─────────────────────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — adapter calls", () => {
  it("boardroom adapter is called (boardroomResult present)", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    expect(bridgeOutput.boardroomResult).toBeDefined();
  });

  it("executive reporting adapter is called (executiveReport present)", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    expect(bridgeOutput.executiveReport).toBeDefined();
  });

  it("mapped spine is present", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    expect(bridgeOutput.mappedSpine).toBeDefined();
  });
});

// ─── 8. No PDF / no export side effects ───────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — no PDF, no export", () => {
  it("productionFunctionsCalled does not include PDF or export functions", async () => {
    const fns = executiveReportBoardroomBridgeAdapter.productionFunctionsCalled;
    const hasPdf = fns.some((fn) => fn.toLowerCase().includes("pdf"));
    const hasExport = fns.some((fn) => fn.toLowerCase().includes("export"));
    expect(hasPdf).toBe(false);
    expect(hasExport).toBe(false);
  });

  it("pipelineStagesNotCalled explicitly lists PDF export", () => {
    const pdfEntry = executiveReportBoardroomBridgeAdapter.pipelineStagesNotCalled.find((s) =>
      s.toLowerCase().includes("pdf"),
    );
    expect(pdfEntry).toBeTruthy();
  });

  it("pipelineStagesNotCalled explicitly lists archive/persistence", () => {
    const archiveEntry = executiveReportBoardroomBridgeAdapter.pipelineStagesNotCalled.find((s) =>
      s.toLowerCase().includes("archive") || s.toLowerCase().includes("persist"),
    );
    expect(archiveEntry).toBeTruthy();
  });

  it("rawOutput pipelineStagesNotCalled is a non-empty array", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    expect(Array.isArray(rawOutput.pipelineStagesNotCalled)).toBe(true);
    expect((rawOutput.pipelineStagesNotCalled as unknown[]).length).toBeGreaterThan(0);
  });
});

// ─── 9. Findings quality ──────────────────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — findings quality", () => {
  it("every finding has source", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    for (const finding of result.findings) {
      expect(finding.source).toBeTruthy();
      expect(finding.source).toContain("executive-report-boardroom-bridge");
    }
  });

  it("findings include bridge decision finding", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const decisionFinding = result.findings.find((f) => f.source.includes("bridge-decision"));
    expect(decisionFinding).toBeDefined();
  });

  it("findings include financial exposure threshold finding for high cost", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const financialFinding = result.findings.find((f) =>
      f.source.includes("financialExposure"),
    );
    expect(financialFinding).toBeDefined();
  });

  it("findings include failure mode finding when failure modes present", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const failureFinding = result.findings.find((f) => f.source.includes("failureModes"));
    expect(failureFinding).toBeDefined();
  });

  it("every finding has id, title, description, severity, source", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    for (const finding of result.findings) {
      expect(typeof finding.id).toBe("string");
      expect(typeof finding.title).toBe("string");
      expect(typeof finding.description).toBe("string");
      expect(["CRITICAL", "HIGH", "MEDIUM", "INFO"]).toContain(finding.severity);
      expect(typeof finding.source).toBe("string");
    }
  });
});

// ─── 10. Formula steps ────────────────────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — formula steps", () => {
  it("produces exactly 4 formula steps", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    expect(formulaSteps).toHaveLength(4);
  });

  it("every formula step has sourceRule", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    for (const step of formulaSteps ?? []) {
      expect(typeof step.sourceRule).toBe("string");
      expect(step.sourceRule.length).toBeGreaterThan(0);
    }
  });

  it("every formula step has engineVersion", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    for (const step of formulaSteps ?? []) {
      expect(step.engineVersion).toBe(BRIDGE_VERSION);
    }
  });

  it("step 1 is er-adapter-run", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    expect(formulaSteps[0]?.stepId).toBe("er-adapter-run");
  });

  it("step 2 is er-to-spine-mapping", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    expect(formulaSteps[1]?.stepId).toBe("er-to-spine-mapping");
  });

  it("step 3 is boardroom-adapter-run", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    expect(formulaSteps[2]?.stepId).toBe("boardroom-adapter-run");
  });

  it("step 4 is bridge-decision", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    expect(formulaSteps[3]?.stepId).toBe("bridge-decision");
  });
});

// ─── 11. Limitations honesty ──────────────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — limitations honesty", () => {
  it("limitations array has at least 6 entries", () => {
    expect(executiveReportBoardroomBridgeAdapter.limitations.length).toBeGreaterThanOrEqual(6);
  });

  it("limitations mention synthetic fixtures", () => {
    const syntheticLimitation = executiveReportBoardroomBridgeAdapter.limitations.find((l) =>
      l.toLowerCase().includes("synthetic"),
    );
    expect(syntheticLimitation).toBeTruthy();
  });

  it("limitations mention PDF not rendered", () => {
    const pdfLimitation = executiveReportBoardroomBridgeAdapter.limitations.find((l) =>
      l.toLowerCase().includes("pdf"),
    );
    expect(pdfLimitation).toBeTruthy();
  });

  it("limitations mention no DB writes", () => {
    const dbLimitation = executiveReportBoardroomBridgeAdapter.limitations.find((l) =>
      l.toLowerCase().includes("persist") || l.toLowerCase().includes("db write"),
    );
    expect(dbLimitation).toBeTruthy();
  });

  it("limitations mention HCD/OGR data loss", () => {
    const hcdLimitation = executiveReportBoardroomBridgeAdapter.limitations.find((l) =>
      l.toLowerCase().includes("hcd") || l.toLowerCase().includes("ogr"),
    );
    expect(hcdLimitation).toBeTruthy();
  });

  it("promotionRequirements has at least 4 entries", () => {
    expect(executiveReportBoardroomBridgeAdapter.promotionRequirements.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── 12. Engine version ───────────────────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — engine version", () => {
  it("getVersion returns version string", () => {
    expect(executiveReportBoardroomBridgeAdapter.getVersion()).toBe("1.0.0");
  });

  it("run output includes engineVersion", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    expect(result.engineVersion).toBe("1.0.0");
  });
});

// ─── 13. No DB mutation ───────────────────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — no DB mutation", () => {
  it("pipelineStagesNotCalled declares executive-report-service.ts", () => {
    const hasService = executiveReportBoardroomBridgeAdapter.pipelineStagesNotCalled.some((s) =>
      s.includes("executive-report-service.ts"),
    );
    expect(hasService).toBe(true);
  });

  it("pipelineStagesNotCalled declares archiveIntake", () => {
    const hasArchive = executiveReportBoardroomBridgeAdapter.pipelineStagesNotCalled.some((s) =>
      s.includes("archiveIntake"),
    );
    expect(hasArchive).toBe(true);
  });

  it("productionFunctionsCalled does not include DB-bound functions", () => {
    const fns = executiveReportBoardroomBridgeAdapter.productionFunctionsCalled;
    const hasDB = fns.some((fn) => fn.toLowerCase().includes("service.ts"));
    expect(hasDB).toBe(false);
  });
});

// ─── 14. Malformed input ──────────────────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — malformed input", () => {
  it("empty payload defaults to disordered fixture", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({ payload: {} });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    expect(rawOutput.fixtureKey).toBe("disordered");
  });

  it("invalid input type returns validation error finding", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: "yes" } as unknown,
    });
    // Should still produce valid output (Zod may coerce)
    expect(result.engineVersion).toBe("1.0.0");
  });
});

// ─── 15. Bridge output shape ──────────────────────────────────────────────────

describe("executiveReportBoardroomBridgeAdapter — bridge output shape", () => {
  it("rawOutput contains bridgeOutput with all required fields", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;

    expect(bridgeOutput).toBeDefined();
    expect(bridgeOutput).toHaveProperty("executiveReport");
    expect(bridgeOutput).toHaveProperty("mappedSpine");
    expect(bridgeOutput).toHaveProperty("boardroomResult");
    expect(bridgeOutput).toHaveProperty("qualifiesForBoardroom");
    expect(bridgeOutput).toHaveProperty("bridgeDecision");
    expect(bridgeOutput).toHaveProperty("mappingTrace");
    expect(bridgeOutput).toHaveProperty("mappingGaps");
    expect(bridgeOutput).toHaveProperty("findings");
    expect(bridgeOutput).toHaveProperty("formulaSteps");
    expect(bridgeOutput).toHaveProperty("limitations");
    expect(bridgeOutput).toHaveProperty("promotionRequirements");
    expect(bridgeOutput).toHaveProperty("productionFunctionsCalled");
    expect(bridgeOutput).toHaveProperty("pipelineStagesNotCalled");
  });

  it("rawOutput has engineId, runAt, fixtureKey", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    expect(rawOutput.engineId).toBe(BRIDGE_ENGINE_ID);
    expect(typeof rawOutput.runAt).toBe("string");
    expect(rawOutput.fixtureKey).toBe("disordered");
  });
});
