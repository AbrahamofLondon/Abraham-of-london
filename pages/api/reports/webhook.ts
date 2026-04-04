/* pages/api/reports/webhook.ts */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { updateReportRequestByCheckoutSessionId } from "@/lib/reports/store";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const stripe =
  stripeSecret
    ? new Stripe(stripeSecret, {
        apiVersion: "2026-02-25.clover" as any,
      })
    : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  if (!stripe || !stripeWebhookSecret) {
    return res.status(500).end("Stripe not configured");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    return res.status(400).end("Missing stripe signature");
  }

  try {
    const rawBody = await buffer(req);
    const event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      await updateReportRequestByCheckoutSessionId(session.id, {
        status: "paid",
        paidAt: new Date().toISOString(),
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent as any)?.id || null,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[REPORT_WEBHOOK_ERROR]", error);
    return res.status(400).end("Webhook error");
  }
}