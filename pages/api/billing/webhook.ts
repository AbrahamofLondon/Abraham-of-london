// pages/api/billing/webhook.ts — CANONICAL PRODUCT WEBHOOK (thin adapter)
//
// PR E: Thin adapter. Verifies Stripe signature, normalizes the event,
// and delegates to the canonical payment event processor.
// No independent business logic.

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import {
  processCheckoutCompleted,
  processSubscriptionEvent,
  processRefundEvent,
  processCheckoutFailureEvent,
} from "@/lib/commercial/payment-event-processor";

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

  // ── Route to canonical processor ──────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await processCheckoutCompleted(event, session);
        if (!result.ok && result.quarantined) {
          console.warn("[BILLING_WEBHOOK_QUARANTINED]", { eventId: event.id, error: result.error });
        }
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await processCheckoutFailureEvent(event, session);
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        // Map to checkout failure via payment_intent
        const sessionId = intent.metadata?.checkout_session_id || null;
        if (sessionId) {
          // We don't have the full session object, but we can still mark the order
          const { prisma } = await import("@/lib/prisma.server");
          const order = await prisma.boardroomBriefOrder.findFirst({
            where: { stripePaymentIntentId: intent.id },
          });
          if (order) {
            await prisma.boardroomBriefOrder.update({
              where: { id: order.id },
              data: {
                paymentStatus: "failed",
                deliveryStatus: "failed",
                metadata: {
                  ...((order.metadata as Record<string, unknown>) ?? {}),
                  lastPaymentEvent: event.type,
                  lastPaymentReason: intent.last_payment_error?.message || "Payment intent failed",
                },
                updatedAt: new Date(),
              },
            });
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await processRefundEvent(event, charge);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await processSubscriptionEvent(event, subscription);
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }
  } catch (error) {
    console.error("[BILLING_WEBHOOK_PROCESSOR_ERROR]", { eventId: event.id, error });
    return res.status(500).json({ error: "Processing failed" });
  }

  return res.json({ received: true });
}