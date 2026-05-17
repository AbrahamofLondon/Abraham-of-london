import { describe, expect, it } from "vitest";
import { CATALOG, getAllProducts, checkCheckoutEligibility } from "./catalog";

describe("catalog integrity", () => {
  const allProducts = getAllProducts();

  describe("commercialStatus", () => {
    it("every product has a defined commercialStatus", () => {
      const undefined_ = allProducts.filter((p) => !p.commercialStatus);
      expect(undefined_.length, `${undefined_.length} products missing commercialStatus: ${undefined_.map((p) => p.code).join(", ")}`).toBe(0);
    });

    it("active paid checkout products require Stripe IDs", () => {
      const missing = allProducts.filter(
        (p) => p.active && p.commercialStatus === "paid" && p.requiresCheckout && (!p.stripeProductId || !p.stripePriceId),
      );
      expect(missing.length, `${missing.length} active paid checkout products missing Stripe IDs: ${missing.map((p) => p.code).join(", ")}`).toBe(0);
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
  });
});
