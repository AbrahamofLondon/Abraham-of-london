// pages/api/billing/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any }) : null;

const PRICE_MAP: Record<string, { amount: number; name: string; productCode: string; tier: string }> = {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  if (!stripe) return res.status(500).json({ ok: false, reason: "STRIPE_NOT_CONFIGURED" });

  const { email, priceCode } = req.body || {};
  const price = PRICE_MAP[String(priceCode || "")];

  if (!email || !price) return res.status(400).json({ ok: false, reason: "INVALID_PAYLOAD" });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: String(email).trim().toLowerCase(),
    line_items: [
      {
        price_data: {
          currency: process.env.DIAGNOSTIC_DEFAULT_CURRENCY || "gbp",
          unit_amount: price.amount,
          product_data: {
            name: price.name,
            metadata: {
              productCode: price.productCode,
              tier: price.tier,
            },
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?billing=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?billing=cancelled`,
    metadata: {
      productCode: price.productCode,
      tier: price.tier,
      email: String(email).trim().toLowerCase(),
    },
  });

  return res.json({ ok: true, url: session.url });
}