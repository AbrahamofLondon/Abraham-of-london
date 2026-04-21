export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { getPdfAssetIdentityBySlug } from "@/lib/assets/pdf-identity";
import { resolveAssetPricing } from "@/lib/commercial/pricing-engine";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { ensureEntitlementAfterPayment } from "@/lib/commercial/payment-verification";
import type { UserContext } from "@/lib/assets/pdf-access";

type CheckoutPayload = {
  slug?: string;
  userId?: string;
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
  const email = identity.email || null;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Authenticated user required for checkout" },
      { status: 401 },
    );
  }

  const entitlement = await resolveCanonicalEntitlement({
    userId,
    email,
    slug: asset.slug,
  });
  const user: UserContext = {
    id: userId,
    authenticated: true,
    tier: identity.tier,
    flags: identity.flags,
    entitlementSlugs: entitlement.granted ? [asset.slug] : [],
  };

  const pricing = resolveAssetPricing(user, asset);
  const paymentSucceeded = payload.simulateSuccess !== false;

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
