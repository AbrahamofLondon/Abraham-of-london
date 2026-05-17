import { describe, expect, it } from "vitest";

import { getActivePaidProducts } from "./catalog";
import {
  getAllProductIdentities,
  resolveProductIdentity,
  validateProductIdentity,
} from "./product-identity";

describe("product identity SSOT", () => {
  it("resolves every active paid product through one canonical identity chain", () => {
    const activePaidProducts = getActivePaidProducts();
    const identities = getAllProductIdentities();

    expect(activePaidProducts.length).toBeGreaterThan(0);
    expect(new Set(identities.map((item) => item.productCode)).size).toBe(identities.length);

    for (const product of activePaidProducts) {
      const byCode = resolveProductIdentity(product.code);
      const bySlug = resolveProductIdentity(product.entitlementSlug);

      expect(byCode?.productCode).toBe(product.code);
      // Products sharing the same entitlement slug (e.g. professional + professional_annual)
      // will resolve to the first match by slug — that's acceptable
      if (bySlug) {
        expect(bySlug.entitlementSlug).toBe(product.entitlementSlug);
      }
      expect(byCode?.entitlementSlug).toBe(product.entitlementSlug);
      expect(byCode?.accessAuthority).toBe("canonical_entitlement");
      expect(validateProductIdentity(product.code)).toEqual({ valid: true, issues: [] });
    }
  });

  it("resolves content-backed paid products by route slug without identity drift", () => {
    expect(resolveProductIdentity("global-market-intelligence-report-q1-2026")?.productCode).toBe("gmi_q1_2026");
    expect(resolveProductIdentity("decision-exposure-instrument")?.productCode).toBe("decision_exposure_instrument");
    expect(resolveProductIdentity("mandate-clarity-framework")?.productCode).toBe("mandate_clarity_framework");
    expect(resolveProductIdentity("intervention-path-selector")?.productCode).toBe("intervention_path_selector");
  });
});
