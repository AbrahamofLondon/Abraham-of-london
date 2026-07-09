// pages/api/webhooks/stripe.ts — LEGACY STRIPE WEBHOOK (thin adapter)
//
// PR E: Thin adapter. Retained for Stripe configuration compatibility.
// Verifies signature and delegates to the canonical payment event processor.
// No independent business logic.
//
// This route exists because Stripe may still be configured to send events here.
// It must not independently create orders, grant entitlements, or generate reports.

import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import {
  processCheckoutCompleted,
  processSubscriptionEvent,
} from "@/lib/commercial/payment-event-processor";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    })
  : null;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!stripe || !webhookSecret) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    return res.status(400).json({ error: "Missing stripe signature" });
  }

  const buf = await buffer(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown signature failure";
    console.error("[LEGACY_WEBHOOK_SIGNATURE_FAILED]", message);
    return res.status(400).json({ error: `Webhook Error: ${message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Delegate to canonical processor
        const result = await processCheckoutCompleted(event, session);
        if (!result.ok && result.quarantined) {
          console.warn("[LEGACY_WEBHOOK_QUARANTINED]", { eventId: event.id, error: result.error });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await processSubscriptionEvent(event, subscription);
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("[LEGACY_WEBHOOK_PROCESSOR_ERROR]", { eventId: event.id, error });
    return res.status(500).json({ error: "Processing failed" });
  }

  return res.status(200).json({ received: true });
}