/**
 * lib/commercial/gmi/gmi-edition-registry.ts
 *
 * Canonical registry of GMI quarterly editions.
 *
 * This is the ONLY file that needs to change when a new GMI edition is released.
 * The factory derives all catalog fields (routes, entitlement slugs, display names,
 * access mode, pricing visibility) from the registry entry.
 *
 * Rules enforced at build/import time by the factory:
 *   - Exactly one edition may be current: true
 *   - Active paid_checkout editions require stripeProductId + stripePriceId
 *   - Draft editions must have hiddenFromPricing: true
 *   - Archived/retired editions must not be current
 *   - manual_billing editions do not require Stripe IDs
 *
 * To release a new quarter:
 *   1. Add a new entry to GMI_EDITION_REGISTRY below
 *   2. Set current: false on the outgoing edition
 *   3. Set current: true on the incoming edition
 *   4. Set status: "archived" on the outgoing edition
 *   5. Add Stripe IDs when the edition is ready for paid_checkout
 *   6. Run pnpm exec vitest run tests/product-estate/gmi-edition-catalog-factory.test.ts
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
  /** Price in pence GBP. Default 5900 (£59) if omitted. */
  amountGbp?: number;
  /** Display price string e.g. "£59". Derived from amountGbp if omitted. */
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
  // ── Q1 2026 — archived ──────────────────────────────────────────────────────
  // Superseded by Q2. Still purchasable for historical reference.
  // Stripe IDs confirmed: prod_UNnSL8r6DMedEH
  {
    editionId: "GMI-Q1-2026",
    productCode: "gmi_q1_2026",
    quarter: "Q1",
    year: 2026,
    title: "Global Market Report — Q1 2026",
    slug: "q1-2026",
    status: "archived",
    current: false,
    hiddenFromPricing: true,
    hiddenReason: "superseded_by_q2",
    stripeProductId: "prod_UNnSL8r6DMedEH",
    stripePriceId: "price_1TP1rRQFpelVFMXJWaFMOpJQ",
    amountGbp: 5900,
    displayPrice: "£59",
    releaseDate: "2026-04-08",
    shortDescription: "Q1 2026 market report — archived edition. Available for historical reference.",
    pricingNote: "Coverage period: Q1 2026. Superseded by Q2 2026 edition. Updated 8 April 2026.",
  },

  // ── Q2 2026 — current (manual_billing) ─────────────────────────────────────
  // Current published edition. No self-serve checkout yet — access via enquiry.
  // To move to paid_checkout: add stripeProductId + stripePriceId and change status to "active".
  {
    editionId: "GMI-Q2-2026",
    productCode: "gmi_q2_2026",
    quarter: "Q2",
    year: 2026,
    title: "Global Market Report — Q2 2026",
    slug: "q2-2026",
    status: "manual_billing",
    current: true,
    hiddenFromPricing: false,
    stripeProductId: null,
    stripePriceId: null,
    amountGbp: 5900,
    displayPrice: "£59",
    releaseDate: "2026-06-01",
    shortDescription: "Q2 2026 market report — current published edition. Market context and analysis for the current decision window.",
    pricingNote: "Coverage period: Q2 2026. Current decision window: Q2 2026. Published June 2026.",
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
    displayPrice: "£59",
    releaseDate: undefined,
    shortDescription: "Q3 2026 market report — not yet released.",
    pricingNote: "Draft — not yet available.",
  },
];
