import { describe, expect, it } from "vitest";
import { CATALOG } from "./catalog";
import { resolvePricingAction } from "./pricing-actions";

describe("pricing actions", () => {
  it("renders live self-serve products as checkout actions", () => {
    expect(resolvePricingAction(CATALOG.professional!)).toMatchObject({
      type: "checkout",
      href: "/pricing",
    });
    expect(resolvePricingAction(CATALOG.professional_annual!)).toMatchObject({
      type: "checkout",
      href: "/pricing",
    });
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
    expect(resolvePricingAction(CATALOG.execution_integrity_protocol!)).toMatchObject({
      type: "request_access",
      label: "Request access",
      href: "/contact",
    });
  });

  it("renders free products and inactive products with non-checkout actions", () => {
    expect(resolvePricingAction(CATALOG.fast_diagnostic!)).toMatchObject({
      type: "view_free_surface",
      href: "/diagnostics/fast",
    });
    expect(resolvePricingAction(CATALOG.gmi_q1_2026!)).toMatchObject({
      type: "archive_reference_only",
    });
  });
});
