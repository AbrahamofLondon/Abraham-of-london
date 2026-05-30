/* pages/api/checkout/decision-failure-brief.ts
 *
 * Creates a Stripe checkout session for a paid Decision Failure Brief.
 *
 * Flow:
 *   1. Validate input (name, email, tier, decisionSummary optional)
 *   2. Create DecisionBriefOrder in DB
 *   3. Create Stripe checkout session
 *   4. Return checkout URL
 *
 * No sensitive decision text in analytics.
 * Decision summary stored only if user provides it.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/prisma.server";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any })
  : null;

const TIERS = {
  basic:  { price: 4900, label: "Basic" },
  full:   { price: 14900, label: "Full" },
  urgent: { price: 34900, label: "Urgent" },
} as const;

type TierKey = keyof typeof TIERS;

const CheckoutSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  tier: z.enum(["basic", "full", "urgent"]),
  decisionSummary: z.string().max(500).trim().optional().or(z.literal("")),
  decisionType: z.string().optional().or(z.literal("")),
  primaryFailurePoint: z.string().optional().or(z.literal("")),
  directive: z.string().optional().or(z.literal("")),
  sourceTest: z.string().optional().or(z.literal("")),
});

function siteUrl(req: NextApiRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`
  ).replace(/\/$/, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  if (!stripe) {
    return res.status(500).json({ ok: false, error: "STRIPE_NOT_CONFIGURED" });
  }

  // Validate
  const parsed = CheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "VALIDATION_ERROR",
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const { name, email, tier, decisionSummary, decisionType, primaryFailurePoint, directive, sourceTest } = parsed.data;
  const tierConfig = TIERS[tier as TierKey];

  // Create order record
  let order;
  try {
    order = await prisma.decisionBriefOrder.create({
      data: {
        name,
        email,
        tier,
        price: tierConfig.price,
        status: "pending",
        decisionSummary: decisionSummary || null,
        decisionType: decisionType || null,
        primaryFailurePoint: primaryFailurePoint || null,
        directive: directive || null,
        sourceTest: sourceTest || null,
      },
    });
  } catch (error) {
    console.error("[BRIEF_CHECKOUT] Failed to create order:", error);
    return res.status(500).json({ ok: false, error: "ORDER_CREATE_FAILED" });
  }

  // Create Stripe checkout session
  const baseUrl = siteUrl(req);
  const tierLabel = tierConfig.label;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Decision Failure Brief — ${tierLabel}`,
              description:
                tier === "urgent"
                  ? "24-hour delivery of a full Decision Failure Map with verification token and follow-up Q&A."
                  : tier === "full"
                  ? "48-hour delivery of a full Decision Failure Map with verification token and evidence pack."
                  : "72-hour delivery of a Decision Failure Map with primary failure point and minimum viable next move.",
            },
            unit_amount: tierConfig.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        product_type: "decision_failure_brief",
        tier,
        order_id: order.id,
        email,
        name,
      },
      success_url: `${baseUrl}/foundry/brief/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/foundry/decision-test`,
    });

    // Update order with Stripe session ID
    await prisma.decisionBriefOrder.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return res.status(200).json({
      ok: true,
      checkoutUrl: session.url,
      orderId: order.id,
    });
  } catch (error) {
    console.error("[BRIEF_CHECKOUT] Stripe session creation failed:", error);
    // Clean up the order
    await prisma.decisionBriefOrder.update({
      where: { id: order.id },
      data: { status: "cancelled" },
    }).catch(() => {});
    return res.status(500).json({ ok: false, error: "STRIPE_CHECKOUT_FAILED" });
  }
}
