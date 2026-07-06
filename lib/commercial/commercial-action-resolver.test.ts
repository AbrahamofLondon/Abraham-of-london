/**
 * lib/commercial/commercial-action-resolver.test.ts
 *
 * PR A — fail-closed commercial resolver proof.
 *
 * Imports the PRODUCTION resolver directly (no mirror). The non-negotiable
 * assertion: absence of a governance record can never become permission to sell.
 */

import { describe, it, expect } from "vitest";
import { resolveCommercialAction } from "./commercial-action-resolver";
import type { GovernanceState } from "./commercial-governance";
import type { CatalogProduct } from "./catalog";

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    code: "test_product",
    displayName: "Test Product",
    amount: 4900,
    displayPrice: "£49",
    stripeProductId: "prod_test",
    stripePriceId: "price_test",
    entitlementSlug: "test-product",
    tier: "test",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/test",
    cancelPath: "/test",
    cookieName: null,
    includes: [],
    ...overrides,
  } as CatalogProduct;
}

function gov(overrides: Partial<GovernanceState>): GovernanceState {
  return {
    productCode: "test_product",
    known: true,
    readinessStatus: "release_ready_now",
    releaseReadyNow: true,
    checkoutSafe: true,
    commercialSafe: true,
    releaseLane: "evidence_limited_commercial_product",
    releaseMode: null,
    checkoutAllowed: true,
    manualFulfilmentAllowed: null,
    commercialClaimAllowed: true,
    authorityState: null,
    effectiveAuthorityState: null,
    ...overrides,
  };
}

const GOV_UNKNOWN: GovernanceState = {
  productCode: "test_product", known: false,
  readinessStatus: null, releaseReadyNow: false, checkoutSafe: null, commercialSafe: null,
  releaseLane: null, releaseMode: null, checkoutAllowed: null, manualFulfilmentAllowed: null,
  commercialClaimAllowed: null, authorityState: null, effectiveAuthorityState: null,
};

describe("commercial resolver — fail-closed proof (production module)", () => {
  it("1. paid + Stripe complete + governance UNKNOWN → blocked (fail-closed)", () => {
    const a = resolveCommercialAction(product({}), GOV_UNKNOWN);
    expect(a.state).toBe("blocked");
    expect(a.purchasable).toBe(false);
    expect(a.reason).toBe("governance_unknown_fail_closed");
  });

  it("2. paid + Stripe complete + governance BLOCKED → blocked", () => {
    const a = resolveCommercialAction(
      product({}),
      gov({ readinessStatus: "blocked", releaseMode: "blocked", releaseLane: "blocked_claim_unsafe_product", checkoutSafe: false, commercialSafe: false, checkoutAllowed: false }),
    );
    expect(a.state).toBe("blocked");
    expect(a.purchasable).toBe(false);
  });

  it("3. paid + Stripe complete + governance review-required (commercialSafe=false) → review_gated", () => {
    const a = resolveCommercialAction(product({}), gov({ commercialSafe: false, releaseMode: null }));
    expect(a.state).toBe("review_gated");
    expect(a.purchasable).toBe(false);
  });

  it("4. paid + Stripe INCOMPLETE + governance cleared → unavailable (missing_stripe_metadata)", () => {
    const a = resolveCommercialAction(product({ stripePriceId: null }), gov({}));
    expect(a.state).toBe("unavailable");
    expect(a.reason).toBe("missing_stripe_metadata");
    expect(a.purchasable).toBe(false);
  });

  it("5. paid + Stripe complete + governance CLEARED → checkout", () => {
    const a = resolveCommercialAction(product({}), gov({}));
    expect(a.state).toBe("checkout");
    expect(a.purchasable).toBe(true);
  });

  it("6. free_controlled + governance cleared → view_free_surface", () => {
    const a = resolveCommercialAction(
      product({ commercialStatus: "free_controlled", requiresCheckout: false, amount: 0, accessType: "free", stripeProductId: null, stripePriceId: null }),
      gov({ releaseMode: "manual_fulfilment_only" }),
    );
    expect(a.state).toBe("view_free_surface");
    expect(a.purchasable).toBe(false);
  });

  it("7. contracted → contact_sales", () => {
    const a = resolveCommercialAction(product({ commercialStatus: "contracted", requiresCheckout: false }), gov({ commercialSafe: true, checkoutSafe: true }));
    expect(a.state).toBe("contact_sales");
    expect(a.purchasable).toBe(false);
  });

  it("8. manual_billing → manual_fulfilment", () => {
    const a = resolveCommercialAction(
      product({ commercialStatus: "manual_billing", requiresCheckout: false, stripeProductId: null, stripePriceId: null }),
      GOV_UNKNOWN,
    );
    expect(a.state).toBe("manual_fulfilment");
    expect(a.purchasable).toBe(false);
  });

  it("9. inactive → archive_reference_only", () => {
    const a = resolveCommercialAction(product({ active: false, commercialStatus: "inactive" }), gov({}));
    expect(a.state).toBe("archive_reference_only");
    expect(a.purchasable).toBe(false);
  });

  it("NON-NEGOTIABLE: no unknown-governance paid product is ever purchasable", () => {
    for (const stripeComplete of [true, false]) {
      const a = resolveCommercialAction(
        product(stripeComplete ? {} : { stripePriceId: null }),
        GOV_UNKNOWN,
      );
      expect(a.purchasable).toBe(false);
      expect(a.state).not.toBe("checkout");
    }
  });
});
