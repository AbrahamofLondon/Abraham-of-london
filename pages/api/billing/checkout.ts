// pages/api/billing/checkout.ts — CANONICAL CHECKOUT ROUTE
// All products resolve from lib/commercial/catalog.ts SSOT.
// Stripe Price IDs are embedded in catalog, not env vars.

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import {
  checkCheckoutEligibility,
  resolveEntitlementSlugs,
} from "@/lib/commercial/catalog";
import { resolveProductIdentity } from "@/lib/commercial/product-identity";
import { hubspotSync } from "@/lib/hubspot/sync";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any })
  : null;

function siteUrl(req: NextApiRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`
  ).replace(/\/$/, "");
}

function stripeErrorDetails(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { message: String(error || "Unknown Stripe checkout error") };
  }
  const e = error as Stripe.errors.StripeError & { requestId?: string; statusCode?: number };
  return {
    type: e.type,
    code: e.code,
    declineCode: e.decline_code,
    message: e.message,
    requestId: e.requestId,
    statusCode: e.statusCode,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  if (!stripe) return res.status(500).json({ ok: false, reason: "STRIPE_NOT_CONFIGURED" });

  const { email, priceCode, productCode, entitlementSlug, contentId, originPath } = req.body || {};
  const rawCode = String(productCode || entitlementSlug || contentId || priceCode || "").trim();

  // Resolve canonical product code — accepts catalog key OR content ID OR entitlement slug
  const identity = resolveProductIdentity(rawCode);
  if (!identity) {
    return res.status(400).json({ ok: false, error: "Invalid product identifier" });
  }

  const code = identity.productCode;

  // ── Resolve product from catalog SSOT with guardrails ──
  if (!email) {
    return res.status(400).json({ ok: false, reason: "EMAIL_REQUIRED" });
  }

  const eligibility = checkCheckoutEligibility(code);
  if (!eligibility.eligible) {
    return res.status(400).json({ ok: false, reason: eligibility.reason, code });
  }

  const product = eligibility.product;

  // ── Paths ──
  const origin = typeof originPath === "string" && originPath.startsWith("/") ? originPath : "";
  const successPath = product.successPath || origin || "/dashboard";
  const cancelPath = origin || product.cancelPath || "/dashboard";
  const baseUrl = siteUrl(req);

  // ── Metadata (attached to Stripe session, used by webhooks) ──
  const entitlementSlugs = resolveEntitlementSlugs(code);
  const metadata: Record<string, string> = {
    productCode: product.entitlementSlug,
    priceCode: code,
    tier: product.tier,
    email: String(email).trim().toLowerCase(),
    originPath: origin,
    // For bundles, include the full list of entitlement slugs
    ...(entitlementSlugs.length > 1
      ? { bundleEntitlements: entitlementSlugs.join(",") }
      : {}),
  };

  // ── Create Stripe checkout session ──
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: String(email).trim().toLowerCase(),
      line_items: [
        product.stripePriceId
          ? { price: product.stripePriceId, quantity: 1 }
          : {
              price_data: {
                currency: "gbp",
                unit_amount: product.amount,
                product_data: {
                  name: product.displayName,
                  metadata: {
                    productCode: product.code,
                    entitlementSlug: product.entitlementSlug,
                  },
                },
              },
              quantity: 1,
            },
      ],
      success_url: `${baseUrl}${successPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelPath}?checkout=cancelled`,
      metadata,
    });
  } catch (error) {
    const details = stripeErrorDetails(error);
    console.error("[BILLING_CHECKOUT_ERROR]", { priceCode: code, ...details });
    return res.status(502).json({
      ok: false,
      reason: "STRIPE_CHECKOUT_CREATE_FAILED",
      code: typeof details.code === "string" ? details.code : undefined,
    });
  }

  // ── HubSpot sync (fire and forget) ──
  hubspotSync({
    event: code === "strategy_room" ? "strategy_room_checkout" : "executive_reporting_checkout",
    email: String(email || ""),
    data: { amount: product.amount / 100, productCode: code },
  }).catch(() => {});

  return res.json({ ok: true, url: session.url });
}
