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
import { trackServerLaunch } from "@/lib/analytics/server-launch-event";

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

async function recordBoardroomOrderEvent(input: {
  orderId: string;
  actorEmail?: string | null;
  eventType: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  note?: string | null;
}) {
  await prisma.accessAuditLog.create({
    data: {
      actorType: "SYSTEM",
      actorEmail: input.actorEmail ?? null,
      action: "boardroom_brief_order.event",
      targetType: "boardroom_brief_order",
      targetKey: input.orderId,
      success: true,
      reason: input.eventType,
      metadata: {
        previousStatus: input.previousStatus ?? null,
        newStatus: input.newStatus ?? null,
        note: input.note ?? null,
      },
    },
  });
}

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

async function markBoardroomOrderBySession(input: {
  stripeSessionId: string;
  paymentStatus: "failed" | "refunded";
  deliveryStatus: "failed" | "refunded";
  eventType: string;
  reason?: string | null;
}) {
  const order = await prisma.boardroomBriefOrder.findUnique({
    where: { stripeSessionId: input.stripeSessionId },
    select: { id: true, paymentStatus: true, deliveryStatus: true, metadata: true },
  }).catch(() => null);

  if (!order) return;

  await prisma.boardroomBriefOrder.update({
    where: { id: order.id },
    data: {
      paymentStatus: input.paymentStatus,
      deliveryStatus: input.deliveryStatus,
      metadata: {
        ...((order.metadata as Record<string, unknown> | null) ?? {}),
        lastPaymentEvent: input.eventType,
        lastPaymentReason: input.reason ?? null,
      },
      updatedAt: new Date(),
    },
  });

  await recordBoardroomOrderEvent({
    orderId: order.id,
    actorEmail: "stripe:webhook",
    eventType: input.eventType,
    previousStatus: `${order.paymentStatus}/${order.deliveryStatus}`,
    newStatus: `${input.paymentStatus}/${input.deliveryStatus}`,
    note: input.reason ?? null,
  }).catch(() => undefined);
}

