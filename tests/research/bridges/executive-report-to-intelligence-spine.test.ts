/**
 * tests/research/bridges/executive-report-to-intelligence-spine.test.ts
 *
 * Tests for the ER → IntelligenceSpine mapper.
 * Verifies: required mappings, gap detection, trace completeness, no silent fallback.
 */

import { describe, it, expect } from "vitest";
import { mapExecutiveReportToIntelligenceSpine } from "@/lib/research/bridges/executive-report-to-intelligence-spine";
import {
  DISORDERED_HIGH_COST_REPORT,
  ORDERED_DOES_NOT_QUALIFY_REPORT,
  MAPPING_GAP_INSUFFICIENT_REPORT,
} from "@/tests/research/fixtures/executive-report-boardroom-bridge";

// ─── 1. Required mappings ─────────────────────────────────────────────────────

describe("required mappings — DISORDERED report", () => {
  const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);

  it("financialExposure.totalExposure maps to spine.economics.estimatedMonthlyCost (divided by 12)", () => {
    const expectedMonthly = Math.round(DISORDERED_HIGH_COST_REPORT.financialExposure.totalExposure / 12);
    expect(result.spine.economics?.estimatedMonthlyCost).toBe(expectedMonthly);
  });

  it("financial mapping trace uses named rule bridge:financial_exposure_monthly_normalisation_v1", () => {
    const trace = result.mappingTrace.find(
      (t) => t.from.includes("totalExposure") && t.to.includes("estimatedMonthlyCost"),
    );
    expect(trace).toBeDefined();
    expect(trace!.sourceRule).toBe("bridge:financial_exposure_monthly_normalisation_v1");
    expect(trace!.valueKind).toBe("derived");
    expect(trace!.rationale).toBeDefined();
    expect(trace!.rationale!.length).toBeGreaterThan(0);
  });

  it("state maps to spine.deterministic.conditionClass (DISORDERED → instability)", () => {
    expect(result.spine.deterministic.conditionClass).toBe("instability");
  });

  it("state mapping trace uses named rule bridge:er_state_to_spine_condition_class_v1", () => {
    const trace = result.mappingTrace.find((t) => t.from.includes("state"));
    expect(trace).toBeDefined();
    expect(trace!.sourceRule).toBe("bridge:er_state_to_spine_condition_class_v1");
    expect(trace!.rationale).toBeDefined();
  });

  it("narrative maps to spine.synthesis.verdict", () => {
    expect(result.spine.synthesis?.verdict).toBe(
      DISORDERED_HIGH_COST_REPORT.narrative.summary,
    );
  });

  it("failureModes map to spine.deterministic.contradictionSet", () => {
    for (const fm of DISORDERED_HIGH_COST_REPORT.failureModes) {
      expect(result.spine.deterministic.contradictionSet).toContain(`Failure mode: ${fm}`);
    }
  });

  it("failure modes mapping trace uses named rule bridge:failure_modes_to_contradiction_set_v1", () => {
    const trace = result.mappingTrace.find((t) => t.from.includes("failureModes"));
    expect(trace).toBeDefined();
    expect(trace!.sourceRule).toBe("bridge:failure_modes_to_contradiction_set_v1");
    expect(trace!.rationale).toBeDefined();
  });

  it("priorityStack maps to spine.synthesis.concreteMove (first item)", () => {
    expect(result.spine.synthesis?.concreteMove).toBe(
      DISORDERED_HIGH_COST_REPORT.priorityStack[0],
    );
  });

  it("financialExposure maps to spine.economics", () => {
    expect(result.spine.economics?.estimatedMonthlyCost).toBeDefined();
    expect(result.spine.economics?.costOfDelayMonthly).toBeDefined();
  });
});

// ─── 2. Mapping traces ────────────────────────────────────────────────────────

describe("mapping traces", () => {
  const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);

  it("every mappingTrace has sourceRule", () => {
    for (const trace of result.mappingTrace) {
      expect(typeof trace.sourceRule).toBe("string");
      expect(trace.sourceRule.length).toBeGreaterThan(0);
    }
  });

  it("every mappingTrace has from and to fields", () => {
    for (const trace of result.mappingTrace) {
      expect(typeof trace.from).toBe("string");
      expect(trace.from.length).toBeGreaterThan(0);
      expect(typeof trace.to).toBe("string");
      expect(trace.to.length).toBeGreaterThan(0);
    }
  });

  it("every mappingTrace has valueKind", () => {
    for (const trace of result.mappingTrace) {
      expect(["direct", "derived", "fallback", "omitted"]).toContain(trace.valueKind);
    }
  });

  it("every mappingTrace has confidence", () => {
    for (const trace of result.mappingTrace) {
      expect(["high", "medium", "low"]).toContain(trace.confidence);
    }
  });

  it("totalExposure mapping trace is derived with medium confidence (divided by 12)", () => {
    const trace = result.mappingTrace.find((t) => t.from.includes("totalExposure"));
    expect(trace).toBeDefined();
    expect(trace?.valueKind).toBe("derived");
    expect(trace?.confidence).toBe("medium");
  });

  it("state mapping trace is derived", () => {
    const trace = result.mappingTrace.find((t) => t.from.includes("state"));
    expect(trace).toBeDefined();
    expect(trace?.valueKind).toBe("derived");
  });

  it("failureModes mapping trace is derived", () => {
    const trace = result.mappingTrace.find((t) => t.from.includes("failureModes"));
    expect(trace).toBeDefined();
    expect(trace?.valueKind).toBe("derived");
  });
});

