/**
 * lib/decision-instruments/instrument-catalog-bridge.ts
 *
 * Single authority mapper: instrument URL slug → catalog product.
 *
 * Instrument URL slugs (hyphen format, e.g. "decision-exposure-instrument")
 * must resolve through this file to their catalog product code
 * (underscore format, e.g. "decision_exposure_instrument").
 *
 * Any file that needs an instrument's price, displayName, entitlementSlug,
 * Stripe IDs, or delivery specs must read from here — NOT from a hardcoded
 * local array.
 *
 * Rules:
 * - Every active decision instrument must have a catalog entry
 * - Prices displayed in UI must equal catalog.displayPrice
 * - Packs must resolve to their catalog product code
 * - No instrument slug resolves to a catalog code that does not exist
 */

import {
  CATALOG,
  getProduct,
  getProductDisplayPrice,
  getProductAmountGbp,
  type CatalogProduct,
} from "@/lib/commercial/catalog";

// ── Instrument slug → catalog product code mapping ────────────────────────────
// URL slug format (hyphen) → catalog code (underscore)
// This is the ONLY place this mapping exists. Do not duplicate.

export const INSTRUMENT_SLUG_TO_CATALOG_CODE: Record<string, string> = {
  "decision-exposure-instrument":         "decision_exposure_instrument",
  "mandate-clarity-framework":            "mandate_clarity_framework",
  "intervention-path-selector":           "intervention_path_selector",
  "escalation-readiness-scorecard":       "escalation_readiness_scorecard",
  "structural-failure-diagnostic-canvas": "structural_failure_diagnostic_canvas",
  "execution-risk-index":                 "execution_risk_index",
  "team-alignment-gap-map":              "team_alignment_gap_map",
  "governance-drift-detector":           "governance_drift_detector",
  "strategic-priority-stack-builder":    "strategic_priority_stack_builder",
  "board-brief-builder":                 "board_brief_builder",
  // Packs
  "operator-decision-pack":              "operator_decision_pack",
  "operator-essentials-pack":            "operator_essentials_pack",
  "command-pack":                        "command_pack",
  "governance-suite":                    "governance_suite",
};

// ── Pack ID → catalog product code mapping ────────────────────────────────────
// Pack IDs from instrument-pack-contract.ts → catalog code

export const PACK_ID_TO_CATALOG_CODE: Record<string, string> = {
  operator_essentials:   "operator_essentials_pack",
  command_pack:          "command_pack",
  governance_suite:      "governance_suite",
  // executive_intelligence — not yet in catalog; price is held here pending catalog entry
};

// The executive_intelligence pack exists in instrument-pack-contract.ts
// but has no catalog entry. Price is held here as the provisional source
// until it is added to catalog.ts with a real Stripe product ID.
export const EXECUTIVE_INTELLIGENCE_PACK_PRICE_GBP = 995;
export const EXECUTIVE_INTELLIGENCE_PACK_DISPLAY_PRICE = "Catalog registration required";

// ── Getters ───────────────────────────────────────────────────────────────────

/**
 * Resolve a catalog product from an instrument URL slug.
 * Returns null if the slug is not registered or the catalog entry is missing.
 */
export function getInstrumentCatalogProduct(
  slug: string,
): CatalogProduct | null {
  const code = INSTRUMENT_SLUG_TO_CATALOG_CODE[slug];
  if (!code) return null;
  return getProduct(code);
}

/**
 * Get the display price for an instrument from the catalog.
 * Throws if slug is not found or catalog entry is missing.
 *
 * Use this instead of hardcoded price strings.
 */
export function getInstrumentDisplayPrice(slug: string): string {
  const product = getInstrumentCatalogProduct(slug);
  if (!product) {
    throw new Error(
      `getInstrumentDisplayPrice: no catalog entry found for instrument slug "${slug}". ` +
        "Register the slug in INSTRUMENT_SLUG_TO_CATALOG_CODE.",
    );
  }
  return product.displayPrice;
}

/**
 * Get the GBP amount (integer pence → pounds) for an instrument from the catalog.
 */
export function getInstrumentAmountGbp(slug: string): number {
  const product = getInstrumentCatalogProduct(slug);
  if (!product) {
    throw new Error(
      `getInstrumentAmountGbp: no catalog entry found for instrument slug "${slug}".`,
    );
  }
  return product.amount / 100;
}

/**
 * Get the catalog product for a pack by its pack ID.
 * Returns null for packs not yet in catalog (e.g. executive_intelligence).
 */
export function getPackCatalogProduct(packId: string): CatalogProduct | null {
  const code = PACK_ID_TO_CATALOG_CODE[packId];
  if (!code) return null;
  return getProduct(code);
}

/**
 * Get the display price for a pack.
 * Falls back to provisional price for packs not yet in catalog.
 */
