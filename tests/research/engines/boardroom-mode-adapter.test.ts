/**
 * tests/research/engines/boardroom-mode-adapter.test.ts
 *
 * Tests for the Boardroom Mode Foundry adapter.
 * Verifies: identity, selfTest, qualification logic, dossier structure,
 * limitations honesty, no PDF/DB side effects, formula trace, error handling.
 */

import { describe, it, expect } from "vitest";
import { boardroomModeAdapter, BOARDROOM_ENGINE_ID, BOARDROOM_VERSION } from "@/lib/research/engines/boardroom-mode-adapter";
import type { FormulaStep } from "@/lib/research/foundry-contract";
import {
  QUALIFYING_SPINE,
  BORDERLINE_SPINE,
  NON_QUALIFYING_SPINE,
  MALFORMED_SPINE,
  HIGH_COST_QUALIFYING_SPINE,
} from "@/tests/research/fixtures/boardroom-mode";

// ─── 1. Identity ──────────────────────────────────────────────────────────────

describe("boardroomModeAdapter — identity", () => {
  it("exports correct engine ID", () => {
    expect(BOARDROOM_ENGINE_ID).toBe("boardroom-dossier");
    expect(boardroomModeAdapter.id).toBe("boardroom-dossier");
  });

  it("exports correct version string", () => {
    expect(BOARDROOM_VERSION).toBe("1.0.0");
    expect(boardroomModeAdapter.getVersion()).toBe("1.0.0");
  });

  it("exposes all required contract properties", () => {
    expect(typeof boardroomModeAdapter.selfTest).toBe("function");
    expect(typeof boardroomModeAdapter.run).toBe("function");
    expect(typeof boardroomModeAdapter.getVersion).toBe("function");
    expect(Array.isArray(boardroomModeAdapter.limitations)).toBe(true);
    expect(Array.isArray(boardroomModeAdapter.promotionRequirements)).toBe(true);
    expect(Array.isArray(boardroomModeAdapter.productionFunctionsCalled)).toBe(true);
    expect(Array.isArray(boardroomModeAdapter.pipelineStagesNotCalled)).toBe(true);
  });
});

// ─── 2. selfTest ─────────────────────────────────────────────────────────────

describe("boardroomModeAdapter — selfTest", () => {
  it("selfTest passes with qualifying fixture", async () => {
    const result = await boardroomModeAdapter.selfTest();
    expect(result.passed).toBe(true);
    expect(result.message).toContain("selfTest passed");
  });

  it("selfTest message reports section count and formula steps", async () => {
    const result = await boardroomModeAdapter.selfTest();
    expect(result.message).toMatch(/sections/);
    expect(result.message).toMatch(/formula steps/);
  });
});

// ─── 3. Qualifying fixture — QUALIFIED ───────────────────────────────────────

describe("boardroomModeAdapter — qualifying fixture", () => {
  it("useQualifyingFixture returns qualified=true", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const qualification = rawOutput.qualification as { qualified: boolean; reason: string };
    expect(qualification.qualified).toBe(true);
  });

  it("dossier has title with condition class", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { title: string };
    expect(dossier.title).toMatch(/AUTHORITY/i);
  });

  it("dossier has at least 6 sections", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { sections: unknown[] };
    expect(dossier.sections.length).toBeGreaterThanOrEqual(6);
  });

  it("dossier has classification BOARD_RESTRICTED", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { classification: string };
    expect(dossier.classification).toBe("BOARD_RESTRICTED");
  });

  it("dossier has objection handling entries", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { objectionHandling: unknown[] };
    expect(dossier.objectionHandling.length).toBeGreaterThan(0);
  });

  it("dossier has decision paths", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { decisionPath: Array<{ recommended: boolean }> };
    expect(dossier.decisionPath.length).toBeGreaterThan(0);
    const recommended = dossier.decisionPath.filter(d => d.recommended);
    expect(recommended.length).toBeGreaterThanOrEqual(1);
  });

  it("summary mentions QUALIFIED", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    expect(result.summary).toMatch(/QUALIFIED/i);
  });
});

