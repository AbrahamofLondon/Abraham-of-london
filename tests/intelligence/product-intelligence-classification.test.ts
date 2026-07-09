import { describe, expect, it } from "vitest";
import { PRODUCT_FULFILMENT_CONTRACTS } from "@/lib/product/product-fulfilment-contract";
import {
  PRODUCT_INTELLIGENCE_CLASSES,
  assertCompleteProductIntelligenceClassificationCoverage,
  buildProductIntelligenceClassificationReport,
  getProductIntelligenceClass,
  listAllProductIntelligenceClassifications,
  type ProductIntelligenceClass,
} from "@/lib/intelligence/product-intelligence-classification";

const EXPECTED_CLASSIFICATIONS: Record<string, ProductIntelligenceClass> = {
  additional_collaborator: "infrastructure",
  alignment_audit_playbook: "originator",
  board_brief_builder: "derivative",
  boardroom_brief: "fulfilment",
  boardroom_mode: "derivative",
  case_dossier_escalation_denied: "proof_surface",
  case_dossier_tariff_shock: "proof_surface",
  case_dossier_team_alignment: "proof_surface",
  command_pack: "wrapper",
  decision_exposure_instrument: "originator",
  diagnostic_report_basic: "derivative",
  diagnostic_report_pro: "derivative",
  drift_detection_framework: "originator",
  enterprise: "infrastructure",
  enterprise_assessment: "originator",
  escalation_readiness_scorecard: "originator",
  execution_integrity_protocol: "originator",
  execution_risk_index: "originator",
  executive_reporting: "derivative",
  executive_reporting_priority: "derivative",
  fast_diagnostic: "originator",
  gmi_q1_2026: "proof_surface",
  gmi_q2_2026: "proof_surface",
  gmi_q3_2026: "proof_surface",
  gmi_quarterly: "derivative",
  governance_drift_detector: "originator",
  governance_suite: "wrapper",
  inner_circle: "infrastructure",
  intervention_path_selector: "originator",
  mandate_clarity_framework: "originator",
  operator_decision_pack: "wrapper",
  operator_essentials_pack: "wrapper",
  personal_decision_audit: "originator",
  professional: "infrastructure",
  professional_annual: "infrastructure",
  reporting_custom: "fulfilment",
  reporting_monthly: "derivative",
  retainer_core: "infrastructure",
  retainer_institutional: "infrastructure",
  retainer_operational: "infrastructure",
  strategic_priority_stack_builder: "originator",
  strategy_room: "fulfilment",
  strategy_room_extended: "fulfilment",
  structural_failure_diagnostic_canvas: "originator",
  team_alignment_gap_map: "originator",
  team_assessment: "originator",
};

function countExpectedByClass(): Record<ProductIntelligenceClass, number> {
  const counts: Record<ProductIntelligenceClass, number> = {
    originator: 0,
    derivative: 0,
    wrapper: 0,
    infrastructure: 0,
    fulfilment: 0,
    proof_surface: 0,
  };

  for (const classification of Object.values(EXPECTED_CLASSIFICATIONS)) {
    counts[classification] += 1;
  }

  return counts;
}

describe("product intelligence classification", () => {
  it("covers the canonical product estate exactly once", () => {
    const report = buildProductIntelligenceClassificationReport();

    const expectedCount = PRODUCT_FULFILMENT_CONTRACTS.length;
    expect(report.expectedProductCount).toBe(expectedCount);
    expect(report.uniqueProductCount).toBe(expectedCount);
    expect(report.classifiedProductCount).toBe(expectedCount);
    expect(report.completeCoverage).toBe(true);
    expect(report.duplicateRegistryProductCodes).toEqual([]);
    expect(report.unclassifiedProducts).toEqual([]);
    expect(report.multiplyClassifiedProducts).toEqual([]);
  });

  it("locks the class for every classified product", () => {
    expect(Object.keys(EXPECTED_CLASSIFICATIONS)).toHaveLength(PRODUCT_FULFILMENT_CONTRACTS.length);

    for (const [productCode, expectedClassification] of Object.entries(EXPECTED_CLASSIFICATIONS)) {
      expect(getProductIntelligenceClass(productCode)).toBe(expectedClassification);
    }
  });

  it("exposes complete report and list helpers", () => {
    expect(() => assertCompleteProductIntelligenceClassificationCoverage()).not.toThrow();

    const report = buildProductIntelligenceClassificationReport();
    const allClassifications = listAllProductIntelligenceClassifications();
    const expectedCounts = countExpectedByClass();

    expect(allClassifications).toHaveLength(PRODUCT_FULFILMENT_CONTRACTS.length);
    expect(new Set(allClassifications.map((entry) => entry.productCode)).size).toBe(PRODUCT_FULFILMENT_CONTRACTS.length);
    expect(report.classifications).toEqual(allClassifications);
    expect(report.countsByClass).toEqual(expectedCounts);
    expect(Object.keys(report.countsByClass).sort()).toEqual(
      [...PRODUCT_INTELLIGENCE_CLASSES].sort(),
    );
  });

  it("fails closed for unknown, future, or out-of-scope products", () => {
    expect(() => getProductIntelligenceClass("future_authority_product")).toThrow(
      /fails closed/i,
    );
    expect(getProductIntelligenceClass("reporting_monthly")).toBe("derivative");
  });
});
