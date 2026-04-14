import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDiagnosticRecordById, markDiagnosticReportPending } from "@/lib/diagnostics/store";
import type { DiagnosticReportTier } from "@/lib/diagnostics/types";
import { prisma } from "@/lib/prisma.server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover" as any,
});

function getAmountForTier(tier: DiagnosticReportTier): number {
  return tier === "premium" ? 25000 : 9500;
}

function safeTier(value: unknown): DiagnosticReportTier {
  return value === "premium" ? "premium" : "standard";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};

    const diagnosticRecordId =
      typeof body.diagnosticRecordId === "string" ? body.diagnosticRecordId.trim() : "";

    const reportTier = safeTier(body.reportTier);

    if (!diagnosticRecordId) {
      return res.status(400).json({ ok: false, reason: "DIAGNOSTIC_ID_REQUIRED" });
    }

    const record = await getDiagnosticRecordById(diagnosticRecordId);
    if (!record) {
      return res.status(404).json({ ok: false, reason: "RECORD_NOT_FOUND" });
    }

    const sessionEmail = session?.user?.email ?? null;
    const sessionUserId =
      (session?.user as { id?: string | null } | undefined)?.id ?? null;

    if (record.userEmail && sessionEmail && record.userEmail !== sessionEmail) {
      return res.status(403).json({ ok: false, reason: "RECORD_OWNERSHIP_MISMATCH" });
    }

    const amount = getAmountForTier(reportTier);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: sessionEmail || record.userEmail || undefined,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: amount,
            product_data: {
              name: `${reportTier === "premium" ? "Premium" : "Standard"} Diagnostic Report`,
              description: `${record.diagnosticType} diagnostic report`,
            },
          },
        },
      ],
      metadata: {
        diagnosticRecordId: record.id,
        reportTier,
        userEmail: sessionEmail || record.userEmail || "",
        userId: sessionUserId || record.userId || "",
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/diagnostics?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/diagnostics?checkout=cancelled`,
    });

    await prisma.diagnosticReportOrder.create({
      data: {
        diagnosticRecordId: record.id,
        stripeSessionId: checkoutSession.id,
        reportTier,
        amount,
        currency: "gbp",
        status: "pending",
        userEmail: sessionEmail || record.userEmail || null,
        userId: sessionUserId || record.userId || null,
      },
    });

    await markDiagnosticReportPending({
      diagnosticId: record.id,
      reportTier,
    });

    return res.status(200).json({
      ok: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("[CREATE_REPORT_CHECKOUT_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "SERVER_ERROR" });
  }
}