// pages/api/billing/webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import {
  grantEntitlement,
  PRODUCT_CODES,
  type ProductCode,
} from "@/lib/server/billing/entitlements";

const VALID_PRODUCT_CODES = new Set<string>(Object.values(PRODUCT_CODES));

function isProductCode(value: string): value is ProductCode {
  return VALID_PRODUCT_CODES.has(value);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any }) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  if (!stripe || !webhookSecret) return res.status(500).end();

  const sig = req.headers["stripe-signature"];
  if (!sig || Array.isArray(sig)) return res.status(400).end();

  const rawBody = await buffer(req);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = String(session.metadata?.email || session.customer_details?.email || "").toLowerCase();
    const productCode = String(session.metadata?.productCode || "");
    const tier = String(session.metadata?.tier || "report-basic");

    if (email && productCode && isProductCode(productCode)) {
      await grantEntitlement({
        email,
        productCode,
        tier,
        source: "stripe",
        externalRef: session.id,
      });
    } else if (email && productCode) {
      console.warn(
        `[BILLING_WEBHOOK] Rejected unknown productCode from Stripe metadata: ${productCode}`,
      );
    }
  }

  return res.json({ received: true });
}