/**
 * lib/commercial/gmi/gmi-edition-registry.ts
 *
 * Canonical registry of GMI quarterly editions.
 *
 * This is the commercial/catalog view of GMI editions. It is NOT the publication
 * authority. The single source of publication truth is the lifecycle module:
 *   lib/intelligence/market-intelligence-lifecycle.ts
 * The factory cross-checks this registry against that lifecycle at build/import
 * time (assertGmiRegistryAgreesWithLifecycle) and fails closed on contradiction.
 *
 * `current` here is an ADMIN in-preparation focus flag only — it does NOT mean
 * "current published". Public/commercial "current published issue" is computed
 * from the lifecycle via getCurrentPublishedMarketIntelligenceReport(). Never
 * read `current: true` as publication truth.
 *
 * Rules enforced at build/import time by the factory:
 *   - Exactly one edition may be current: true (admin focus)
 *   - Active paid_checkout editions require stripeProductId + stripePriceId
 *   - Draft editions must have hiddenFromPricing: true
 *   - Archived/retired editions must not be current
 *   - manual_billing editions do not require Stripe IDs
 *   - Commercial status/visibility must agree with the lifecycle record
 *
 * To release a new quarter (see project_gmi_q2_release_workflow):
 *   1. Promote lifecycle state in market-intelligence-lifecycle.ts first
 *      (DRAFT → ACTIVE_UNTIL_SUPERSEDED; supersede the outgoing edition).
 *   2. Reconcile this registry to match: incoming → status "active"/"manual_billing"
 *      + visible; outgoing → status "archived" + hiddenFromPricing.
 *   3. Add Stripe IDs when the edition is ready for paid_checkout.
 *   4. Run pnpm exec vitest run tests/product-estate/gmi-edition-catalog-factory.test.ts
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type GmiEditionCommercialStatus =
  | "draft"          // Not yet released. Hidden from pricing. No checkout allowed.
  | "active"         // Active paid checkout edition. Requires stripeProductId + stripePriceId.
  | "manual_billing" // Active but no self-serve checkout. Routes to enquiry/intake.
  | "archived"       // Superseded edition. Hidden from pricing. Checkout still possible for historical access.
  | "retired";       // Decommissioned. No checkout. No route. Admin record only.

export type GmiEditionRegistryEntry = {
  /** Unique human-readable ID: "GMI-Q2-2026" */
  editionId: string;
  /** Catalog product code: "gmi_q2_2026" */
  productCode: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  /** Full title for display: "Global Market Intelligence Report — Q2 2026" */
  title: string;
  /** URL slug: "q2-2026" — used to build routes and artifact paths */
  slug: string;
  status: GmiEditionCommercialStatus;
  /** Exactly one edition must have current: true */
  current: boolean;
  hiddenFromPricing: boolean;
  hiddenReason?: string;
  /** Required if status === "active" (paid_checkout). Null for manual_billing/draft. */
  stripeProductId?: string | null;
  /** Required if status === "active" (paid_checkout). Null for manual_billing/draft. */
  stripePriceId?: string | null;
  /** Price in pence GBP. Default 5900 pence if omitted. */
  amountGbp?: number;
  /** Display price string. Derived from amountGbp if omitted. */
  displayPrice?: string;
  /** ISO date when this edition was or will be released */
  releaseDate?: string;
  /** Short description for pricing/product pages */
  shortDescription?: string;
  /** Pricing note shown on product/pricing page */
  pricingNote?: string;
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const GMI_EDITION_REGISTRY: GmiEditionRegistryEntry[] = [
  // ── Q1 2026 — current published issue until Q2 release authority ─────────────
  // Reconciled to the authoritative lifecycle: Q1 remains the current published
  // issue until GMI-Q2-2026 completes its final data lock and owner release.
  {
    editionId: "GMI-Q1-2026",
    productCode: "gmi_q1_2026",
    quarter: "Q1",
    year: 2026,
    title: "Global Market Report — Q1 2026",
    slug: "q1-2026",
    status: "active",
    current: false,
    hiddenFromPricing: false,
    stripeProductId: "prod_UNnSL8r6DMedEH",
    stripePriceId: "price_1TP1rRQFpelVFMXJWaFMOpJQ",
    amountGbp: 5900,
    releaseDate: "2026-04-08",
    shortDescription: "Q1 2026 market report — current published edition until Q2 receives owner release authority.",
    pricingNote: "Coverage period: Q1 2026. Current published edition until GMI-Q2-2026 completes final data lock and owner release authority.",
  },

  // ── Q2 2026 — MARKET-READY release candidate (commercial activation blocked) ──
  // Reconciled to the authoritative lifecycle: GMI-Q2-2026 remains DRAFT until final data lock and owner release authority.
  // It preserves the edition amount identity but is not public-visible or purchasable yet.
  // No Stripe product/price IDs are bound; self-serve checkout remains disabled.
  {
    editionId: "GMI-Q2-2026",
    productCode: "gmi_q2_2026",
    quarter: "Q2",
    year: 2026,
    title: "Global Market Intelligence — Q2 2026",
    slug: "q2-2026",
    status: "draft",
    current: true,
    hiddenFromPricing: true,
    hiddenReason: "awaiting_post_8_july_data_lock_and_owner_release_authority",
    stripeProductId: null,
    stripePriceId: null,
    amountGbp: 5900,
    releaseDate: "2026-07-08",
    shortDescription: "Quarterly decision intelligence for leaders operating under structural uncertainty.",
    pricingNote: "Coverage period: Q2 2026. Structurally market-ready release candidate; commercial activation awaits post-8-July data lock and owner release authority. No self-serve checkout.",
  },

  // ── Q3 2026 — draft (blocked) ───────────────────────────────────────────────
  // Not yet released. Add Stripe IDs and change status to "active" or "manual_billing"
  // when the edition is ready. Do NOT set current: true until ready to publish.
  {
    editionId: "GMI-Q3-2026",
    productCode: "gmi_q3_2026",
    quarter: "Q3",
    year: 2026,
    title: "Global Market Report — Q3 2026",
    slug: "q3-2026",
    status: "draft",
    current: false,
    hiddenFromPricing: true,
    hiddenReason: "draft_not_yet_released",
    stripeProductId: null,
    stripePriceId: null,
    amountGbp: 5900,
    releaseDate: undefined,
    shortDescription: "Q3 2026 market report — not yet released.",
    pricingNote: "Draft — not yet available.",
  },
];
