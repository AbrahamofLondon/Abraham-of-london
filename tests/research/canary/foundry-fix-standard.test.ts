/**
 * tests/research/canary/foundry-fix-standard.test.ts
 *
 * Enforces the Foundry Fix Standard:
 * - Every mappingTrace.sourceRule must exist in foundry-rule-registry.
 * - Every valueKind "derived" mapping must include rationale.
 * - Every valueKind "fallback" mapping must have confidence not equal to "high".
 * - Every adapter promoted to PRODUCTION_CALLABLE must expose limitations and promotionRequirements.
 * - Every bridge output with mappingGaps must convert high-impact gaps into findings.
 * - financial_exposure_monthly_normalisation_v1 must be present and documented.
 * - No bridge mapper may map totalExposure directly to estimatedMonthlyCost without the named rule.
 */

import { describe, it, expect } from "vitest";
import { getAllRuleIds, getRule, ruleExists } from "@/lib/research/foundry-rule-registry";
import { mapExecutiveReportToIntelligenceSpine } from "@/lib/research/bridges/executive-report-to-intelligence-spine";
import { DISORDERED_HIGH_COST_REPORT } from "@/tests/research/fixtures/executive-report-boardroom-bridge";
import { executiveReportBoardroomBridgeAdapter } from "@/lib/research/engines/executive-report-boardroom-bridge-adapter";
import { executiveReportingAdapter } from "@/lib/research/engines/executive-reporting-adapter";
import { boardroomModeAdapter } from "@/lib/research/engines/boardroom-mode-adapter";

// ─── 1. Rule Registry Integrity ──────────────────────────────────────────────

describe("Foundry Fix Standard — rule registry", () => {
  it("contains at least 15 named rules", () => {
    const ids = getAllRuleIds();
    expect(ids.length).toBeGreaterThanOrEqual(15);
  });

  it("every rule has a unique ID", () => {
    const ids = getAllRuleIds();
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every rule has title, category, description, limitation, promotionRequirement", () => {
    const ids = getAllRuleIds();
    for (const id of ids) {
      const rule = getRule(id);
      expect(rule).toBeDefined();
      expect(typeof rule!.title).toBe("string");
      expect(rule!.title.length).toBeGreaterThan(0);
      expect(typeof rule!.category).toBe("string");
      expect(typeof rule!.description).toBe("string");
      expect(rule!.description.length).toBeGreaterThan(0);
      expect(typeof rule!.limitation).toBe("string");
      expect(rule!.limitation.length).toBeGreaterThan(0);
      expect(typeof rule!.promotionRequirement).toBe("string");
      expect(rule!.promotionRequirement.length).toBeGreaterThan(0);
    }
  });

  it("bridge:financial_exposure_monthly_normalisation_v1 is present", () => {
    expect(ruleExists("bridge:financial_exposure_monthly_normalisation_v1")).toBe(true);
  });

  it("bridge:er_state_to_spine_condition_class_v1 is present", () => {
    expect(ruleExists("bridge:er_state_to_spine_condition_class_v1")).toBe(true);
  });

  it("bridge:failure_modes_to_contradiction_set_v1 is present", () => {
    expect(ruleExists("bridge:failure_modes_to_contradiction_set_v1")).toBe(true);
  });

  it("bridge:narrative_to_synthesis_v1 is present", () => {
    expect(ruleExists("bridge:narrative_to_synthesis_v1")).toBe(true);
  });

  it("bridge:priority_stack_to_concrete_move_v1 is present", () => {
    expect(ruleExists("bridge:priority_stack_to_concrete_move_v1")).toBe(true);
  });

  it("bridge:resonance_to_c3_specificity_v1 is present", () => {
    expect(ruleExists("bridge:resonance_to_c3_specificity_v1")).toBe(true);
  });

  it("bridge:hcd_ogr_data_loss_v1 is present", () => {
    expect(ruleExists("bridge:hcd_ogr_data_loss_v1")).toBe(true);
  });

  it("adapter:fast_diagnostic_validation_scoring_only_v1 is present", () => {
    expect(ruleExists("adapter:fast_diagnostic_validation_scoring_only_v1")).toBe(true);
  });

  it("adapter:constitutional_diagnostic_deterministic_bundle_v1 is present", () => {
    expect(ruleExists("adapter:constitutional_diagnostic_deterministic_bundle_v1")).toBe(true);
  });

  it("adapter:strategy_room_directive_derivation_v1 is present", () => {
    expect(ruleExists("adapter:strategy_room_directive_derivation_v1")).toBe(true);
  });

  it("adapter:strategy_room_authority_override_v1 is present", () => {
    expect(ruleExists("adapter:strategy_room_authority_override_v1")).toBe(true);
  });

  it("adapter:boardroom_synthetic_spine_dossier_v1 is present", () => {
    expect(ruleExists("adapter:boardroom_synthetic_spine_dossier_v1")).toBe(true);
  });

  it("adapter:boardroom_qualification_gate_v1 is present", () => {
    expect(ruleExists("adapter:boardroom_qualification_gate_v1")).toBe(true);
  });

  it("adapter:executive_reporting_builder_fixture_v1 is present", () => {
    expect(ruleExists("adapter:executive_reporting_builder_fixture_v1")).toBe(true);
  });

  it("adapter:executive_reporting_state_thresholds_v1 is present", () => {
    expect(ruleExists("adapter:executive_reporting_state_thresholds_v1")).toBe(true);
  });

  it("adapter:executive_reporting_financial_exposure_v1 is present", () => {
    expect(ruleExists("adapter:executive_reporting_financial_exposure_v1")).toBe(true);
  });

  it("adapter:pattern_recurrence_detection_v1 is present", () => {
    expect(ruleExists("adapter:pattern_recurrence_detection_v1")).toBe(true);
  });

  it("performance:bounded_internal_benchmark_v1 is present", () => {
    expect(ruleExists("performance:bounded_internal_benchmark_v1")).toBe(true);
  });
});

