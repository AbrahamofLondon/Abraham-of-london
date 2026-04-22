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
  | "membership";

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
    stripePriceId: "price_1TOmnAQFpelVFMXJxJTN1liy",
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
    stripePriceId: "price_1TOmoUQFpelVFMXJAYjKKkb2",
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
    stripePriceId: "price_1TOmpKQFpelVFMXJsPU6e6rI",
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
    stripePriceId: "price_1TOmqvQFpelVFMXJo5IH2hcq",
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
    stripePriceId: null,
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
    stripePriceId: null,
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
    stripePriceId: null,
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
    displayName: "Executive Reporting",
    amount: 9500,
    displayPrice: "\u00a395",
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
    stripePriceId: null,
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
    stripePriceId: null,
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
    displayName: "Executive Reporting \u2014 Priority",
    amount: 125000,
    displayPrice: "\u00a31,250",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "executive-reporting-priority",
    tier: "one-time-reporting-priority",
    category: "reporting_premium",
    accessType: "one_time",
    duration: "lifetime",
    active: false,
    successPath: "/diagnostics/executive-reporting/run",
    cancelPath: "/diagnostics/executive-reporting",
    cookieName: "aol_paid_executive_reporting",
    includes: [],
  },

  // ═��═ E. EXECUTION LAYER ��═══════════��════════════════════════════════��════

  strategy_room: {
    code: "strategy_room",
    displayName: "Strategy Room",
    amount: 39500,
    displayPrice: "\u00a3395",
    stripeProductId: "prod_SQGsGHhBiAFnG2",
    stripePriceId: "price_1TOLsPQFpelVFMXJ5ieJsFas",
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
    displayName: "Strategy Room \u2014 Extended Intervention",
    amount: 380000,
    displayPrice: "\u00a33,800",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "strategy-room-extended",
    tier: "execution-premium",
    category: "execution_premium",
    accessType: "subscription",
    duration: "semi_annual",
    active: false,
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
    stripePriceId: null,
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
};

// ───────────────��───────────────────────────────��─────────────────────────────
// Lookups
// ───────��────────────────���────────────────────────────────────────────────────

export function getProduct(code: string): CatalogProduct | null {
  return CATALOG[code] ?? null;
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
  if (!product.stripePriceId) return { eligible: false, reason: "MISSING_STRIPE_PRICE_ID" };
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
