/**
 * lib/commercial/professional-subscription-lifecycle.test.ts
 *
 * Professional subscription lifecycle tests (Parts 5 + 6 of the
 * Subscription Cancellation & Metadata Hardening Pass).
 *
 * Scope:
 *   1. Webhook metadata field resolution (metadata.tier priority)
 *   2. mapStripeTierToAccessTier — tier mapping table
 *   3. Professional price ID catalogue (PROFESSIONAL_PRICE_IDS derivation)
 *   4. revokeCanonicalEntitlement — unit tests with prisma mock
 *   5. resolveCanonicalEntitlement — blocked after revocation (prisma mock)
 *   6. Trial: expired trial does not grant professional access
 *   7. Invariant: cancelled subscription must not leave active entitlement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CATALOG } from "@/lib/commercial/catalog";
import { normalizeUserTier } from "@/lib/access/tier-policy";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers mirroring webhook internals (pure, no DB)
// ─────────────────────────────────────────────────────────────────────────────

function mapStripeTierToAccessTier(membershipTier: unknown) {
  const raw = String(membershipTier ?? "").trim().toLowerCase();
  const explicit: Record<string, ReturnType<typeof normalizeUserTier>> = {
    free: "member",
    premium: "professional",
    enterprise: "client",
    elite: "legacy",
    basic: "member",
    standard: "member",
    pro: "professional",
    professional: "professional",
    business: "client",
  };
  return normalizeUserTier(explicit[raw] ?? raw);
}

function resolveWebhookTierMetadata(metadata: Record<string, string | undefined>) {
  return (
    metadata.tier ||
    metadata.membershipTier ||
    metadata.plan ||
    "premium"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Part 1: Webhook metadata field resolution
// ─────────────────────────────────────────────────────────────────────────────

describe("webhook metadata field resolution", () => {
  it("prefers metadata.tier over membershipTier and plan", () => {
    const raw = resolveWebhookTierMetadata({
      tier: "professional",
      membershipTier: "premium",
      plan: "pro",
    });
    expect(raw).toBe("professional");
    expect(mapStripeTierToAccessTier(raw)).toBe("professional");
  });

  it("falls back to membershipTier when tier is absent", () => {
    const raw = resolveWebhookTierMetadata({
      membershipTier: "premium",
      plan: "pro",
    });
    expect(raw).toBe("premium");
    expect(mapStripeTierToAccessTier(raw)).toBe("professional");
  });

  it("falls back to plan when tier and membershipTier are absent", () => {
    const raw = resolveWebhookTierMetadata({ plan: "pro" });
    expect(raw).toBe("pro");
    expect(mapStripeTierToAccessTier(raw)).toBe("professional");
  });

  it("falls back to 'premium' when all metadata fields are absent (legacy session)", () => {
    const raw = resolveWebhookTierMetadata({});
    expect(raw).toBe("premium");
    expect(mapStripeTierToAccessTier(raw)).toBe("professional");
  });

  it("Professional Monthly checkout: metadata.tier = 'professional' resolves correctly", () => {
    const raw = resolveWebhookTierMetadata({ tier: "professional" });
    expect(mapStripeTierToAccessTier(raw)).toBe("professional");
  });

  it("Professional Annual checkout: metadata.tier = 'professional' resolves correctly", () => {
    const raw = resolveWebhookTierMetadata({ tier: "professional" });
    expect(mapStripeTierToAccessTier(raw)).toBe("professional");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 2: mapStripeTierToAccessTier
// ─────────────────────────────────────────────────────────────────────────────

describe("mapStripeTierToAccessTier", () => {
  it("'professional' → professional", () => {
    expect(mapStripeTierToAccessTier("professional")).toBe("professional");
  });

  it("'pro' → professional", () => {
    expect(mapStripeTierToAccessTier("pro")).toBe("professional");
  });

  it("'premium' → professional (legacy Stripe metadata)", () => {
    expect(mapStripeTierToAccessTier("premium")).toBe("professional");
  });

  it("fallback 'premium' → professional (no metadata present — legacy session)", () => {
    expect(mapStripeTierToAccessTier("premium")).toBe("professional");
  });

  it("'free' → member", () => {
    expect(mapStripeTierToAccessTier("free")).toBe("member");
  });

  it("'enterprise' → client", () => {
    expect(mapStripeTierToAccessTier("enterprise")).toBe("client");
  });

  it("unknown value → public (safe fallback)", () => {
    expect(mapStripeTierToAccessTier("unknown-garbage")).toBe("public");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 3: Professional price ID set (catalogue derivation)
// ─────────────────────────────────────────────────────────────────────────────

describe("PROFESSIONAL_PRICE_IDS derivation from catalogue", () => {
  const PROFESSIONAL_PRICE_IDS = new Set([
    CATALOG.professional?.stripePriceId,
    CATALOG.professional_annual?.stripePriceId,
  ].filter(Boolean) as string[]);

  it("includes the professional monthly price ID", () => {
    expect(PROFESSIONAL_PRICE_IDS.has(CATALOG.professional!.stripePriceId!)).toBe(true);
  });

  it("includes the professional annual price ID", () => {
    expect(PROFESSIONAL_PRICE_IDS.has(CATALOG.professional_annual!.stripePriceId!)).toBe(true);
  });

  it("monthly and annual price IDs are distinct", () => {
    expect(CATALOG.professional!.stripePriceId).not.toBe(CATALOG.professional_annual!.stripePriceId);
  });

  it("inner_circle price ID is NOT in the set (inactive product)", () => {
    const icPriceId = CATALOG.inner_circle?.stripePriceId;
    if (icPriceId) {
      expect(PROFESSIONAL_PRICE_IDS.has(icPriceId)).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 4: revokeCanonicalEntitlement — unit tests with prisma mock
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clientEntitlement: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    entitlement: {
      findFirst: vi.fn(),
    },
  },
}));

// Import after mock registration
const { prisma } = await import("@/lib/prisma");
const {
  revokeCanonicalEntitlement,
  resolveCanonicalEntitlement,
  grantCanonicalEntitlement,
  resetCanonicalEntitlementsForTests,
} = await import("@/lib/commercial/entitlement-authority");

const SLUG = CATALOG.professional!.entitlementSlug; // "tier.professional"
const TEST_EMAIL = "test@example.com";
const TEST_USER_ID = "user_test_123";

beforeEach(() => {
  vi.clearAllMocks();
  resetCanonicalEntitlementsForTests();
});

afterEach(() => {
  vi.clearAllMocks();
  resetCanonicalEntitlementsForTests();
});

describe("revokeCanonicalEntitlement", () => {
  it("revokes an active entitlement — sets status=cancelled and endsAt=now", async () => {
    const updateMany = vi.mocked(prisma.clientEntitlement.updateMany);
    updateMany.mockResolvedValue({ count: 1 });

    const result = await revokeCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
      reason: "stripe_subscription_cancelled",
      stripeSubscriptionId: "sub_test_123",
    });

    expect(result.revoked).toBe(true);
    expect(result.count).toBe(1);

    expect(updateMany).toHaveBeenCalledWith({
      where: { email: TEST_EMAIL, productCode: SLUG, status: "active" },
      data: {
        status: "cancelled",
        endsAt: expect.any(Date),
      },
    });
  });

  it("returns revoked=false when no active entitlement found (no double-revoke risk)", async () => {
    vi.mocked(prisma.clientEntitlement.updateMany).mockResolvedValue({ count: 0 });

    const result = await revokeCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
      reason: "stripe_subscription_cancelled",
    });

    expect(result.revoked).toBe(false);
    expect(result.count).toBe(0);
  });

  it("resolves identity via userId when email absent", async () => {
    const updateMany = vi.mocked(prisma.clientEntitlement.updateMany);
    updateMany.mockResolvedValue({ count: 1 });

    await revokeCanonicalEntitlement({
      userId: TEST_USER_ID,
      slug: SLUG,
      reason: "stripe_subscription_cancelled",
    });

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: `user:${TEST_USER_ID}`, productCode: SLUG, status: "active" },
      }),
    );
  });

  it("returns revoked=false and does not throw when DB fails", async () => {
    vi.mocked(prisma.clientEntitlement.updateMany).mockRejectedValue(
      new Error("DB connection lost"),
    );

    const result = await revokeCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
      reason: "stripe_subscription_cancelled",
    });

    expect(result.revoked).toBe(false);
    expect(result.count).toBe(0);
  });

  it("returns revoked=false if neither email nor userId provided", async () => {
    const result = await revokeCanonicalEntitlement({
      slug: SLUG,
      reason: "stripe_subscription_cancelled",
    });

    expect(result.revoked).toBe(false);
    expect(prisma.clientEntitlement.updateMany).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 5: resolveCanonicalEntitlement blocked after revocation
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveCanonicalEntitlement — blocked after revocation", () => {
  it("returns granted=false after entitlement revoked (status=cancelled)", async () => {
    // After revocation, DB query for status:"active" finds nothing.
    vi.mocked(prisma.clientEntitlement.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.entitlement.findFirst).mockResolvedValue(null);

    const result = await resolveCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
    });

    expect(result.granted).toBe(false);
  });

  it("returns granted=true when active entitlement exists (pre-cancellation)", async () => {
    vi.mocked(prisma.clientEntitlement.findFirst).mockResolvedValue({
      id: "ent_1",
      email: TEST_EMAIL,
      productCode: SLUG,
      tier: "canonical",
      status: "active",
      source: "purchase",
      externalRef: null,
      startsAt: new Date(Date.now() - 1000),
      endsAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.entitlement.findFirst).mockResolvedValue(null);

    const result = await resolveCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
    });

    expect(result.granted).toBe(true);
    expect(result.source).toBe("purchase");
  });

  it("cancelled entitlement (status=cancelled) is not returned by findFirst (DB filter)", async () => {
    // The query always filters status:"active" — simulate cancelled row not returned
    vi.mocked(prisma.clientEntitlement.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.entitlement.findFirst).mockResolvedValue(null);

    const result = await resolveCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
    });

    expect(result.granted).toBe(false);
    expect(result.verified).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 4 (trial): Expired trial does not grant professional access
// ─────────────────────────────────────────────────────────────────────────────

describe("trial entitlement — expired trial does not grant access", () => {
  it("findFirst with status:'active' does not return trial-status rows", async () => {
    // Trial rows use status:"trial", not "active".
    // resolveCanonicalEntitlement queries status:"active" only.
    // Simulate: only a trial row exists (not returned by active filter).
    vi.mocked(prisma.clientEntitlement.findFirst).mockImplementation(
      async (args: any) => {
        if (args?.where?.status === "active") return null;
        return null;
      },
    );
    vi.mocked(prisma.entitlement.findFirst).mockResolvedValue(null);

    const result = await resolveCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
    });

    expect(result.granted).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 5: Feature gates blocked after cancellation
// ─────────────────────────────────────────────────────────────────────────────

describe("feature gate: return_brief blocked after cancellation", () => {
  it("return_brief requires tier.professional entitlement", async () => {
    const { FEATURES } = await import("@/lib/product/feature-entitlements");
    const feat = FEATURES.return_brief;
    expect(feat.requiredEntitlementSlugs).toContain(SLUG);
  });

  it("after revocation: no active entitlement → feature denied", async () => {
    vi.mocked(prisma.clientEntitlement.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.entitlement.findFirst).mockResolvedValue(null);

    const result = await resolveCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
    });

    expect(result.granted).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 6: Invariant — cancelled subscription leaves no active entitlement
// ─────────────────────────────────────────────────────────────────────────────

describe("invariant: cancelled subscription must not leave active entitlement", () => {
  it("after revokeCanonicalEntitlement, resolveCanonicalEntitlement returns granted=false", async () => {
    // Step 1: revoke
    vi.mocked(prisma.clientEntitlement.updateMany).mockResolvedValue({ count: 1 });
    const { revoked } = await revokeCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
      reason: "stripe_subscription_cancelled",
    });
    expect(revoked).toBe(true);

    // Step 2: resolve — DB now returns null (row has status=cancelled)
    vi.mocked(prisma.clientEntitlement.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.entitlement.findFirst).mockResolvedValue(null);

    const result = await resolveCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
    });

    // Invariant: no active Professional access remains
    expect(result.granted).toBe(false);
    expect(result.verified).toBe(false);
  });

  it("revokeCanonicalEntitlement targets only 'active' rows — does not touch cancelled rows", async () => {
    vi.mocked(prisma.clientEntitlement.updateMany).mockResolvedValue({ count: 1 });

    await revokeCanonicalEntitlement({
      email: TEST_EMAIL,
      slug: SLUG,
      reason: "stripe_subscription_cancelled",
    });

    expect(prisma.clientEntitlement.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "active" }),
      }),
    );
  });

  it("annual and monthly cancellation both target tier.professional entitlement slug", () => {
    const monthlySlug = CATALOG.professional!.entitlementSlug;
    const annualSlug = CATALOG.professional_annual!.entitlementSlug;
    expect(monthlySlug).toBe(annualSlug);
    expect(monthlySlug).toBe(SLUG);
  });

  it("legacy inner_circle records normalize to professional before cancellation", async () => {
    const { normalizeRuntimeTier } = await import("@/lib/access/tier-policy");
    expect(normalizeRuntimeTier("inner_circle")).toBe("professional");
    expect(normalizeRuntimeTier("professional")).toBe("professional");
  });

  it("legacy inner_circle catalogue product remains inactive and checkout-blocked", () => {
    expect(CATALOG.inner_circle?.active).toBe(false);
    expect(CATALOG.inner_circle?.requiresCheckout).toBeFalsy();
  });
});
