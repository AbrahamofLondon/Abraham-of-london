/**
 * tests/product-estate/gmi-edition-catalog-factory.test.ts
 *
 * P6 — GMI Dynamic Edition Catalog Factory Tests
 *
 * Verifies that the GMI edition registry and factory:
 *   - generate correct catalog products for all editions
 *   - enforce fail-closed validation rules
 *   - preserve all catalog lookup paths
 *   - do not weaken commercial truth audit
 *   - keep 48-surface audit at zero fail
 */

import { describe, expect, it } from "vitest";
import { CATALOG, getProductByStripePriceId, getProductByStripeProductId, getProductByEntitlementSlug, getProductPricingFamily } from "@/lib/commercial/catalog";
import { PRODUCT_SURFACE_REGISTRY } from "@/lib/product/product-surface-registry";
import { GMI_EDITION_REGISTRY } from "@/lib/commercial/gmi/gmi-edition-registry";
import {
  buildGmiEditionProduct,
  buildGmiEditionProducts,
  validateGmiEditionRegistry,
  getCurrentGmiEditionProduct,
  getGmiEditionProductByEditionId,
  getGmiEditionProductBySlug,
  getCurrentGmiEditionCode,
} from "@/lib/commercial/gmi/gmi-edition-factory";
import { resolveProductAccessLink, auditProductAccessLinks } from "@/lib/product/product-access-link-resolver";

// ─── 1. Q1 and Q2 products generated from registry ───────────────────────────

describe("GMI-1 — Q1 and Q2 products are generated from registry", () => {
  it("gmi_q1_2026 exists in CATALOG", () => {
    expect(CATALOG["gmi_q1_2026"], "gmi_q1_2026 missing from generated catalog").toBeDefined();
  });

  it("gmi_q2_2026 exists in CATALOG", () => {
    expect(CATALOG["gmi_q2_2026"], "gmi_q2_2026 missing from generated catalog").toBeDefined();
  });

  it("gmi_q1_2026 has correct displayName", () => {
    expect(CATALOG["gmi_q1_2026"]?.displayName).toContain("Q1 2026");
  });

  it("gmi_q2_2026 has correct displayName", () => {
    expect(CATALOG["gmi_q2_2026"]?.displayName).toContain("Q2 2026");
  });
});

// ─── 2. Q1 uses prod_UNnSL8r6DMedEH ─────────────────────────────────────────

describe("GMI-2 — Current Q2 owns the reusable GMI Stripe binding", () => {
  it("gmi_q1_2026 has no new-purchase Stripe product after supersession", () => {
    expect(CATALOG["gmi_q1_2026"]?.stripeProductId).toBeNull();
  });

  it("gmi_q2_2026 owns the reusable GMI Stripe price", () => {
    expect(CATALOG["gmi_q2_2026"]?.stripePriceId).toBe("price_1TP1rRQFpelVFMXJWaFMOpJQ");
  });
});

// ─── 3. Q1 remains current until Q2 release authority (lifecycle authority) ────────────────
// Per lifecycle reconciliation: GMI-Q1-2026 remains active until Q2 receives final data lock and owner release authority.
// It is not the admin in-focus edition, but it remains the current published commercial edition.

describe("GMI-3 — Q1 2026 is archived after Q2 supersession (released 2026-07-08)", () => {
  it("gmi_q1_2026 is hidden from pricing after supersession", () => {
    expect(CATALOG["gmi_q1_2026"]?.hiddenFromPricing).toBe(true);
  });

  it("gmi_q1_2026 is not the admin in-focus edition", () => {
    const q1Entry = GMI_EDITION_REGISTRY.find((e) => e.productCode === "gmi_q1_2026");
    expect(q1Entry?.current).toBe(false);
  });

  it("gmi_q1_2026 is archived (inactive) as a commercial product", () => {
    expect(CATALOG["gmi_q1_2026"]?.active).toBe(false);
    expect(CATALOG["gmi_q1_2026"]?.commercialStatus).toBe("inactive");
  });

  it("gmi_q1_2026 carries the Q2 supersession hidden reason", () => {
    expect(CATALOG["gmi_q1_2026"]?.hiddenReason).toBe("superseded_by_gmi_q2_2026");
  });
});

// ─── 4. Q2 is the current published edition (released 2026-07-08) ──
// Per lifecycle reconciliation: GMI-Q2-2026 was released through the atomic
// transaction with hash-bound owner authority. Commercial mode: paid checkout
// at the £59 identity using the reusable GMI Stripe binding.

