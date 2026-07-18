/**
 * lib/commercial/payment-event-processor.ts
 *
 * PR E — Canonical Payment Event Processor.
 *
 * The single authoritative domain processor for Stripe payment events.
 * Route files become thin adapters that verify signatures and delegate here.
 *
 * Event state model (stored in StripeWebhookEvent table):
 *   RECEIVED → PROCESSING → PROCESSED
 *   RECEIVED → PROCESSING → FAILED_RETRYABLE
 *   RECEIVED → PROCESSING → FAILED_PERMANENT
 *   RECEIVED → QUARANTINED
 *
 * Idempotency:
 *   - Event idempotency: ProcessedWebhookEvent table (Stripe Event ID)
 *   - Business idempotency: StripeWebhookEvent @@unique([type, sessionId])
 */

import Stripe from "stripe";
import { prisma } from "@/lib/prisma.server";
import { getProductByStripePriceId, resolveProductCode, resolveEntitlementSlugs } from "@/lib/commercial/catalog";
import { grantEntitlement, type ProductCode } from "@/lib/server/billing/entitlements";
import { ensureEntitlementAfterPayment } from "@/lib/commercial/payment-verification";
import { revokeCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { generatePaidExecutiveReport } from "@/lib/commercial/paid-er-generation";
import { syncRetainerContractFromSubscription } from "@/lib/retainers/retainer-service";
import { trackServerLaunch } from "@/lib/analytics/server-launch-event";
import { hubspotSync } from "@/lib/hubspot/sync";
import { sendBoardroomAdminNotification } from "@/lib/boardroom/admin-notification";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";
import { CATALOG } from "@/lib/commercial/catalog";

// ── Types ──────────────────────────────────────────────────────────────────

export type PaymentEventState =
  | "RECEIVED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED_RETRYABLE"
  | "FAILED_PERMANENT"
  | "QUARANTINED";

/**
 * Canonical commercial identity envelope.
 * Resolved from Stripe Price → Product → Catalog identity chain.
 */
export type CommercialPaymentIdentity = {
  productCode: string;
  catalogKey: string;
  entitlementKey?: string;
  fulfilmentKey?: string;
  orderReference?: string;
  stripeProductId: string;
  stripePriceId: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  subscriptionId?: string;
  customerId?: string;
  billingMode: "one_time" | "subscription";
};

// ── Constants ──────────────────────────────────────────────────────────────


// ── Event state management ─────────────────────────────────────────────────

/**
 * Record a payment event's durable state using the StripeWebhookEvent table.
 * The @@unique([type, sessionId]) constraint provides business idempotency.
 */
export async function recordPaymentEventState(
  stripeEventId: string,
  eventType: string,
  sessionId: string | null,
  state: PaymentEventState,
  error?: string,
): Promise<void> {
  try {
    await prisma.stripeWebhookEvent.upsert({
      where: { id: stripeEventId },
      create: {
        id: stripeEventId,
        type: eventType,
        sessionId,
        status: state,
      },
      update: {
        status: state,
      },
    });
  } catch (e: any) {
    // P2002 = unique constraint violation — another event with same type+sessionId exists
    if (e?.code !== "P2002") {
      console.warn("[PAYMENT_EVENT_STATE_RECORD_FAILED]", { stripeEventId, state, error: e?.message });
    }
  }
}

/**
 * Check event idempotency via ProcessedWebhookEvent table.
 * Returns true if already processed.
 */
export async function isEventAlreadyProcessed(stripeEventId: string): Promise<boolean> {
  try {
    const existing = await prisma.processedWebhookEvent.findUnique({
      where: { id: stripeEventId },
      select: { id: true },
    });
    return existing !== null;
  } catch {
    return false;
  }
}

/**
 * Mark event as processed (idempotency record).
 */
export async function markEventProcessed(stripeEventId: string): Promise<void> {
  try {
    await prisma.processedWebhookEvent.create({
      data: { id: stripeEventId },
    });
  } catch (e: any) {
    if (e?.code !== "P2002") {
      console.warn("[PAYMENT_EVENT_MARK_PROCESSED_FAILED]", { stripeEventId, error: e?.message });
    }
  }
}

// ── Identity resolution ────────────────────────────────────────────────────

/**
 * Resolve canonical commercial identity from a Stripe Checkout Session.
 *
 * Resolution order:
 *   1. Resolve by Stripe Price ID → Product → catalog identity
 *   2. Cross-check against session metadata
 *   3. Quarantine if identity is contradictory or unresolvable
 */
export async function resolvePaymentIdentity(
  session: Stripe.Checkout.Session,
): Promise<{ identity: CommercialPaymentIdentity | null; quarantinedReason: string | null }> {
  const metadata = session.metadata ?? {};

  const rawPriceCode = String(metadata.priceCode || "").trim();
  const rawStripePriceId = String(metadata.stripePriceId || "").trim();
  const priceId = rawStripePriceId || (rawPriceCode.startsWith("price_") ? rawPriceCode : "");
  const metadataProductCode = String(metadata.productCode || metadata.catalogCode || "").trim();
  const metadataEntitlementSlug = String(metadata.entitlementSlug || "").trim();

  let catalogProduct = null;
  let stripeProductId = "";

  if (priceId) {
    catalogProduct = getProductByStripePriceId(priceId);
    if (catalogProduct) {
      stripeProductId = catalogProduct.stripeProductId || "";
    }
  }

  if (!catalogProduct && metadataProductCode) {
    catalogProduct = resolveProductCode(metadataProductCode);
  }

  if (!catalogProduct && metadataEntitlementSlug) {
    catalogProduct = resolveProductCode(metadataEntitlementSlug);
  }

  if (!catalogProduct && rawPriceCode && !rawPriceCode.startsWith("price_")) {
    catalogProduct = resolveProductCode(rawPriceCode);
  }

  if (!catalogProduct) {
    return {
      identity: null,
      quarantinedReason: priceId
        ? `UNKNOWN_PRICE: Stripe Price ${priceId} does not match any catalog product`
        : "UNRESOLVABLE_IDENTITY: No Price ID or product code could resolve to a catalog product",
    };
  }

  const claimedProduct = metadataProductCode ? resolveProductCode(metadataProductCode) : null;
  if (metadataProductCode && (!claimedProduct || claimedProduct.code !== catalogProduct.code)) {
    return {
      identity: null,
      quarantinedReason: `CONTRADICTORY_METADATA: Metadata claims productCode="${metadataProductCode}" but resolved payment identity is "${catalogProduct.code}"`,
    };
  }

  const claimedEntitlement = metadataEntitlementSlug ? resolveProductCode(metadataEntitlementSlug) : null;
  if (metadataEntitlementSlug && (!claimedEntitlement || claimedEntitlement.code !== catalogProduct.code)) {
    return {
      identity: null,
      quarantinedReason: `CONTRADICTORY_METADATA: Metadata claims entitlementSlug="${metadataEntitlementSlug}" but resolved payment identity is "${catalogProduct.entitlementSlug}"`,
    };
  }

  const billingMode: "one_time" | "subscription" =
    session.mode === "subscription" ? "subscription" : "one_time";

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  const customerId =
    typeof session.customer === "string" ? session.customer : null;

  return {
    identity: {
      productCode: catalogProduct.code,
      catalogKey: catalogProduct.code,
      entitlementKey: catalogProduct.entitlementSlug,
      fulfilmentKey: catalogProduct.entitlementSlug,
      orderReference: session.id,
      stripeProductId: catalogProduct.stripeProductId || stripeProductId,
      stripePriceId: priceId || catalogProduct.stripePriceId || "",
      checkoutSessionId: session.id,
      paymentIntentId: paymentIntentId ?? undefined,
      subscriptionId: subscriptionId ?? undefined,
      customerId: customerId ?? undefined,
      billingMode,
    },
    quarantinedReason: null,
  };
}
// ── Business idempotency keys ──────────────────────────────────────────────

/**
 * Build a deterministic business idempotency key for a checkout completion.
 */
export function buildBusinessIdempotencyKey(
  eventType: string,
  session: Stripe.Checkout.Session,
): string {
  return `${eventType}::${session.id}`;
}

/**
 * Build a business idempotency key for subscription events.
 */
export function buildSubscriptionBusinessKey(
  eventType: string,
  subscription: Stripe.Subscription,
): string {
  return `${eventType}::${subscription.id}`;
}

// ── Canonical event processing ─────────────────────────────────────────────

/**
 * Process a checkout.session.completed event through the canonical processor.
 *
 * This is the single authoritative path for processing successful checkouts.
 * All webhook routes should delegate here.
 */
export async function processCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Promise<{ ok: boolean; error?: string; quarantined?: boolean }> {
  const stripeEventId = event.id;

  // ── Event idempotency ──────────────────────────────────────────────────
  if (await isEventAlreadyProcessed(stripeEventId)) {
    return { ok: true };
  }

  await recordPaymentEventState(stripeEventId, event.type, session.id, "PROCESSING");

  try {
    // ── Identity resolution ──────────────────────────────────────────────
    const { identity, quarantinedReason } = await resolvePaymentIdentity(session);

    if (!identity || quarantinedReason) {
      await recordPaymentEventState(stripeEventId, event.type, session.id, "QUARANTINED");
      console.warn("[PAYMENT_PROCESSOR_QUARANTINED]", { eventId: stripeEventId, reason: quarantinedReason });
      return { ok: false, error: quarantinedReason ?? "QUARANTINED", quarantined: true };
    }

    const email = String(
      session.metadata?.email ||
      session.customer_details?.email ||
      session.customer_email ||
      "",
    ).trim().toLowerCase();

    if (!email) {
      await recordPaymentEventState(stripeEventId, event.type, session.id, "FAILED_PERMANENT", "EMAIL_MISSING");
      return { ok: false, error: "EMAIL_MISSING" };
    }

    // ── Grant entitlement ────────────────────────────────────────────────
    const primaryEntitlementSlug = identity.entitlementKey || identity.productCode;
    const tier = String(session.metadata?.tier || identity.productCode);
    await grantEntitlement({
      email,
      productCode: primaryEntitlementSlug as ProductCode,
      tier,
      source: "stripe",
      externalRef: session.id,
    });

    // Bundle entitlements
    const bundleMeta = session.metadata?.bundleEntitlements;
    const catalogProduct = resolveProductCode(identity.productCode);
    const allSlugs = bundleMeta
      ? String(bundleMeta).split(",").filter(Boolean)
      : catalogProduct
        ? resolveEntitlementSlugs(catalogProduct.code)
        : [primaryEntitlementSlug];

    for (const slug of allSlugs) {
      if (slug !== primaryEntitlementSlug) {
        try {
          await grantEntitlement({
            email,
            productCode: slug as ProductCode,
            tier,
            source: "stripe",
            externalRef: session.id,
          });
        } catch {
          console.error("[PAYMENT_PROCESSOR_BUNDLE_GRANT_FAILED]", { slug, email });
        }
      }
    }

    // Verify entitlement
    const verified = await ensureEntitlementAfterPayment({
      checkoutSessionId: session.id,
      slug: primaryEntitlementSlug,
      email,
    });

    if (!verified.ok || !verified.entitlement?.granted) {
      await recordPaymentEventState(stripeEventId, event.type, session.id, "FAILED_RETRYABLE", "ENTITLEMENT_SYNC_FAILED");
      return { ok: false, error: "ENTITLEMENT_SYNC_FAILED" };
    }

    // ── Boardroom Brief order creation ───────────────────────────────────
    if (identity.productCode === "boardroom_brief" || identity.productCode === "boardroom-brief") {
      await handleBoardroomBriefPayment(event, session, email, identity);
    }

    // ── Executive Reporting generation ───────────────────────────────────
    if (identity.productCode === "executive_reporting") {
      await handleExecutiveReportingPayment(event, session, email, identity);
    }

    // ── Subscription / retainer handling ─────────────────────────────────
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;
    const contractId = String(session.metadata?.contractId || "").trim();

    if (subscriptionId && contractId) {
      await prisma.retainerContract.updateMany({
        where: { id: contractId },
        data: {
          stripeSubscriptionId: subscriptionId,
          status: "ACTIVE",
        },
      });
    }

    // ── Analytics ────────────────────────────────────────────────────────
    trackServerLaunch("checkout_session_created" as any, "/api/billing/webhook", {
      productCode: identity.productCode,
    });

    // ── HubSpot sync ─────────────────────────────────────────────────────
    const hsAmount = typeof session.amount_total === "number" ? session.amount_total / 100 : undefined;
    hubspotSync({
      event: "payment_confirmed",
      email,
      data: { amount: hsAmount },
    }).catch(() => {});

    // ── Mark processed ───────────────────────────────────────────────────
    await recordPaymentEventState(stripeEventId, event.type, session.id, "PROCESSED");
    await markEventProcessed(stripeEventId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown processing error";
    console.error("[PAYMENT_PROCESSOR_ERROR]", { stripeEventId, error: message });
    await recordPaymentEventState(stripeEventId, event.type, session.id, "FAILED_RETRYABLE", message);
    return { ok: false, error: message };
  }
}

// ── Domain handlers ────────────────────────────────────────────────────────

async function handleBoardroomBriefPayment(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  email: string,
  identity: CommercialPaymentIdentity,
): Promise<void> {
  const paymentIntentId = identity.paymentIntentId ?? null;

  const existingOrder = await prisma.boardroomBriefOrder.findUnique({
    where: { stripeSessionId: session.id },
  }).catch(() => null);

  let canonicalOrderId: string;

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
    canonicalOrderId = order.id;

    routeGovernanceEvent({
      eventType: "BOARDROOM_ORDER_PAID",
      sourceSurface: "payment-processor",
      canonicalRecordType: "BoardroomBriefOrder",
      canonicalRecordId: order.id,
      actorEmail: "stripe:webhook",
      severity: "HIGH",
      payload: { email, stripeSessionId: session.id, source: session.metadata?.source || "direct" },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    }).catch(() => undefined);
  } else {
    canonicalOrderId = existingOrder.id;
    await prisma.boardroomBriefOrder.update({
      where: { id: existingOrder.id },
      data: {
        paymentStatus: "paid",
        deliveryStatus: "in_review",
        stripePaymentIntentId: paymentIntentId || existingOrder.stripePaymentIntentId,
        updatedAt: new Date(),
      },
    });
  }

  // ── Durable fulfilment stubs (idempotent via upsert) ───────────────────
  try {
    const artifactId = `pa_boardroom_${canonicalOrderId}`;
    await prisma.productArtifact.upsert({
      where: { artifactId },
      create: {
        artifactId,
        productCode: "boardroom-brief",
        sourceEntityType: "boardroom_brief_order",
        sourceEntityId: canonicalOrderId,
        userId: session.metadata?.userId || null,
        userEmail: email,
        status: "PENDING",
        deliveryStatus: "PENDING",
      },
      update: {},
    });
  } catch (e) {
    console.error("[PAYMENT_PROCESSOR_ARTIFACT_STUB_FAILED]", e);
  }

  try {
    const existingFalsification = await prisma.falsificationEntry.findFirst({
      where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: canonicalOrderId },
    });
    if (!existingFalsification) {
      await prisma.falsificationEntry.create({
        data: {
          productCode: "boardroom-brief",
          sourceEntityType: "boardroom_brief_order",
          sourceEntityId: canonicalOrderId,
          claimOrRecommendation: "PENDING_REVIEW — awaiting human analysis",
          confidenceLevel: "LOW",
          whatWouldChangeThisView: "PENDING — to be completed during analysis",
          observableIndicator: "PENDING — to be defined",
          status: "MONITORING",
        },
      });
    }
  } catch (e) {
    console.error("[PAYMENT_PROCESSOR_FALSIFICATION_STUB_FAILED]", e);
  }

  try {
    const hypothesisId = `oh_boardroom_${canonicalOrderId}`;
    await prisma.outcomeHypothesis.upsert({
      where: { hypothesisId },
      create: {
        hypothesisId,
        productCode: "boardroom-brief",
        sourceRunId: canonicalOrderId,
        userEmail: email,
        predictedDecisionMove: "PENDING_REVIEW — awaiting human analysis",
        expectedObservableChange: "PENDING_REVIEW — awaiting analysis",
        reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: "OPEN",
      },
      update: {},
    });
  } catch (e) {
    console.error("[PAYMENT_PROCESSOR_HYPOTHESIS_STUB_FAILED]", e);
  }

  sendBoardroomAdminNotification({
    orderId: canonicalOrderId,
    customerEmail: email,
    sessionId: session.id,
    proofMode: session.metadata?.proofMode === "true",
    orderCreatedAt: new Date(),
  }).catch(() => undefined);

  if (session.metadata?.handoffId) {
    try {
      await prisma.$executeRaw`
        UPDATE boardroom_bridge_handoffs
        SET used_at = COALESCE(used_at, NOW())
        WHERE id = ${session.metadata.handoffId}
      `;
    } catch (e) {
      console.warn("[PAYMENT_PROCESSOR_HANDOFF_MARK_FAILED]", e);
    }
  }
}

