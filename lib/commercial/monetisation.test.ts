import { afterEach, describe, expect, it, vi } from "vitest";

import type { PdfAssetIdentityResolved } from "@/lib/assets/pdf-identity";
import { canAccessPdfAsset, type UserContext } from "@/lib/assets/pdf-access";
import { resolvePdfDelivery } from "@/lib/assets/pdf-delivery";
import { resolveAssetPricing } from "@/lib/commercial/pricing-engine";
import {
  grantCanonicalEntitlement,
  resetCanonicalEntitlementsForTests,
  resolveCanonicalEntitlement,
} from "@/lib/commercial/entitlement-authority";
import {
  ensureEntitlementAfterPayment,
  verifyPaymentEntitlementSync,
} from "@/lib/commercial/payment-verification";
import { getCommercialCookieSecret } from "@/lib/server/billing/commercial-access";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clientEntitlement: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
    },
    entitlement: {
      findFirst: vi.fn(async () => null),
      findMany: vi.fn(async () => []),
    },
  },
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    clientEntitlement: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({ count: 0 })),
      findMany: vi.fn(async () => []),
    },
  },
}));

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

afterEach(() => {
  resetCanonicalEntitlementsForTests();
  vi.clearAllMocks();
});

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

  it("prices all premium launch categories by default", () => {
    expect(resolveAssetPricing(null, asset({ access: "paid", category: "worksheet" })).price).toBe(19);
    expect(resolveAssetPricing(null, asset({ access: "paid", category: "framework" })).price).toBe(29);
    expect(resolveAssetPricing(null, asset({ access: "paid", category: "playbook" })).price).toBe(49);
    expect(resolveAssetPricing(null, asset({ access: "paid", category: "brief" })).price).toBe(29);
    expect(resolveAssetPricing(null, asset({ access: "paid", category: "report" })).price).toBe(79);
    expect(resolveAssetPricing(null, asset({ access: "paid", category: "toolkit" })).price).toBe(129);
  });

  it("lets a curated per-asset override replace category pricing", () => {
    expect(
      resolveAssetPricing(
        null,
        asset({
          slug: "override-toolkit",
          access: "paid",
          category: "toolkit",
          pricingOverride: {
            slug: "override-toolkit",
            price: 99,
            originalPrice: 129,
            currency: "gbp",
            rationale: "Launch override",
          },
        } as Partial<PdfAssetIdentityResolved>),
      ),
    ).toMatchObject({
      price: 99,
      originalPrice: 129,
      discounted: true,
      reason: "Launch override",
    });
  });

  it("resolves one canonical winner across legacy user/email disagreement", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.clientEntitlement.findFirst).mockResolvedValueOnce({
      id: "email-1",
      email: "buyer@example.com",
      productCode: "paid-report",
      tier: "legacy",
      status: "active",
      source: "stripe",
      externalRef: "cs_1",
      startsAt: new Date(),
      endsAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.entitlement.findFirst).mockResolvedValueOnce({
      startsAt: null,
      expiresAt: null,
      revokedAt: null,
      metadata: { source: "manual" },
    } as any);

    await expect(
      resolveCanonicalEntitlement({
        userId: "user-1",
        email: "buyer@example.com",
        slug: "paid-report",
      }),
    ).resolves.toMatchObject({
      granted: true,
      source: "manual",
      verified: true,
      slug: "paid-report",
    });
  });

  it("repairs a successful payment that is missing its entitlement", async () => {
    const result = await ensureEntitlementAfterPayment({
      checkoutSessionId: "simulated:paid-report",
      slug: "paid-report",
      userId: "buyer-1",
    });

    expect(result).toMatchObject({
      ok: true,
      repaired: true,
      entitlement: {
        granted: true,
        source: "purchase",
        verified: true,
      },
    });
  });

  it("returns explicit failure when payment verification cannot prove payment", async () => {
    const result = await verifyPaymentEntitlementSync({
      checkoutSessionId: "cs_missing",
      slug: "paid-report",
      userId: "buyer-1",
    });

    expect(result).toMatchObject({
      ok: false,
      entitlementRecorded: false,
      reason: "STRIPE_NOT_CONFIGURED",
    });
  });

  it("grants new commercial entitlements through the canonical authority", async () => {
    await expect(
      grantCanonicalEntitlement({
        userId: "user-2",
        slug: "paid-playbook",
        source: "purchase",
      }),
    ).resolves.toMatchObject({
      granted: true,
      source: "purchase",
      verified: true,
      slug: "paid-playbook",
    });
  });

  it("refuses commercial cookie fallback in production", () => {
    const previousCommercial = process.env.COMMERCIAL_COOKIE_SECRET;
    const previousCommercialAccess = process.env.COMMERCIAL_ACCESS_SECRET;
    const previousNextAuth = process.env.NEXTAUTH_SECRET;

    vi.stubEnv("NODE_ENV", "production");
    Reflect.deleteProperty(process.env, "COMMERCIAL_COOKIE_SECRET");
    Reflect.deleteProperty(process.env, "COMMERCIAL_ACCESS_SECRET");
    process.env.NEXTAUTH_SECRET = "x".repeat(64);

    expect(() => getCommercialCookieSecret()).toThrow(
      "COMMERCIAL_COOKIE_SECRET is required in production.",
    );

    vi.unstubAllEnvs();
    if (previousCommercial === undefined) Reflect.deleteProperty(process.env, "COMMERCIAL_COOKIE_SECRET");
    else process.env.COMMERCIAL_COOKIE_SECRET = previousCommercial;
    if (previousCommercialAccess === undefined) Reflect.deleteProperty(process.env, "COMMERCIAL_ACCESS_SECRET");
    else process.env.COMMERCIAL_ACCESS_SECRET = previousCommercialAccess;
    if (previousNextAuth === undefined) Reflect.deleteProperty(process.env, "NEXTAUTH_SECRET");
    else process.env.NEXTAUTH_SECRET = previousNextAuth;
  });
});
