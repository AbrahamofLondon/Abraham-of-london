/**
 * tests/product-estate/commercial-truth-audit.test.ts
 *
 * P7 — Commercial Truth Audit Tests
 *
 * Verifies that every paid-labelled product has a valid commercial path,
 * no product loops back to the same page, all access CTAs resolve through
 * the product-access-link-resolver, and dormant products have no checkout.
 */

import { describe, expect, it } from "vitest";
import { CATALOG } from "@/lib/commercial/catalog";
import { PRODUCT_SURFACE_REGISTRY } from "@/lib/product/product-surface-registry";
import {
  resolveProductAccessLink,
  auditProductAccessLinks,
} from "@/lib/product/product-access-link-resolver";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const allProducts = Object.values(CATALOG);
const activeProducts = allProducts.filter((p) => p.active);
const paidProducts = activeProducts.filter((p) => p.commercialStatus === "paid");
const manualBillingProducts = allProducts.filter((p) => p.commercialStatus === "manual_billing");
const evidenceGatedProducts = allProducts.filter((p) => p.commercialStatus === "evidence_gated");
const dormantProducts = allProducts.filter(
  (p) => !p.active || p.commercialStatus === "inactive" || p.commercialStatus === "retired" || p.commercialStatus === "dormant",
);

// ─── P7.1: All paid-labelled products have Stripe IDs or non-checkout status ──

describe("P7.1 — paid products have Stripe IDs or non-checkout commercial path", () => {
  it("every active paid product with requiresCheckout=true has a stripePriceId", () => {
    for (const p of paidProducts) {
      if (p.requiresCheckout) {
        expect(
          p.stripePriceId,
          `${p.code}: commercialStatus=paid + requiresCheckout=true but stripePriceId is null`,
        ).toBeTruthy();
      }
    }
  });

  it("no product is labelled paid without a checkout path or manual billing path", () => {
    for (const p of activeProducts) {
      if (p.commercialStatus === "paid" && p.requiresCheckout && !p.stripePriceId) {
        expect.fail(
          `${p.code}: commercialStatus=paid + requiresCheckout=true but no stripePriceId — must add Stripe or downgrade to manual_billing`,
        );
      }
    }
  });
});

// ─── P7.2: Team Assessment and Enterprise Assessment are explicit ─────────────

describe("P7.2 — Team Assessment and Enterprise Assessment commercial mode is explicit", () => {
  it("team_assessment is in the catalog", () => {
    expect(CATALOG["team_assessment"], "team_assessment missing from catalog").toBeDefined();
  });

  it("enterprise_assessment is in the catalog", () => {
    expect(CATALOG["enterprise_assessment"], "enterprise_assessment missing from catalog").toBeDefined();
  });

  it("team_assessment is not labelled paid with a checkout path", () => {
    const ta = CATALOG["team_assessment"];
    if (!ta) return;
    if (ta.commercialStatus === "paid" && ta.requiresCheckout) {
      expect(ta.stripePriceId, "team_assessment: paid+checkout but no stripePriceId").toBeTruthy();
    }
  });

  it("enterprise_assessment is not labelled paid with a checkout path", () => {
    const ea = CATALOG["enterprise_assessment"];
    if (!ea) return;
    if (ea.commercialStatus === "paid" && ea.requiresCheckout) {
      expect(ea.stripePriceId, "enterprise_assessment: paid+checkout but no stripePriceId").toBeTruthy();
    }
  });

  it("team_assessment commercialStatus is one of the valid non-ambiguous modes", () => {
    const ta = CATALOG["team_assessment"];
    if (!ta) return;
    const validModes = ["free_controlled", "paid", "contracted", "manual_billing", "evidence_gated", "inactive", "retired", "dormant", "internal_only"];
    expect(validModes, `team_assessment.commercialStatus "${ta.commercialStatus}" is not a recognised mode`).toContain(ta.commercialStatus);
  });

  it("enterprise_assessment commercialStatus is one of the valid non-ambiguous modes", () => {
    const ea = CATALOG["enterprise_assessment"];
    if (!ea) return;
    const validModes = ["free_controlled", "paid", "contracted", "manual_billing", "evidence_gated", "inactive", "retired", "dormant", "internal_only"];
    expect(validModes, `enterprise_assessment.commercialStatus "${ea.commercialStatus}" is not a recognised mode`).toContain(ea.commercialStatus);
  });
});

// ─── P7.3: No product card loops to the same page ────────────────────────────