async function markBoardroomOrderByPaymentIntent(input: {
  paymentIntentId: string;
  paymentStatus: "failed" | "refunded";
  deliveryStatus: "failed" | "refunded";
  eventType: string;
  reason?: string | null;
}) {
  const order = await prisma.boardroomBriefOrder.findFirst({
    where: { stripePaymentIntentId: input.paymentIntentId },
    select: { id: true, paymentStatus: true, deliveryStatus: true, metadata: true },
  }).catch(() => null);

  if (!order) return;

  await prisma.boardroomBriefOrder.update({
    where: { id: order.id },
    data: {
      paymentStatus: input.paymentStatus,
      deliveryStatus: input.deliveryStatus,
      metadata: {
        ...((order.metadata as Record<string, unknown> | null) ?? {}),
        lastPaymentEvent: input.eventType,
        lastPaymentReason: input.reason ?? null,
      },
      updatedAt: new Date(),
    },
  });

  await recordBoardroomOrderEvent({
    orderId: order.id,
    actorEmail: "stripe:webhook",
    eventType: input.eventType,
    previousStatus: `${order.paymentStatus}/${order.deliveryStatus}`,
    newStatus: `${input.paymentStatus}/${input.deliveryStatus}`,
    note: input.reason ?? null,
  }).catch(() => undefined);
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

  // ── Idempotency check ──────────────────────────────────────────────────────
  // Record the event only after processing succeeds. If processing fails,
  // Stripe can retry and the unique Boardroom/entitlement writes remain the
  // state-level idempotency guard.
  try {
    const existing = await prisma.processedWebhookEvent.findUnique({
      where: { id: event.id },
      select: { id: true },
    });
    if (existing) {
      return res.json({ received: true, replay: true });
    }
  } catch (idempotencyError: any) {
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
        trackServerLaunch("boardroom_checkout_completed", "/api/billing/webhook", {
          productCode: pc,
          route: catalogProduct?.successPath ?? "/boardroom-brief",
        });

        // Create BoardroomBriefOrder record
        try {
          const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
          const existingOrder = await prisma.boardroomBriefOrder.findUnique({
            where: { stripeSessionId: session.id },
          }).catch(() => null);

          if (!existingOrder) {
            const order = await prisma.boardroomBriefOrder.create({
              data: {
                userId: session.metadata?.userId || email,
                email,
                diagnosticId: session.metadata?.diagnosticId || null,
                handoffId: session.metadata?.handoffId || null,
                stripeSessionId: session.id,
                stripePaymentIntentId: paymentIntentId,
                paymentStatus: "paid",
                deliveryStatus: "paid",
                source: session.metadata?.source || "direct",
                riskLevel: session.metadata?.riskLevel || null,
                score: session.metadata?.score ? parseInt(session.metadata.score) : null,
                metadata: {
                  customerName: session.customer_details?.name || null,
                  customerEmail: email,
                  originPath: session.metadata?.originPath || null,
                },
              },
            });
            await recordBoardroomOrderEvent({
              orderId: order.id,
              actorEmail: "stripe:webhook",
              eventType: "checkout.session.completed",
              previousStatus: "none",
              newStatus: "paid/paid",
              note: "Stripe checkout completed.",
            }).catch(() => undefined);
          } else {
            await prisma.boardroomBriefOrder.update({
              where: { id: existingOrder.id },
              data: {
                paymentStatus: "paid",
                deliveryStatus: "in_review",
                stripePaymentIntentId: paymentIntentId || existingOrder.stripePaymentIntentId,
                updatedAt: new Date(),
              },
            });
            await recordBoardroomOrderEvent({
              orderId: existingOrder.id,
              actorEmail: "stripe:webhook",
              eventType: "checkout.session.completed.replay_update",
              previousStatus: `${existingOrder.paymentStatus}/${existingOrder.deliveryStatus}`,
              newStatus: "paid/in_review",
              note: "Stripe checkout replay updated existing order.",
            }).catch(() => undefined);
          }
        } catch (orderError) {
          console.error("[BILLING_WEBHOOK_BOARDROOM_ORDER_FAILED]", orderError);
        }

        if (session.metadata?.handoffId) {
          try {
            await prisma.$executeRaw`
              UPDATE boardroom_bridge_handoffs
              SET used_at = COALESCE(used_at, NOW())
              WHERE id = ${session.metadata.handoffId}
            `;
          } catch (handoffError) {
            console.warn("[BILLING_WEBHOOK_BOARDROOM_HANDOFF_MARK_FAILED]", handoffError);
          }
        }

        // Update advisory queue
        try {
          const userId = session.metadata?.userId || "";
          if (userId) {
            await prisma.$executeRaw`
              UPDATE inner_circle_advisory_qualifications
              SET status = 'BOARDROOM_PAID', updated_at = NOW()
              WHERE user_id = ${userId}
                AND status IN ('BOARDROOM_CLICKED', 'BOARDROOM_REQUESTED')
            `;
          }
        } catch (qualError) {
          console.error("[BILLING_WEBHOOK_BOARDROOM_QUAL_UPDATE_FAILED]", qualError);
        }
      } else if (pc === "global-market-intelligence-report-q1-2026" || pc === "gmi_q1_2026") {
        trackServerLaunch("gmi_full_report_purchase_completed", "/api/billing/webhook", {
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

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await markBoardroomOrderBySession({
      stripeSessionId: session.id,
      paymentStatus: "failed",
      deliveryStatus: "failed",
      eventType: event.type,
      reason: "Checkout session expired before payment completion.",
    });
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await markBoardroomOrderBySession({
      stripeSessionId: session.id,
      paymentStatus: "failed",
      deliveryStatus: "failed",
      eventType: event.type,
      reason: "Async payment failed.",
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    await markBoardroomOrderByPaymentIntent({
      paymentIntentId: intent.id,
      paymentStatus: "failed",
      deliveryStatus: "failed",
      eventType: event.type,
      reason: intent.last_payment_error?.message || "Payment intent failed.",
    });
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    if (paymentIntentId) {
      await markBoardroomOrderByPaymentIntent({
        paymentIntentId,
        paymentStatus: "refunded",
        deliveryStatus: "refunded",
        eventType: event.type,
        reason: "Stripe charge refunded.",
      });
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

  try {
    await prisma.processedWebhookEvent.create({ data: { id: event.id } });
  } catch (idempotencyError: any) {
    if (idempotencyError?.code !== "P2002") {
      console.warn("[BILLING_WEBHOOK] Failed to record processed event", idempotencyError);
    }
  }

  return res.json({ received: true });
}
