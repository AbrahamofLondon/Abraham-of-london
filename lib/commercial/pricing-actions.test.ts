import { describe, expect, it } from "vitest";
import { CATALOG } from "./catalog";
import { resolvePricingAction } from "./pricing-actions";

describe("pricing actions", () => {
  it("FAIL-CLOSED: ungoverned paid products never resolve to checkout, even with complete Stripe metadata", () => {
    // These are paid, self-serve, Stripe-complete products with NO governance
    // record (absent from the readiness/governance matrices). Absence of
    // governance is not permission to sell — they must fail closed to blocked
    // until individually classified. (PR A.)
    for (const code of ["professional_annual", "execution_integrity_protocol"]) {
      const action = resolvePricingAction(CATALOG[code]!);
      expect(action.purchasable, `${code} must not be purchasable while ungoverned`).toBe(false);
      expect(action.type).not.toBe("checkout");
      expect(action.reason).toBe("governance_unknown_fail_closed");
    }
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
    expect(resolvePricingAction(CATALOG.gmi_q2_2026!)).toMatchObject({
      type: "request_access",
      href: "/contact",
    });
  });

  it("renders superseded GMI Q1 as archive reference only", () => {
    expect(resolvePricingAction(CATALOG.gmi_q1_2026!)).toMatchObject({
      type: "archive_reference_only",
      purchasable: false,
      reason: "inactive_or_retired",
    });
  });

  it("renders free products with a non-checkout free surface", () => {
    expect(resolvePricingAction(CATALOG.fast_diagnostic!)).toMatchObject({
      type: "view_free_surface",
      href: "/diagnostics/fast",
    });
  });
});