describe("GMI-4 — Q2 2026 is the current published checkout edition", () => {
  it("gmi_q2_2026 is the current edition in the registry", () => {
    const q2Entry = GMI_EDITION_REGISTRY.find((e) => e.productCode === "gmi_q2_2026");
    expect(q2Entry?.current).toBe(true);
  });

  it("getCurrentGmiEditionCode returns gmi_q2_2026 (admin focus)", () => {
    expect(getCurrentGmiEditionCode(GMI_EDITION_REGISTRY)).toBe("gmi_q2_2026");
  });

  it("getCurrentGmiEditionProduct returns gmi_q2_2026 product (admin focus)", () => {
    const product = getCurrentGmiEditionProduct(GMI_EDITION_REGISTRY);
    expect(product?.code).toBe("gmi_q2_2026");
  });

  it("gmi_q2_2026 is visible on pricing after release", () => {
    expect(CATALOG["gmi_q2_2026"]?.hiddenFromPricing).toBe(false);
  });

  it("gmi_q2_2026 is active via paid checkout with reusable GMI Stripe IDs", () => {
    expect(CATALOG["gmi_q2_2026"]?.active).toBe(true);
    expect(CATALOG["gmi_q2_2026"]?.commercialStatus).toBe("paid");
    expect(CATALOG["gmi_q2_2026"]?.requiresCheckout).toBe(true);
    expect(CATALOG["gmi_q2_2026"]?.stripeProductId).toBe("prod_UNnSL8r6DMedEH");
    expect(CATALOG["gmi_q2_2026"]?.stripePriceId).toBe("price_1TP1rRQFpelVFMXJWaFMOpJQ");
  });
});

// ─── 5. Q3 draft does not appear as active/current ───────────────────────────

describe("GMI-5 — Q3 2026 draft is blocked from active state", () => {
  it("gmi_q3_2026 exists in catalog (draft, hidden)", () => {
    expect(CATALOG["gmi_q3_2026"]).toBeDefined();
  });

  it("gmi_q3_2026 is hidden from pricing", () => {
    expect(CATALOG["gmi_q3_2026"]?.hiddenFromPricing).toBe(true);
  });

  it("gmi_q3_2026 is not current", () => {
    const q3Entry = GMI_EDITION_REGISTRY.find((e) => e.productCode === "gmi_q3_2026");
    expect(q3Entry?.current).toBe(false);
  });

  it("gmi_q3_2026 is not a paid_checkout product", () => {
    const q3 = CATALOG["gmi_q3_2026"];
    if (!q3) return;
    // draft → internal_only in catalog, no checkout
    expect(q3.requiresCheckout).toBeFalsy();
    expect(q3.stripeProductId).toBeNull();
    expect(q3.stripePriceId).toBeNull();
  });

  it("gmi_q3_2026 resolver does not return a paid_checkout access mode", () => {
    const link = resolveProductAccessLink("gmi_q3_2026");
    expect(link.accessMode).not.toBe("paid_checkout");
  });
});

// ─── 6. Active paid_checkout edition without stripeProductId fails ────────────

describe("GMI-6 — active paid_checkout without stripeProductId throws", () => {
  it("fails validation if active edition has no stripeProductId", () => {
    const badRegistry = [
      {
        editionId: "GMI-TEST-ACTIVE",
        productCode: "gmi_test",
        quarter: "Q4" as const,
        year: 2099,
        title: "Test GMI",
        slug: "test-2099",
        status: "active" as const,
        current: true,
        hiddenFromPricing: false,
        stripeProductId: null,   // missing — should fail
        stripePriceId: "price_test",
        amountGbp: 5900,
      },
    ];
    const errors = validateGmiEditionRegistry(badRegistry);
    expect(errors.some((e) => e.error.includes("stripeProductId"))).toBe(true);
  });
});

// ─── 7. Active paid_checkout edition without stripePriceId fails ──────────────

describe("GMI-7 — active paid_checkout without stripePriceId throws", () => {
  it("fails validation if active edition has no stripePriceId", () => {
    const badRegistry = [
      {
        editionId: "GMI-TEST-ACTIVE2",
        productCode: "gmi_test2",
        quarter: "Q4" as const,
        year: 2099,
        title: "Test GMI 2",
        slug: "test2-2099",
        status: "active" as const,
        current: true,
        hiddenFromPricing: false,
        stripeProductId: "prod_test",
        stripePriceId: null,   // missing — should fail
        amountGbp: 5900,
      },
    ];
    const errors = validateGmiEditionRegistry(badRegistry);
    expect(errors.some((e) => e.error.includes("stripePriceId"))).toBe(true);
  });
});

// ─── 8. Two current editions fail ────────────────────────────────────────────

