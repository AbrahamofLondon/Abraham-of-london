import {
  isCheckoutAvailable,
  type CatalogProduct,
} from "@/lib/commercial/catalog";

export type PricingActionType =
  | "checkout"
  | "request_access"
  | "contact_sales"
  | "view_free_surface"
  | "archive_reference_only";

export type PricingAction = {
  type: PricingActionType;
  label: string;
  href: string;
};

export function resolvePricingAction(product: CatalogProduct): PricingAction {
  if (!product.active || product.commercialStatus === "inactive" || product.commercialStatus === "retired") {
    return {
      type: "archive_reference_only",
      label: "Archive reference",
      href: product.successPath,
    };
  }

  if (product.commercialStatus === "contracted" || product.requiresContract === true) {
    return {
      type: "contact_sales",
      label: product.primaryCta ?? "Discuss access",
      href: product.successPath || "/contact",
    };
  }

  if (product.commercialStatus === "manual_billing") {
    return {
      type: "request_access",
      label: product.primaryCta ?? "Request access",
      href: "/contact",
    };
  }

  if (product.commercialStatus === "free_controlled" || product.accessType === "free" || product.amount <= 0) {
    return {
      type: "view_free_surface",
      label: product.primaryCta ?? "Start free",
      href: product.successPath,
    };
  }

  if (isCheckoutAvailable(product)) {
    return {
      type: "checkout",
      label: product.primaryCta ?? "Purchase / unlock",
      href: product.cancelPath,
    };
  }

  return {
    type: "request_access",
    label: product.primaryCta ?? "Request access",
    href: "/contact",
  };
}
