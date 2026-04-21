import type { PdfAssetIdentityResolved } from "@/lib/assets/pdf-identity";
import {
  canAccessPdfAsset,
  hasExplicitPdfEntitlement,
  type UserContext,
} from "@/lib/assets/pdf-access";
import {
  resolveAssetPricing,
  type PricingDecision,
} from "@/lib/commercial/pricing-engine";

export type PdfDeliveryMode =
  | "direct"
  | "paid"
  | "member_only"
  | "lead_capture";

export type PdfDeliveryDecision = {
  mode: PdfDeliveryMode;
  allowed: boolean;
  price: number;
  originalPrice?: number;
  discounted?: boolean;
  reason: string;
  nextAction?: string;
  pricing: PricingDecision;
};

export function resolvePdfDelivery(
  user: UserContext | null,
  asset: PdfAssetIdentityResolved,
): PdfDeliveryDecision {
  const pricing = resolveAssetPricing(user, asset);

  if (hasExplicitPdfEntitlement(user, asset.slug)) {
    return {
      mode: "direct",
      allowed: true,
      price: 0,
      reason: "Explicit asset entitlement",
      pricing,
    };
  }

  const access = canAccessPdfAsset(user, asset);
  if (access.allowed) {
    return {
      mode: "direct",
      allowed: true,
      price: pricing.price,
      originalPrice: pricing.originalPrice,
      discounted: pricing.discounted,
      reason: access.reason || pricing.reason,
      pricing,
    };
  }

  if (asset.access === "paid") {
    return {
      mode: "paid",
      allowed: false,
      price: pricing.price,
      originalPrice: pricing.originalPrice,
      discounted: pricing.discounted,
      reason: access.reason || pricing.reason,
      nextAction: `/checkout?slug=${encodeURIComponent(asset.slug)}`,
      pricing,
    };
  }

  if (asset.access === "inner_circle") {
    return {
      mode: "member_only",
      allowed: false,
      price: pricing.price,
      originalPrice: pricing.originalPrice,
      discounted: pricing.discounted,
      reason: access.reason || "Member access required",
      nextAction: "/inner-circle",
      pricing,
    };
  }

  return {
    mode: "lead_capture",
    allowed: false,
    price: pricing.price,
    originalPrice: pricing.originalPrice,
    discounted: pricing.discounted,
    reason: access.reason || "Lead capture required",
    nextAction: `/downloads/${encodeURIComponent(asset.slug)}`,
    pricing,
  };
}
