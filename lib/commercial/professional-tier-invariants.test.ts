/**
 * lib/commercial/professional-tier-invariants.test.ts
 *
 * Catalogue invariants for the Professional tier migration.
 * Guards that:
 *   - professional and professional_annual are active paid products
 *   - inner_circle is inactive (legacy, not reactivated)
 *   - Entitlement slugs are canonical and consistent
 *   - Success/cancel paths route to /decision-centre (not /inner-circle)
 *   - normalizeRuntimeTier integrates correctly with the catalogue
 */

import { describe, it, expect } from "vitest";
import { CATALOG, getAllProducts } from "@/lib/commercial/catalog";
import { normalizeRuntimeTier } from "@/lib/access/tier-policy";
import type { AccessTier } from "@/lib/access/tier-policy";

// ─────────────────────────────────────────────────────────────────────────────
// Professional product invariants
// ─────────────────────────────────────────────────────────────────────────────

describe("CATALOG.professional", () => {
  const p = CATALOG.professional;

  it("exists in the catalogue", () => {
    expect(p).toBeDefined();
  });

  it("is active", () => {
    expect(p?.active).toBe(true);
  });

  it("has commercialStatus 'paid'", () => {
    expect(p?.commercialStatus).toBe("paid");
  });

  it("entitlementSlug is 'tier.professional'", () => {
    expect(p?.entitlementSlug).toBe("tier.professional");
  });

  it("tier metadata is 'professional'", () => {
    expect(p?.tier).toBe("professional");
  });

  it("has a Stripe product ID", () => {
    expect(p?.stripeProductId).toBeTruthy();
  });

  it("has a Stripe price ID", () => {
    expect(p?.stripePriceId).toBeTruthy();
  });

  it("success path routes to /decision-centre (not /inner-circle)", () => {
    expect(p?.successPath).toBe("/decision-centre");
    expect(p?.successPath).not.toContain("inner-circle");
  });

  it("requires checkout", () => {
    expect(p?.requiresCheckout).toBe(true);
  });
});

describe("CATALOG.professional_annual", () => {
  const p = CATALOG.professional_annual;

  it("exists in the catalogue", () => {
    expect(p).toBeDefined();
  });

  it("is active", () => {
    expect(p?.active).toBe(true);
  });

  it("has commercialStatus 'paid'", () => {
    expect(p?.commercialStatus).toBe("paid");
  });

  it("entitlementSlug matches monthly professional ('tier.professional')", () => {
    expect(p?.entitlementSlug).toBe("tier.professional");
    expect(p?.entitlementSlug).toBe(CATALOG.professional?.entitlementSlug);
  });

  it("tier metadata is 'professional'", () => {
    expect(p?.tier).toBe("professional");
  });

  it("success path routes to /decision-centre", () => {
    expect(p?.successPath).toBe("/decision-centre");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Inner Circle legacy invariants — must NOT be reactivated
// ─────────────────────────────────────────────────────────────────────────────

describe("CATALOG.inner_circle (legacy)", () => {
  const p = CATALOG.inner_circle;

  it("exists in catalogue (preserved as record, not deleted)", () => {
    expect(p).toBeDefined();
  });

  it("is inactive — must NOT be reactivated", () => {
    expect(p?.active).toBe(false);
  });

  it("commercialStatus is 'inactive'", () => {
    expect(p?.commercialStatus).toBe("inactive");
  });

  it("does NOT require checkout (inactive products cannot be purchased)", () => {
    expect(p?.requiresCheckout).toBeFalsy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Entitlement slug consistency across professional products
// ─────────────────────────────────────────────────────────────────────────────

describe("professional entitlement slug consistency", () => {
  it("professional and professional_annual share the same entitlement slug", () => {
    expect(CATALOG.professional?.entitlementSlug).toBe(
      CATALOG.professional_annual?.entitlementSlug,
    );
  });

  it("entitlement slug does not reference inner_circle or inner-circle", () => {
    const slug = CATALOG.professional?.entitlementSlug ?? "";
    expect(slug).not.toContain("inner");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeRuntimeTier + catalogue round-trip
// ─────────────────────────────────────────────────────────────────────────────

describe("catalogue × normalizeRuntimeTier integration", () => {
  it("a DB record with inner_circle tier resolves to the professional catalogue display tier", () => {
    const dbTier: AccessTier = "inner_circle";
    const runtimeTier = normalizeRuntimeTier(dbTier);
    expect(runtimeTier).toBe("professional");
    // Confirm catalogue tier matches
    expect(CATALOG.professional?.tier).toBe(runtimeTier);
  });

  it("a DB record with professional tier resolves to the professional catalogue display tier (idempotent)", () => {
    const dbTier: AccessTier = "professional";
    const runtimeTier = normalizeRuntimeTier(dbTier);
    expect(runtimeTier).toBe("professional");
    expect(CATALOG.professional?.tier).toBe(runtimeTier);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// No active product points to /inner-circle route
// ─────────────────────────────────────────────────────────────────────────────

describe("no active product routes to legacy inner-circle", () => {
  it("no active product has successPath containing '/inner-circle'", () => {
    const bad = getAllProducts().filter(
      (p) => p.active && String(p.successPath ?? "").includes("inner-circle"),
    );
    expect(bad.map((p) => p.code)).toEqual([]);
  });

  it("no active product has cancelPath containing '/inner-circle'", () => {
    const bad = getAllProducts().filter(
      (p) => p.active && String(p.cancelPath ?? "").includes("inner-circle"),
    );
    expect(bad.map((p) => p.code)).toEqual([]);
  });
});
