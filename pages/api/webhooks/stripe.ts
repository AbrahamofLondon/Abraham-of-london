/* pages/api/webhooks/stripe.ts — SSOT Stripe Webhook (Tier Mapping) */
import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma"; // Institutional Prisma singleton
import { auditLogger } from "@/lib/audit/audit-logger";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // Maintain strict versioning for intelligence stability
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

type Ok = { received: true };
type Fail = { error: string };

// Stripe requires the raw body to verify signatures
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Map Stripe membership tier to SSOT AccessTier
 * Accepts legacy Stripe payload values: FREE/PREMIUM/ENTERPRISE etc.
 */
function mapStripeTierToAccessTier(membershipTier: unknown): AccessTier {
  const raw = String(membershipTier ?? "").trim().toLowerCase();

  // Explicit mapping for Stripe-specific values
  const explicit: Record<string, AccessTier> = {
    free: "member",
    premium: "inner-circle",
    enterprise: "client",
    elite: "legacy",
    basic: "member",
    standard: "member",
    pro: "inner-circle",
    business: "client",
  };

  return explicit[raw] ?? normalizeUserTier(raw);
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<Ok | Fail>
) {
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
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
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
      // Determine tier from session metadata or line items
      const membershipTierRaw = session.metadata?.membershipTier ?? 
                                session.metadata?.plan ?? 
                                "premium"; // Default fallback
      
      const tier: AccessTier = mapStripeTierToAccessTier(membershipTierRaw);

      // 1. Atomically Upgrade User Role in Database (SSOT aligned)
      const updatedUser = await prisma.innerCircleMember.update({
        where: { id: userId },
        data: { 
          tier, // SSOT tier
          status: "active",
          metadata: {
            stripeCustomerId: session.customer as string,
            stripeSessionId: session.id,
            membershipTier: membershipTierRaw, // Store original for audit
            upgradedAt: new Date().toISOString(),
          },
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
          tier,
          originalTier: membershipTierRaw,
        },
        severity: "info",
      });

      console.log(`[SUCCESS] User ${userId} elevated to ${tier}.`);
    } catch (dbError) {
      console.error(`[DATABASE ERROR] Failed to upgrade user ${userId}:`, dbError);
      
      // Log failure for manual intervention
      await auditLogger.log({
        action: "membership_elevation_failed",
        userId: userId,
        details: { error: "Database update failed after payment", sessionId: session.id },
        severity: "critical",
      });
      
      return res.status(500).json({ error: "Provisioning failed" });
    }
  }

  // Handle Subscription Cancellations
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    
    // Find user by Stripe customer ID and downgrade to member tier
    const user = await prisma.innerCircleMember.findFirst({
      where: { 
        metadata: {
          path: ['stripeCustomerId'],
          equals: subscription.customer as string
        }
      }
    });

    if (user) {
      await prisma.innerCircleMember.update({
        where: { id: user.id },
        data: { 
          tier: "member", // Downgrade to basic member tier
          status: "active",
          metadata: {
            ...(user.metadata as any),
            subscriptionCancelledAt: new Date().toISOString(),
          },
        },
      });

      await auditLogger.log({
        action: "membership_revoked_expiry",
        userId: user.id,
        details: { customerId: subscription.customer },
        severity: "warning",
      });
    }
  }

  // Handle Subscription Updates (tier changes)
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const priceId = subscription.items.data[0]?.price.id;
    
    // Map price ID to tier (you'd have a price-to-tier mapping in your system)
    // This is simplified - you'd likely lookup from a Product table
    const user = await prisma.innerCircleMember.findFirst({
      where: { 
        metadata: {
          path: ['stripeCustomerId'],
          equals: subscription.customer as string
        }
      }
    });

    if (user && priceId) {
      // Determine tier from price ID (implement your own mapping)
      const tier: AccessTier = "inner-circle"; // Default, should be mapped properly
      
      await prisma.innerCircleMember.update({
        where: { id: user.id },
        data: { tier },
      });

      await auditLogger.log({
        action: "membership_updated",
        userId: user.id,
        details: { customerId: subscription.customer, priceId, tier },
        severity: "info",
      });
    }
  }

  return res.status(200).json({ received: true });
}