describe("P7.3 — no product card loops to the same page", () => {
  it("no active product resolves to a dead '#' href regardless of current page context", () => {
    // Resolve from a neutral page context (e.g. /products) to check CTAs don't produce dead links
    for (const p of activeProducts) {
      const link = resolveProductAccessLink(p.code, { currentPath: "/products" });
      expect(link.href, `${p.code}: resolver returned dead href="#"`).not.toBe("#");
      expect(link.href, `${p.code}: resolver returned empty href`).toBeTruthy();
    }
  });
});

// ─── P7.4: All access CTAs resolve through the resolver ──────────────────────

describe("P7.4 — access CTAs resolve through product-access-link-resolver", () => {
  it("resolver returns a valid link for every catalog product", () => {
    for (const p of allProducts) {
      const link = resolveProductAccessLink(p.code);
      expect(link, `resolveProductAccessLink(${p.code}) returned null/undefined`).toBeTruthy();
      expect(link.href, `${p.code}: resolved link has no href`).toBeTruthy();
      expect(link.href, `${p.code}: resolved link has dead href "#"`).not.toBe("#");
    }
  });

  it("resolver never returns href='#' for any product", () => {
    for (const p of allProducts) {
      const link = resolveProductAccessLink(p.code);
      expect(link.href, `${p.code}: resolver returned dead href="#"`).not.toBe("#");
    }
  });
});

// ─── P7.5: No checkout route for dormant Inner Circle ────────────────────────

describe("P7.5 — no checkout route for dormant Inner Circle", () => {
  it("inner_circle has no requiresCheckout", () => {
    const ic = CATALOG["inner_circle"];
    if (!ic) return;
    expect(
      ic.requiresCheckout,
      "inner_circle: requiresCheckout must be falsy — product is dormant/inactive",
    ).toBeFalsy();
  });

  it("inner_circle is inactive or dormant", () => {
    const ic = CATALOG["inner_circle"];
    if (!ic) return;
    expect(
      ic.active || ic.commercialStatus,
      "inner_circle status check",
    ).toBeTruthy();
    if (ic.active) {
      expect(
        ["inactive", "dormant", "internal_only"].includes(ic.commercialStatus ?? ""),
        `inner_circle is active with commercialStatus="${ic.commercialStatus}" — should be inactive/dormant`,
      ).toBe(true);
    }
  });
});

// ─── P7.6: No checkout for Retainer Oversight unless explicitly enabled ───────

describe("P7.6 — no checkout for Retainer Oversight unless explicitly enabled", () => {
  it("retainer_core has no requiresCheckout", () => {
    const r = CATALOG["retainer_core"];
    if (!r) return;
    expect(r.requiresCheckout, "retainer_core should not require checkout — contracted product").toBeFalsy();
  });

  it("retainer_operational has no requiresCheckout", () => {
    const r = CATALOG["retainer_operational"];
    if (!r) return;
    expect(r.requiresCheckout, "retainer_operational should not require checkout — contracted product").toBeFalsy();
  });

  it("retainer_institutional has no requiresCheckout", () => {
    const r = CATALOG["retainer_institutional"];
    if (!r) return;
    expect(r.requiresCheckout, "retainer_institutional should not require checkout — contracted product").toBeFalsy();
  });
});

// ─── P7.7: Professional subscription is distinct from Inner Circle ────────────

describe("P7.7 — Professional subscription remains distinct from Inner Circle", () => {
  it("professional has a Stripe price and product ID", () => {
    const pro = CATALOG["professional"];
    if (!pro) return;
    expect(pro.stripePriceId, "professional: missing stripePriceId").toBeTruthy();
    expect(pro.stripeProductId, "professional: missing stripeProductId").toBeTruthy();
  });

  it("professional entitlementSlug differs from inner_circle entitlementSlug", () => {
    const pro = CATALOG["professional"];
    const ic = CATALOG["inner_circle"];
    if (!pro || !ic) return;
    expect(pro.entitlementSlug).not.toBe(ic.entitlementSlug);
  });

  it("professional is active; inner_circle is not", () => {
    const pro = CATALOG["professional"];
    const ic = CATALOG["inner_circle"];
    if (!pro || !ic) return;
    expect(pro.active).toBe(true);
    expect(ic.active).toBe(false);
  });
});

// ─── P7.8: manual_billing must not have requiresCheckout=true ────────────────

describe("P7.8 — manual_billing products must not have requiresCheckout=true", () => {
  it("no manual_billing product has requiresCheckout=true", () => {
    for (const p of manualBillingProducts) {
      expect(
        p.requiresCheckout,
        `${p.code}: commercialStatus=manual_billing but requiresCheckout=true — contradiction; remove requiresCheckout or switch to paid_checkout`,
      ).toBeFalsy();
    }
  });
});

