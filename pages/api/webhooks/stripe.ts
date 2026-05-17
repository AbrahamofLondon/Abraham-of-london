import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { auditLogger } from "@/lib/audit/audit-logger";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";
import { ensureEntitlementAfterPayment } from "@/lib/commercial/payment-verification";
import { revokeCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { CATALOG } from "@/lib/commercial/catalog";

// Professional subscription price IDs — derived from catalog SSOT.
// Used to detect cancellation of a Professional subscription without requiring
// checkout session metadata (which is not present on subscription.deleted events).
const PROFESSIONAL_PRICE_IDS = new Set([
  CATALOG.professional?.stripePriceId,
  CATALOG.professional_annual?.stripePriceId,
].filter(Boolean) as string[]);

const PROFESSIONAL_ENTITLEMENT_SLUG = CATALOG.professional!.entitlementSlug;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    })
  : null;

type Ok = { received: true };
type Fail = { error: string };

export const config = {
  api: {
    bodyParser: false,
  },
};

function mapStripeTierToAccessTier(membershipTier: unknown): AccessTier {
  const raw = String(membershipTier ?? "").trim().toLowerCase();

  const explicit: Record<string, AccessTier> = {
    free: "member",
    premium: "professional",
    enterprise: "client",
    elite: "legacy",
    basic: "member",
    standard: "member",
    pro: "professional",
    professional: "professional",
    business: "client",
  };

  return normalizeUserTier(explicit[raw] ?? raw);
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
    const processedEventId = `legacy-stripe:${event.id}`;
    const existing = await prisma.processedWebhookEvent.findUnique({
      where: { id: processedEventId },
      select: { id: true },
    });
    if (existing) {
      return res.status(200).json({ received: true });
    }

    await prisma.processedWebhookEvent.create({
      data: { id: processedEventId },
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || null;
      const userEmail =
        session.metadata?.email ||
        session.customer_details?.email ||
        null;

      if (!userId && !userEmail) {
        console.error("[STRIPE_WEBHOOK] No userId or email in session metadata");
        return res.status(400).json({ error: "Missing identity metadata — neither userId nor email available" });
      }

      // Read metadata.tier first (set by modern checkout), then legacy fields.
      const membershipTierRaw =
        session.metadata?.tier ||
        session.metadata?.membershipTier ||
        session.metadata?.plan ||
        "premium";

      const tier = mapStripeTierToAccessTier(membershipTierRaw);

      // Membership elevation only possible with userId
      if (userId) {
      const existingUser = await prisma.innerCircleMember.findUnique({
        where: { id: userId },
        select: { metadata: true },
      });

      await prisma.innerCircleMember.update({
        where: { id: userId },
        data: {
          tier,
          status: "active",
          metadata: JSON.stringify(mergeMetadata(existingUser?.metadata, {
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            stripeSessionId: session.id,
            membershipTier: membershipTierRaw,
            upgradedAt: new Date().toISOString(),
          })),
          updatedAt: new Date(),
        },
      });

      await auditLogger.log({
        action: "membership_elevation_success",
        actorId: userId ?? userEmail ?? "unknown",
        details: {
          email: userEmail,
          sessionId: session.id,
          tier,
          originalTier: membershipTierRaw,
        },
        severity: "info",
      });
      } // end if (userId) — membership elevation block

      const paidSlug = session.metadata?.slug || session.metadata?.productCode;
      if (paidSlug) {
        const verified = await ensureEntitlementAfterPayment({
          checkoutSessionId: session.id,
          slug: paidSlug,
          userId,
          email: userEmail,
        });

        if (!verified.ok || !verified.entitlement?.granted) {
          console.error("[STRIPE_WEBHOOK_ENTITLEMENT_SYNC_FAILED]", {
            sessionId: session.id,
            userId,
            email: userEmail,
            slug: paidSlug,
          });
          return res.status(500).json({ error: "Entitlement sync failed" });
        }

        // Send purchase confirmation email for decision instruments
        const instrumentSlugs = ["decision-exposure-instrument", "mandate-clarity-framework", "intervention-path-selector", "operator-decision-pack"];
        if (userEmail && instrumentSlugs.includes(paidSlug)) {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
            await fetch(`${baseUrl}/api/decision-instruments/send-purchase-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: userEmail, slug: paidSlug }),
            });
          } catch (emailErr) {
            console.error("[STRIPE_WEBHOOK] Purchase email failed (non-blocking):", emailErr);
          }
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const targetCustomerId =
        typeof subscription.customer === "string" ? subscription.customer : null;
      const subscriptionId = subscription.id;
      const subscriptionPriceId = subscription.items.data[0]?.price.id ?? null;

      // Determine if this is a Professional subscription by price ID.
      // subscription.deleted does not carry checkout session metadata, so we
      // resolve via the known catalog price IDs for professional/professional_annual.
      const isProfessionalSubscription =
        subscriptionPriceId != null && PROFESSIONAL_PRICE_IDS.has(subscriptionPriceId);

      // Engineering workaround for C3: InnerCircleMember.metadata is `String?`
      // (not `Json?`), so Prisma's JSON `path` filter is unsupported on this
      // schema. Load candidates with non-null metadata and parse-and-filter in
      // memory instead. The Inner Circle population is bounded; acceptable for
      // a webhook handler.
      const candidates = await prisma.innerCircleMember.findMany({
        where: { metadata: { not: null } },
      });
      const user = targetCustomerId
        ? candidates.find((m) => {
            try {
              const meta = JSON.parse(m.metadata ?? "{}");
              return meta?.stripeCustomerId === targetCustomerId;
            } catch {
              return false;
            }
          }) ?? null
        : null;

      if (user) {
        // 1. Downgrade runtime tier.
        await prisma.innerCircleMember.update({
          where: { id: user.id },
          data: {
            tier: "member",
            status: "active",
            metadata: JSON.stringify(mergeMetadata(user.metadata, {
              subscriptionCancelledAt: new Date().toISOString(),
              cancelledSubscriptionId: subscriptionId,
            })),
          },
        });

        // 2. Revoke canonical entitlement.
        // If price ID confirms Professional, revoke by slug directly.
        // If price ID is absent/unknown but user holds an active Professional
        // entitlement (i.e. tier was professional), also revoke — catches
        // subscription metadata gaps.
        const shouldRevokeEntitlement =
          isProfessionalSubscription ||
          user.tier === "professional" ||
          user.tier === "inner_circle";

        let entitlementRevoked = false;
        if (shouldRevokeEntitlement) {
          const { revoked } = await revokeCanonicalEntitlement({
            userId: user.id,
            email: user.email ?? null,
            slug: PROFESSIONAL_ENTITLEMENT_SLUG,
            reason: "stripe_subscription_cancelled",
            stripeSubscriptionId: subscriptionId,
          });
          entitlementRevoked = revoked;
        }

        await auditLogger.log({
          action: "membership_revoked_expiry",
          actorId: user.id,
          details: {
            customerId: subscription.customer,
            subscriptionId,
            priceId: subscriptionPriceId,
            isProfessionalSubscription,
            entitlementRevoked,
          },
          severity: "warn",
        });
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id;
      const targetCustomerId =
        typeof subscription.customer === "string" ? subscription.customer : null;

      // Same C3 workaround as the deleted handler above: in-memory parse-and-filter.
      const candidates = await prisma.innerCircleMember.findMany({
        where: { metadata: { not: null } },
      });
      const user = targetCustomerId
        ? candidates.find((m) => {
            try {
              const meta = JSON.parse(m.metadata ?? "{}");
              return meta?.stripeCustomerId === targetCustomerId;
            } catch {
              return false;
            }
          }) ?? null
        : null;

      if (user && priceId) {
        const tier: AccessTier = "professional";

        await prisma.innerCircleMember.update({
          where: { id: user.id },
          data: { tier },
        });

        await auditLogger.log({
          action: "membership_updated",
          actorId: user.id,
          details: { customerId: subscription.customer, priceId, tier },
          severity: "info",
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "P2002") {
      return res.status(200).json({ received: true });
    }
    console.error("[STRIPE_WEBHOOK_HANDLER_ERROR]", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
