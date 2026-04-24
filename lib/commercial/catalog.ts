/**
 * lib/commercial/catalog.ts — COMMERCIAL CATALOG (SINGLE SOURCE OF TRUTH)
 *
 * All 15 canonical products. Stripe IDs embedded. No env var price deps.
 * Checkout, webhook, admin, and access-resolution all read from here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ──────────���──────────────────────────────────────────────────────────────────

export type AccessType = "one_time" | "free" | "subscription";
export type Duration = "lifetime" | "monthly" | "semi_annual" | "annual";
export type ProductCategory =
  | "decision_tools"
  | "bundle"
  | "evidence"
  | "intelligence"
  | "reporting"
  | "reporting_premium"
  | "execution"
  | "execution_premium"
  | "membership"
  | "retainer";

export type CatalogProduct = {
  code: string;
  displayName: string;
  amount: number;
  displayPrice: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  entitlementSlug: string;
  /** Metadata tier label (routing, NOT access tier enum) */
  tier: string;
  category: ProductCategory;
  accessType: AccessType;
  duration: Duration;
  active: boolean;
  successPath: string;
  cancelPath: string;
  cookieName: string | null;
  includes: string[];
};

// ─────────────────────────────────────���───────────────────────────────────────
// Catalog — 15 Products
// ──────────────���────────────────────────────��─────────────────────────────────

