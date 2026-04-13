import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { auditLogger } from "@/lib/audit/audit-logger";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";
import type { AccessTier as DbAccessTier } from "@prisma/client";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

type Ok = { received: true };
type Fail = { error: string };

export const config = {
  api: {
    bodyParser: false,
  },
};

function mapStripeTierToAccessTier(membershipTier: unknown): DbAccessTier {
  const raw = String(membershipTier ?? "").trim().toLowerCase();

  const explicit: Record<string, DbAccessTier> = {
    free: "member",
    premium: "inner_circle",
    enterprise: "client",
    elite: "legacy",
    basic: "member",
    standard: "member",
    pro: "inner_circle",
    business: "client",
  };

  const normalized = explicit[raw] ?? normalizeUserTier(raw);
  switch (normalized) {
    case "public":
    case "member":
    case "inner_circle":
    case "restricted":
    case "client":
    case "legacy":
    case "architect":
    case "owner":
    case "top_secret":
      return normalized;
    default:
      return "member";
  }
}

function mergeMetadata(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};

  return {
    ...base,
    ...patch,
  };
}

function readMetadataRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

async function findMemberByStripeCustomerId(customerId: string) {
  const candidates = await prisma.innerCircleMember.findMany({
    where: {
      metadata: {
        not: null,
      },
    },
    select: {
      id: true,
      metadata: true,
      tier: true,
      status: true,
    },
  });

  return (
    candidates.find((candidate) => {
      const metadata = readMetadataRecord(candidate.metadata);
      return metadata.stripeCustomerId === customerId;
    }) ?? null
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Fail>,
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
    console.error("[STRIPE_WEBHOOK_SIGNATURE_FAILED]", message);
    return res.status(400).json({ error: `Webhook Error: ${message}` });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const userEmail = session.customer_details?.email || null;

      if (!userId) {
        console.error("[STRIPE_WEBHOOK] Missing metadata.userId");
        return res.status(400).json({ error: "Missing identity metadata" });
      }

      const membershipTierRaw =
        session.metadata?.membershipTier ||
        session.metadata?.plan ||
        "premium";

      const tier = mapStripeTierToAccessTier(membershipTierRaw);

      const existingUser = await prisma.innerCircleMember.findUnique({
        where: { id: userId },
        select: { metadata: true },
      });

      await prisma.innerCircleMember.update({
        where: { id: userId },
        data: {
          tier,
          status: "active",
          metadata: mergeMetadata(existingUser?.metadata, {
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            stripeSessionId: session.id,
            membershipTier: membershipTierRaw,
            upgradedAt: new Date().toISOString(),
          }),
          updatedAt: new Date(),
        },
      });

      await auditLogger.log({
        action: "membership_elevation_success",
        actorId: userId,
        details: {
          email: userEmail,
          sessionId: session.id,
          tier,
          originalTier: membershipTierRaw,
        },
        severity: "info",
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : null;

      const user = customerId ? await findMemberByStripeCustomerId(customerId) : null;

      if (user) {
        await prisma.innerCircleMember.update({
          where: { id: user.id },
          data: {
            tier: "member",
            status: "active",
            metadata: mergeMetadata(user.metadata, {
              subscriptionCancelledAt: new Date().toISOString(),
            }),
          },
        });

        await auditLogger.log({
          action: "membership_revoked_expiry",
          actorId: user.id,
          details: { customerId },
          severity: "warning",
        });
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : null;

      const user = customerId ? await findMemberByStripeCustomerId(customerId) : null;

      if (user && priceId) {
        const tier: DbAccessTier = "inner_circle";

        await prisma.innerCircleMember.update({
          where: { id: user.id },
          data: { tier },
        });

        await auditLogger.log({
          action: "membership_updated",
          actorId: user.id,
          details: { customerId, priceId, tier },
          severity: "info",
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_HANDLER_ERROR]", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