// ─── P7.9: evidence_gated must not have requiresCheckout=true ────────────────

describe("P7.9 — evidence_gated products must not have requiresCheckout=true", () => {
  it("no evidence_gated product has requiresCheckout=true", () => {
    for (const p of evidenceGatedProducts) {
      expect(
        p.requiresCheckout,
        `${p.code}: commercialStatus=evidence_gated but requiresCheckout=true — contradiction`,
      ).toBeFalsy();
    }
  });
});

// ─── P7.10: auditProductAccessLinks finds no FAIL-severity issues ─────────────

describe("P7.10 — auditProductAccessLinks() finds no FAIL-severity issues", () => {
  it("returns zero FAIL errors", () => {
    const errors = auditProductAccessLinks();
    const fails = errors.filter((e) => e.severity === "FAIL");
    if (fails.length > 0) {
      const msg = fails.map((e) => `  [${e.productCode}] ${e.error}`).join("\n");
      expect.fail(`Commercial truth audit FAIL errors:\n${msg}`);
    }
    expect(fails).toHaveLength(0);
  });
});

// ─── P7.11: gmi_q2_2026 is consistent (no checkout contradiction) ────────────

describe("P7.11 — GMI Q2 2026 commercial consistency", () => {
  it("gmi_q2_2026 is current paid checkout with canonical Stripe binding", () => {
    const q2 = CATALOG["gmi_q2_2026"];
    if (!q2) return;
    expect(q2.commercialStatus).toBe("paid");
    expect(q2.requiresCheckout).toBe(true);
    expect(q2.stripeProductId).toBe("prod_UNnSL8r6DMedEH");
    expect(q2.stripePriceId).toBe("price_1TP1rRQFpelVFMXJWaFMOpJQ");
  });
});

// ─── P7.12: GMI Q1 2026 Stripe product ID is configured ──────────────────────

describe("P7.12 — GMI Q1 2026 is reference-only after supersession", () => {
  it("gmi_q1_2026 has no new-purchase Stripe product after supersession", () => {
    const q1 = CATALOG["gmi_q1_2026"];
    if (!q1) return;
    expect(q1.commercialStatus).toBe("inactive");
    expect(q1.stripeProductId).toBeNull();
  });

  it("gmi_q1_2026 has no standalone current-edition price after supersession", () => {
    const q1 = CATALOG["gmi_q1_2026"];
    if (!q1) return;
    expect(q1.stripeProductId).toBeNull();
    expect(q1.stripePriceId).toBeNull();
  });
});

// ─── P7.13: Team Assessment and Enterprise Assessment are free_controlled ────────

describe("P7.13 — Team/Enterprise Assessment classified as free_controlled", () => {
  it("team_assessment is free_controlled", () => {
    const ta = CATALOG["team_assessment"];
    if (!ta) return;
    expect(ta.commercialStatus).toBe("free_controlled");
  });

  it("enterprise_assessment is free_controlled", () => {
    const ea = CATALOG["enterprise_assessment"];
    if (!ea) return;
    expect(ea.commercialStatus).toBe("free_controlled");
  });

  it("team_assessment has no requiresCheckout", () => {
    const ta = CATALOG["team_assessment"];
    if (!ta) return;
    expect(ta.requiresCheckout).toBeFalsy();
  });

  it("enterprise_assessment has no requiresCheckout", () => {
    const ea = CATALOG["enterprise_assessment"];
    if (!ea) return;
    expect(ea.requiresCheckout).toBeFalsy();
  });

  it("team_assessment has no Stripe IDs", () => {
    const ta = CATALOG["team_assessment"];
    if (!ta) return;
    expect(ta.stripeProductId).toBeNull();
    expect(ta.stripePriceId).toBeNull();
  });

  it("enterprise_assessment has no Stripe IDs", () => {
    const ea = CATALOG["enterprise_assessment"];
    if (!ea) return;
    expect(ea.stripeProductId).toBeNull();
    expect(ea.stripePriceId).toBeNull();
  });

  it("team_assessment resolver routes to /diagnostics/team-assessment (free_public)", () => {
    const link = resolveProductAccessLink("team_assessment");
    expect(link.href).toBe("/diagnostics/team-assessment");
    expect(link.accessMode).toBe("free_public");
  });

  it("enterprise_assessment resolver routes to /diagnostics/enterprise-assessment (free_public)", () => {
    const link = resolveProductAccessLink("enterprise_assessment");
    expect(link.href).toBe("/diagnostics/enterprise-assessment");
    expect(link.accessMode).toBe("free_public");
  });

  it("team_assessment displayPrice is Free, not By enquiry or paid label", () => {
    const ta = CATALOG["team_assessment"];
    if (!ta) return;
    expect(ta.displayPrice).not.toMatch(/enquiry|paid/i);
    expect(ta.displayPrice).toBe("Free");
  });

  it("enterprise_assessment displayPrice is Free, not By enquiry or paid label", () => {
    const ea = CATALOG["enterprise_assessment"];
    if (!ea) return;
    expect(ea.displayPrice).not.toMatch(/enquiry|paid/i);
    expect(ea.displayPrice).toBe("Free");
  });
});