export const CATALOG: Record<string, CatalogProduct> = {

  // ═══ A. DECISION LAYER ═══════════════════════════════════════════════════

  decision_exposure_instrument: {
    code: "decision_exposure_instrument",
    displayName: "Decision Exposure Instrument",
    amount: 2900,
    displayPrice: "\u00a329",
    stripeProductId: "prod_SRLlGzqV6k3dDH",
    stripePriceId: "price_1TP1XIQFpelVFMXJ35YurntT",
    entitlementSlug: "decision-exposure-instrument",
    tier: "decision-instrument",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    successPath: "/decision-instruments/decision-exposure-instrument",
    cancelPath: "/decision-instruments/decision-exposure-instrument",
    cookieName: null,
    includes: [],
  },

  mandate_clarity_framework: {
    code: "mandate_clarity_framework",
    displayName: "Mandate Clarity Framework",
    amount: 4900,
    displayPrice: "\u00a349",
    stripeProductId: "prod_SRLmhJBFLjXDnp",
    stripePriceId: "price_1TP1ZaQFpelVFMXJovfynFoS",
    entitlementSlug: "mandate-clarity-framework",
    tier: "decision-instrument",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    successPath: "/decision-instruments/mandate-clarity-framework",
    cancelPath: "/decision-instruments/mandate-clarity-framework",
    cookieName: null,
    includes: [],
  },

  intervention_path_selector: {
    code: "intervention_path_selector",
    displayName: "Intervention Path Selector",
    amount: 7900,
    displayPrice: "\u00a379",
    stripeProductId: "prod_SRLnPE5yKPOBJH",
    stripePriceId: "price_1TP1dRQFpelVFMXJvVlFQjWH",
    entitlementSlug: "intervention-path-selector",
    tier: "decision-instrument",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    successPath: "/decision-instruments/intervention-path-selector",
    cancelPath: "/decision-instruments/intervention-path-selector",
    cookieName: null,
    includes: [],
  },

  operator_decision_pack: {
    code: "operator_decision_pack",
    displayName: "Operator Decision Pack",
    amount: 12900,
    displayPrice: "\u00a3129",
    stripeProductId: "prod_SRLpFVDmjvVsv3",
    stripePriceId: "price_1TP1idQFpelVFMXJG77Vj5bE",
    entitlementSlug: "operator-decision-pack",
    tier: "decision-pack",
    category: "bundle",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    successPath: "/decision-instruments",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [
      "decision_exposure_instrument",
      "mandate_clarity_framework",
      "intervention_path_selector",
    ],
  },

  // ═══ B. EVIDENCE LAYER ═���═════════════════════════════════════════════════

  case_dossier_tariff_shock: {
    code: "case_dossier_tariff_shock",
    displayName: "Case Dossier \u2014 Tariff Shock",
    amount: 0,
    displayPrice: "Free",
    stripeProductId: null,
    stripePriceId: "price_1TP1lhQFpelVFMXJN4xf1yxW",
    entitlementSlug: "case-dossier-tariff-shock",
    tier: "evidence",
    category: "evidence",
    accessType: "free",
    duration: "lifetime",
    active: true,
    successPath: "/evidence/tariff-shock-growth-break",
    cancelPath: "/evidence",
    cookieName: null,
    includes: [],
  },

  case_dossier_team_alignment: {
    code: "case_dossier_team_alignment",
    displayName: "Case Dossier \u2014 Team Alignment",
    amount: 0,
    displayPrice: "Free",
    stripeProductId: null,
    stripePriceId: "price_1TP1nMQFpelVFMXJukt9E22Z",
    entitlementSlug: "case-dossier-team-alignment-illusion",
    tier: "evidence",
    category: "evidence",
    accessType: "free",
    duration: "lifetime",
    active: true,
    successPath: "/evidence/team-alignment-illusion",
    cancelPath: "/evidence",
    cookieName: null,
    includes: [],
  },

  case_dossier_escalation_denied: {
    code: "case_dossier_escalation_denied",
    displayName: "Case Dossier \u2014 Escalation Denied",
    amount: 0,
    displayPrice: "Free",
    stripeProductId: null,
    stripePriceId: "price_1TP1omQFpelVFMXJtUTNXdkc",
    entitlementSlug: "case-dossier-escalation-denied",
    tier: "evidence",
    category: "evidence",
    accessType: "free",
    duration: "lifetime",
    active: true,
    successPath: "/evidence/escalation-denied-case",
    cancelPath: "/evidence",
    cookieName: null,
    includes: [],
  },

  // ═══ C. INTELLIGENCE LAYER ���════════════════════════���═════════════════════

  gmi_q1_2026: {
    code: "gmi_q1_2026",
    displayName: "Global Market Intelligence Report \u2014 Q1 2026",
    amount: 5900,
    displayPrice: "\u00a359",
    stripeProductId: null,
    stripePriceId: "price_1TP1rRQFpelVFMXJWaFMOpJQ",
    entitlementSlug: "global-market-intelligence-report-q1-2026",
    tier: "premium-report",
    category: "intelligence",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    successPath: "/artifacts/global-market-intelligence-report-q1-2026",
    cancelPath: "/artifacts/global-market-intelligence-report-q1-2026",
    cookieName: null,
    includes: [],
  },

  // ═══ D. REPORTING LAYER ══════���═══════════════════════════════════════════

  executive_reporting: {
    code: "executive_reporting",
    displayName: "Executive Reporting — Standard",
    amount: 19500,
    displayPrice: "\u00a3195",
    stripeProductId: "prod_SQGrT5cFHJ3MFH",
    stripePriceId: "price_1TOLggQFpelVFMXJKSSxZvKv",
    entitlementSlug: "assessment.executive_reporting",
    tier: "one-time-executive-reporting",
    category: "reporting",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    successPath: "/diagnostics/executive-reporting/run",
    cancelPath: "/diagnostics/executive-reporting",
    cookieName: "aol_paid_executive_reporting",
    includes: [],
  },

  diagnostic_report_basic: {
    code: "diagnostic_report_basic",
    displayName: "Diagnostic Report \u2014 Basic",
    amount: 25000,
    displayPrice: "\u00a3250",
    stripeProductId: null,
    stripePriceId: "price_1TP1ufQFpelVFMXJ4NqwIXjv",
    entitlementSlug: "diagnostic-report-basic",
    tier: "one-time-reporting",
    category: "reporting",
    accessType: "one_time",
    duration: "lifetime",
    active: false,
    successPath: "/diagnostics",
    cancelPath: "/diagnostics",
    cookieName: null,
    includes: [],
  },

  diagnostic_report_pro: {
    code: "diagnostic_report_pro",
    displayName: "Diagnostic Report \u2014 Pro",
    amount: 75000,
    displayPrice: "\u00a3750",
    stripeProductId: null,
    stripePriceId: "price_1TP1w5QFpelVFMXJvIQUVqgz",
    entitlementSlug: "diagnostic-report-pro",
    tier: "one-time-reporting",
    category: "reporting",
    accessType: "one_time",
    duration: "lifetime",
    active: false,
    successPath: "/diagnostics",
    cancelPath: "/diagnostics",
    cookieName: null,
    includes: [],
  },

  executive_reporting_priority: {
    code: "executive_reporting_priority",
    displayName: "Executive Reporting \u2014 Advanced",
    amount: 29500,
    displayPrice: "\u00a3295",
    stripeProductId: "prod_SQGrT5cFHJ3MFH",
    stripePriceId: "price_1TP22XQFpelVFMXJ4IWRIaqb",
    entitlementSlug: "executive-reporting-priority",
    tier: "one-time-reporting-priority",
    category: "reporting_premium",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    successPath: "/diagnostics/executive-reporting/run",
    cancelPath: "/diagnostics/executive-reporting",
    cookieName: "aol_paid_executive_reporting",
    includes: [],
  },

  // ═��═ E. EXECUTION LAYER ��═══════════��════════════════════════════════��════

  strategy_room: {
    code: "strategy_room",
    displayName: "Strategy Room \u2014 Entry",
    amount: 75000,
    displayPrice: "\u00a3750",
    stripeProductId: "prod_UOAYVuehd5sSG0",
    stripePriceId: "price_1TPODlQFpelVFMXJY3Mo0ayo",
    entitlementSlug: "strategy-room.entry",
    tier: "one-time-strategy-room",
    category: "execution",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    successPath: "/strategy-room",
    cancelPath: "/strategy-room",
    cookieName: "aol_paid_strategy_room",
    includes: [],
  },

  strategy_room_extended: {
    code: "strategy_room_extended",
    displayName: "Strategy Room \u2014 Active / Multi-Decision",
    amount: 125000,
    displayPrice: "\u00a31,250",
    stripeProductId: "prod_UOAYVuehd5sSG0",
    stripePriceId: "price_1TP26NQFpelVFMXJgMpsREew",
    entitlementSlug: "strategy-room-extended",
    tier: "execution-premium",
    category: "execution_premium",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    successPath: "/strategy-room",
    cancelPath: "/strategy-room",
    cookieName: "aol_paid_strategy_room",
    includes: [],
  },

  // ══�� F. MEMBERSHIP LAYER ═══════════════════════════════════════════════��═

  inner_circle: {
    code: "inner_circle",
    displayName: "Inner Circle",
    amount: 3000,
    displayPrice: "\u00a330/mo",
    stripeProductId: null,
    stripePriceId: "price_1TP20xQFpelVFMXJwBO0Kz1h",
    entitlementSlug: "inner-circle",
    tier: "inner-circle",
    category: "membership",
    accessType: "subscription",
    duration: "monthly",
    active: false,
    successPath: "/inner-circle",
    cancelPath: "/",
    cookieName: null,
    includes: [],
  },

  // ═══ G. ENTERPRISE RETAINER LAYER ════════════════════════════════════════
  // Stripe subscription price IDs are intentionally not guessed here. These
  // products are first-class catalog identities, but inactive until contracted
  // monthly prices are created in Stripe and inserted into this SSOT.

  retainer_core: {
    code: "retainer_core",
    displayName: "Decision Authority Retainer — Core",
    amount: 0,
    displayPrice: "Contracted monthly",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "retainer_core",
    tier: "CORE",
    category: "retainer",
    accessType: "subscription",
    duration: "monthly",
    active: false,
    successPath: "/retainer",
    cancelPath: "/retainer",
    cookieName: null,
    includes: [],
  },

  retainer_operational: {
    code: "retainer_operational",
    displayName: "Decision Authority Retainer — Operational",
    amount: 0,
    displayPrice: "Contracted monthly",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "retainer_operational",
    tier: "OPERATIONAL",
    category: "retainer",
    accessType: "subscription",
    duration: "monthly",
    active: false,
    successPath: "/retainer",
    cancelPath: "/retainer",
    cookieName: null,
    includes: [],
  },

  retainer_institutional: {
    code: "retainer_institutional",
    displayName: "Decision Authority Retainer — Institutional",
    amount: 0,
    displayPrice: "Contracted monthly",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "retainer_institutional",
    tier: "INSTITUTIONAL",
    category: "retainer",
    accessType: "subscription",
    duration: "monthly",
    active: false,
    successPath: "/retainer",
    cancelPath: "/retainer",
    cookieName: null,
    includes: [],
  },
};

