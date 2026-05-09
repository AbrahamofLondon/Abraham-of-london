/**
 * Commercial Classification Contract
 *
 * Governs how commercial infrastructure files are classified for
 * utilisation audits, corridor guards, and governance enforcement.
 *
 * These classifications prevent over-zealous suppression of legitimate
 * public-safe commercial displays (e.g. display prices) while protecting
 * internal pricing mechanics, entitlement logic, and discount rules.
 */

export type CommercialClassification =
  | "COMMERCIAL_SENSITIVE_INTERNAL"
  | "PUBLIC_SAFE_WITH_POLICY"
  | "SERVER_ONLY_CRITICAL"
  | "SERVER_ONLY_SENSITIVE"
  | "CONTROLLED_SHARED";

export type CommercialClassificationEntry = {
  file: string;
  classification: CommercialClassification;
  rationale: string;
  publicSafeOutputs: string[];
  forbiddenOutputs: string[];
};

/**
 * Canonical classification registry for commercial infrastructure files.
 *
 * pricing-engine.ts: COMMERCIAL_SENSITIVE_INTERNAL
 *   - Pricing mechanics, discount logic, tier-based resolution are internal.
 *   - Display prices flow through catalog helpers, not the engine directly.
 *
 * catalog.ts: PUBLIC_SAFE_WITH_POLICY
 *   - Product names, display prices, and product identity are intentionally public.
 *   - Stripe price IDs, bundle resolution, and entitlement slug mappings are internal.
 *
 * entitlement-authority.ts: SERVER_ONLY_CRITICAL
 *   - Entitlement resolution, grant logic, and source ranking are server-only.
 *   - No entitlement state should reach client without policy gating.
 *
 * tier-policy.ts: SERVER_ONLY_SENSITIVE
 *   - Tier hierarchy, alias mapping, and access computation are server-only.
 *   - Tier labels may be displayed to authenticated users.
 *
 * product-identity.ts: CONTROLLED_SHARED
 *   - Product identity chains link catalog → entitlement → delivery.
 *   - Display-safe fields (product name, display price) may be shared.
 *   - Internal routing (delivery route, access authority) must stay server-only.
 */
export const COMMERCIAL_CLASSIFICATIONS: CommercialClassificationEntry[] = [
  {
    file: "lib/commercial/pricing-engine.ts",
    classification: "COMMERCIAL_SENSITIVE_INTERNAL",
    rationale: "Pricing mechanics, discount rules, and tier-based resolution are internal commercial IP. Display prices flow through catalog helpers.",
    publicSafeOutputs: [],
    forbiddenOutputs: ["BASE_PRICING", "resolveAssetPricing", "PricingDecision"],
  },
  {
    file: "lib/commercial/catalog.ts",
    classification: "PUBLIC_SAFE_WITH_POLICY",
    rationale: "Product names and display prices are intentionally public. Internal Stripe mappings and bundle resolution are not.",
    publicSafeOutputs: ["getProductDisplayPrice", "getProduct (name, displayPrice only)"],
    forbiddenOutputs: ["getStripePriceId", "resolveEntitlementSlugs", "assertActiveProductsHavePriceIds"],
  },
  {
    file: "lib/commercial/entitlement-authority.ts",
    classification: "SERVER_ONLY_CRITICAL",
    rationale: "Entitlement resolution and grant logic must never execute or be importable on the client.",
    publicSafeOutputs: [],
    forbiddenOutputs: ["resolveCanonicalEntitlement", "grantCanonicalEntitlement"],
  },
  {
    file: "lib/access/tier-policy.ts",
    classification: "SERVER_ONLY_SENSITIVE",
    rationale: "Tier hierarchy and access computation are server-only. Tier labels may be displayed.",
    publicSafeOutputs: ["getTierLabel"],
    forbiddenOutputs: ["TIER_HIERARCHY", "TIER_ORDER", "hasAccess"],
  },
  {
    file: "lib/commercial/product-identity.ts",
    classification: "CONTROLLED_SHARED",
    rationale: "Product identity chains are internal. Display-safe fields (name, price) may be shared via catalog helpers.",
    publicSafeOutputs: ["resolveProductIdentity (display fields only)"],
    forbiddenOutputs: ["accessAuthority", "deliveryRoute", "entitlementSlug"],
  },
];

/**
 * Look up the classification for a given file path.
 */
export function getCommercialClassification(filePath: string): CommercialClassificationEntry | null {
  const normalised = filePath.replace(/\\/g, "/");
  return COMMERCIAL_CLASSIFICATIONS.find((entry) => normalised.endsWith(entry.file)) ?? null;
}

/**
 * Returns true if the file is classified as safe for public/client import.
 */
export function isPublicSafe(filePath: string): boolean {
  const entry = getCommercialClassification(filePath);
  if (!entry) return false;
  return entry.classification === "PUBLIC_SAFE_WITH_POLICY" || entry.classification === "CONTROLLED_SHARED";
}