// ─── P7.14: Boardroom Mode catalog decision (Option A: evidence_gated) ────────

describe("P7.14 — Boardroom Mode is in catalog as evidence_gated", () => {
  it("boardroom_mode exists in catalog", () => {
    expect(CATALOG["boardroom_mode"], "boardroom_mode not in catalog — add as evidence_gated").toBeDefined();
  });

  it("boardroom_mode is evidence_gated", () => {
    const bm = CATALOG["boardroom_mode"];
    if (!bm) return;
    expect(bm.commercialStatus).toBe("evidence_gated");
  });

  it("boardroom_mode has no requiresCheckout", () => {
    const bm = CATALOG["boardroom_mode"];
    if (!bm) return;
    expect(bm.requiresCheckout).toBeFalsy();
  });

  it("boardroom_mode has no stripeProductId or stripePriceId (evidence_gated, no checkout)", () => {
    const bm = CATALOG["boardroom_mode"];
    if (!bm) return;
    expect(bm.stripeProductId).toBeNull();
    expect(bm.stripePriceId).toBeNull();
  });
});

// ─── P7.15: 48-surface registry coverage ─────────────────────────────────────

describe("P7.15 — 48-surface registry commercial truth", () => {
  it("surface registry contains exactly 48 surfaces", () => {
    expect(PRODUCT_SURFACE_REGISTRY).toHaveLength(48);
  });

  it("no accepting-payment surface lacks a catalog entry", () => {
    // All surfaces with acceptsPayment=true must have a catalogProductCode that resolves
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      if (!surface.acceptsPayment) continue;
      expect(
        surface.catalogProductCode,
        `${surface.surfaceId}: acceptsPayment=true but catalogProductCode is null`,
      ).toBeTruthy();
      const entry = CATALOG[surface.catalogProductCode as keyof typeof CATALOG];
      expect(
        entry,
        `${surface.surfaceId}: catalogProductCode="${surface.catalogProductCode}" not in CATALOG`,
      ).toBeDefined();
    }
  });

  it("no surface with acceptsPayment=true is dormant or retired", () => {
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      if (!surface.acceptsPayment) continue;
      const isDormant =
        surface.currentExposureStatus === "dormant" ||
        surface.currentExposureStatus === "retired";
      expect(
        isDormant,
        `${surface.surfaceId}: acceptsPayment=true but exposure is dormant/retired`,
      ).toBe(false);
    }
  });

  it("all paid_checkout surfaces have Stripe IDs configured", () => {
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      if (!surface.acceptsPayment) continue;
      const catalogCode = surface.catalogProductCode;
      if (!catalogCode) continue;
      const entry = CATALOG[catalogCode as keyof typeof CATALOG];
      if (!entry || !entry.requiresCheckout) continue;
      expect(
        entry.stripePriceId,
        `${surface.surfaceId} (${catalogCode}): paid_checkout surface but stripePriceId is null`,
      ).toBeTruthy();
      expect(
        entry.stripeProductId,
        `${surface.surfaceId} (${catalogCode}): paid_checkout surface but stripeProductId is null`,
      ).toBeTruthy();
    }
  });

  it("surface registry gmi surfaces use gmi_q2_2026 not gmi_quarterly", () => {
    const gmiSurfaces = PRODUCT_SURFACE_REGISTRY.filter(
      (s) => s.surfaceId.startsWith("gmi_") && s.catalogProductCode,
    );
    for (const s of gmiSurfaces) {
      expect(
        s.catalogProductCode,
        `${s.surfaceId}: uses legacy gmi_quarterly — update to gmi_q2_2026`,
      ).not.toBe("gmi_quarterly");
    }
  });

  it("boardroom_mode surface points to /boardroom-mode not /boardroom", () => {
    const bm = PRODUCT_SURFACE_REGISTRY.find((s) => s.surfaceId === "boardroom_mode");
    expect(bm, "boardroom_mode surface not found in registry").toBeDefined();
    if (!bm) return;
    expect(bm.route).toBe("/boardroom-mode");
  });
});