async function handleExecutiveReportingPayment(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  email: string,
  identity: CommercialPaymentIdentity,
): Promise<void> {
  const result = await generatePaidExecutiveReport({
    checkoutSessionId: session.id,
    stripeEventId: event.id,
    email,
    clientName: session.customer_details?.name ?? undefined,
    caseRef: session.metadata?.caseRef ?? null,
  });

  if (!result.ok || !result.reportId) {
    throw new Error(`EXECUTIVE_REPORT_GENERATION_FAILED: ${result.error}`);
  }
}

// ── Subscription event handlers ────────────────────────────────────────────

/**
 * Process a customer.subscription.updated or customer.subscription.deleted event.
 */
export async function processSubscriptionEvent(
  event: Stripe.Event,
  subscription: Stripe.Subscription,
): Promise<{ ok: boolean; error?: string }> {
  const stripeEventId = event.id;

  if (await isEventAlreadyProcessed(stripeEventId)) {
    return { ok: true };
  }

  await recordPaymentEventState(stripeEventId, event.type, subscription.id, "PROCESSING");

  try {
    await syncRetainerContractFromSubscription({
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
    });

    // Handle Professional subscription cancellation
    if (event.type === "customer.subscription.deleted") {
      const priceId = subscription.items.data[0]?.price.id ?? null;
      const PROFESSIONAL_PRICE_IDS = new Set([
        CATALOG.professional?.stripePriceId,
        CATALOG.professional_annual?.stripePriceId,
      ].filter(Boolean) as string[]);

      const isProfessional = priceId != null && PROFESSIONAL_PRICE_IDS.has(priceId);

      if (isProfessional) {
        const targetCustomerId = typeof subscription.customer === "string" ? subscription.customer : null;
        if (targetCustomerId) {
          const candidates = await prisma.innerCircleMember.findMany({
            where: { metadata: { not: null } },
          });
          const user = candidates.find((m) => {
            try {
              const meta = JSON.parse(m.metadata ?? "{}");
              return meta?.stripeCustomerId === targetCustomerId;
            } catch { return false; }
          });

          if (user) {
            await revokeCanonicalEntitlement({
              userId: user.id,
              email: user.email ?? null,
              slug: CATALOG.professional!.entitlementSlug,
              reason: "stripe_subscription_cancelled",
              stripeSubscriptionId: subscription.id,
            });
          }
        }
      }
    }

    await recordPaymentEventState(stripeEventId, event.type, subscription.id, "PROCESSED");
    await markEventProcessed(stripeEventId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await recordPaymentEventState(stripeEventId, event.type, subscription.id, "FAILED_RETRYABLE", message);
    return { ok: false, error: message };
  }
}

/**
 * Process a charge.refunded event.
 */
export async function processRefundEvent(
  event: Stripe.Event,
  charge: Stripe.Charge,
): Promise<{ ok: boolean; error?: string }> {
  const stripeEventId = event.id;

  if (await isEventAlreadyProcessed(stripeEventId)) {
    return { ok: true };
  }

  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

  if (!paymentIntentId) {
    await recordPaymentEventState(stripeEventId, event.type, "", "FAILED_PERMANENT", "NO_PAYMENT_INTENT");
    return { ok: false, error: "NO_PAYMENT_INTENT" };
  }

  await recordPaymentEventState(stripeEventId, event.type, paymentIntentId, "PROCESSING");

  try {
    const order = await prisma.boardroomBriefOrder.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (order) {
      await prisma.boardroomBriefOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: "refunded",
          deliveryStatus: "refunded",
          metadata: {
            ...((order.metadata as Record<string, unknown>) ?? {}),
            lastPaymentEvent: event.type,
            lastPaymentReason: "Stripe charge refunded",
          },
          updatedAt: new Date(),
        },
      });
    }

    await recordPaymentEventState(stripeEventId, event.type, paymentIntentId, "PROCESSED");
    await markEventProcessed(stripeEventId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await recordPaymentEventState(stripeEventId, event.type, paymentIntentId, "FAILED_RETRYABLE", message);
    return { ok: false, error: message };
  }
}

/**
 * Process a checkout.session.expired or checkout.session.async_payment_failed event.
 */
export async function processCheckoutFailureEvent(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Promise<{ ok: boolean; error?: string }> {
  const stripeEventId = event.id;

  if (await isEventAlreadyProcessed(stripeEventId)) {
    return { ok: true };
  }

  await recordPaymentEventState(stripeEventId, event.type, session.id, "PROCESSING");

  try {
    const order = await prisma.boardroomBriefOrder.findUnique({
      where: { stripeSessionId: session.id },
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
            lastPaymentReason: event.type === "checkout.session.expired"
              ? "Checkout session expired"
              : "Async payment failed",
          },
          updatedAt: new Date(),
        },
      });
    }

    await recordPaymentEventState(stripeEventId, event.type, session.id, "PROCESSED");
    await markEventProcessed(stripeEventId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await recordPaymentEventState(stripeEventId, event.type, session.id, "FAILED_RETRYABLE", message);
    return { ok: false, error: message };
  }
}