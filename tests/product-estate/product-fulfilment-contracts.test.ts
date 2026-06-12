/**
 * tests/product-estate/product-fulfilment-contracts.test.ts
 *
 * Product Fulfilment Assurance Gate — invariant tests.
 *
 * Validates the contract registry and validator logic without DB calls.
 * These tests are the build-time proof that no product can be sold
 * without a structurally valid fulfilment path.
 */

import { describe, expect, it } from "vitest";
import {
  PRODUCT_FULFILMENT_CONTRACTS,
  BOARDROOM_BRIEF_CONTRACT,
  getContractByProductCode,
} from "@/lib/product/product-fulfilment-contract";
import type { ProductFulfilmentContract } from "@/lib/product/product-fulfilment-contract";
import {
  validateContract,
  validateAllContracts,
} from "@/lib/product/fulfilment-readiness-validator";

// ── Registry integrity ────────────────────────────────────────────────────────

describe("product-fulfilment-contracts — registry", () => {
  it("PRODUCT_FULFILMENT_CONTRACTS is a non-empty array", () => {
    expect(Array.isArray(PRODUCT_FULFILMENT_CONTRACTS)).toBe(true);
    expect(PRODUCT_FULFILMENT_CONTRACTS.length).toBeGreaterThan(0);
  });

  it("every contract has a unique productCode", () => {
    const codes = PRODUCT_FULFILMENT_CONTRACTS.map((c) => c.productCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it("every contract has a non-empty productCode, displayName, entitlementSlug", () => {
    for (const c of PRODUCT_FULFILMENT_CONTRACTS) {
      expect(c.productCode, `productCode blank`).toBeTruthy();
      expect(c.displayName, `displayName blank for ${c.productCode}`).toBeTruthy();
      expect(c.entitlementSlug, `entitlementSlug blank for ${c.productCode}`).toBeTruthy();
    }
  });

  it("every contract has a valid readinessStatus", () => {
    const valid = ["sellable", "proof_ready", "not_sellable", "not_applicable"];
    for (const c of PRODUCT_FULFILMENT_CONTRACTS) {
      expect(valid, `invalid readinessStatus on ${c.productCode}`).toContain(c.readinessStatus);
    }
  });

  it("every contract has a valid fulfilmentType", () => {
    const valid = [
      "interactive_instrument", "governed_methodology_run", "human_reviewed_dossier",
      "executive_report_artifact", "scheduled_session", "bundle_grant", "retainer_cycle",
      "free_asset", "evidence_gated", "free_controlled", "corridor_stage",
    ];
    for (const c of PRODUCT_FULFILMENT_CONTRACTS) {
      expect(valid, `invalid fulfilmentType on ${c.productCode}`).toContain(c.fulfilmentType);
    }
  });

  it("every paid contract has a stripePriceId", () => {
    const paidMissingPrice = PRODUCT_FULFILMENT_CONTRACTS.filter(
      (c) => c.commercialStatus === "paid" && !c.stripePriceId,
    );
    expect(paidMissingPrice.map((c) => c.productCode)).toEqual([]);
  });

  it("every paid contract has a checkoutRoute", () => {
    const missing = PRODUCT_FULFILMENT_CONTRACTS.filter(
      (c) => c.commercialStatus === "paid" && !c.checkoutRoute,
    );
    expect(missing.map((c) => c.productCode)).toEqual([]);
  });

  it("every paid contract has a customerAccessRoute", () => {
    const missing = PRODUCT_FULFILMENT_CONTRACTS.filter(
      (c) => c.commercialStatus === "paid" && !c.customerAccessRoute,
    );
    expect(missing.map((c) => c.productCode)).toEqual([]);
  });

  it("getContractByProductCode returns the correct contract", () => {
    const c = getContractByProductCode("boardroom_brief");
    expect(c).toBeDefined();
    expect(c?.productCode).toBe("boardroom_brief");
  });

  it("getContractByProductCode returns undefined for unknown code", () => {
    const c = getContractByProductCode("nonexistent_product");
    expect(c).toBeUndefined();
  });
});

// ── Boardroom Brief as exemplar (Phase 8) ────────────────────────────────────

describe("product-fulfilment-contracts — boardroom_brief exemplar", () => {
  it("boardroom_brief contract exists in registry", () => {
    const c = getContractByProductCode("boardroom_brief");
    expect(c).toBeDefined();
  });

  it("boardroom_brief has human_reviewed_dossier fulfilmentType", () => {
    expect(BOARDROOM_BRIEF_CONTRACT.fulfilmentType).toBe("human_reviewed_dossier");
  });

  it("boardroom_brief has BoardroomBriefOrder artifactModel", () => {
    expect(BOARDROOM_BRIEF_CONTRACT.artifactModel).toBe("BoardroomBriefOrder");
  });

  it("boardroom_brief has adminRoute", () => {
    expect(BOARDROOM_BRIEF_CONTRACT.adminRoute).toBe("/admin/boardroom/orders");
  });

  it("boardroom_brief is proof_ready, not sellable (proof run not completed)", () => {
    expect(BOARDROOM_BRIEF_CONTRACT.readinessStatus).toBe("proof_ready");
    expect(BOARDROOM_BRIEF_CONTRACT.proofRunCompleted).toBe(false);
  });

  it("boardroom_brief has no hard failures (structurally complete)", () => {
    const result = validateContract(BOARDROOM_BRIEF_CONTRACT);
    expect(result.hardFailures).toHaveLength(0);
  });

  it("boardroom_brief validator computes proof_ready (matches declared)", () => {
    const result = validateContract(BOARDROOM_BRIEF_CONTRACT);
    expect(result.computedStatus).toBe("proof_ready");
    expect(result.statusMismatch).toBe(false);
  });

  it("boardroom_brief has at least one warning about proof run", () => {
    const result = validateContract(BOARDROOM_BRIEF_CONTRACT);
    const allWarnings = [...result.warnings, ...result.contractWarnings];
    const proofWarn = allWarnings.some(
      (w) => (typeof w === "string" ? w : w.message).toLowerCase().includes("proof"),
    );
    expect(proofWarn).toBe(true);
  });

  it("boardroom_brief has dashboardVisibility: true", () => {
    expect(BOARDROOM_BRIEF_CONTRACT.dashboardVisibility).toBe(true);
  });

  it("boardroom_brief has estateSpineSourceType: boardroom_brief_order", () => {
    expect(BOARDROOM_BRIEF_CONTRACT.estateSpineSourceType).toBe("boardroom_brief_order");
  });
});

// ── Validator — hard failure logic ────────────────────────────────────────────

describe("product-fulfilment-contracts — validator hard failures", () => {
  function makeContract(overrides: Partial<ProductFulfilmentContract>): ProductFulfilmentContract {
    return {
      productCode: "test_product",
      displayName: "Test Product",
      entitlementSlug: "test-product",
      stripePriceId: "price_test",
      commercialStatus: "paid",
      checkoutRoute: "/api/checkout/test",
      intakeRoute: "/test",
      successRoute: "/test/success",
      customerAccessRoute: "/test/run",
      adminRoute: "/admin/test",
      fulfilmentType: "interactive_instrument",
      artifactModel: null,
      deliveryModel: "entitlement_on_payment",
      dashboardVisibility: false,
      caseStudyEligible: false,
      feedbackSurface: null,
      estateSpineSourceType: null,
      readinessStatus: "sellable",
      proofRunCompleted: true,
      hardFailures: [],
      warnings: [],
      notes: null,
      ...overrides,
    };
  }

  it("paid product missing stripePriceId gets MISSING_STRIPE_PRICE_ID failure", () => {
    const result = validateContract(makeContract({ stripePriceId: null, readinessStatus: "not_sellable" }));
    expect(result.hardFailures.some((f) => f.rule === "MISSING_STRIPE_PRICE_ID")).toBe(true);
    expect(result.computedStatus).toBe("not_sellable");
  });

  it("paid product missing checkoutRoute gets MISSING_CHECKOUT_ROUTE failure", () => {
    const result = validateContract(makeContract({ checkoutRoute: null, readinessStatus: "not_sellable" }));
    expect(result.hardFailures.some((f) => f.rule === "MISSING_CHECKOUT_ROUTE")).toBe(true);
  });

  it("paid product missing customerAccessRoute gets MISSING_CUSTOMER_ACCESS_ROUTE failure", () => {
    const result = validateContract(makeContract({ customerAccessRoute: null, readinessStatus: "not_sellable" }));
    expect(result.hardFailures.some((f) => f.rule === "MISSING_CUSTOMER_ACCESS_ROUTE")).toBe(true);
  });

  it("human_reviewed_dossier without adminRoute gets MISSING_ADMIN_ROUTE_FOR_DOSSIER", () => {
    const result = validateContract(
      makeContract({ fulfilmentType: "human_reviewed_dossier", adminRoute: null, artifactModel: "BoardroomBriefOrder", readinessStatus: "not_sellable" }),
    );
    expect(result.hardFailures.some((f) => f.rule === "MISSING_ADMIN_ROUTE_FOR_DOSSIER")).toBe(true);
  });

  it("human_reviewed_dossier without artifactModel gets MISSING_ARTIFACT_MODEL_FOR_DOSSIER", () => {
    const result = validateContract(
      makeContract({ fulfilmentType: "human_reviewed_dossier", artifactModel: null, readinessStatus: "not_sellable" }),
    );
    expect(result.hardFailures.some((f) => f.rule === "MISSING_ARTIFACT_MODEL_FOR_DOSSIER")).toBe(true);
  });

  it("valid paid interactive_instrument has no hard failures", () => {
    const result = validateContract(makeContract({}));
    expect(result.hardFailures).toHaveLength(0);
  });
});

// ── Validator — computed status rules ────────────────────────────────────────

describe("product-fulfilment-contracts — validator computed status", () => {
  it("inactive product computes not_applicable regardless of other fields", () => {
    const c = getContractByProductCode("retainer_core");
    expect(c).toBeDefined();
    const result = validateContract(c!);
    expect(result.computedStatus).toBe("not_applicable");
  });

  it("free_controlled product computes not_applicable", () => {
    const c = getContractByProductCode("fast_diagnostic");
    expect(c).toBeDefined();
    const result = validateContract(c!);
    expect(result.computedStatus).toBe("not_applicable");
  });

  it("evidence_gated product computes not_applicable", () => {
    const c = getContractByProductCode("boardroom_mode");
    expect(c).toBeDefined();
    const result = validateContract(c!);
    expect(result.computedStatus).toBe("not_applicable");
  });

  it("paid product with proofRunCompleted=true and no hard failures is sellable", () => {
    const c = getContractByProductCode("decision_exposure_instrument");
    expect(c).toBeDefined();
    const result = validateContract(c!);
    expect(result.computedStatus).toBe("sellable");
  });
});

// ── Estate-wide validation ────────────────────────────────────────────────────

describe("product-fulfilment-contracts — estate validation", () => {
  const report = validateAllContracts(PRODUCT_FULFILMENT_CONTRACTS);

  it("no product in the estate has a not_sellable computed status", () => {
    const blocked = report.results.filter((r) => r.computedStatus === "not_sellable");
    expect(blocked.map((r) => r.productCode)).toEqual([]);
  });

  it("estate has at least one sellable product", () => {
    expect(report.sellable).toBeGreaterThan(0);
  });

  it("estate has no declared/computed status mismatches", () => {
    const mismatches = report.results.filter((r) => r.statusMismatch);
    expect(mismatches.map((r) => `${r.productCode}: declared=${r.declaredStatus} computed=${r.computedStatus}`)).toEqual([]);
  });

  it("report summary is a non-empty string", () => {
    expect(report.summary).toBeTruthy();
    expect(report.summary.length).toBeGreaterThan(10);
  });

  it("report totals add up to totalProducts", () => {
    expect(report.sellable + report.proofReady + report.notSellable + report.notApplicable).toBe(
      report.totalProducts,
    );
  });

  it("boardroom_brief appears in proof_ready products", () => {
    const proofReady = report.results.filter((r) => r.computedStatus === "proof_ready");
    expect(proofReady.some((r) => r.productCode === "boardroom_brief")).toBe(true);
  });

  it("all 10 interactive instruments are sellable", () => {
    const instruments = [
      "decision_exposure_instrument", "mandate_clarity_framework", "intervention_path_selector",
      "escalation_readiness_scorecard", "structural_failure_diagnostic_canvas",
      "execution_risk_index", "team_alignment_gap_map", "governance_drift_detector",
      "strategic_priority_stack_builder", "board_brief_builder",
    ];
    for (const code of instruments) {
      const result = report.results.find((r) => r.productCode === code);
      expect(result, `${code} not in report`).toBeDefined();
      expect(result?.computedStatus, `${code} not sellable`).toBe("sellable");
    }
  });

  it("all 3 governed playbooks are sellable", () => {
    const playbooks = [
      "execution_integrity_protocol", "alignment_audit_playbook", "drift_detection_framework",
    ];
    for (const code of playbooks) {
      const result = report.results.find((r) => r.productCode === code);
      expect(result?.computedStatus, `${code} not sellable`).toBe("sellable");
    }
  });

  it("free products and corridor stages are not_applicable", () => {
    const freeCodes = [
      "fast_diagnostic", "team_assessment", "enterprise_assessment",
      "boardroom_mode", "case_dossier_tariff_shock",
    ];
    for (const code of freeCodes) {
      const result = report.results.find((r) => r.productCode === code);
      expect(result, `${code} not in report`).toBeDefined();
      expect(result?.computedStatus, `${code} should be not_applicable`).toBe("not_applicable");
    }
  });
});

// ── Admin nav registration ────────────────────────────────────────────────────

describe("product-fulfilment-contracts — admin nav", () => {
  it("/admin/product-fulfilment is registered in admin navigation", async () => {
    const { ADMIN_NAVIGATION, getAllAdminNavItems } = await import("@/lib/admin/admin-navigation");
    const item = getAllAdminNavItems().find((i) => i.href === "/admin/product-fulfilment");
    expect(item, "/admin/product-fulfilment must be in nav").toBeDefined();
    expect(item?.status).toBe("active");
    expect(item?.visibility).toBe("admin");
  });

  it("/admin/product-fulfilment is in the operations section", async () => {
    const { ADMIN_NAVIGATION } = await import("@/lib/admin/admin-navigation");
    const section = ADMIN_NAVIGATION.find((s) => s.id === "operations");
    const item = section?.items.find((i) => i.href === "/admin/product-fulfilment");
    expect(item, "/admin/product-fulfilment must be in operations section").toBeDefined();
  });

  it("/admin/product-fulfilment is in the domain registry", async () => {
    const { ADMIN_ROUTES } = await import("@/lib/platform/admin-domain-registry");
    const entry = ADMIN_ROUTES.find((r) => r.route === "/admin/product-fulfilment");
    expect(entry, "/admin/product-fulfilment must be in ADMIN_ROUTES").toBeDefined();
  });
});
