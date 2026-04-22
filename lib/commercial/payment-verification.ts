import Stripe from "stripe";

import {
  grantCanonicalEntitlement,
  resolveCanonicalEntitlement,
  type CanonicalEntitlement,
} from "@/lib/commercial/entitlement-authority";

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key ? new Stripe(key, { apiVersion: "2025-03-31.basil" as any }) : null;
}

async function isPaidCheckoutSession(sessionId: string): Promise<{ ok: boolean; reason?: string }> {
  // Simulated/test sessions allowed ONLY in non-production environments
  if (
    (sessionId.startsWith("simulated:") || sessionId.startsWith("test:")) &&
    process.env.NODE_ENV !== "production"
  ) {
    console.warn("[PAYMENT_VERIFICATION] Simulated session accepted in dev:", sessionId);
    return { ok: true };
  }
  if (sessionId.startsWith("simulated:") || sessionId.startsWith("test:")) {
    console.error("[PAYMENT_VERIFICATION_BLOCKED] Simulated session rejected in production:", sessionId);
    return { ok: false, reason: "SIMULATED_SESSION_BLOCKED_IN_PRODUCTION" };
  }

  const stripe = stripeClient();
  if (!stripe) {
    return { ok: false, reason: "STRIPE_NOT_CONFIGURED" };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return { ok: false, reason: `PAYMENT_NOT_PAID:${session.payment_status}` };
    }
    return { ok: true };
  } catch (error) {
    console.error("[PAYMENT_VERIFICATION_STRIPE_READ_FAILED]", {
      checkoutSessionId: sessionId,
      error,
    });
    return { ok: false, reason: "STRIPE_SESSION_READ_FAILED" };
  }
}

async function checkoutSessionEmail(sessionId: string): Promise<string | null> {
  if (sessionId.startsWith("simulated:") || sessionId.startsWith("test:")) return null;
  const stripe = stripeClient();
  if (!stripe) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return (
      String(session.metadata?.email || session.customer_details?.email || "")
        .trim()
        .toLowerCase() || null
    );
  } catch {
    return null;
  }
}

export async function verifyPaymentEntitlementSync(input: {
  checkoutSessionId: string;
  slug: string;
  userId?: string | null;
  email?: string | null;
}): Promise<{
  ok: boolean;
  entitlementRecorded: boolean;
  reason?: string;
}> {
  const paid = await isPaidCheckoutSession(input.checkoutSessionId);
  if (!paid.ok) {
    return {
      ok: false,
      entitlementRecorded: false,
      reason: paid.reason,
    };
  }

  const entitlement = await resolveCanonicalEntitlement({
    userId: input.userId ?? null,
    email: input.email ?? null,
    slug: input.slug,
  });

  return {
    ok: entitlement.granted && entitlement.verified,
    entitlementRecorded: entitlement.granted && entitlement.verified,
    reason: entitlement.granted ? undefined : "ENTITLEMENT_MISSING_AFTER_PAYMENT",
  };
}

export async function ensureEntitlementAfterPayment(input: {
  checkoutSessionId: string;
  slug: string;
  userId?: string | null;
  email?: string | null;
}): Promise<{
  ok: boolean;
  entitlement: CanonicalEntitlement | null;
  repaired?: boolean;
}> {
  const resolvedEmail = input.email ?? (await checkoutSessionEmail(input.checkoutSessionId));
  const resolvedInput = { ...input, email: resolvedEmail };
  const initial = await verifyPaymentEntitlementSync(resolvedInput);
  if (initial.ok) {
    return {
      ok: true,
      entitlement: await resolveCanonicalEntitlement(resolvedInput),
      repaired: false,
    };
  }

  const paid = await isPaidCheckoutSession(resolvedInput.checkoutSessionId);
  if (!paid.ok) {
    console.error("[PAYMENT_ENTITLEMENT_SYNC_FAILED]", {
      ...input,
      reason: paid.reason,
    });
    return { ok: false, entitlement: null, repaired: false };
  }

  let repaired: CanonicalEntitlement | null = null;
  try {
    repaired = await grantCanonicalEntitlement({
      userId: input.userId ?? null,
      email: resolvedEmail ?? null,
      slug: input.slug,
      source: "purchase",
    });
  } catch (error) {
    console.error("[PAYMENT_ENTITLEMENT_REPAIR_FAILED]", {
      ...input,
      error,
    });
    return { ok: false, entitlement: null, repaired: false };
  }

  const final = await verifyPaymentEntitlementSync(resolvedInput);
  if (!final.ok) {
    console.error("[PAYMENT_ENTITLEMENT_REPAIR_DID_NOT_VERIFY]", {
      ...input,
      reason: final.reason,
    });
    return { ok: false, entitlement: repaired, repaired: true };
  }

  return {
    ok: true,
    entitlement: await resolveCanonicalEntitlement(resolvedInput),
    repaired: true,
  };
}
