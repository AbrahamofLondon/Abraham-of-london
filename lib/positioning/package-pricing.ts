// lib/positioning/package-pricing.ts
// Resolves pricing by package type. Extends (not replaces) existing commercial-access.

import type { OfferPackage } from "./package-model";
import type { CommercialProduct } from "@/lib/server/billing/commercial-access";

export type PackagePricing = {
  packageId: OfferPackage;
  priceGBP: number | null;
  stripePriceCode: string | null;
  commercialProductKey: CommercialProduct | null;
  billingMode: "one_time" | "subscription" | "contact" | "included";
  displayPrice: string;
  pricingRationale: string;
};

const PACKAGE_PRICING: Record<OfferPackage, PackagePricing> = {
  executive_report_single: {
    packageId: "executive_report_single",
    priceGBP: 95,
    stripePriceCode: "executive_reporting",
    commercialProductKey: "executive_reporting",
    billingMode: "one_time",
    displayPrice: "£95",
    pricingRationale: "One-time governed executive brief. Evidence-derived, not generic.",
  },
  executive_report_sponsored: {
    packageId: "executive_report_sponsored",
    priceGBP: 95,
    stripePriceCode: "executive_reporting",
    commercialProductKey: "executive_reporting",
    billingMode: "one_time",
    displayPrice: "£95",
    pricingRationale: "Direct institutional intake. Same output, bypasses public ladder.",
  },
  team_reality_campaign: {
    packageId: "team_reality_campaign",
    priceGBP: null,
    stripePriceCode: null,
    commercialProductKey: null,
    billingMode: "included",
    displayPrice: "Included",
    pricingRationale: "Campaign tooling included. Strengthens Executive Reporting evidence base.",
  },
  monitoring_subscription: {
    packageId: "monitoring_subscription",
    priceGBP: null,
    stripePriceCode: null,
    commercialProductKey: null,
    billingMode: "contact",
    displayPrice: "Contact",
    pricingRationale: "Longitudinal observation. Pricing determined by monitoring cadence and scope.",
  },
  strategy_room_escalation: {
    packageId: "strategy_room_escalation",
    priceGBP: 395,
    stripePriceCode: "strategy_room",
    commercialProductKey: "strategy_room",
    billingMode: "one_time",
    displayPrice: "£395",
    pricingRationale: "Escalation environment. Opens when constitutional evidence warrants intervention.",
  },
  asset_access_membership: {
    packageId: "asset_access_membership",
    priceGBP: null,
    stripePriceCode: null,
    commercialProductKey: null,
    billingMode: "contact",
    displayPrice: "Invitation-controlled",
    pricingRationale: "Continuous access to decision assets. Removes per-asset friction.",
  },
};

export function resolvePackagePricing(packageId: OfferPackage): PackagePricing {
  return PACKAGE_PRICING[packageId];
}

export function listPricedPackages(): PackagePricing[] {
  return Object.values(PACKAGE_PRICING).filter((p) => p.priceGBP !== null);
}

export function resolveStripeCodeForPackage(packageId: OfferPackage): string | null {
  return PACKAGE_PRICING[packageId]?.stripePriceCode ?? null;
}
