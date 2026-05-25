// app/api/stripe/webhook/route.ts
// Stripe webhook handler — triggers post-payment ER generation and delivery.
// Idempotent: duplicate Stripe events are detected and skipped.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";
import { sendEmail } from "@/lib/email/core/sendEmail";
import { DecisionActionLog } from "@/lib/commercial/decision-action-log";
import { createHash, randomBytes } from "crypto";

function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 401 });
  }

  try {
    const body = await request.text();
    const event = JSON.parse(body);
    const eventId = event.id as string;
    const eventType = event.type as string;

    // Only process completed checkout sessions
    if (eventType !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object;
    const sessionId = session.id as string;
    const email = session.customer_email ?? session.customer_details?.email;
    const metadata = session.metadata ?? {};

    if (!email) {
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    // Verify this is an executive_reporting purchase
    const productCode = metadata.productCode ?? "";
    if (productCode !== "executive_reporting") {
      return NextResponse.json({ received: true });
    }

    // ── Idempotency check ─────────────────────────────────────────────────
    const existing = await prisma.stripeWebhookEvent.findUnique({
      where: { id: eventId },
    });
    if (existing) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    // Record the event immediately to prevent duplicate processing
    await prisma.stripeWebhookEvent.create({
      data: {
        id: eventId,
        type: eventType,
        sessionId,
        status: "processing",
      },
    });

    // ── Find the ER run ───────────────────────────────────────────────────
    const run = await prisma.executiveReportingRun.findFirst({
      where: {
        email,
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, canonicalSnapshot: true },
    });

    if (!run) {
      // Mark event as deferred — run may be created later
      await prisma.stripeWebhookEvent.update({
        where: { id: eventId },
        data: { status: "deferred" },
      });
      return NextResponse.json({ received: true, note: "Run not yet created" });
    }

    const snapshot = run.canonicalSnapshot as Record<string, unknown> | null;

    // ── Create secure access token ─────────────────────────────────────────
    const rawToken = generateRawToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.executiveReportingArtifact.create({
      data: {
        artifactKey: `er-access-${run.id}-${Date.now()}`,
        runId: run.id,
        kind: "ACCESS_TOKEN",
        payload: {
          tokenHash: hashToken(rawToken),
          email,
          expiresAt: expiresAt.toISOString(),
        } as any,
        status: "active",
      },
    });

    // ── Create DecisionActionLog items ─────────────────────────────────────
    const failureModes = (snapshot?.failureModes as string[]) ?? [];
    const priorityStack = (snapshot?.priorityStack as string[]) ?? [];
    const state = (snapshot?.state as string) ?? "ORDERED";

    if (failureModes.length > 0 || priorityStack.length > 0) {
      await DecisionActionLog.createFromReport(run.id, email, {
        failureModes,
        priorityStack,
        state,
      });

      await routeGovernanceEvent({
        eventType: "FINDING_CREATED",
        sourceSurface: "executive-reporting",
        canonicalRecordType: "FoundryFinding",
        canonicalRecordId: run.id,
        actorEmail: email,
        severity: state === "DISORDERED" ? "CRITICAL" : "HIGH",
        payload: {
          actionItemCount: failureModes.length + priorityStack.length,
          source: "paid-er-generation",
        },
        shouldWriteAudit: true,
        shouldWriteLineage: true,
      });
    }

    // ── Email secure link ─────────────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.com";
    const accessUrl = `${baseUrl}/client/reports/${run.id}?token=${encodeURIComponent(rawToken)}`;

    await sendEmail({
      type: "TRANSACTIONAL",
      to: email,
      subject: "Your Executive Report is ready",
      html: buildERDeliveryEmail(accessUrl),
      text: `Your Executive Report is ready.\n\nAccess it here: ${accessUrl}\n\nThis link expires in 30 days.`,
      meta: { source: "stripe-webhook" },
    });

    // ── Emit governance events ────────────────────────────────────────────
    await routeGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_GENERATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
      canonicalRecordId: run.id,
      actorEmail: email,
      severity: "HIGH",
      payload: { sessionId },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    await routeGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_DELIVERED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
      canonicalRecordId: run.id,
      actorEmail: email,
      severity: "MEDIUM",
      payload: { deliveryMethod: "email", expiresAt: expiresAt.toISOString() },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    // ── Mark event as processed ───────────────────────────────────────────
    await prisma.stripeWebhookEvent.update({
      where: { id: eventId },
      data: { status: "processed", reportId: run.id },
    });

    return NextResponse.json({ received: true, reportId: run.id });
  } catch (err) {
    console.error("[STRIPE_WEBHOOK]", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

function buildERDeliveryEmail(url: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(201,169,110,0.70);margin:0 0 20px;">
      Abraham of London
    </p>
    <h1 style="font-family:Georgia,serif;font-weight:300;font-size:22px;line-height:1.45;color:rgba(255,255,255,0.82);margin:0 0 20px;">
      Your Executive Report is ready
    </h1>
    <p style="font-size:15px;line-height:1.65;color:rgba(255,255,255,0.55);margin:0 0 20px;">
      Your report has been generated and is now available through your secure link below.
    </p>
    <a href="${url}" style="display:inline-block;background:rgba(201,169,110,0.12);border:1px solid rgba(201,169,110,0.35);color:rgba(201,169,110,0.90);font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">
      View Your Executive Report
    </a>
    <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.12em;color:rgba(255,255,255,0.22);margin:16px 0 0;">
      This link expires in 30 days. Do not share it.
    </p>
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;margin-top:24px;">
      <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.12em;color:rgba(255,255,255,0.18);margin:0;">
        This report is a governed analytical output, not financial or legal advice.
      </p>
    </div>
  </div>
</body>
</html>`;
}