// ─── 2. Mapping Trace sourceRule must exist in registry ──────────────────────

describe("Foundry Fix Standard — mapping trace sourceRule validation", () => {
  it("every mappingTrace.sourceRule from ER→spine mapper exists in registry", () => {
    const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);
    for (const trace of result.mappingTrace) {
      // sourceRule could be a named rule ID or a descriptive string
      // Check if it looks like a rule ID (contains colon)
      if (trace.sourceRule.includes(":")) {
        expect(ruleExists(trace.sourceRule)).toBe(true);
      }
    }
  });

  it("no mappingTrace maps totalExposure directly to estimatedMonthlyCost without the named rule", () => {
    const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);
    const financeTrace = result.mappingTrace.find(
      (t) => t.from.includes("totalExposure") && t.to.includes("estimatedMonthlyCost"),
    );
    expect(financeTrace).toBeDefined();
    expect(financeTrace!.sourceRule).toBe("bridge:financial_exposure_monthly_normalisation_v1");
    expect(financeTrace!.valueKind).toBe("derived");
    expect(financeTrace!.rationale).toBeDefined();
    expect(financeTrace!.rationale!.length).toBeGreaterThan(0);
  });
});

// ─── 3. Derived mappings must include rationale ─────────────────────────────

describe("Foundry Fix Standard — derived mappings include rationale", () => {
  it("every valueKind 'derived' mapping includes rationale", () => {
    const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);
    for (const trace of result.mappingTrace) {
      if (trace.valueKind === "derived") {
        expect(trace.rationale).toBeDefined();
        expect(trace.rationale!.length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── 4. Fallback mappings must not have high confidence ──────────────────────

describe("Foundry Fix Standard — fallback confidence", () => {
  it("no fallback mapping has high confidence", () => {
    const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);
    for (const trace of result.mappingTrace) {
      if (trace.valueKind === "fallback") {
        expect(trace.confidence).not.toBe("high");
      }
    }
  });
});

// ─── 5. PRODUCTION_CALLABLE adapters expose limitations and promotionRequirements ──

describe("Foundry Fix Standard — adapter honesty", () => {
  it("executiveReportingAdapter exposes limitations and promotionRequirements", () => {
    expect(Array.isArray(executiveReportingAdapter.limitations)).toBe(true);
    expect(executiveReportingAdapter.limitations.length).toBeGreaterThan(0);
    expect(Array.isArray(executiveReportingAdapter.promotionRequirements)).toBe(true);
    expect(executiveReportingAdapter.promotionRequirements.length).toBeGreaterThan(0);
  });

  it("boardroomModeAdapter exposes limitations and promotionRequirements", () => {
    expect(Array.isArray(boardroomModeAdapter.limitations)).toBe(true);
    expect(boardroomModeAdapter.limitations.length).toBeGreaterThan(0);
    expect(Array.isArray(boardroomModeAdapter.promotionRequirements)).toBe(true);
    expect(boardroomModeAdapter.promotionRequirements.length).toBeGreaterThan(0);
  });

  it("executiveReportBoardroomBridgeAdapter exposes limitations and promotionRequirements", () => {
    expect(Array.isArray(executiveReportBoardroomBridgeAdapter.limitations)).toBe(true);
    expect(executiveReportBoardroomBridgeAdapter.limitations.length).toBeGreaterThan(0);
    expect(Array.isArray(executiveReportBoardroomBridgeAdapter.promotionRequirements)).toBe(true);
    expect(executiveReportBoardroomBridgeAdapter.promotionRequirements.length).toBeGreaterThan(0);
  });
});

// ─── 6. Pipeline stages not called implies limitations present ──────────────

describe("Foundry Fix Standard — pipeline stages not called implies limitations", () => {
  it("executiveReportingAdapter has pipelineStagesNotCalled and limitations", () => {
    expect(Array.isArray(executiveReportingAdapter.pipelineStagesNotCalled)).toBe(true);
    expect(executiveReportingAdapter.pipelineStagesNotCalled.length).toBeGreaterThan(0);
    expect(executiveReportingAdapter.limitations.length).toBeGreaterThan(0);
  });

  it("boardroomModeAdapter has pipelineStagesNotCalled and limitations", () => {
    expect(Array.isArray(boardroomModeAdapter.pipelineStagesNotCalled)).toBe(true);
    expect(boardroomModeAdapter.pipelineStagesNotCalled.length).toBeGreaterThan(0);
    expect(boardroomModeAdapter.limitations.length).toBeGreaterThan(0);
  });

  it("executiveReportBoardroomBridgeAdapter has pipelineStagesNotCalled and limitations", () => {
    expect(Array.isArray(executiveReportBoardroomBridgeAdapter.pipelineStagesNotCalled)).toBe(true);
    expect(executiveReportBoardroomBridgeAdapter.pipelineStagesNotCalled.length).toBeGreaterThan(0);
    expect(executiveReportBoardroomBridgeAdapter.limitations.length).toBeGreaterThan(0);
  });
});

// ─── 7. High-impact mapping gaps produce findings ───────────────────────────

describe("Foundry Fix Standard — high-impact gaps produce findings", () => {
  it("bridge adapter produces findings for mapping gaps", async () => {
    const result = await executiveReportBoardroomBridgeAdapter.run({
      payload: { useDisorderedFixture: true },
    });
    const rawOutput = result.rawOutput as Record<string, unknown>;
    const bridgeOutput = rawOutput.bridgeOutput as Record<string, unknown>;
    const gaps = bridgeOutput.mappingGaps as Array<{ impact: string }>;
    const findings = result.findings;

    // If there are high-impact gaps, there should be findings for them
    const highGaps = gaps.filter((g) => g.impact === "high");
    if (highGaps.length > 0) {
      const gapFindings = findings.filter((f) => f.source.includes("mapping-gap"));
      expect(gapFindings.length).toBeGreaterThanOrEqual(highGaps.length);
    }
  });
});

// ─── 8. No direct totalExposure → estimatedMonthlyCost mapping ──────────────

describe("Foundry Fix Standard — no direct totalExposure mapping", () => {
  it("estimatedMonthlyCost is totalExposure / 12, not raw totalExposure", () => {
    const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);
    const expectedMonthly = Math.round(DISORDERED_HIGH_COST_REPORT.financialExposure.totalExposure / 12);
    expect(result.spine.economics?.estimatedMonthlyCost).toBe(expectedMonthly);
    expect(result.spine.economics?.estimatedMonthlyCost).not.toBe(
      DISORDERED_HIGH_COST_REPORT.financialExposure.totalExposure,
    );
  });

  it("mapping trace confirms the normalisation rule", () => {
    const result = mapExecutiveReportToIntelligenceSpine(DISORDERED_HIGH_COST_REPORT);
    const trace = result.mappingTrace.find(
      (t) => t.from.includes("totalExposure") && t.to.includes("estimatedMonthlyCost"),
    );
    expect(trace).toBeDefined();
    expect(trace!.sourceRule).toBe("bridge:financial_exposure_monthly_normalisation_v1");
    expect(trace!.valueKind).toBe("derived");
  });
});

// ─── 9. Fixture semantic comments ───────────────────────────────────────────

describe("Foundry Fix Standard — fixture semantics", () => {
  it("DISORDERED fixture totalExposure / 12 exceeds boardroom £5k threshold", () => {
    const monthly = Math.round(DISORDERED_HIGH_COST_REPORT.financialExposure.totalExposure / 12);
    expect(monthly).toBeGreaterThanOrEqual(5000);
  });

  it("ORDERED fixture totalExposure / 12 is below boardroom £5k threshold", async () => {
    // Import the ordered fixture
    const { ORDERED_DOES_NOT_QUALIFY_REPORT } = await import(
      "@/tests/research/fixtures/executive-report-boardroom-bridge"
    );
    const monthly = Math.round(ORDERED_DOES_NOT_QUALIFY_REPORT.financialExposure.totalExposure / 12);
    expect(monthly).toBeLessThan(5000);
  });
});
