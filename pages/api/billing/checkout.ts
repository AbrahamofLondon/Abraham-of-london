// pages/api/billing/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { COMMERCIAL_PRODUCTS } from "@/lib/server/billing/commercial-access";
import { hubspotSync } from "@/lib/hubspot/sync";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any }) : null;

const PRICE_MAP: Record<"executive_reporting" | "strategy_room", string> = {
  executive_reporting: process.env.STRIPE_EXECUTIVE_REPORTING_PRICE_ID || "",
  strategy_room: process.env.STRIPE_STRATEGY_ROOM_PRICE_ID || "",
};

const COMMERCIAL_PRICE_CONFIG = {
  executive_reporting: {
    name: COMMERCIAL_PRODUCTS.executive_reporting.name,
    productCode: COMMERCIAL_PRODUCTS.executive_reporting.productCode,
    tier: COMMERCIAL_PRODUCTS.executive_reporting.tier,
  },
  strategy_room: {
    name: COMMERCIAL_PRODUCTS.strategy_room.name,
    productCode: COMMERCIAL_PRODUCTS.strategy_room.productCode,
    tier: COMMERCIAL_PRODUCTS.strategy_room.tier,
  },
};

const INLINE_PRICE_MAP: Record<string, { amount: number; name: string; productCode: string; tier: string }> = {
  diagnostic_report_basic: {
    amount: 25000,
    name: "Diagnostic Report Basic",
    productCode: "diagnostic_report_basic",
    tier: "report-basic",
  },
  diagnostic_report_pro: {
    amount: 75000,
    name: "Diagnostic Report Pro",
    productCode: "diagnostic_report_pro",
    tier: "report-pro",
  },
};

const RETURN_PATHS: Record<string, { successPath: string; cancelPath: string }> = {
  executive_reporting: {
    successPath: COMMERCIAL_PRODUCTS.executive_reporting.successPath,
    cancelPath: COMMERCIAL_PRODUCTS.executive_reporting.cancelPath,
  },
  strategy_room: {
    successPath: COMMERCIAL_PRODUCTS.strategy_room.successPath,
    cancelPath: COMMERCIAL_PRODUCTS.strategy_room.cancelPath,
  },
};

function stripeErrorDetails(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { message: String(error || "Unknown Stripe checkout error") };
  }

  const stripeError = error as Stripe.errors.StripeError & {
    requestId?: string;
    statusCode?: number;
  };

  return {
    type: stripeError.type,
    code: stripeError.code,
    declineCode: stripeError.decline_code,
    message: stripeError.message,
    requestId: stripeError.requestId,
    statusCode: stripeError.statusCode,
  };
}

function siteUrl(req: NextApiRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`
  ).replace(/\/$/, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  if (!stripe) return res.status(500).json({ ok: false, reason: "STRIPE_NOT_CONFIGURED" });

  const { email, priceCode, originPath } = req.body || {};
  const normalizedPriceCode = String(priceCode || "");
  const commercialPriceId = PRICE_MAP[normalizedPriceCode as keyof typeof PRICE_MAP];
  const commercialConfig =
    COMMERCIAL_PRICE_CONFIG[normalizedPriceCode as keyof typeof COMMERCIAL_PRICE_CONFIG];
  const inlinePrice = INLINE_PRICE_MAP[normalizedPriceCode];

  if (!email || (!commercialConfig && !inlinePrice)) {
    return res.status(400).json({ ok: false, reason: "INVALID_PAYLOAD" });
  }
  if (commercialConfig && !commercialPriceId) {
    return res.status(500).json({ ok: false, reason: "STRIPE_PRICE_NOT_CONFIGURED" });
  }

  const returnPaths = RETURN_PATHS[normalizedPriceCode];
  const origin = typeof originPath === "string" && originPath.startsWith("/") ? originPath : "";
  const successPath = returnPaths?.successPath || "/dashboard";
  const cancelPath = origin || returnPaths?.cancelPath || "/dashboard";
  const baseUrl = siteUrl(req);
  const productCode = commercialConfig ? commercialConfig.productCode : inlinePrice!.productCode;
  const tier = commercialConfig ? commercialConfig.tier : inlinePrice!.tier;

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: String(email).trim().toLowerCase(),
      line_items: [
        commercialConfig
          ? {
              price: commercialPriceId,
              quantity: 1,
            }
          : {
              price_data: {
                currency: process.env.DIAGNOSTIC_DEFAULT_CURRENCY || "gbp",
                unit_amount: inlinePrice!.amount,
                product_data: {
                  name: inlinePrice!.name,
                  metadata: {
                    productCode,
                    tier,
                  },
                },
              },
              quantity: 1,
            },
      ],
      success_url: `${baseUrl}${successPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelPath}?checkout=cancelled`,
      metadata: {
        productCode,
        priceCode: normalizedPriceCode,
        tier,
        email: String(email).trim().toLowerCase(),
        originPath: origin,
      },
    });
  } catch (error) {
    const details = stripeErrorDetails(error);
    console.error("[BILLING_CHECKOUT_ERROR]", {
      priceCode: normalizedPriceCode,
      productCode,
      tier,
      originPath: origin,
      stripe: details,
    });

    return res.status(502).json({
      ok: false,
      reason: "STRIPE_CHECKOUT_CREATE_FAILED",
      code: typeof details.code === "string" ? details.code : undefined,
      type: typeof details.type === "string" ? details.type : undefined,
    });
  }

  // HubSpot sync — fire and forget
  const hsEvent = normalizedPriceCode === "strategy_room" ? "strategy_room_checkout" as const : "executive_reporting_checkout" as const;
  hubspotSync({
    event: hsEvent,
    email: String(email || ""),
    data: { amount: normalizedPriceCode === "strategy_room" ? 395 : 95 },
  }).catch(() => {});

  return res.json({ ok: true, url: session.url });
}
