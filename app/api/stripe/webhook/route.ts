// app/api/stripe/webhook/route.ts
// Stripe webhook handler for paid Executive Report generation.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma.server";
import { resolveProductCode } from "@/lib/commercial/catalog";
import { generatePaidExecutiveReport } from "@/lib/commercial/paid-er-generation";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any }) : null;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function resolveCheckoutProduct(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  return (
    resolveProductCode(String(metadata.priceCode || "")) ??
    resolveProductCode(String(metadata.productCode || "")) ??
    null
  );
}

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return json(500, { error: "STRIPE_WEBHOOK_NOT_CONFIGURED" });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return json(400, { error: "STRIPE_SIGNATURE_MISSING" });
  }

  let event: Stripe.Event;
  const rawBody = await request.text();
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return json(400, {
      error: "STRIPE_SIGNATURE_VERIFICATION_FAILED",
      message: error instanceof Error ? error.message : "Invalid Stripe signature",
    });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const product = resolveCheckoutProduct(session);
  if (product?.code !== "executive_reporting") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { id: event.id },
    select: { id: true, status: true, reportId: true },
  });
  if (existing?.status === "processed") {
    return NextResponse.json({
      received: true,
      replay: true,
      reportId: existing.reportId ?? null,
    });
  }

  if (!existing) {
    try {
      await prisma.stripeWebhookEvent.create({
        data: {
          id: event.id,
          type: event.type,
          sessionId: session.id,
          status: "processing",
        },
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        return NextResponse.json({ received: true, replay: true });
      }
      throw error;
    }
  }

  const email = String(
    session.metadata?.email ||
    session.customer_details?.email ||
    session.customer_email ||
    "",
  ).trim().toLowerCase();

  if (!email) {
    await prisma.stripeWebhookEvent.update({
      where: { id: event.id },
      data: { status: "failed" },
    });
    return json(400, { error: "EMAIL_MISSING" });
  }

  const result = await generatePaidExecutiveReport({
    checkoutSessionId: session.id,
    stripeEventId: event.id,
    email,
    clientName: session.customer_details?.name ?? undefined,
    caseRef: session.metadata?.caseRef ?? null,
  });

  if (!result.ok || !result.reportId) {
    await prisma.stripeWebhookEvent.update({
      where: { id: event.id },
      data: { status: "failed" },
    });
    return json(500, {
      error: "EXECUTIVE_REPORT_GENERATION_FAILED",
      detail: result.error ?? null,
    });
  }

  await prisma.stripeWebhookEvent.update({
    where: { id: event.id },
    data: {
      status: "processed",
      reportId: result.reportId,
    },
  });

  return NextResponse.json({
    received: true,
    reportId: result.reportId,
    tokenStatus: result.tokenStatus ?? null,
    emailStatus: result.emailStatus ?? null,
    actionLogCount: result.actionLogCount ?? 0,
  });
}
