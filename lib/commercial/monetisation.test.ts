import { describe, expect, it } from "vitest";

import type { PdfAssetIdentityResolved } from "@/lib/assets/pdf-identity";
import { canAccessPdfAsset, type UserContext } from "@/lib/assets/pdf-access";
import { resolvePdfDelivery } from "@/lib/assets/pdf-delivery";
import { resolveAssetPricing } from "@/lib/commercial/pricing-engine";

function asset(
  overrides: Partial<PdfAssetIdentityResolved>,
): PdfAssetIdentityResolved {
  return {
    slug: "test-asset",
    title: "Test Asset",
    category: "report",
    authority: "canonical",
    access: "public",
    canonicalPath: "/assets/downloads/test-asset.pdf",
    fileExists: true,
    ...overrides,
  };
}

const member: UserContext = {
  id: "member-1",
  authenticated: true,
  tier: "inner_circle",
};

describe("monetisation infrastructure", () => {
  it("Case 1 - public assets can be downloaded without a user", () => {
    const publicAsset = asset({ access: "public", category: "worksheet" });

    expect(canAccessPdfAsset(null, publicAsset)).toMatchObject({
      allowed: true,
    });
    expect(resolvePdfDelivery(null, publicAsset)).toMatchObject({
      mode: "direct",
      allowed: true,
      price: 0,
    });
  });

  it("Case 2 - Inner Circle assets block non-members and allow members", () => {
    const innerCircleAsset = asset({
      access: "inner_circle",
      category: "worksheet",
    });

    expect(resolvePdfDelivery(null, innerCircleAsset)).toMatchObject({
      mode: "member_only",
      allowed: false,
    });
    expect(resolvePdfDelivery(member, innerCircleAsset)).toMatchObject({
      mode: "direct",
      allowed: true,
    });
  });

  it("Case 3 - paid assets require purchase, then entitlement allows delivery", () => {
    const paidAsset = asset({
      slug: "paid-report",
      access: "paid",
      category: "report",
    });

    expect(resolvePdfDelivery(null, paidAsset)).toMatchObject({
      mode: "paid",
      allowed: false,
      price: 79,
      nextAction: "/checkout?slug=paid-report",
    });

    expect(
      resolvePdfDelivery(
        {
          id: "buyer-1",
          authenticated: true,
          tier: "member",
          entitlementSlugs: ["paid-report"],
        },
        paidAsset,
      ),
    ).toMatchObject({
      mode: "direct",
      allowed: true,
      price: 0,
    });
  });

  it("Case 4 - entitlement overrides restricted access and pricing", () => {
    const restrictedAsset = asset({
      slug: "restricted-toolkit",
      access: "restricted",
      category: "toolkit",
    });
    const entitledUser: UserContext = {
      id: "entitled-1",
      authenticated: true,
      tier: "public",
      entitlementSlugs: ["restricted-toolkit"],
    };

    expect(canAccessPdfAsset(entitledUser, restrictedAsset)).toMatchObject({
      allowed: true,
    });
    expect(resolveAssetPricing(entitledUser, restrictedAsset)).toMatchObject({
      price: 0,
      reason: "Asset entitlement applied",
    });
    expect(resolvePdfDelivery(entitledUser, restrictedAsset)).toMatchObject({
      mode: "direct",
      allowed: true,
    });
  });

  it("Case 5 - direct API delivery without entitlement remains blocked for paid assets", () => {
    const paidAsset = asset({
      slug: "paid-playbook",
      access: "paid",
      category: "playbook",
    });

    expect(canAccessPdfAsset({ id: "anon", tier: "public" }, paidAsset)).toMatchObject({
      allowed: false,
      requiredTier: "client",
    });
    expect(resolvePdfDelivery({ id: "anon", tier: "public" }, paidAsset)).toMatchObject({
      mode: "paid",
      allowed: false,
      price: 49,
    });
  });

  it("applies deterministic tier-aware pricing", () => {
    const report = asset({
      slug: "tiered-report",
      access: "paid",
      category: "report",
    });
    const first = resolveAssetPricing(member, report);
    const second = resolveAssetPricing(member, report);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      price: 40,
      originalPrice: 79,
      discounted: true,
      reason: "Inner Circle pricing applied",
    });
  });
});
