/**
 * lib/commercial/gmi/gmi-edition-factory.ts
 *
 * Converts GmiEditionRegistryEntry records into CatalogProduct objects.
 *
 * Fail-closed: invalid registry configurations throw at module import time,
 * not lazily at runtime. This means misconfiguration is caught at build/test,
 * not in production.
 *
 * Derived fields (no manual entry required in registry):
 *   - entitlementSlug: "global-market-intelligence-report-{slug}"
 *   - route: "/artifacts/global-market-intelligence-report-{slug}"
 *   - successPath / cancelPath: same as route
 *   - commercialStatus: derived from GmiEditionCommercialStatus
 *   - requiresCheckout: true only for status === "active"
 *   - active: false for "retired", true for all others
 *   - PricingFamily entry: "intelligence_reports" for all editions
 */

// Import types only — no runtime import from catalog to avoid circular dependency.
// catalog.ts → gmi-edition-factory.ts is the runtime direction.
// These type-only imports are erased by TypeScript at compile time.
import type { CatalogProduct, CommercialStatus, PricingFamily } from "../catalog";
import type { GmiEditionRegistryEntry } from "./gmi-edition-registry";
// Runtime import: the lifecycle module is the publication authority. The registry
// must AGREE with it — enforced at build/import time below (fail-closed).
import { getMarketIntelligenceCommercialState } from "@/lib/intelligence/market-intelligence-lifecycle";

// ─── Validation ───────────────────────────────────────────────────────────────

export type GmiEditionValidationError = {
  editionId: string;
  error: string;
};

export function validateGmiEditionRegistry(
  entries: GmiEditionRegistryEntry[],
): GmiEditionValidationError[] {
  const errors: GmiEditionValidationError[] = [];

  // Check exactly one current edition
  const currentEditions = entries.filter((e) => e.current);
  if (currentEditions.length === 0) {
    errors.push({ editionId: "(registry)", error: "No edition has current: true — exactly one must be current" });
  }
  if (currentEditions.length > 1) {
    errors.push({
      editionId: currentEditions.map((e) => e.editionId).join(", "),
      error: `Multiple editions have current: true — only one may be current`,
    });
  }

  // Check archived/retired editions are not current
  for (const e of entries) {
    if (e.current && (e.status === "archived" || e.status === "retired")) {
      errors.push({
        editionId: e.editionId,
        error: `status="${e.status}" but current=true — archived/retired editions cannot be current`,
      });
    }
  }

  // Check draft editions are hidden from pricing
  for (const e of entries) {
    if (e.status === "draft" && !e.hiddenFromPricing) {
      errors.push({
        editionId: e.editionId,
        error: `status="draft" but hiddenFromPricing=false — draft editions must be hidden from pricing`,
      });
    }
  }

  // Check active (paid_checkout) editions have Stripe IDs
  for (const e of entries) {
    if (e.status === "active") {
      if (!e.stripeProductId) {
        errors.push({
          editionId: e.editionId,
          error: `status="active" requires stripeProductId — add Stripe product ID or change status to "manual_billing"`,
        });
      }
      if (!e.stripePriceId) {
        errors.push({
          editionId: e.editionId,
          error: `status="active" requires stripePriceId — add Stripe price ID or change status to "manual_billing"`,
        });
      }
    }
  }

  // Check no duplicate product codes
  const codes = entries.map((e) => e.productCode);
  const seen = new Set<string>();
  for (const code of codes) {
    if (seen.has(code)) {
      errors.push({ editionId: code, error: `Duplicate productCode: "${code}"` });
    }
    seen.add(code);
  }

  // Check no duplicate editionIds
  const ids = entries.map((e) => e.editionId);
  const seenIds = new Set<string>();
  for (const id of ids) {
    if (seenIds.has(id)) {
      errors.push({ editionId: id, error: `Duplicate editionId: "${id}"` });
    }
    seenIds.add(id);
  }

  return errors;
}