// ─── 3. Mapping gaps ──────────────────────────────────────────────────────────

describe("mapping gaps", () => {
  it("DISORDERED report produces mapping gaps for HCD and OGR", () => {
    const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);
    const hcdGap = result.mappingGaps.find((g) => g.targetField.includes("humanCapital"));
    const ogrGap = result.mappingGaps.find((g) => g.targetField.includes("governance"));

    expect(hcdGap).toBeDefined();
    expect(hcdGap?.impact).toBe("medium");
    expect(ogrGap).toBeDefined();
    expect(ogrGap?.impact).toBe("medium");
  });

  it("every mappingGap has missingSource, targetField, impact, recommendation", () => {
    const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);
    for (const gap of result.mappingGaps) {
      expect(typeof gap.missingSource).toBe("string");
      expect(gap.missingSource.length).toBeGreaterThan(0);
      expect(typeof gap.targetField).toBe("string");
      expect(gap.targetField.length).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(gap.impact);
      expect(typeof gap.recommendation).toBe("string");
      expect(gap.recommendation.length).toBeGreaterThan(0);
    }
  });

  it("missing required field creates mappingGap", () => {
    const result = mapExecutiveReportToIntelligenceSpine(MAPPING_GAP_INSUFFICIENT_REPORT);
    // With empty priorityStack, there should be a gap for concreteMove
    const concreteMoveGap = result.mappingGaps.find((g) =>
      g.targetField.includes("concreteMove"),
    );
    expect(concreteMoveGap).toBeDefined();
  });
});

// ─── 4. No silent fallback ────────────────────────────────────────────────────

describe("no silent fallback", () => {
  it("every mappingTrace is accounted for — no unknown field dropped without trace", () => {
    const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);
    // All traces should have a sourceRule
    for (const trace of result.mappingTrace) {
      expect(trace.sourceRule).toBeTruthy();
    }
  });

  it("mappingGaps cover HCD, OGR, and financial breakdown", () => {
    const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);
    const gapTargets = result.mappingGaps.map((g) => g.targetField);
    expect(gapTargets.some((t) => t.includes("humanCapital"))).toBe(true);
    expect(gapTargets.some((t) => t.includes("governance"))).toBe(true);
    expect(gapTargets.some((t) => t.includes("replacementCost"))).toBe(true);
  });
});

// ─── 5. Output shape ──────────────────────────────────────────────────────────

describe("output shape", () => {
  const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);

  it("returns spine object", () => {
    expect(result.spine).toBeDefined();
    expect(result.spine.id).toBeTruthy();
  });

  it("returns mappingTrace array", () => {
    expect(Array.isArray(result.mappingTrace)).toBe(true);
    expect(result.mappingTrace.length).toBeGreaterThan(0);
  });

  it("returns mappingGaps array", () => {
    expect(Array.isArray(result.mappingGaps)).toBe(true);
  });

  it("returns limitations array", () => {
    expect(Array.isArray(result.limitations)).toBe(true);
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it("returns promotionRequirements array", () => {
    expect(Array.isArray(result.promotionRequirements)).toBe(true);
    expect(result.promotionRequirements.length).toBeGreaterThan(0);
  });

  it("mapped spine has valid IntelligenceSpine structure", () => {
    const spine = result.spine;
    expect(spine.case).toBeDefined();
    expect(spine.case.decision).toBeTruthy();
    expect(spine.deterministic).toBeDefined();
    expect(spine.deterministic.conditionClass).toBeTruthy();
    expect(spine.deterministic.signal).toBeDefined();
    expect(spine.c3).toBeDefined();
    expect(spine.c3.tier).toBeTruthy();
    expect(spine.synthesis).toBeDefined();
    expect(spine.forecast).toBeDefined();
    expect(spine.stage).toBe("executive_reporting");
    expect(Array.isArray(spine.history)).toBe(true);
    expect(spine.history.length).toBeGreaterThan(0);
  });
});

// ─── 6. ORDERED report mapping ────────────────────────────────────────────────

describe("ORDERED report mapping", () => {
  const result = mapExecutiveReportToIntelligenceSpine(ORDERED_DOES_NOT_QUALIFY_REPORT);

  it("maps ORDERED state to execution condition", () => {
    expect(result.spine.deterministic.conditionClass).toBe("execution");
  });

  it("maps empty failureModes to fallback contradiction", () => {
    expect(result.spine.deterministic.contradictionSet).toContain(
      "No failure modes detected in executive report.",
    );
  });

  it("maps ORDERED state to high confidence band", () => {
    expect(result.spine.c3.confidenceBand).toBe("high");
  });

  it("maps ORDERED state to FULL_SYNTHESIS tier", () => {
    expect(result.spine.c3.tier).toBe("FULL_SYNTHESIS");
  });

  it("maps ORDERED accuracyFeedback to yes", () => {
    expect(result.spine.accuracyFeedback?.response).toBe("yes");
  });
});
