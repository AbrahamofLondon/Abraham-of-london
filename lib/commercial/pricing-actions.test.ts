import { describe, expect, it } from "vitest";
import { CATALOG } from "./catalog";
import { resolvePricingAction } from "./pricing-actions";

describe("pricing actions", () => {
  it("renders governance-cleared self-serve products as checkout actions", () => {
    // professional_annual is not in the governance matrix → catalog-driven checkout.
    expect(resolvePricingAction(CATALOG.professional_annual!)).toMatchObject({
      type: "checkout",
      href: "/pricing",
    });
  });

  it("blocks internal_only products from public checkout AND public request-access", () => {
    // professional is releaseMode=internal_only. Internal-only products must not
    // auto-become public "request access" surfaces (no public-intake rule), and
    // must never resolve to checkout — regardless of Stripe metadata.
    const action = resolvePricingAction(CATALOG.professional!);
    expect(action.purchasable).toBe(false);
    expect(action.type).toBe("blocked");
  });

  it("never resolves governance-blocked products to checkout", () => {
    for (const code of ["boardroom_brief", "executive_reporting"]) {
      const action = resolvePricingAction(CATALOG[code]!);
      expect(action.purchasable).toBe(false);
      expect(action.type).not.toBe("checkout");
    }
  });

  it("routes contracted products to enterprise enquiry", () => {
    expect(resolvePricingAction(CATALOG.enterprise!)).toMatchObject({
      type: "contact_sales",
      label: "Request Enterprise access",
      href: "/contact",
    });
  });

  it("renders manual billing products as request-access actions", () => {
    expect(resolvePricingAction(CATALOG.additional_collaborator!)).toMatchObject({
      type: "request_access",
      href: "/contact",
    });
  });

  it("renders checkout-cleared paid products (e.g. playbooks) as checkout", () => {
    // execution_integrity_protocol is a paid, checkout-safe playbook
    // (requiresCheckout=true, valid Stripe price) and is not governance-gated.
    expect(resolvePricingAction(CATALOG.execution_integrity_protocol!)).toMatchObject({
      type: "checkout",
      purchasable: true,
    });
  });

  it("renders free products with non-checkout actions and GMI Q1 as active checkout", () => {
    expect(resolvePricingAction(CATALOG.fast_diagnostic!)).toMatchObject({
      type: "view_free_surface",
      href: "/diagnostics/fast",
    });
    expect(resolvePricingAction(CATALOG.gmi_q1_2026!)).toMatchObject({
      type: "checkout",
      href: "/artifacts/global-market-intelligence-report-q1-2026",
    });
  });
});