export function getPackDisplayPrice(packId: string): string {
  const product = getPackCatalogProduct(packId);
  if (product) return product.displayPrice;
  if (packId === "executive_intelligence") return EXECUTIVE_INTELLIGENCE_PACK_DISPLAY_PRICE;
  throw new Error(
    `getPackDisplayPrice: no catalog entry found for pack "${packId}". ` +
      "Register the pack in PACK_ID_TO_CATALOG_CODE.",
  );
}

/**
 * Get GBP amount for a pack.
 */
export function getPackAmountGbp(packId: string): number {
  const product = getPackCatalogProduct(packId);
  if (product) return product.amount / 100;
  if (packId === "executive_intelligence") return EXECUTIVE_INTELLIGENCE_PACK_PRICE_GBP;
  throw new Error(`getPackAmountGbp: no catalog entry for pack "${packId}".`);
}

/**
 * Resolve catalog code from instrument URL slug.
 */
export function resolveCatalogCodeFromSlug(slug: string): string | null {
  return INSTRUMENT_SLUG_TO_CATALOG_CODE[slug] ?? null;
}

/**
 * Resolve catalog code from instrument URL slug or throw.
 */
export function requireCatalogCodeFromSlug(slug: string): string {
  const code = resolveCatalogCodeFromSlug(slug);
  if (!code) {
    throw new Error(
      `No catalog code registered for instrument slug "${slug}". ` +
        "Add an entry to INSTRUMENT_SLUG_TO_CATALOG_CODE in instrument-catalog-bridge.ts.",
    );
  }
  return code;
}

// ── Validation ────────────────────────────────────────────────────────────────

export type CatalogBridgeError = {
  slug: string;
  catalogCode: string | null;
  error: string;
};

/**
 * Validate all registered instrument slugs resolve to catalog entries.
 * Run at test time or build time. Should return zero errors in a healthy estate.
 */
export function validateInstrumentCatalogIntegrity(): CatalogBridgeError[] {
  const errors: CatalogBridgeError[] = [];

  for (const [slug, code] of Object.entries(INSTRUMENT_SLUG_TO_CATALOG_CODE)) {
    const product = getProduct(code);
    if (!product) {
      errors.push({
        slug,
        catalogCode: code,
        error: `Catalog code "${code}" does not exist in CATALOG`,
      });
      continue;
    }
    // Active instruments must be in paid/free_controlled status and have valid amounts
    if (product.active && product.commercialStatus !== "free_controlled") {
      if (!product.stripePriceId && product.amount <= 0) {
        errors.push({
          slug,
          catalogCode: code,
          error: `Active instrument "${code}" has no Stripe price ID and zero amount`,
        });
      }
    }
  }

  for (const [packId, code] of Object.entries(PACK_ID_TO_CATALOG_CODE)) {
    const product = getProduct(code);
    if (!product) {
      errors.push({
        slug: packId,
        catalogCode: code,
        error: `Pack catalog code "${code}" does not exist in CATALOG`,
      });
    }
  }

  return errors;
}

/**
 * Get all instrument slugs that have active catalog entries with prices.
 * Useful for generating pricing tables, navigation, etc.
 */
export function getActiveCatalogInstruments(): Array<{
  slug: string;
  product: CatalogProduct;
}> {
  return Object.entries(INSTRUMENT_SLUG_TO_CATALOG_CODE)
    .filter(([, code]) => {
      const product = getProduct(code);
      return product?.active && product.commercialStatus !== "inactive";
    })
    .map(([slug, code]) => ({
      slug,
      product: getProduct(code)!,
    }));
}

/**
 * Price parity check: verify INSTRUMENT_REGISTRY entries (from governed-instrument-contract.ts)
 * match catalog prices. Returns mismatches.
 *
 * @param registry - the INSTRUMENT_REGISTRY object from governed-instrument-contract.ts
 */
export function checkInstrumentRegistryPriceParity(
  registry: Record<string, { price: string }>,
): Array<{ slug: string; registryPrice: string; catalogPrice: string }> {
  const mismatches: Array<{ slug: string; registryPrice: string; catalogPrice: string }> = [];

  for (const [slug, entry] of Object.entries(registry)) {
    const product = getInstrumentCatalogProduct(slug);
    if (!product) continue; // Skip slugs not in instrument bridge (e.g. "board-brief-template" — legacy)
    const catalogPrice = product.displayPrice;
    if (entry.price !== catalogPrice) {
      mismatches.push({
        slug,
        registryPrice: entry.price,
        catalogPrice,
      });
    }
  }

  return mismatches;
}

// ── Convenience re-exports ────────────────────────────────────────────────────

export { getProductDisplayPrice, getProductAmountGbp };

// ── Type guard ───────────────────────────────────────────────────────────────

export function isKnownInstrumentSlug(slug: string): boolean {
  return slug in INSTRUMENT_SLUG_TO_CATALOG_CODE;
}

export function isKnownPackId(packId: string): boolean {
  return packId in PACK_ID_TO_CATALOG_CODE || packId === "executive_intelligence";
}
