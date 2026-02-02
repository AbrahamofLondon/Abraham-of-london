/* pages/api/webhooks/stripe.ts — HANDLES ASYNCHRONOUS ROLE ELEVATION */
import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { prisma } from "@/lib/db"; // Assuming Prisma for DB operations
import { auditLogger } from "@/lib/audit/audit-logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // Maintain strict versioning for intelligence stability
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Stripe requires the raw body to verify signatures
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"]!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[CRITICAL] Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the specific event: Successful Checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const userEmail = session.customer_details?.email;

    if (!userId) {
      console.error("[ERROR] Stripe session missing metadata.userId");
      return res.status(400).json({ error: "Missing identity metadata" });
    }

    try {
      // 1. Atomically Upgrade User Role in Database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          role: "INNER_CIRCLE",
          membershipTier: "PREMIUM",
          stripeCustomerId: session.customer as string,
          updatedAt: new Date(),
        },
      });

      // 2. Log the Elevation to Audit Trail
      await auditLogger.log({
        action: "membership_elevation_success",
        userId: userId,
        details: { 
          email: userEmail, 
          sessionId: session.id,
          tier: "Inner Circle"
        },
        severity: "info",
      });

      console.log(`[SUCCESS] User ${userId} elevated to Inner Circle.`);
    } catch (dbError) {
      console.error(`[DATABASE ERROR] Failed to upgrade user ${userId}:`, dbError);
      
      // Log failure for manual intervention
      await auditLogger.log({
        action: "membership_elevation_failed",
        userId: userId,
        details: { error: "Database update failed after payment" },
        severity: "critical",
      });
      
      return res.status(500).json({ error: "Provisioning failed" });
    }
  }

  // Handle Subscription Cancellations
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    
    await prisma.user.updateMany({
      where: { stripeCustomerId: subscription.customer as string },
      data: { role: "USER", membershipTier: "FREE" },
    });

    await auditLogger.log({
      action: "membership_revoked_expiry",
      userId: "SYSTEM",
      details: { customerId: subscription.customer },
      severity: "warning",
    });
  }

  res.json({ received: true });
}