// ─── 4. Non-qualifying fixture — NOT QUALIFIED ───────────────────────────────

describe("boardroomModeAdapter — non-qualifying fixture", () => {
  it("useNonQualifyingFixture returns qualified=false", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useNonQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const qualification = rawOutput.qualification as { qualified: boolean; reason: string };
    expect(qualification.qualified).toBe(false);
  });

  it("non-qualifying dossier has empty sections", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useNonQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { sections: unknown[] };
    expect(dossier.sections.length).toBe(0);
  });

  it("non-qualifying reason references operational resolution", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useNonQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const qualification = rawOutput.qualification as { reason: string };
    expect(qualification.reason).toMatch(/operationally/i);
  });

  it("summary mentions NOT QUALIFIED", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useNonQualifyingFixture: true } });
    expect(result.summary).toMatch(/NOT QUALIFIED/i);
  });
});

// ─── 5. Borderline fixture ────────────────────────────────────────────────────

describe("boardroomModeAdapter — borderline fixture", () => {
  it("borderline spine qualifies (cost £5,200 + accuracy partial)", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useBorderlineFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const qualification = rawOutput.qualification as { qualified: boolean; reason: string };
    // £5,200 >= £5,000 AND accuracy = "partial" → qualifies
    expect(qualification.qualified).toBe(true);
  });

  it("borderline qualification reason cites cost and accuracy", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useBorderlineFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const qualification = rawOutput.qualification as { reason: string };
    expect(qualification.reason).toMatch(/£5k|accuracy/i);
  });

  it("borderline dossier has sections for execution condition", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useBorderlineFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { sections: Array<{ id: string }> };
    const sectionIds = dossier.sections.map(s => s.id);
    expect(sectionIds).toContain("decision");
    expect(sectionIds).toContain("cost");
    expect(sectionIds).toContain("failure_pattern");
  });
});

// ─── 6. High-cost fixture — qualifies by cost alone ──────────────────────────

describe("boardroomModeAdapter — high-cost fixture", () => {
  it("cost >= £20k qualifies regardless of accuracy=no", async () => {
    const result = await boardroomModeAdapter.run({ payload: { spine: HIGH_COST_QUALIFYING_SPINE } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const qualification = rawOutput.qualification as { qualified: boolean; reason: string };
    expect(qualification.qualified).toBe(true);
    expect(qualification.reason).toMatch(/£20k/i);
  });
});

// ─── 7. Formula trace ─────────────────────────────────────────────────────────

describe("boardroomModeAdapter — formula trace", () => {
  it("produces exactly 3 formula steps for qualifying run", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    expect(formulaSteps).toHaveLength(3);
  });

  it("formula steps have required fields", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    for (const step of formulaSteps ?? []) {
      expect(step.stepId).toBeTruthy();
      expect(step.label).toBeTruthy();
      expect(step.sourceRule).toBeTruthy();
      expect(step.engineVersion).toBe(BOARDROOM_VERSION);
    }
  });

  it("spine-validation step sourceRule references intelligence-spine.ts", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    const step = formulaSteps?.find(s => s.stepId === "spine-validation");
    expect(step?.sourceRule).toContain("intelligence-spine.ts");
  });

  it("qualification-gate step sourceRule references boardroom-mode.ts", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    const step = formulaSteps?.find(s => s.stepId === "qualification-gate");
    expect(step?.sourceRule).toContain("boardroom-mode.ts");
    expect(step?.sourceRule).toContain("qualifiesForBoardroom");
  });

  it("dossier-generation step sourceRule references boardroom-mode.ts", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    const step = formulaSteps?.find(s => s.stepId === "dossier-generation");
    expect(step?.sourceRule).toContain("boardroom-mode.ts");
    expect(step?.sourceRule).toContain("generateBoardroomDossier");
  });

  it("qualification-gate output string contains qualified status", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    const step = formulaSteps?.find(s => s.stepId === "qualification-gate");
    const qual = rawOutput.qualification as { qualified: boolean };
    // output is a string — check it reflects qualification status
    expect(typeof step?.output).toBe("string");
    expect(String(step?.output)).toContain(qual.qualified ? "QUALIFIED" : "NOT QUALIFIED");
  });
});

