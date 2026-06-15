/**
 * lib/commercial/commercial-action-resolver.ts
 *
 * THE single authority for commercial action / checkout gating.
 *
 * Non-negotiable principle: checkout-ready catalog data (Stripe IDs, price) is
 * NOT checkout permission. Governance state decides purchasability. A product
 * may carry valid Stripe IDs and still resolve to `blocked`.
 *
 * Pure function: takes a catalog product + governance state (+ optional route
 * availability) and returns a typed, explicit action. No I/O, no fs — callable
 * on server, at build time, and in the client bundle.
 */

import type { CatalogProduct } from "@/lib/commercial/catalog";
import type { GovernanceState } from "@/lib/commercial/commercial-governance";

export type CommercialActionState =
  | "checkout"
  | "request_access"
  | "manual_fulfilment"
  | "contact_sales"
  | "review_gated"
  | "evidence_gated"
  | "blocked"
  | "archive_reference_only"
  | "view_free_surface"
  | "unavailable";

export type CommercialAction = {
  state: CommercialActionState;
  label: string;
  href: string;
  /** Only true for `checkout`. Every other state is non-purchasable. */
  purchasable: boolean;
  /** Machine-readable reason, primarily for non-checkout/unavailable states. */
  reason?: string;
};

export type ResolveOptions = {
  /** When explicitly false, a required route is missing → `unavailable`. */
  routeAvailable?: boolean;
};

/**
 * Products with an EXPLICIT public-intake rule. An `internal_only` product is
 * never automatically turned into a public "request access" product; it only
 * becomes a public request surface if it is deliberately listed here. Empty by
 * default — adding a code is an explicit, owner-level decision.
 */
export const PUBLIC_INTAKE_ALLOWLIST: readonly string[] = [];

function isFreeCatalog(p: CatalogProduct): boolean {
  // Explicitly commercial statuses are never "free" even if a price is not yet
  // set (e.g. a manual_billing product awaiting Stripe metadata).
  if (
    p.commercialStatus === "manual_billing" ||
    p.commercialStatus === "contracted" ||
    p.commercialStatus === "paid" ||
    p.commercialStatus === "evidence_gated"
  ) {
    return false;
  }
  return (
    p.commercialStatus === "free_controlled" ||
    p.accessType === "free" ||
    (p.amount ?? 0) <= 0
  );
}

function hasValidStripe(p: CatalogProduct): boolean {
  return Boolean(p.stripePriceId && (p.amount ?? 0) > 0);
}

/**
 * Resolve the governed commercial action for a product.
 * Rule order follows the Commercial Checkout Architecture Consolidation brief.
 */
export function resolveCommercialAction(
  product: CatalogProduct,
  governance: GovernanceState,
  options: ResolveOptions = {},
): CommercialAction {
  const cta = product.primaryCta;
  const successPath = product.successPath || "/pricing";
  const checkoutHref = product.cancelPath || successPath; // preserves legacy checkout href

  // (0) Inactive / retired catalog state — never commercial.
  if (
    !product.active ||
    product.commercialStatus === "inactive" ||
    product.commercialStatus === "retired"
  ) {
    return { state: "archive_reference_only", label: "Archive reference", href: successPath, purchasable: false, reason: "inactive_or_retired" };
  }

  const g = governance;
  const lane = g.releaseLane || "";

  // (1) Governance hard block — regardless of Stripe IDs. (Rule 1)
  if (
    g.known &&
    (g.readinessStatus === "blocked" || g.releaseMode === "blocked" || lane.startsWith("blocked"))
  ) {
    return { state: "blocked", label: "Not currently available", href: successPath, purchasable: false, reason: "governance_blocked" };
  }

  // (1b) internal_only is not a public commercial surface. It must NOT auto-
  // become a public "request access" product. Default to blocked unless an
  // explicit public-intake rule opts the product in.
  if (
    g.known &&
    g.releaseMode === "internal_only" &&
    !PUBLIC_INTAKE_ALLOWLIST.includes(product.code)
  ) {
    return { state: "blocked", label: "Not currently available", href: successPath, purchasable: false, reason: "internal_only" };
  }

  // (2) checkoutSafe === false → review/evidence gated by lane. (Rule 2, 5)
  if (g.known && g.checkoutSafe === false) {
    if (lane.includes("evidence")) {
      return { state: "evidence_gated", label: cta ?? "Requires evidence review", href: successPath, purchasable: false, reason: "checkout_not_safe_evidence" };
    }
    return { state: "review_gated", label: cta ?? "Request review", href: successPath, purchasable: false, reason: "checkout_not_safe_review" };
  }

  // (3) commercialSafe === false → review-gated (visible, controlled access,
  // never checkout). Hard `blocked` is reserved for the blocked lane handled in
  // (1); commercially-unsafe-but-not-blocked products (e.g. internal_only,
  // insufficient_information_requires_review) remain visible behind a request.
  if (g.known && g.commercialSafe === false) {
    return { state: "review_gated", label: cta ?? "Request access", href: successPath, purchasable: false, reason: "commercial_not_safe" };
  }

  // (4) Explicit governance checkout denial (governance matrix). (Rule 2/12)
  if (g.known && g.checkoutAllowed === false && g.releaseMode !== "manual_fulfilment_only") {
    return { state: "review_gated", label: cta ?? "Request review", href: successPath, purchasable: false, reason: "checkout_not_allowed" };
  }

  // (5) Contracted / enterprise — enquiry only. (Rule 7)
  if (product.commercialStatus === "contracted" || product.requiresContract === true) {
    return { state: "contact_sales", label: cta ?? "Discuss access", href: successPath || "/contact", purchasable: false, reason: "contracted" };
  }

  // (6) Free + active → free surface. (Rule 6)
  if (isFreeCatalog(product)) {
    return { state: "view_free_surface", label: cta ?? "Start free", href: successPath, purchasable: false, reason: "free_access" };
  }

  // (7) Manual fulfilment only (governance) → no direct checkout. (Rule 4)
  if (g.known && g.releaseMode === "manual_fulfilment_only") {
    return { state: "manual_fulfilment", label: cta ?? "Request access", href: "/contact", purchasable: false, reason: "manual_fulfilment_only" };
  }

  // (8) Manual billing (catalog) → assisted access. (Rule 8)
  if (product.commercialStatus === "manual_billing") {
    return { state: "manual_fulfilment", label: cta ?? "Request access", href: "/contact", purchasable: false, reason: "manual_billing" };
  }

  // (9) Paid + checkout-intended: enforce Stripe metadata before allowing checkout.
  const checkoutIntended = product.commercialStatus === "paid" && product.requiresCheckout === true;
  if (checkoutIntended) {
    // (10) Missing Stripe metadata for a checkout-safe paid product → unavailable.
    if (!hasValidStripe(product)) {
      return { state: "unavailable", label: "Currently unavailable", href: successPath, purchasable: false, reason: "missing_stripe_metadata" };
    }
    // (11) Missing route → unavailable.
    if (options.routeAvailable === false) {
      return { state: "unavailable", label: "Currently unavailable", href: successPath, purchasable: false, reason: "missing_route" };
    }
    // Cleared by governance (blocked/unsafe handled above) and checkout-ready. (Rule 9)
    return { state: "checkout", label: cta ?? "Purchase / unlock", href: checkoutHref, purchasable: true };
  }

  // (12) Default: never checkout merely because a Stripe price exists.
  return { state: "request_access", label: cta ?? "Request access", href: "/contact", purchasable: false, reason: "not_checkout_cleared" };
}
