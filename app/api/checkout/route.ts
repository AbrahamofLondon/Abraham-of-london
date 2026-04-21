export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { getPdfAssetIdentityBySlug } from "@/lib/assets/pdf-identity";
import { resolveAssetPricing } from "@/lib/commercial/pricing-engine";
import {
  getUserEntitlements,
  grantEntitlement,
} from "@/lib/commercial/entitlements";
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

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Authenticated user required for checkout" },
      { status: 401 },
    );
  }

  const entitlements = await getUserEntitlements(userId);
  const user: UserContext = {
    id: userId,
    authenticated: true,
    tier: identity.tier,
    flags: identity.flags,
    entitlementSlugs: entitlements.map((entry) => entry.slug),
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

  const entitlement = await grantEntitlement(
    userId,
    asset.slug,
    pricing.price === 0 ? "checkout-free" : "checkout-simulated",
  );

  return NextResponse.json({
    ok: true,
    slug: asset.slug,
    price: pricing.price,
    originalPrice: pricing.originalPrice,
    discounted: pricing.discounted,
    reason: pricing.reason,
    entitlement,
    nextAction: `/api/downloads/${encodeURIComponent(asset.slug)}`,
  });
}
