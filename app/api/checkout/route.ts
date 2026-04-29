export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { getPdfAssetIdentityBySlug } from "@/lib/assets/pdf-identity";
import { resolveAssetPricing } from "@/lib/commercial/pricing-engine";
import { grantEntitlement } from "@/lib/commercial/entitlements";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { ensureEntitlementAfterPayment } from "@/lib/commercial/payment-verification";
import type { UserContext } from "@/lib/assets/pdf-access";

type CheckoutPayload = {
  slug?: string;
  userId?: string;
  email?: string;
  simulateSuccess?: boolean;
};

async function parsePayload(req: NextRequest): Promise<CheckoutPayload> {
  try {
    return (await req.json()) as CheckoutPayload;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const payload = await parsePayload(req);
  const slug = String(payload.slug || "").replace(/\.pdf$/i, "");

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "slug is required" },
      { status: 400 },
    );
  }

  let asset;
  try {
    asset = getPdfAssetIdentityBySlug(slug);
  } catch {
    return NextResponse.json(
      { ok: false, error: "PDF asset not found" },
      { status: 404 },
    );
  }

  const identity = await resolveIdentity(req);
  const userId = identity.subjectId || payload.userId || null;
  const email = identity.email || String(payload.email || "").trim().toLowerCase() || null;

  if (!userId && !email) {
    return NextResponse.json(
      { ok: false, error: "Authenticated user or entitlement email required for checkout" },
      { status: 401 },
    );
  }

  // Production: redirect to canonical checkout route
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: "Use canonical checkout",
        canonicalEndpoint: "/api/billing/checkout",
        requiredPayload: { email, priceCode: slug },
      },
      { status: 308 },
    );
  }

  const entitlement = await resolveCanonicalEntitlement({
    userId,
    email,
    slug: asset.slug,
  });
  const user: UserContext = {
    id: userId ?? email ?? "anonymous-email-checkout",
    authenticated: Boolean(userId || email),
    tier: identity.tier,
    flags: identity.flags,
    entitlementSlugs: entitlement.granted ? [asset.slug] : [],
  };

  const pricing = resolveAssetPricing(user, asset);
  const paymentSucceeded = payload.simulateSuccess === true;

  if (!paymentSucceeded) {
    return NextResponse.json(
      {
        ok: false,
        slug: asset.slug,
        price: pricing.price,
        reason: "Checkout payment failed",
      },
      { status: 402 },
    );
  }

  const checkoutSessionId = `simulated:${asset.slug}:${Date.now()}`;
  const verified = await ensureEntitlementAfterPayment({
    checkoutSessionId,
    slug: asset.slug,
    userId,
    email,
  });

  if (!verified.ok || !verified.entitlement?.granted) {
    if (userId) {
      await grantEntitlement(userId, asset.slug, "purchase-repair").catch(() => undefined);
    }

    return NextResponse.json(
      {
        ok: false,
        slug: asset.slug,
        price: pricing.price,
        reason: "PAYMENT_SUCCEEDED_ENTITLEMENT_SYNC_FAILED",
      },
      { status: 500 },
    );
  }

  if (userId) {
    await grantEntitlement(userId, asset.slug, "purchase").catch(() => undefined);
  }

  return NextResponse.json({
    ok: true,
    slug: asset.slug,
    price: pricing.price,
    originalPrice: pricing.originalPrice,
    discounted: pricing.discounted,
    reason: pricing.reason,
    entitlement: verified.entitlement,
    entitlementVerified: verified.entitlement.verified,
    entitlementRepaired: verified.repaired,
    nextAction: `/api/downloads/${encodeURIComponent(asset.slug)}`,
  });
}
