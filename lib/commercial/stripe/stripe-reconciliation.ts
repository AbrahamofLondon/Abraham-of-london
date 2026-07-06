/**
 * lib/commercial/stripe/stripe-reconciliation.ts
 *
 * PR B — pure reconciliation engine. Compares local commercial catalogue records
 * against a normalized live Stripe snapshot and assigns an explicit classification
 * to every local and remote record. Pure and deterministic — no I/O, no writes.
 *
 * Matching hierarchy (never auto-writes an ID from a fuzzy/ambiguous match):
 *   1. exact existing Stripe ID match
 *   2. explicit canonical Stripe metadata (aol_product_code)
 *   3. lookup key (where already adopted)
 *   4. deterministic name + amount + currency + recurrence (CANDIDATE only)
 */

import type { StripeCatalogSnapshot, NormalizedStripePrice } from "./stripe-catalog-adapter.server";

export type LocalCommercialProduct = {
  code: string;
  name: string;
  /** unit amount in minor units (pence). */
  amount: number | null;
  currency: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  active: boolean;
  commercialStatus: string | null;
  recurringInterval: string | null;
};

/**
 * Primary reconciliation outcome — exactly one per local product.
 * Mutually exclusive: every local product has exactly one of these.
 */
export type PrimaryOutcome =
  | "EXACT_MATCH"           // Local IDs match live Stripe objects exactly
  | "INTENTIONALLY_UNBOUND" // No remote match by design (free_controlled, contracted, etc.)
  | "PRODUCT_ID_MISMATCH"   // Local stripeProductId differs from the matched live Product
  | "PRICE_ID_MISMATCH"     // Local stripePriceId does not belong to the matched live Product
  | "LOCAL_ID_MISSING"      // Local has no stripeProductId or stripePriceId; live candidate exists
  | "REMOTE_OBJECT_MISSING" // Local stripeProductId points to a non-existent live object
  | "LOCAL_ONLY_PRODUCT"    // Local product has no Stripe counterpart (inactive/internal_only)
  | "AMBIGUOUS_MATCH";      // Multiple live candidates; no clear match

/**
 * Orthogonal anomaly flag — zero or more per local product.
 * These coexist with the primary outcome and are NOT mutually exclusive.
 */
export type AnomalyFlag =
  | "AMOUNT_MISMATCH"
  | "CURRENCY_MISMATCH"
  | "INTERVAL_MISMATCH"
  | "ACTIVE_STATE_DRIFT"
  | "MULTIPLE_ACTIVE_PRICE_CANDIDATES"
  | "INFORMATIONAL_STRIPE_BINDING";

export type ReconResult = {
  code: string | null;            // local canonical code (null for orphan remotes)
  remoteProductId: string | null;
  remotePriceId: string | null;
  /** Exactly one primary outcome per local product. */
  primaryOutcome: PrimaryOutcome;
  /** Zero or more orthogonal anomaly flags. */
  anomalyFlags: AnomalyFlag[];
  /**
   * Derived compatibility field only. Constructed from authoritative state:
   *   classifications = [primaryOutcome, ...anomalyFlags]
   * No caller may independently mutate or construct competing classification semantics.
   * This field exists for backward compatibility with consumers that read `classifications`
   * as an array. New code should read `primaryOutcome` and `anomalyFlags` directly.
   */
  classifications: string[];
  matchedBy: "id" | "metadata" | "lookup_key" | "candidate" | "none";
  detail: string;
  // Active-state facts reported SEPARATELY — never auto-synced.
  stripeProductActive: boolean | null;
  stripePriceActive: boolean | null;
  localActive: boolean | null;
  localCommercialStatus: string | null;
};

