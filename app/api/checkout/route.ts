export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { getPdfAssetIdentityBySlug } from "@/lib/assets/pdf-identity";
import { resolveAssetPricing } from "@/lib/commercial/pricing-engine";
import { grantEntitlement } from "@/lib/commercial/entitlements";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { ensureEntitlementAfterPayment } from "@/lib/commercial/payment-verification";
import type { UserContext } from "@/lib/assets/pdf-access";
import {
  enforceAppRouteRateLimit,
  failClosedForFlag,
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
} from "@/lib/server/security/app-route-guards";

const checkoutSchema = z.object({
  slug: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320).optional(),
  simulateSuccess: z.boolean().optional(),
}).strict();

export async function POST(req: NextRequest) {
  const methodCheck = requireMethod(req, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(req);
  if (!contentCheck.ok) return contentCheck.response;

  const lockdown = failClosedForFlag({
    flag: "DISABLE_CHECKOUT",
    action: "checkout_started",
    route: "/api/checkout",
    publicMessage: "CHECKOUT_TEMPORARILY_DISABLED",
  });
  if (!lockdown.ok) return lockdown.response;

  const parsed = await parseJsonBody(req, checkoutSchema);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.data;
  const slug = payload.slug.replace(/\.pdf$/i, "");

  const rateLimit = await enforceAppRouteRateLimit({
    request: req,
    routeKey: "checkout",
    limit: 12,
    windowMs: 15 * 60_000,
    email: payload.email || null,
    failClosed: true,
  });
  if (!rateLimit.ok) return rateLimit.response;

  if (!slug) {
    return noStoreJson(
      { ok: false, error: "slug is required" },
      { status: 400 },
    );
  }

  let asset;
  try {
    asset = getPdfAssetIdentityBySlug(slug);
  } catch {
    return noStoreJson(
      { ok: false, error: "PDF asset not found" },
      { status: 404 },
    );
  }

  const identity = await resolveIdentity(req);
  const userId = identity.subjectId || null;
  const email = identity.email || payload.email?.trim().toLowerCase() || null;

  if (!userId && !email) {
    return noStoreJson(
      { ok: false, error: "Authenticated user or entitlement email required for checkout" },
      { status: 401 },
    );
  }

  // Production: redirect to canonical checkout route
  if (process.env.NODE_ENV === "production") {
    return noStoreJson(
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
    return noStoreJson(
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

    return noStoreJson(
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

  return noStoreJson({
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
