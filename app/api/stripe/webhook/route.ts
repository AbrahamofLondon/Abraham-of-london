// app/api/stripe/webhook/route.ts — EXECUTIVE REPORT WEBHOOK (thin adapter)
//
// PR E: Thin adapter. Verifies Stripe signature and delegates to the
// canonical payment event processor for executive_reporting checkouts.
// Retained for App Router compatibility; delegates all business logic.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { processCheckoutCompleted } from "@/lib/commercial/payment-event-processor";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any }) : null;

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_NOT_CONFIGURED" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "STRIPE_SIGNATURE_MISSING" }, { status: 400 });
  }

  let event: Stripe.Event;
  const rawBody = await request.text();
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({
      error: "STRIPE_SIGNATURE_VERIFICATION_FAILED",
      message: error instanceof Error ? error.message : "Invalid Stripe signature",
    }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Delegate to canonical processor
  const result = await processCheckoutCompleted(event, session);

  if (!result.ok && result.error === "EMAIL_MISSING") {
    return NextResponse.json({ error: "EMAIL_MISSING" }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}