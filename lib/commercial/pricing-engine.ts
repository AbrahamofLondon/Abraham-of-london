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
};

export const BASE_PRICING = {
  worksheet: 0,
  framework: 19,
  brief: 29,
  playbook: 49,
  report: 79,
  toolkit: 129,
} as const;

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

export function resolveAssetPricing(
  user: UserContext | null,
  asset: PdfAssetIdentityResolved,
): PricingDecision {
  const basePrice = BASE_PRICING[asset.category];

  if (asset.access === "public") {
    return free("Public asset");
  }

  if (hasExplicitPdfEntitlement(user, asset.slug)) {
    return free("Asset entitlement applied");
  }

  if (basePrice === 0) {
    return free("Base price is free");
  }

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