// ───────────────��───────────────────────────────��─────────────────────────────
// Lookups
// ───────��────────────────���────────────────────────────────────────────────────

export function getProduct(code: string): CatalogProduct | null {
  return CATALOG[code] ?? null;
}

export function requireProduct(code: string): CatalogProduct {
  const product = getProduct(code);
  if (!product) {
    throw new Error(`Unknown commercial product: ${code}`);
  }
  return product;
}

export function getProductDisplayPrice(code: string): string {
  return requireProduct(code).displayPrice;
}

export function getProductAmountGbp(code: string): number {
  return requireProduct(code).amount / 100;
}

export function getAllProducts(): CatalogProduct[] {
  return Object.values(CATALOG);
}

export function getActiveProducts(): CatalogProduct[] {
  return getAllProducts().filter((p) => p.active);
}

export function getActivePaidProducts(): CatalogProduct[] {
  return getActiveProducts().filter((p) => p.accessType !== "free" && p.amount > 0);
}

export function getProductsByCategory(cat: ProductCategory): CatalogProduct[] {
  return getAllProducts().filter((p) => p.category === cat);
}

export function getProductByStripePriceId(priceId: string): CatalogProduct | null {
  return getAllProducts().find((p) => p.stripePriceId === priceId) ?? null;
}

