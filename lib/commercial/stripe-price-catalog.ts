// lib/commercial/catalog.ts

export type CommercialCategory =
  | "reporting"
  | "execution"
  | "decision_tools"
  | "bundle"
  | "intelligence"
  | "membership"
  | "service";

export type CommercialAccessType =
  | "one_time"
  | "subscription"
  | "free"
  | "gated";

export type CommercialDuration =
  | "lifetime"
  | "membership_bound"
  | "time_limited";

export type CommercialProductCode =
  | "executive_reporting"
  | "strategy_room"
  | "decision_exposure_instrument"
  | "mandate_clarity_framework"
  | "intervention_path_selector"
  | "operator_decision_pack"
  | "gmi_q1_2026"
  | "diagnostic_report_basic"
  | "diagnostic_report_pro"
  | "executive_reporting_priority"
  | "inner_circle";

export type CommercialCatalogEntry = {
  productCode: CommercialProductCode;
  displayName: string;
  stripeProductId: string;
  stripePriceId: string;
  entitlementSlug: string;
  category: CommercialCategory;
  accessType: CommercialAccessType;
  duration: CommercialDuration;
  unitAmountGbp: number;
  active: boolean;
  includes?: CommercialProductCode[];
};

export const COMMERCIAL_CATALOG: Record<
  CommercialProductCode,
  CommercialCatalogEntry
> = {
  executive_reporting: {
    productCode: "executive_reporting",
    displayName: "Executive Reporting",
    stripeProductId: "prod_REPLACE_EXECUTIVE_REPORTING",
    stripePriceId: "price_REPLACE_EXECUTIVE_REPORTING",
    entitlementSlug: "assessment.executive_reporting",
    category: "reporting",
    accessType: "one_time",
    duration: "lifetime",
    unitAmountGbp: 9500,
    active: true,
  },

  strategy_room: {
    productCode: "strategy_room",
    displayName: "Strategy Room",
    stripeProductId: "prod_REPLACE_STRATEGY_ROOM",
    stripePriceId: "price_REPLACE_STRATEGY_ROOM",
    entitlementSlug: "strategy_room",
    category: "execution",
    accessType: "one_time",
    duration: "lifetime",
    unitAmountGbp: 39500,
    active: true,
  },

  decision_exposure_instrument: {
    productCode: "decision_exposure_instrument",
    displayName: "Decision Exposure Instrument",
    stripeProductId: "prod_REPLACE_DECISION_EXPOSURE",
    stripePriceId: "price_REPLACE_DECISION_EXPOSURE",
    entitlementSlug: "decision-exposure-instrument",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    unitAmountGbp: 2900,
    active: true,
  },

  mandate_clarity_framework: {
    productCode: "mandate_clarity_framework",
    displayName: "Mandate Clarity Framework",
    stripeProductId: "prod_REPLACE_MANDATE_CLARITY",
    stripePriceId: "price_REPLACE_MANDATE_CLARITY",
    entitlementSlug: "mandate-clarity-framework",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    unitAmountGbp: 4900,
    active: true,
  },

  intervention_path_selector: {
    productCode: "intervention_path_selector",
    displayName: "Intervention Path Selector",
    stripeProductId: "prod_REPLACE_INTERVENTION_PATH",
    stripePriceId: "price_REPLACE_INTERVENTION_PATH",
    entitlementSlug: "intervention-path-selector",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    unitAmountGbp: 7900,
    active: true,
  },

  operator_decision_pack: {
    productCode: "operator_decision_pack",
    displayName: "Operator Decision Pack",
    stripeProductId: "prod_REPLACE_OPERATOR_PACK",
    stripePriceId: "price_REPLACE_OPERATOR_PACK",
    entitlementSlug: "operator-decision-pack",
    category: "bundle",
    accessType: "one_time",
    duration: "lifetime",
    unitAmountGbp: 12900,
    active: true,
    includes: [
      "decision_exposure_instrument",
      "mandate_clarity_framework",
      "intervention_path_selector",
    ],
  },

  gmi_q1_2026: {
    productCode: "gmi_q1_2026",
    displayName: "Global Market Intelligence Report — Q1 2026",
    stripeProductId: "prod_REPLACE_GMI_Q1_2026",
    stripePriceId: "price_REPLACE_GMI_Q1_2026",
    entitlementSlug: "global-market-intelligence-report-q1-2026",
    category: "intelligence",
    accessType: "one_time",
    duration: "lifetime",
    unitAmountGbp: 5900,
    active: true,
  },

  diagnostic_report_basic: {
    productCode: "diagnostic_report_basic",
    displayName: "Diagnostic Report — Basic",
    stripeProductId: "prod_REPLACE_DIAGNOSTIC_BASIC",
    stripePriceId: "price_REPLACE_DIAGNOSTIC_BASIC",
    entitlementSlug: "diagnostic-report-basic",
    category: "service",
    accessType: "one_time",
    duration: "lifetime",
    unitAmountGbp: 25000,
    active: true,
  },

  diagnostic_report_pro: {
    productCode: "diagnostic_report_pro",
    displayName: "Diagnostic Report — Pro",
    stripeProductId: "prod_REPLACE_DIAGNOSTIC_PRO",
    stripePriceId: "price_REPLACE_DIAGNOSTIC_PRO",
    entitlementSlug: "diagnostic-report-pro",
    category: "service",
    accessType: "one_time",
    duration: "lifetime",
    unitAmountGbp: 75000,
    active: true,
  },

  executive_reporting_priority: {
    productCode: "executive_reporting_priority",
    displayName: "Executive Reporting — Priority",
    stripeProductId: "prod_REPLACE_EXEC_REPORT_PRIORITY",
    stripePriceId: "price_REPLACE_EXEC_REPORT_PRIORITY",
    entitlementSlug: "executive-reporting-priority",
    category: "service",
    accessType: "one_time",
    duration: "lifetime",
    unitAmountGbp: 125000,
    active: true,
  },

  inner_circle: {
    productCode: "inner_circle",
    displayName: "Inner Circle",
    stripeProductId: "prod_REPLACE_INNER_CIRCLE",
    stripePriceId: "price_REPLACE_INNER_CIRCLE",
    entitlementSlug: "inner-circle",
    category: "membership",
    accessType: "subscription",
    duration: "membership_bound",
    unitAmountGbp: 0, // replace when finalised
    active: true,
  },
};

export function getCommercialProduct(productCode: CommercialProductCode) {
  return COMMERCIAL_CATALOG[productCode];
}

export function getCommercialProductBySlug(slug: string) {
  return Object.values(COMMERCIAL_CATALOG).find(
    (entry) => entry.entitlementSlug === slug,
  );
}

export function getCommercialProductByPriceId(priceId: string) {
  return Object.values(COMMERCIAL_CATALOG).find(
    (entry) => entry.stripePriceId === priceId,
  );
}

export function getCommercialProductByStripeProductId(productId: string) {
  return Object.values(COMMERCIAL_CATALOG).find(
    (entry) => entry.stripeProductId === productId,
  );
}