function normName(s: string): string {
  return s.toLowerCase().replace(/[—–]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
}

/** A local product is intentionally unbound if its status implies no Stripe checkout. */
function isIntentionallyUnbound(p: LocalCommercialProduct): boolean {
  return (
    p.commercialStatus === "free_controlled" ||
    p.commercialStatus === "contracted" ||
    p.commercialStatus === "manual_billing" ||
    p.commercialStatus === "evidence_gated"
  );
}

export function reconcile(
  snapshot: StripeCatalogSnapshot,
  locals: LocalCommercialProduct[],
): ReconResult[] {
  const results: ReconResult[] = [];
  const productById = new Map(snapshot.products.map((p) => [p.id, p]));
  const pricesByProduct = new Map<string, NormalizedStripePrice[]>();
  for (const pr of snapshot.prices) {
    if (!pr.productId) continue;
    (pricesByProduct.get(pr.productId) ?? pricesByProduct.set(pr.productId, []).get(pr.productId)!).push(pr);
  }
  const matchedRemoteProductIds = new Set<string>();

  for (const local of locals) {
    const anomalyFlags: AnomalyFlag[] = [];
    let primaryOutcome: PrimaryOutcome;
    let matchedBy: ReconResult["matchedBy"] = "none";
    let remote = null as (typeof snapshot.products)[number] | null;

    // ── Remote product matching ──────────────────────────────────────────
    // (1) exact ID match
    if (local.stripeProductId && productById.has(local.stripeProductId)) {
      remote = productById.get(local.stripeProductId)!;
      matchedBy = "id";
    }
    // (2) canonical metadata match
    if (!remote) {
      const byMeta = snapshot.products.find((p) => p.aolProductCode === local.code);
      if (byMeta) { remote = byMeta; matchedBy = "metadata"; }
    }
    // (4) deterministic candidate (name + amount + currency)
    if (!remote) {
      const candidates = snapshot.products.filter((p) => normName(p.name) === normName(local.name));
      if (candidates.length === 1) { remote = candidates[0] ?? null; matchedBy = "candidate"; }
      else if (candidates.length > 1) {
        // Ambiguous: multiple remote candidates with same name
        results.push({
          code: local.code, remoteProductId: null, remotePriceId: null,
          primaryOutcome: "AMBIGUOUS_MATCH",
          anomalyFlags: [],
          classifications: ["AMBIGUOUS_MATCH"],
          matchedBy, detail: "multiple remote candidates with same name",
          stripeProductActive: null, stripePriceActive: null,
          localActive: local.active, localCommercialStatus: local.commercialStatus,
        });
        continue;
      }
    }

    // ── No remote match ──────────────────────────────────────────────────
    if (!remote) {
      if (local.stripeProductId) {
        primaryOutcome = "REMOTE_OBJECT_MISSING";
      } else if (isIntentionallyUnbound(local)) {
        primaryOutcome = "INTENTIONALLY_UNBOUND";
      } else {
        primaryOutcome = "LOCAL_ONLY_PRODUCT";
      }
      results.push({
        code: local.code, remoteProductId: null, remotePriceId: null,
        primaryOutcome, anomalyFlags,
        classifications: [primaryOutcome], matchedBy,
        detail: matchedBy === "none" ? "no remote product matched" : "",
        stripeProductActive: null, stripePriceActive: null,
        localActive: local.active, localCommercialStatus: local.commercialStatus,
      });
      continue;
    }

    matchedRemoteProductIds.add(remote.id);

    // ── Determine primary identity/binding outcome ───────────────────────
    // Order of precedence: PRODUCT_ID_MISMATCH > PRICE_ID_MISMATCH >
    // LOCAL_ID_MISSING > EXACT_MATCH
    if (!local.stripeProductId) {
      primaryOutcome = "LOCAL_ID_MISSING";
    } else if (local.stripeProductId !== remote.id) {
      primaryOutcome = "PRODUCT_ID_MISMATCH";
    } else {
      // Product ID matches. Check Price.
      const remotePrices = pricesByProduct.get(remote.id) ?? [];
      if (local.stripePriceId) {
        const matchedPrice = remotePrices.find((pr) => pr.id === local.stripePriceId);
        if (!matchedPrice) {
          primaryOutcome = "PRICE_ID_MISMATCH";
        } else {
          primaryOutcome = "EXACT_MATCH";
        }
      } else {
        primaryOutcome = "LOCAL_ID_MISSING";
      }
    }

    // ── Collect orthogonal anomaly flags ─────────────────────────────────
    const remotePrices = pricesByProduct.get(remote.id) ?? [];
    const activePrices = remotePrices.filter((pr) => pr.active);

    let matchedPrice: NormalizedStripePrice | null = null;
    if (local.stripePriceId) {
      matchedPrice = remotePrices.find((pr) => pr.id === local.stripePriceId) ?? null;
    } else {
      if (activePrices.length > 1) anomalyFlags.push("MULTIPLE_ACTIVE_PRICE_CANDIDATES");
      matchedPrice = activePrices.length === 1 ? (activePrices[0] ?? null) : null;
    }

    // Field drift (only where we have a matched price)
    if (matchedPrice) {
      if (local.amount != null && matchedPrice.unitAmount != null && local.amount !== matchedPrice.unitAmount) anomalyFlags.push("AMOUNT_MISMATCH");
      if (matchedPrice.currency && local.currency && matchedPrice.currency.toLowerCase() !== local.currency.toLowerCase()) anomalyFlags.push("CURRENCY_MISMATCH");
      if ((local.recurringInterval ?? null) !== (matchedPrice.recurringInterval ?? null)) anomalyFlags.push("INTERVAL_MISMATCH");
    }

    // Active-state drift (reported, NEVER auto-synced)
    if (remote.active !== local.active) anomalyFlags.push("ACTIVE_STATE_DRIFT");

    // Informational binding: free/manual product that nonetheless maps to a remote.
    // This is an anomaly flag only — it never replaces the primary outcome.
    if (isIntentionallyUnbound(local) && primaryOutcome !== "PRODUCT_ID_MISMATCH") {
      anomalyFlags.push("INFORMATIONAL_STRIPE_BINDING");
    }

    const allClassifications = [primaryOutcome, ...anomalyFlags];

    results.push({
      code: local.code, remoteProductId: remote.id, remotePriceId: matchedPrice?.id ?? null,
      primaryOutcome, anomalyFlags,
      classifications: allClassifications,
      matchedBy,
      detail: `${remotePrices.length} price(s), ${activePrices.length} active`,
      stripeProductActive: remote.active, stripePriceActive: matchedPrice?.active ?? null,
      localActive: local.active, localCommercialStatus: local.commercialStatus,
    });
  }

  // Orphan remote products (in Stripe, not matched to any local)
  for (const p of snapshot.products) {
    if (matchedRemoteProductIds.has(p.id)) continue;
    results.push({
      code: null, remoteProductId: p.id, remotePriceId: null,
      primaryOutcome: "EXACT_MATCH" as PrimaryOutcome, // orphan remotes have no local primary outcome
      anomalyFlags: [],
      classifications: ["ORPHAN_REMOTE_PRODUCT"], matchedBy: "none",
      detail: `orphan remote: "${p.name}"`,
      stripeProductActive: p.active, stripePriceActive: null,
      localActive: null, localCommercialStatus: null,
    });
  }

  return results;
}

/** Orphan disposition recommendations (recommendation only — no Stripe writes). */
export type OrphanDisposition = "MAP_TO_EXISTING_PRODUCT" | "LEGACY_KEEP" | "ARCHIVE_CANDIDATE" | "INTERNAL_BILLING_ONLY" | "DUPLICATE_REVIEW";

export function recommendOrphanDisposition(name: string): OrphanDisposition {
  const n = normName(name);
  if (/subscription fee|engagement fee|annual subscription/.test(n)) return "INTERNAL_BILLING_ONLY";
  if (/test|demo|sample/.test(n)) return "ARCHIVE_CANDIDATE";
  return "DUPLICATE_REVIEW";
}
