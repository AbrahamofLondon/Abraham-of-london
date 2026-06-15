import { type CatalogProduct } from "@/lib/commercial/catalog";
import { getGovernanceState } from "@/lib/commercial/commercial-governance";
import {
  resolveCommercialAction,
  type CommercialActionState,
} from "@/lib/commercial/commercial-action-resolver";

/**
 * UI-facing pricing action. This is a thin adapter over the single commercial
 * action resolver (lib/commercial/commercial-action-resolver.ts) so that every
 * storefront CTA is governance-gated. Catalog data (Stripe IDs/price) is never
 * checkout permission — only the resolver grants `checkout`.
 */
export type PricingActionType =
  | "checkout"
  | "request_access"
  | "manual_fulfilment"
  | "contact_sales"
  | "review_gated"
  | "evidence_gated"
  | "blocked"
  | "view_free_surface"
  | "archive_reference_only"
  | "unavailable";

export type PricingAction = {
  type: PricingActionType;
  label: string;
  href: string;
  /** Only true when the resolver grants checkout. */
  purchasable: boolean;
  reason?: string;
};

/** Map the resolver's state to the (now aligned) UI action type. */
function toPricingType(state: CommercialActionState): PricingActionType {
  // States are 1:1 except manual_fulfilment, which legacy callers/tests treat
  // as request_access (assisted access via /contact).
  if (state === "manual_fulfilment") return "request_access";
  return state;
}

export function resolvePricingAction(product: CatalogProduct): PricingAction {
  const governance = getGovernanceState(product.code);
  const action = resolveCommercialAction(product, governance);
  return {
    type: toPricingType(action.state),
    label: action.label,
    href: action.href,
    purchasable: action.purchasable,
    reason: action.reason,
  };
}