describe("GMI-8 — two current editions fails validation", () => {
  it("fails validation if multiple editions are current", () => {
    const badRegistry = [
      {
        editionId: "GMI-A",
        productCode: "gmi_a",
        quarter: "Q1" as const,
        year: 2099,
        title: "GMI A",
        slug: "a-2099",
        status: "manual_billing" as const,
        current: true,         // first current
        hiddenFromPricing: false,
        amountGbp: 5900,
      },
      {
        editionId: "GMI-B",
        productCode: "gmi_b",
        quarter: "Q2" as const,
        year: 2099,
        title: "GMI B",
        slug: "b-2099",
        status: "manual_billing" as const,
        current: true,         // second current — should fail
        hiddenFromPricing: false,
        amountGbp: 5900,
      },
    ];
    const errors = validateGmiEditionRegistry(badRegistry);
    expect(errors.some((e) => e.error.includes("Multiple editions"))).toBe(true);
  });

  it("buildGmiEditionProducts throws for multiple current editions", () => {
    const badRegistry = [
      { editionId: "GMI-X", productCode: "gmi_x", quarter: "Q1" as const, year: 2099, title: "X", slug: "x-2099", status: "manual_billing" as const, current: true, hiddenFromPricing: false, amountGbp: 5900 },
      { editionId: "GMI-Y", productCode: "gmi_y", quarter: "Q2" as const, year: 2099, title: "Y", slug: "y-2099", status: "manual_billing" as const, current: true, hiddenFromPricing: false, amountGbp: 5900 },
    ];
    expect(() => buildGmiEditionProducts(badRegistry)).toThrow();
  });
});

// ─── 9. Draft edition with hiddenFromPricing=false fails ─────────────────────

describe("GMI-9 — draft edition shown in pricing fails", () => {
  it("fails validation if draft edition has hiddenFromPricing=false", () => {
    const badRegistry = [
      {
        editionId: "GMI-DRAFT",
        productCode: "gmi_draft",
        quarter: "Q3" as const,
        year: 2099,
        title: "Draft GMI",
        slug: "draft-2099",
        status: "draft" as const,
        current: false,
        hiddenFromPricing: false,  // should fail — draft must be hidden
        amountGbp: 5900,
      },
      {
        editionId: "GMI-CURRENT",
        productCode: "gmi_current",
        quarter: "Q2" as const,
        year: 2099,
        title: "Current GMI",
        slug: "current-2099",
        status: "manual_billing" as const,
        current: true,
        hiddenFromPricing: false,
        amountGbp: 5900,
      },
    ];
    const errors = validateGmiEditionRegistry(badRegistry);
    expect(errors.some((e) => e.error.includes("hiddenFromPricing"))).toBe(true);
  });
});

// ─── 10. Product lookup by code still works ───────────────────────────────────

describe("GMI-10 — product lookup by code", () => {
  it("getProduct(gmi_q1_2026) returns the Q1 product", () => {
    expect(CATALOG["gmi_q1_2026"]?.code).toBe("gmi_q1_2026");
  });

  it("getProduct(gmi_q2_2026) returns the Q2 product", () => {
    expect(CATALOG["gmi_q2_2026"]?.code).toBe("gmi_q2_2026");
  });

  it("getGmiEditionProductByEditionId works for GMI-Q1-2026", () => {
    const product = getGmiEditionProductByEditionId(GMI_EDITION_REGISTRY, "GMI-Q1-2026");
    expect(product?.code).toBe("gmi_q1_2026");
  });

  it("getGmiEditionProductBySlug works for q2-2026", () => {
    const product = getGmiEditionProductBySlug(GMI_EDITION_REGISTRY, "q2-2026");
    expect(product?.code).toBe("gmi_q2_2026");
  });
});

// ─── 11. Product lookup by Stripe product ID still works ─────────────────────

describe("GMI-11 — product lookup by stripeProductId", () => {
  it("getProductByStripeProductId(prod_UNnSL8r6DMedEH) returns current gmi_q2_2026", () => {
    const product = getProductByStripeProductId("prod_UNnSL8r6DMedEH");
    expect(product?.code).toBe("gmi_q2_2026");
  });
});

// ─── 12. Product lookup by Stripe price ID still works ───────────────────────

describe("GMI-12 — product lookup by stripePriceId", () => {
  it("getProductByStripePriceId(price_1TP1rRQFpelVFMXJWaFMOpJQ) returns current gmi_q2_2026", () => {
    const product = getProductByStripePriceId("price_1TP1rRQFpelVFMXJWaFMOpJQ");
    expect(product?.code).toBe("gmi_q2_2026");
  });
});

// ─── 13. Access resolver returns correct GMI route ────────────────────────────

