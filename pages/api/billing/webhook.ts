// pages/api/billing/webhook.ts — CANONICAL PRODUCT WEBHOOK
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import {
  grantEntitlement,
  PRODUCT_CODES,
  type ProductCode,
} from "@/lib/server/billing/entitlements";
import { prisma } from "@/lib/prisma.server";
import { hubspotSync } from "@/lib/hubspot/sync";
import { ensureEntitlementAfterPayment } from "@/lib/commercial/payment-verification";
import {
  resolveProductCode,
  resolveEntitlementSlugs,
  getProductByStripePriceId,
} from "@/lib/commercial/catalog";
import { syncRetainerContractFromSubscription } from "@/lib/retainers/retainer-service";
import { generatePaidExecutiveReport } from "@/lib/commercial/paid-er-generation";
import { trackLaunch } from "@/lib/analytics/client-launch-events";

const VALID_PRODUCT_CODES = new Set<string>(Object.values(PRODUCT_CODES));

function isProductCode(value: string): value is ProductCode {
  return VALID_PRODUCT_CODES.has(value);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any }) : null;

async function recordCheckoutCompletion(input: {
  sessionId: string;
  email: string;
  productCode: string;
  priceCode: string;
  tier: string;
  paymentStatus: string | null;
}) {
  try {
    await prisma.accessAuditLog.create({
      data: {
        actorType: "SYSTEM",
        actorEmail: input.email || null,
        action: "billing.checkout.completed",
        targetType: "checkout_session",
        targetKey: input.sessionId,
        success: input.paymentStatus === "paid",
        reason: input.paymentStatus || null,
        metadata: {
          session_id: input.sessionId,
          email: input.email,
          product: input.productCode,
          priceCode: input.priceCode,
          tier: input.tier,
          payment_status: input.paymentStatus,
        },
      },
    });
  } catch (error) {
    console.warn("[BILLING_WEBHOOK] Failed to persist checkout audit record", error);
  }
}

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

  // ── Idempotency hard lock ──────────────────────────────────────────────────
  // Stripe may retry webhooks. The find-or-update entitlement pattern handles
  // duplicate grants, but this table prevents the entire handler from
  // re-executing under concurrency or retries. If the event ID exists, we
  // return 200 immediately — Stripe treats this as acknowledged.
  try {
    const existing = await prisma.processedWebhookEvent.findUnique({
      where: { id: event.id },
      select: { id: true },
    });
    if (existing) {
      return res.json({ received: true, replay: true });
    }
    // Insert BEFORE processing — if we crash mid-processing, Stripe retries
    // and we re-process. If we insert AFTER, concurrent calls can race past
    // the check. Insert-before + unique constraint = exactly-once semantics.
    await prisma.processedWebhookEvent.create({ data: { id: event.id } });
  } catch (idempotencyError: any) {
    // Unique constraint violation = another instance is already processing
    if (idempotencyError?.code === "P2002") {
      return res.json({ received: true, replay: true });
    }
    // Non-idempotency DB errors should not block webhook processing —
    // fall through and let the entitlement authority's own idempotency handle it
    console.warn("[BILLING_WEBHOOK] Idempotency check failed, proceeding", idempotencyError);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = String(session.metadata?.email || session.customer_details?.email || "").toLowerCase();
    const productCode = String(session.metadata?.productCode || "");
    const priceCode = String(session.metadata?.priceCode || "");
    const tier = String(session.metadata?.tier || "report-basic");
    const paymentStatus = session.payment_status || null;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
    const contractId = String(session.metadata?.contractId || "");

    await recordCheckoutCompletion({
      sessionId: session.id,
      email,
      productCode,
      priceCode,
      tier,
      paymentStatus,
    });

    if (email && productCode && isProductCode(productCode)) {
      // Grant primary entitlement
      await grantEntitlement({
        email,
        productCode,
        tier,
        source: "stripe",
        externalRef: session.id,
      });

      // Resolve bundle entitlements from catalog SSOT
      const bundleMeta = session.metadata?.bundleEntitlements;
      const catalogProduct = resolveProductCode(priceCode) ?? resolveProductCode(productCode);
      const allSlugs = bundleMeta
        ? bundleMeta.split(",").filter(Boolean)
        : catalogProduct
          ? resolveEntitlementSlugs(catalogProduct.code)
          : [productCode];

      // Grant each included entitlement (for bundles)
      for (const slug of allSlugs) {
        if (slug !== productCode) {
          try {
            await grantEntitlement({ email, productCode: slug as ProductCode, tier, source: "stripe", externalRef: session.id });
          } catch {
            console.error("[BILLING_WEBHOOK_BUNDLE_GRANT_PARTIAL_FAILURE]", { slug, email });
          }
        }
      }

      const verified = await ensureEntitlementAfterPayment({
        checkoutSessionId: session.id,
        slug: productCode,
        email,
      });

      if (!verified.ok || !verified.entitlement?.granted) {
        console.error("[BILLING_WEBHOOK_ENTITLEMENT_SYNC_FAILED]", {
          sessionId: session.id,
          email,
          productCode,
        });
        return res.status(500).json({
          error: "ENTITLEMENT_SYNC_FAILED",
        });
      }

      // ── Launch analytics on successful payment completion ──
      const pc: string = productCode
      if (pc === "boardroom-brief" || pc === "boardroom_brief") {
        trackLaunch("boardroom_checkout_completed", "/api/billing/webhook", {
          productCode: pc,
          route: catalogProduct?.successPath ?? "/boardroom-brief",
        });
      } else if (pc === "global-market-intelligence-report-q1-2026" || pc === "gmi_q1_2026") {
        trackLaunch("gmi_full_report_purchase_completed", "/api/billing/webhook", {
          productCode: pc,
          route: catalogProduct?.successPath ?? "/artifacts/global-market-intelligence-report-q1-2026",
        });
      }

      if (catalogProduct?.code === "executive_reporting") {
        const generation = await generatePaidExecutiveReport({
          checkoutSessionId: session.id,
          stripeEventId: event.id,
          email,
          clientName: session.customer_details?.name ?? undefined,
          caseRef: session.metadata?.caseRef ?? null,
        });

        if (!generation.ok || !generation.reportId) {
          console.error("[BILLING_WEBHOOK_PAID_ER_GENERATION_FAILED]", {
            sessionId: session.id,
            email,
            error: generation.error,
          });
          return res.status(500).json({
            error: "PAID_ER_GENERATION_FAILED",
          });
        }

        await prisma.stripeWebhookEvent.upsert({
          where: { id: event.id },
          create: {
            id: event.id,
            type: event.type,
            sessionId: session.id,
            reportId: generation.reportId,
            status: "processed",
          },
          update: {
            reportId: generation.reportId,
            status: "processed",
          },
        }).catch(() => undefined);
      }

      if (subscriptionId && contractId) {
        await prisma.retainerContract.updateMany({
          where: { id: contractId },
          data: {
            stripeSubscriptionId: subscriptionId,
            status: "ACTIVE",
          },
        });
      }
    } else if (email && productCode) {
      console.warn(
        `[BILLING_WEBHOOK] Rejected unknown productCode from Stripe metadata: ${productCode}`,
      );
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    if (subscription.id) {
      await syncRetainerContractFromSubscription({
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
      });
    }
  }

  // HubSpot sync on successful checkout
  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const hsEmail = String(s.metadata?.email || s.customer_details?.email || "").toLowerCase();
    const hsAmount = typeof s.amount_total === "number" ? s.amount_total / 100 : undefined;
    if (hsEmail) {
      hubspotSync({
        event: "payment_confirmed",
        email: hsEmail,
        data: { amount: hsAmount },
      }).catch(() => {});
    }
  }

  return res.json({ received: true });
}
