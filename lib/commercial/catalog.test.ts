import { describe, expect, it } from "vitest";
import { CATALOG, getAllProducts, checkCheckoutEligibility, PRICING_FAMILIES } from "./catalog";
import { FEATURES } from "@/lib/product/feature-entitlements";

describe("catalog integrity", () => {
  const allProducts = getAllProducts();

  describe("commercialStatus", () => {
    it("every product has a defined commercialStatus", () => {
      const undefined_ = allProducts.filter((p) => !p.commercialStatus);
      expect(undefined_.length, `${undefined_.length} products missing commercialStatus: ${undefined_.map((p) => p.code).join(", ")}`).toBe(0);
    });

    it("active paid checkout products require a Stripe price ID or inline catalog price", () => {
      const missing = allProducts.filter(
        (p) => p.active && p.commercialStatus === "paid" && p.requiresCheckout && !p.stripePriceId && p.amount <= 0,
      );
      expect(missing.length, `${missing.length} active paid checkout products missing Stripe price IDs or inline prices: ${missing.map((p) => p.code).join(", ")}`).toBe(0);
    });

    it("requiresCheckout=true is only used for paid products", () => {
      const bad = allProducts.filter(
        (p) => p.requiresCheckout === true && p.commercialStatus !== "paid",
      );
      expect(bad.length, `${bad.length} checkout products are not paid: ${bad.map((p) => p.code).join(", ")}`).toBe(0);
    });

    it("inactive products cannot require checkout", () => {
      const bad = allProducts.filter(
        (p) => (p.commercialStatus === "inactive" || p.commercialStatus === "retired") && p.requiresCheckout,
      );
      expect(bad.length, `${bad.length} inactive/retired products have requiresCheckout: ${bad.map((p) => p.code).join(", ")}`).toBe(0);
    });

    it("contracted products cannot require checkout", () => {
      const bad = allProducts.filter(
        (p) => p.commercialStatus === "contracted" && p.requiresCheckout,
      );
      expect(bad.length, `${bad.length} contracted products have requiresCheckout: ${bad.map((p) => p.code).join(", ")}`).toBe(0);
    });

    it("manual_billing products cannot require checkout", () => {
      const bad = allProducts.filter(
        (p) => p.commercialStatus === "manual_billing" && p.requiresCheckout,
      );
      expect(bad.length, `${bad.length} manual_billing products have requiresCheckout: ${bad.map((p) => p.code).join(", ")}`).toBe(0);
    });

    it("contracted products require requiresContract=true", () => {
      const bad = allProducts.filter(
        (p) => p.commercialStatus === "contracted" && !p.requiresContract,
      );
      expect(bad.length, `${bad.length} contracted products missing requiresContract: ${bad.map((p) => p.code).join(", ")}`).toBe(0);
    });

    it("inactive products are not publicly priced as checkout products", () => {
      const inactiveCheckout = allProducts.filter(
        (p) => !p.active && p.requiresCheckout,
      );
      expect(inactiveCheckout.length, `${inactiveCheckout.length} inactive products require checkout: ${inactiveCheckout.map((p) => p.code).join(", ")}`).toBe(0);
    });

    it("keeps Professional monthly and annual commercially coherent", () => {
      const professionalProducts = [CATALOG.professional!, CATALOG.professional_annual!];
      for (const product of professionalProducts) {
        expect(product.active).toBe(true);
        expect(product.commercialStatus).toBe("paid");
        expect(product.requiresCheckout).toBe(true);
        expect(product.requiresContract).toBe(false);
        expect(product.stripePriceId).toBeTruthy();
      }
    });

    it("keeps Enterprise contracted rather than self-serve", () => {
      expect(CATALOG.enterprise!.commercialStatus).toBe("contracted");
      expect(CATALOG.enterprise!.requiresContract).toBe(true);
      expect(CATALOG.enterprise!.requiresCheckout).toBe(false);
      expect(CATALOG.enterprise!.successPath).toBe("/contact");
    });

    it("keeps Additional Collaborator on assisted billing until seat billing is automated", () => {
      expect(CATALOG.additional_collaborator!.commercialStatus).toBe("manual_billing");
      expect(CATALOG.additional_collaborator!.requiresCheckout).toBe(false);
      // D006 approved: stripePriceId bound to live Price; product remains manual_billing
      expect(CATALOG.additional_collaborator!.stripePriceId).toBe("price_1TXt28QFpelVFMXJCqiXwnxp");
    });

    it("reconciles GMI editions to lifecycle authority: Q2 current published, Q1 archived", () => {
      // Q1 2026 was superseded by GMI-Q2-2026 on 2026-07-08 through the atomic
      // release transaction: archived, inactive, hidden from pricing, retained
      // for historical access.
      expect(CATALOG.gmi_q1_2026!.active).toBe(false);
      expect(CATALOG.gmi_q1_2026!.commercialStatus).toBe("inactive");
      expect(CATALOG.gmi_q1_2026!.hiddenFromPricing).toBe(true);
      expect(CATALOG.gmi_q1_2026!.hiddenReason).toBe("superseded_by_gmi_q2_2026");
      expect(CATALOG.gmi_q1_2026!.pricingNote).toContain("Superseded by GMI-Q2-2026");

      // Q2 2026 is the current published edition — released 2026-07-08 with
      // evidence lock and hash-bound owner authority. Self-serve checkout at the
      // £59 identity using the existing GMI Stripe product/price binding.
      expect(CATALOG.gmi_q2_2026!.hiddenFromPricing).toBe(false);
      expect(CATALOG.gmi_q2_2026!.commercialStatus).toBe("paid");
      expect(CATALOG.gmi_q2_2026!.active).toBe(true);
      expect(CATALOG.gmi_q2_2026!.requiresCheckout).toBe(true);
      expect(CATALOG.gmi_q2_2026!.stripeProductId).toBe("prod_UNnSL8r6DMedEH");
      expect(CATALOG.gmi_q2_2026!.stripePriceId).toBe("price_1TP1rRQFpelVFMXJWaFMOpJQ");
      expect(CATALOG.gmi_q2_2026!.pricingNote).toContain("Current published edition");
    });

    it("resolves gmi_quarterly to the dedicated GMI family page, not an issue artifact", () => {
      // gmi_quarterly is the canonical product family. It resolves to the
      // dedicated GMI page — never to a single issue artifact, and is never
      // silently aliased to gmi_q2_2026.
      expect(CATALOG.gmi_quarterly!.active).toBe(true);
      expect(CATALOG.gmi_quarterly!.successPath).toBe("/intelligence/gmi");
      // Issue artifacts resolve independently and are NOT the family route.
      expect(CATALOG.gmi_q2_2026!.successPath).not.toBe("/intelligence/gmi");
      expect(CATALOG.gmi_q1_2026!.successPath).not.toBe("/intelligence/gmi");
    });

    it("keeps Boardroom Brief as the active first paid proof-of-value product", () => {
      expect(CATALOG.boardroom_brief!.active).toBe(true);
      expect(CATALOG.boardroom_brief!.commercialStatus).toBe("paid");
      expect(CATALOG.boardroom_brief!.requiresCheckout).toBe(true);
      expect(CATALOG.boardroom_brief!.amount).toBeGreaterThanOrEqual(4900);
      expect(CATALOG.boardroom_brief!.amount).toBeLessThanOrEqual(14900);
      expect(CATALOG.boardroom_brief!.successPath).toBe("/boardroom-brief");
      expect(checkCheckoutEligibility("boardroom_brief").eligible).toBe(true);
    });

    it("keeps Return Brief and advanced benchmark access aligned with Professional gating", () => {
      expect(FEATURES.return_brief.accessLevel).toBe("paid");
      expect(FEATURES.return_brief.requiredEntitlementSlugs).toContain(CATALOG.professional!.entitlementSlug);
      expect(FEATURES.benchmark_context_basic.accessLevel).toBe("free");
      expect(FEATURES.benchmark_context_advanced.accessLevel).toBe("paid");
      expect(FEATURES.benchmark_context_advanced.requiredEntitlementSlugs).toContain(CATALOG.professional!.entitlementSlug);
    });

    it("keeps Executive Reporting public product canonical", () => {
      expect(CATALOG.executive_reporting!.active).toBe(true);
      expect(CATALOG.executive_reporting_priority!.active).toBe(false);
      expect(CATALOG.executive_reporting_priority!.commercialStatus).toBe("inactive");
    });

    it("keeps Strategy Room public products limited to the approved pair", () => {
      const visibleStrategyRoomProducts = allProducts
        .filter((p) => p.active && (p.category === "execution" || p.category === "execution_premium"))
        .map((p) => p.code)
        .sort();
      expect(visibleStrategyRoomProducts).toEqual(["strategy_room", "strategy_room_extended"]);
    });

    it("no active visible product is missing a pricingFamily assignment", () => {
      const missing = allProducts.filter(
        (p) => p.active && !p.hiddenFromPricing && !PRICING_FAMILIES[p.code],
      );
      expect(
        missing.length,
        `${missing.length} active visible products missing pricingFamily: ${missing.map((p) => p.code).join(", ")}`,
      ).toBe(0);
    });

    it("every hiddenFromPricing product has a hiddenReason", () => {
      const missing = allProducts.filter((p) => p.hiddenFromPricing && !p.hiddenReason);
      expect(
        missing.length,
        `${missing.length} hiddenFromPricing products missing hiddenReason: ${missing.map((p) => p.code).join(", ")}`,
      ).toBe(0);
    });
  });

  describe("checkCheckoutEligibility", () => {
    it("returns ineligible for inactive products", () => {
      const inactive = allProducts.find((p) => p.commercialStatus === "inactive");
      if (inactive) {
        const result = checkCheckoutEligibility(inactive.code);
        expect(result.eligible).toBe(false);
      }
    });

    it("returns eligible for active paid products with Stripe IDs", () => {
      const paid = allProducts.find(
        (p) => p.active && p.commercialStatus === "paid" && p.requiresCheckout && p.stripePriceId,
      );
      if (paid) {
        const result = checkCheckoutEligibility(paid.code);
        expect(result.eligible).toBe(true);
      }
    });

    it("returns precise ineligibility reasons for non-checkout commercial states", () => {
      // Q1 archived after supersession → inactive; Q2 released as manual billing.
      expect(checkCheckoutEligibility("gmi_q1_2026")).toEqual({ eligible: false, reason: "PRODUCT_INACTIVE" });
      expect(checkCheckoutEligibility("gmi_q2_2026").eligible).toBe(true);
      expect(checkCheckoutEligibility("enterprise")).toEqual({ eligible: false, reason: "PRODUCT_CONTRACTED" });
      expect(checkCheckoutEligibility("additional_collaborator")).toEqual({ eligible: false, reason: "MANUAL_BILLING_REQUIRED" });
      expect(checkCheckoutEligibility("fast_diagnostic")).toEqual({ eligible: false, reason: "CHECKOUT_NOT_AVAILABLE" });
    });
  });
});
