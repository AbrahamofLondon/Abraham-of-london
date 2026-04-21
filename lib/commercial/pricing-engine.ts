import { hasAccess } from "@/lib/access/tier-policy";
import type { PdfAssetIdentityResolved } from "@/lib/assets/pdf-identity";
import {
  hasExplicitPdfEntitlement,
  type UserContext,
} from "@/lib/assets/pdf-access";

export type PricingDecision = {
  price: number;
  originalPrice: number;
  discounted: boolean;
  reason: string;
  currency?: string;
};

export const BASE_PRICING = {
  worksheet: 19,
  framework: 29,
  playbook: 49,
  brief: 29,
  report: 79,
  toolkit: 129,
  case_evidence: 0,
} as const;

export type AssetPricingOverride = {
  slug: string;
  price: number;
  originalPrice?: number | null;
  currency?: string;
  rationale?: string;
};

function free(reason: string): PricingDecision {
  return {
    price: 0,
    originalPrice: 0,
    discounted: false,
    reason,
  };
}

function discount(
  basePrice: number,
  multiplier: number,
  reason: string,
): PricingDecision {
  const price = Math.round(basePrice * multiplier);
  return {
    price,
    originalPrice: basePrice,
    discounted: price < basePrice,
    reason,
  };
}

function applyOverride(override: AssetPricingOverride): PricingDecision {
  return {
    price: override.price,
    originalPrice: override.originalPrice ?? override.price,
    discounted:
      typeof override.originalPrice === "number" &&
      override.originalPrice > override.price,
    reason: override.rationale || "Curated asset pricing override",
    currency: override.currency || "gbp",
  };
}

export function resolveAssetPricing(
  user: UserContext | null,
  asset: PdfAssetIdentityResolved,
): PricingDecision {
  if (asset.access === "public") {
    return free("Public asset");
  }

  if (hasExplicitPdfEntitlement(user, asset.slug)) {
    return free("Asset entitlement applied");
  }

  const override = (asset as PdfAssetIdentityResolved & {
    pricingOverride?: AssetPricingOverride | null;
  }).pricingOverride;
  if (override && override.slug.trim().toLowerCase() === asset.slug.trim().toLowerCase()) {
    return applyOverride(override);
  }

  const basePrice = BASE_PRICING[asset.category];

  if (hasAccess(user?.tier, "inner_circle")) {
    if (asset.category === "framework" || asset.category === "brief") {
      return free("Inner Circle included asset");
    }

    if (asset.category === "report") {
      return discount(basePrice, 0.5, "Inner Circle pricing applied");
    }
  }

  if (user?.authenticated || hasAccess(user?.tier, "member")) {
    return discount(basePrice, 0.9, "Registered user pricing applied");
  }

  return {
    price: basePrice,
    originalPrice: basePrice,
    discounted: false,
    reason: "Base pricing applied",
  };
}