export function getProductByStripeProductId(productId: string): CatalogProduct | null {
  return getAllProducts().find((p) => p.stripeProductId === productId) ?? null;
}

export function getProductByEntitlementSlug(slug: string): CatalogProduct | null {
  return getAllProducts().find((p) => p.entitlementSlug === slug) ?? null;
}

export function isValidProductCode(code: string): boolean {
  return code in CATALOG;
}

export function getStripePriceId(code: string): string | null {
  return getProduct(code)?.stripePriceId ?? null;
}

export function getCookieConfig(code: string): { cookieName: string } | null {
  const p = getProduct(code);
  return p?.cookieName ? { cookieName: p.cookieName } : null;
}

// ─────────────────────────────────────────────────────────���───────────────────
// Bundle Logic
// ────────��────────────────────────────────────────────────────────────────────

export function isBundle(code: string): boolean {
  const p = getProduct(code);
  return Boolean(p && p.includes.length > 0);
}

export function resolveEntitlementSlugs(code: string): string[] {
  const product = getProduct(code);
  if (!product) return [];
  const slugs = [product.entitlementSlug];
  for (const includedCode of product.includes) {
    const included = getProduct(includedCode);
    if (included) slugs.push(included.entitlementSlug);
  }
  return slugs;
}

// ─────────��─────────────────────────���─────────────────────────────��───────────
// Activation Guardrails
// ─────────���───────────────────────────────────────────────────────────────────

export type CheckoutEligibility =
  | { eligible: true; product: CatalogProduct }
  | { eligible: false; reason: string };

/** Check if a product can be purchased right now. */
export function checkCheckoutEligibility(code: string): CheckoutEligibility {
  const product = getProduct(code);
  if (!product) return { eligible: false, reason: "UNKNOWN_PRODUCT" };
  if (!product.active) return { eligible: false, reason: "PRODUCT_INACTIVE" };
  if (product.accessType === "free") return { eligible: false, reason: "FREE_PRODUCT_NOT_PURCHASABLE" };
  if (product.amount <= 0) return { eligible: false, reason: "ZERO_AMOUNT" };
  return { eligible: true, product };
}

// ─────────────���─────────────────────────────────────────────���─────────────────
// Legacy Compatibility
// ────��─────────────────────────────────────────────────────────────���──────────

/** Resolve a code that might use old slug format (hyphens vs underscores). */
export function resolveProductCode(codeOrSlug: string): CatalogProduct | null {
  return getProduct(codeOrSlug)
    ?? getProduct(codeOrSlug.replace(/-/g, "_"))
    ?? getProductByEntitlementSlug(codeOrSlug)
    ?? null;
}
