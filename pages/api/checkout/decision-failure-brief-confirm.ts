/* pages/api/checkout/decision-failure-brief-confirm.ts
 *
 * Confirms a Decision Failure Brief payment by looking up the Stripe session.
 * Called by the success page after redirect from Stripe.
 *
 * Generates verification token for full/urgent tiers.
 * No sensitive data in analytics.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any })
  : null;

function generateVerificationToken(): string {
  const raw = crypto.randomBytes(16).toString("hex").toUpperCase();
  return `FDY-${raw.slice(0, 8)}-${raw.slice(8, 16)}-${raw.slice(16, 24)}`;
}

function generateReference(): string {
  return `BRIEF-${Date.now().toString(36).slice(-4).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  if (!stripe) {
    return res.status(500).json({ ok: false, error: "STRIPE_NOT_CONFIGURED" });
  }

  const { sessionId } = req.body || {};
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ ok: false, error: "SESSION_ID_REQUIRED" });
  }

  try {
    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(200).json({
        ok: false,
        error: "PAYMENT_NOT_CONFIRMED",
        message: "Payment has not yet been confirmed. Please wait a moment and refresh.",
      });
    }

    const orderId = session.metadata?.order_id;
    if (!orderId) {
      return res.status(400).json({ ok: false, error: "ORDER_ID_MISSING" });
    }

    // Find and update the order
    const order = await prisma.decisionBriefOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ ok: false, error: "ORDER_NOT_FOUND" });
    }

    // Only update if still pending (avoid double-processing)
    if (order.status === "pending") {
      const updateData: Record<string, any> = {
        status: "in_review",
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        paidAt: new Date(),
      };

      // Generate verification token for full/urgent tiers
      if (order.tier === "full" || order.tier === "urgent") {
        updateData.verificationToken = generateVerificationToken();
      }

      await prisma.decisionBriefOrder.update({
        where: { id: orderId },
        data: updateData,
      });
    }

    const reference = generateReference();

    return res.status(200).json({
      ok: true,
      reference,
      tier: order.tier,
      email: order.email,
      verificationToken: order.verificationToken || undefined,
    });
  } catch (error) {
    console.error("[BRIEF_CONFIRM] Failed:", error);
    return res.status(500).json({ ok: false, error: "CONFIRMATION_FAILED" });
  }
}