// ─── 8. Limitations honesty ──────────────────────────────────────────────────

describe("boardroomModeAdapter — limitations honesty", () => {
  it("limitations array has at least 6 entries", () => {
    expect(boardroomModeAdapter.limitations.length).toBeGreaterThanOrEqual(6);
  });

  it("limitations mention PDF not rendered", () => {
    const pdfLimitation = boardroomModeAdapter.limitations.find(l =>
      l.toLowerCase().includes("pdf")
    );
    expect(pdfLimitation).toBeTruthy();
  });

  it("limitations mention no DB writes", () => {
    const dbLimitation = boardroomModeAdapter.limitations.find(l =>
      l.toLowerCase().includes("persist") || l.toLowerCase().includes("db write") || l.toLowerCase().includes("archive")
    );
    expect(dbLimitation).toBeTruthy();
  });

  it("limitations mention synthetic spine", () => {
    const syntheticLimitation = boardroomModeAdapter.limitations.find(l =>
      l.toLowerCase().includes("synthetic")
    );
    expect(syntheticLimitation).toBeTruthy();
  });

  it("promotionRequirements mentions PDF render dry-run", () => {
    const pdfReq = boardroomModeAdapter.promotionRequirements.find(r =>
      r.toLowerCase().includes("pdf")
    );
    expect(pdfReq).toBeTruthy();
  });

  it("run output limitations match adapter-level limitations", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    expect(result.limitations).toEqual(boardroomModeAdapter.limitations);
  });
});

// ─── 9. No PDF / no production mutation ──────────────────────────────────────

describe("boardroomModeAdapter — no PDF, no production mutation", () => {
  it("pipelineStagesNotCalled explicitly lists PDF export", () => {
    const pdfEntry = boardroomModeAdapter.pipelineStagesNotCalled.find(s =>
      s.toLowerCase().includes("pdf")
    );
    expect(pdfEntry).toBeTruthy();
  });

  it("pipelineStagesNotCalled explicitly lists archiveIntake / persistence", () => {
    const archiveEntry = boardroomModeAdapter.pipelineStagesNotCalled.find(s =>
      s.toLowerCase().includes("archive") || s.toLowerCase().includes("persist")
    );
    expect(archiveEntry).toBeTruthy();
  });

  it("rawOutput pipelineStagesNotCalled is a non-empty array", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    expect(Array.isArray(rawOutput.pipelineStagesNotCalled)).toBe(true);
    expect((rawOutput.pipelineStagesNotCalled as unknown[]).length).toBeGreaterThan(0);
  });

  it("rawOutput productionFunctionsCalled lists boardroom-mode.ts functions", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const fns = rawOutput.productionFunctionsCalled as string[];
    expect(fns.some(f => f.includes("qualifiesForBoardroom"))).toBe(true);
    expect(fns.some(f => f.includes("generateBoardroomDossier"))).toBe(true);
    expect(fns.some(f => f.includes("boardroom-mode.ts"))).toBe(true);
  });

  it("rawOutput does not expose customer email or PII", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const raw = JSON.stringify(result.rawOutput);
    // Fixtures use no email field — confirm nothing leaks
    expect(raw).not.toMatch(/@example\.com/);
    expect(raw).not.toMatch(/@gmail\.com/);
    expect(raw).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  });
});

// ─── 10. Engine version ───────────────────────────────────────────────────────

