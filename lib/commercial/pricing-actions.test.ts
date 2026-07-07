import { describe, expect, it } from "vitest";
import { CATALOG } from "./catalog";
import { resolvePricingAction } from "./pricing-actions";

describe("pricing actions", () => {
  it("FAIL-CLOSED: ungoverned paid products never resolve to checkout, even with complete Stripe metadata", () => {
    const ungovernedPaid = { ...CATALOG.boardroom_brief!, code: "ungoverned_paid_probe" };
    const action = resolvePricingAction(ungovernedPaid);
    expect(action.purchasable).toBe(false);
    expect(action.type).not.toBe("checkout");
    expect(action.reason).toBe("governance_unknown_fail_closed");
  });

  it("controlled subscription products do not resolve to checkout", () => {
    const action = resolvePricingAction(CATALOG.professional!);
    expect(action.purchasable).toBe(false);
    expect(action.type).toBe("review_gated");
    expect(action.reason).toBe("checkout_not_allowed");
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

  it("renders draft GMI Q2 as archive/reference only until release authority", () => {
    expect(resolvePricingAction(CATALOG.gmi_q2_2026!)).toMatchObject({
      type: "archive_reference_only",
      purchasable: false,
      reason: "inactive_or_retired",
    });
  });

  it("renders controlled GMI Q1 as non-checkout review-gated access", () => {
    expect(resolvePricingAction(CATALOG.gmi_q1_2026!)).toMatchObject({
      type: "review_gated",
      purchasable: false,
      reason: "checkout_not_allowed",
    });
  });

  it("renders free products with a non-checkout free surface", () => {
    expect(resolvePricingAction(CATALOG.fast_diagnostic!)).toMatchObject({
      type: "view_free_surface",
      href: "/diagnostics/fast",
    });
  });
});
