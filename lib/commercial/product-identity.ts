/**
 * lib/commercial/product-identity.ts — CANONICAL PRODUCT IDENTITY RESOLVER
 *
 * Every paid product has ONE identity chain. This file resolves any
 * identifier (productCode, entitlementSlug, contentId) to the full chain.
 *
 * Rule: no split identity, no exceptions.
 */

import { CATALOG, type CatalogProduct, resolveProductCode } from "./catalog";

// ─────────────────────────────────────────────────────────────────────────────
// Identity Chain
// ─────────────────────────────────────────────────────────────────────────────

export type ProductIdentityChain = {
  /** Canonical product code (used in checkout, catalog key) */
  productCode: string;
  /** Entitlement slug (stored in ClientEntitlement.productCode) */
  entitlementSlug: string;
  /** Content ID for content-backed products (slug used in routes/MDX) */
  contentId: string;
  /** Purchase destination (where checkout redirects) */
  purchaseDestination: string;
  /** Post-purchase destination (where user lands after successful payment) */
  postPurchaseDestination: string;
  /** Delivery route (API path for controlled download) */
  deliveryRoute: string;
  /** Access authority (how access is resolved) */
  accessAuthority: "canonical_entitlement" | "tier" | "free";
  /** Display price */
  displayPrice: string;
  /** Whether this product is currently sellable */
  active: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Content ID Mapping
// Some products have a contentId that differs from the productCode.
// This maps contentId → productCode for those cases.
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_ID_TO_PRODUCT_CODE: Record<string, string> = {
  // GMI: content slug uses hyphens, product code uses underscores
  "global-market-intelligence-report-q1-2026": "gmi_q1_2026",
  // Instruments: content slugs match entitlement slugs
  "decision-exposure-instrument": "decision_exposure_instrument",
  "mandate-clarity-framework": "mandate_clarity_framework",
  "intervention-path-selector": "intervention_path_selector",
};

// ─────────────────────────────────────────────────────────────────────────────
// Resolvers
// ─────────────────────────────────────────────────────────────────────────────

function catalogToChain(product: CatalogProduct): ProductIdentityChain {
  const contentId = Object.entries(CONTENT_ID_TO_PRODUCT_CODE)
    .find(([, code]) => code === product.code)?.[0]
    ?? product.entitlementSlug;

  return {
    productCode: product.code,
    entitlementSlug: product.entitlementSlug,
    contentId,
    purchaseDestination: product.cancelPath, // where user starts checkout
    postPurchaseDestination: product.successPath, // where user lands after payment
    deliveryRoute: `/api/downloads/${product.entitlementSlug}`,
    accessAuthority: product.accessType === "free" ? "free"
      : product.amount > 0 ? "canonical_entitlement"
      : "tier",
    displayPrice: product.displayPrice,
    active: product.active,
  };
}

/** Resolve from product code (catalog key) */
export function resolveByProductCode(code: string): ProductIdentityChain | null {
  const product = resolveProductCode(code);
  return product ? catalogToChain(product) : null;
}

/** Resolve from entitlement slug (ClientEntitlement.productCode) */
export function resolveByEntitlementSlug(slug: string): ProductIdentityChain | null {
  const product = Object.values(CATALOG).find((p) => p.entitlementSlug === slug);
  return product ? catalogToChain(product) : null;
}

/** Resolve from content ID (route slug, MDX slug, artifact ID) */
export function resolveByContentId(contentId: string): ProductIdentityChain | null {
  const productCode = CONTENT_ID_TO_PRODUCT_CODE[contentId];
  if (productCode) {
    const product = CATALOG[productCode];
    return product ? catalogToChain(product) : null;
  }
  // Try direct match against entitlement slugs
  return resolveByEntitlementSlug(contentId);
}

/** Resolve from ANY identifier — tries all resolution paths */
export function resolveProductIdentity(identifier: string): ProductIdentityChain | null {
  return resolveByProductCode(identifier)
    ?? resolveByEntitlementSlug(identifier)
    ?? resolveByContentId(identifier)
    ?? null;
}

/** Get all product identity chains */
export function getAllProductIdentities(): ProductIdentityChain[] {
  return Object.values(CATALOG).map(catalogToChain);
}

/** Validate that a product's identity chain is consistent */
export function validateProductIdentity(code: string): {
  valid: boolean;
  issues: string[];
} {
  const product = CATALOG[code];
  if (!product) return { valid: false, issues: [`Product ${code} not found in catalog`] };

  const issues: string[] = [];
  const chain = catalogToChain(product);

  if (!chain.productCode) issues.push("Missing productCode");
  if (!chain.entitlementSlug) issues.push("Missing entitlementSlug");
  if (!chain.postPurchaseDestination) issues.push("Missing postPurchaseDestination");

  if (product.active && product.amount > 0 && !product.stripePriceId) {
    issues.push("Active paid product missing Stripe Price ID");
  }

  if (chain.accessAuthority === "canonical_entitlement" && !chain.entitlementSlug) {
    issues.push("Canonical entitlement authority requires entitlementSlug");
  }

  return { valid: issues.length === 0, issues };
}