describe("GMI-13 — access resolver returns correct routes", () => {
  it("gmi_q1_2026 resolver is dormant after supersession (archived, no current checkout)", () => {
    const link = resolveProductAccessLink("gmi_q1_2026");
    expect(link.accessMode).toBe("dormant");
  });

  it("gmi_q2_2026 resolver is paid_checkout after release", () => {
    const link = resolveProductAccessLink("gmi_q2_2026");
    expect(link.accessMode).toBe("paid_checkout");
  });

  it("gmi_q3_2026 resolver does not return paid_checkout", () => {
    const link = resolveProductAccessLink("gmi_q3_2026");
    expect(link.accessMode).not.toBe("paid_checkout");
  });

  it("resolver does not return href='#' for any GMI edition", () => {
    for (const entry of GMI_EDITION_REGISTRY) {
      const link = resolveProductAccessLink(entry.productCode);
      expect(link.href, `${entry.productCode}: resolver returned dead href`).not.toBe("#");
    }
  });
});

// ─── 14. Commercial truth audit includes all generated GMI products ────────────

describe("GMI-14 — commercial truth audit covers generated GMI products", () => {
  it("auditProductAccessLinks returns 0 FAIL errors", () => {
    const errors = auditProductAccessLinks();
    const fails = errors.filter((e) => e.severity === "FAIL");
    if (fails.length > 0) {
      const msg = fails.map((e) => `  [${e.productCode}] ${e.error}`).join("\n");
      expect.fail(`GMI-generated products caused FAIL errors:\n${msg}`);
    }
    expect(fails).toHaveLength(0);
  });

  it("all GMI editions have intelligence_reports pricing family", () => {
    for (const entry of GMI_EDITION_REGISTRY) {
      expect(
        getProductPricingFamily(entry.productCode),
        `${entry.productCode}: missing pricing family`,
      ).toBe("intelligence_reports");
    }
  });
});

// ─── 15. 48-surface audit remains zero-fail ───────────────────────────────────

describe("GMI-15 — 48-surface registry remains complete", () => {
  it("surface registry still has 48 surfaces", () => {
    expect(PRODUCT_SURFACE_REGISTRY).toHaveLength(48);
  });

  it("GMI surfaces reference gmi_q2_2026 (not legacy gmi_quarterly)", () => {
    const gmiSurfaces = PRODUCT_SURFACE_REGISTRY.filter(
      (s) => s.surfaceId.startsWith("gmi_") && s.catalogProductCode,
    );
    for (const s of gmiSurfaces) {
      expect(
        s.catalogProductCode,
        `${s.surfaceId}: uses legacy gmi_quarterly`,
      ).not.toBe("gmi_quarterly");
    }
  });

  it("all accepting-payment GMI surfaces have catalog entries", () => {
    const gmiSurfaces = PRODUCT_SURFACE_REGISTRY.filter(
      (s) => s.family === "market_intelligence" && s.acceptsPayment,
    );
    for (const s of gmiSurfaces) {
      expect(s.catalogProductCode, `${s.surfaceId}: acceptsPayment but no catalogProductCode`).toBeTruthy();
      const entry = CATALOG[s.catalogProductCode as string];
      expect(entry, `${s.surfaceId}: catalogProductCode="${s.catalogProductCode}" not in CATALOG`).toBeDefined();
    }
  });
});

// ─── Registry integrity self-check ───────────────────────────────────────────

describe("GMI registry integrity — production registry is valid", () => {
  it("GMI_EDITION_REGISTRY has no validation errors", () => {
    const errors = validateGmiEditionRegistry(GMI_EDITION_REGISTRY);
    if (errors.length > 0) {
      const msg = errors.map((e) => `  [${e.editionId}] ${e.error}`).join("\n");
      expect.fail(`GMI registry is invalid:\n${msg}`);
    }
    expect(errors).toHaveLength(0);
  });

  it("exactly one edition is current", () => {
    const currentEditions = GMI_EDITION_REGISTRY.filter((e) => e.current);
    expect(currentEditions).toHaveLength(1);
  });

  it("no draft edition is hidden from pricing = false", () => {
    const badDrafts = GMI_EDITION_REGISTRY.filter(
      (e) => e.status === "draft" && !e.hiddenFromPricing,
    );
    expect(badDrafts).toHaveLength(0);
  });

  it("no archived or retired edition is current", () => {
    const badCurrent = GMI_EDITION_REGISTRY.filter(
      (e) => e.current && (e.status === "archived" || e.status === "retired"),
    );
    expect(badCurrent).toHaveLength(0);
  });

  it("all active editions have stripeProductId and stripePriceId", () => {
    const activeEditions = GMI_EDITION_REGISTRY.filter((e) => e.status === "active");
    for (const e of activeEditions) {
      expect(e.stripeProductId, `${e.editionId}: active but missing stripeProductId`).toBeTruthy();
      expect(e.stripePriceId, `${e.editionId}: active but missing stripePriceId`).toBeTruthy();
    }
  });
});