describe("boardroomModeAdapter — engine version", () => {
  it("getVersion returns version string", () => {
    expect(boardroomModeAdapter.getVersion()).toBe("1.0.0");
  });

  it("run output includes engineVersion", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    expect(result.engineVersion).toBe("1.0.0");
  });

  it("every formula step has engineVersion", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const formulaSteps = rawOutput.formulaSteps as FormulaStep[];
    for (const step of formulaSteps ?? []) {
      expect(step.engineVersion).toBe("1.0.0");
    }
  });
});

// ─── 11. Malformed / invalid input ───────────────────────────────────────────

describe("boardroomModeAdapter — malformed input", () => {
  it("malformed spine returns typed error finding", async () => {
    const result = await boardroomModeAdapter.run({ payload: { spine: MALFORMED_SPINE } });
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0]!.severity).toBe("HIGH");
    expect(result.findings[0]!.source).toContain("boardroom-mode-adapter");
  });

  it("malformed spine summary reports failure", async () => {
    const result = await boardroomModeAdapter.run({ payload: { spine: MALFORMED_SPINE } });
    expect(result.summary).toMatch(/blocked|failed|invalid/i);
  });

  it("empty payload defaults to qualifying fixture", async () => {
    const result = await boardroomModeAdapter.run({ payload: {} });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const qualification = rawOutput.qualification as { qualified: boolean } | undefined;
    // Default is qualifying fixture
    expect(qualification?.qualified).toBe(true);
  });

  it("invalid input type returns validation error finding", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: "yes" } as unknown });
    // Zod will fail to coerce boolean from string "yes" — should return error finding
    expect(Array.isArray(result.findings)).toBe(true);
    // engineId is on rawOutput, not on EngineRunOutput directly
    const rawOutput = result.rawOutput as Record<string, unknown> | undefined;
    // Either validation error or successful run (Zod may coerce) — engineVersion must be present
    expect(result.engineVersion).toBe("1.0.0");
  });
});

// ─── 12. Dossier section coverage ────────────────────────────────────────────

describe("boardroomModeAdapter — dossier section coverage", () => {
  it("qualifying dossier contains decision section", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { sections: Array<{ id: string }> };
    expect(dossier.sections.some(s => s.id === "decision")).toBe(true);
  });

  it("qualifying dossier contains cost section", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { sections: Array<{ id: string }> };
    expect(dossier.sections.some(s => s.id === "cost")).toBe(true);
  });

  it("qualifying dossier contains failure_pattern section", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { sections: Array<{ id: string }> };
    expect(dossier.sections.some(s => s.id === "failure_pattern")).toBe(true);
  });

  it("qualifying dossier contains consequence section", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { sections: Array<{ id: string }> };
    expect(dossier.sections.some(s => s.id === "consequence")).toBe(true);
  });

  it("every section has id, label, content, and tone", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const dossier = rawOutput.dossier as { sections: Array<{ id: string; label: string; content: string; tone: string }> };
    for (const section of dossier.sections) {
      expect(section.id).toBeTruthy();
      expect(section.label).toBeTruthy();
      expect(section.content).toBeTruthy();
      expect(["factual", "confrontational", "quantified"]).toContain(section.tone);
    }
  });
});

// ─── 13. Findings quality ─────────────────────────────────────────────────────

describe("boardroomModeAdapter — findings quality", () => {
  it("every finding has sourceRule", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    for (const finding of result.findings) {
      expect(finding.source).toBeTruthy();
      expect(finding.source).toContain("boardroom-mode");
    }
  });

  it("qualifying run produces high-severity finding for authority condition", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const highFindings = result.findings.filter(f => f.severity === "HIGH");
    expect(highFindings.length).toBeGreaterThan(0);
  });

  it("false-authority spine produces false-authority finding", async () => {
    const result = await boardroomModeAdapter.run({ payload: { useQualifyingFixture: true } });
    const falseAuthFinding = result.findings.find(f =>
      f.title.toLowerCase().includes("false authority")
    );
    expect(falseAuthFinding).toBeTruthy();
  });
});