// ─── Lifecycle reconciliation guard ───────────────────────────────────────────
// Fails closed if the commercial registry contradicts the authoritative lifecycle
// (market-intelligence-lifecycle.ts). Editions with no lifecycle record (e.g. a
// far-future draft) are skipped — there is nothing to reconcile yet.
export function assertGmiRegistryAgreesWithLifecycle(
  entries: GmiEditionRegistryEntry[],
): GmiEditionValidationError[] {
  const errors: GmiEditionValidationError[] = [];
  for (const e of entries) {
    const state = getMarketIntelligenceCommercialState(e.editionId);
    if (!state) continue;

    // Pricing visibility is narrower than publication visibility: archives can
    // remain public-visible while hidden from current pricing.
    if (state.isArchive && !e.hiddenFromPricing) {
      errors.push({
        editionId: e.editionId,
        error: `lifecycle archive must be hidden from pricing`,
      });
    }
    if (state.isCurrentPublished && e.hiddenFromPricing) {
      errors.push({
        editionId: e.editionId,
        error: `lifecycle current-published must be visible on pricing`,
      });
    }
    if (state.isReleaseCandidate && !e.hiddenFromPricing) {
      errors.push({
        editionId: e.editionId,
        error: `lifecycle release-candidate must be hidden from pricing`,
      });
    }

    const sellable = e.status === "active" || e.status === "manual_billing";
    if (state.purchasable && !sellable) {
      errors.push({ editionId: e.editionId, error: `lifecycle purchasable=true but registry status="${e.status}" is not sellable` });
    }
    if (!state.purchasable && sellable) {
      errors.push({ editionId: e.editionId, error: `lifecycle purchasable=false but registry status="${e.status}" is sellable` });
    }

    // The current published issue must be a live edition (active/manual_billing), never draft/archived.
    if (state.isCurrentPublished && !(e.status === "active" || e.status === "manual_billing")) {
      errors.push({ editionId: e.editionId, error: `lifecycle current-published but registry status="${e.status}" (expected active/manual_billing)` });
    }
    // A not-yet-published release candidate must be draft.
    if (state.isReleaseCandidate && e.status !== "draft") {
      errors.push({ editionId: e.editionId, error: `lifecycle release-candidate but registry status="${e.status}" (expected draft)` });
    }
  }
  return errors;
}

// ─── Derivation helpers ───────────────────────────────────────────────────────

function deriveEntitlementSlug(slug: string): string {
  return `global-market-intelligence-report-${slug}`;
}

function deriveArtifactRoute(slug: string): string {
  return `/artifacts/global-market-intelligence-report-${slug}`;
}

function deriveCommercialStatus(status: GmiEditionRegistryEntry["status"]): CommercialStatus {
  switch (status) {
    case "active":         return "paid";
    case "manual_billing": return "manual_billing";
    case "archived":       return "inactive";   // archive-visible, not current checkout
    case "draft":          return "internal_only"; // draft is admin-only; no public surface
    case "retired":        return "retired";
  }
}

function deriveRequiresCheckout(entry: GmiEditionRegistryEntry): boolean {
  return entry.status === "active";
}

function deriveActive(status: GmiEditionRegistryEntry["status"]): boolean {
  return status !== "retired" && status !== "draft" && status !== "archived";
}

function deriveDisplayPrice(entry: GmiEditionRegistryEntry): string {
  if (entry.displayPrice) return entry.displayPrice;
  if (entry.status === "manual_billing") return "By enquiry";
  if (entry.status === "draft") return "Coming soon";
  if (entry.amountGbp) return `£${(entry.amountGbp / 100).toFixed(0)}`;
  return "£59";
}

// CTA is derived from commercial status — NOT the admin `current` flag, which is
// in-preparation focus only and must not drive public/commercial copy.
function derivePrimaryCta(status: GmiEditionRegistryEntry["status"]): string {
  switch (status) {
    case "active":         return "View report";
    case "manual_billing": return "Request Access";
    case "archived":       return "View archive";
    case "draft":          return "Coming soon";
    case "retired":        return "Unavailable";
  }
}

