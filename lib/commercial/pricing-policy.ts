/**
 * lib/commercial/pricing-policy.ts — Pricing policy helpers
 *
 * Thin wrapper over lib/commercial/catalog.ts.
 * All product identity and pricing resolves from the catalog.
 * This file provides formatting, display logic, and policy queries.
 *
 * Do NOT define products here. Use catalog.ts.
 */

import {
  CATALOG,
  type CatalogProduct,
  type CommercialStatus,
  getProduct,
  getActiveProducts as getCatalogActiveProducts,
  isCheckoutAvailable,
  isContractedProduct,
  getCommercialDisplayPrice,
  resolveProductByAlias,
} from "@/lib/commercial/catalog";

// Re-export catalog types for convenience
export type { CatalogProduct, CommercialStatus };

// Re-export catalog functions
export {
  CATALOG,
  getProduct,
  isCheckoutAvailable,
  isContractedProduct,
  getCommercialDisplayPrice,
  resolveProductByAlias,
};

/** Get all active products from catalog. */
export function getActiveProducts(): CatalogProduct[] {
  return getCatalogActiveProducts();
}

/** Format price for display — respects commercial status. */
export function formatProductPrice(product: CatalogProduct): string {
  return getCommercialDisplayPrice(product);
}

/** Short price format. */
export function formatPriceShort(product: CatalogProduct): string {
  if (product.commercialStatus === "free_controlled") return "Free";
  if (product.amount > 0) return `£${(product.amount / 100).toLocaleString("en-GB")}`;
  return "—";
}

/** Get the primary CTA text for a product. */
export function getProductCTA(product: CatalogProduct): string {
  return product.primaryCta ?? product.displayName;
}

/** Check if a product is safe to sell right now. */
export function isProductSafeToSell(product: CatalogProduct): boolean {
  if (!product.active) return false;
  if (product.commercialStatus === "free_controlled") return true;
  if (product.commercialStatus === "contracted") return false;
  if (product.commercialStatus === "retired") return false;
  if (product.commercialStatus === "inactive") return false;
  return isCheckoutAvailable(product);
}

/** Resolve product identity from any alias. */
export function resolveProductIdentity(input: string): CatalogProduct | null {
  // Try direct catalog key first
  try {
    return getProduct(input);
  } catch {
    // Not found by code, try alias
  }
  return resolveProductByAlias(input);
}