// ─── Single-entry builder ─────────────────────────────────────────────────────

export function buildGmiEditionProduct(entry: GmiEditionRegistryEntry): CatalogProduct {
  const route = deriveArtifactRoute(entry.slug);
  const commercialStatus = deriveCommercialStatus(entry.status);
  const requiresCheckout = deriveRequiresCheckout(entry);
  const active = deriveActive(entry.status);

  return {
    code: entry.productCode,
    displayName: entry.title,
    marketName: entry.title,
    publicLabel: `GMI ${entry.quarter} ${entry.year}`,
    amount: entry.amountGbp ?? 5900,
    displayPrice: deriveDisplayPrice(entry),
    stripeProductId: entry.stripeProductId ?? null,
    stripePriceId: entry.stripePriceId ?? null,
    entitlementSlug: deriveEntitlementSlug(entry.slug),
    tier: "premium-report",
    category: "intelligence",
    accessType: "one_time",
    duration: "lifetime",
    active,
    commercialStatus,
    requiresCheckout,
    hiddenFromPricing: entry.hiddenFromPricing,
    hiddenReason: entry.hiddenReason,
    shortDescription: entry.shortDescription,
    pricingNote: entry.pricingNote,
    primaryCta: derivePrimaryCta(entry.status),
    successPath: route,
    cancelPath: route,
    cookieName: null,
    includes: [],
    pricingFamily: "intelligence_reports" as PricingFamily,
  };
}

// ─── Batch builder (fail-closed) ──────────────────────────────────────────────

export function buildGmiEditionProducts(
  entries: GmiEditionRegistryEntry[],
): Record<string, CatalogProduct> {
  // Validate before building — any error throws immediately
  const errors = [
    ...validateGmiEditionRegistry(entries),
    ...assertGmiRegistryAgreesWithLifecycle(entries),
  ];
  if (errors.length > 0) {
    const msg = errors.map((e) => `  [${e.editionId}] ${e.error}`).join("\n");
    throw new Error(`GMI Edition Registry validation failed:\n${msg}`);
  }

  const result: Record<string, CatalogProduct> = {};
  for (const entry of entries) {
    result[entry.productCode] = buildGmiEditionProduct(entry);
  }
  return result;
}

// ─── Lookup helpers ───────────────────────────────────────────────────────────

let _cachedProducts: Record<string, CatalogProduct> | null = null;

function getCachedProducts(entries: GmiEditionRegistryEntry[]): Record<string, CatalogProduct> {
  if (!_cachedProducts) {
    _cachedProducts = buildGmiEditionProducts(entries);
  }
  return _cachedProducts;
}

export function getCurrentGmiEditionProduct(
  entries: GmiEditionRegistryEntry[],
): CatalogProduct | null {
  const products = getCachedProducts(entries);
  const currentEntry = entries.find((e) => e.current);
  return currentEntry ? (products[currentEntry.productCode] ?? null) : null;
}

export function getGmiEditionProductByEditionId(
  entries: GmiEditionRegistryEntry[],
  editionId: string,
): CatalogProduct | null {
  const entry = entries.find((e) => e.editionId === editionId);
  if (!entry) return null;
  const products = getCachedProducts(entries);
  return products[entry.productCode] ?? null;
}

export function getGmiEditionProductBySlug(
  entries: GmiEditionRegistryEntry[],
  slug: string,
): CatalogProduct | null {
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) return null;
  const products = getCachedProducts(entries);
  return products[entry.productCode] ?? null;
}

export function getGmiPricingFamilyEntries(
  entries: GmiEditionRegistryEntry[],
): Record<string, PricingFamily> {
  const result: Record<string, PricingFamily> = {};
  for (const entry of entries) {
    result[entry.productCode] = "intelligence_reports";
  }
  return result;
}

export function getCurrentGmiEditionCode(entries: GmiEditionRegistryEntry[]): string | null {
  return entries.find((e) => e.current)?.productCode ?? null;
}
