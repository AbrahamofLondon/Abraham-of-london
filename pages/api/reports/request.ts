/* pages/api/reports/request.ts */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { getReportPackage } from "@/lib/reports/catalogue";
import { createReportRequest, attachCheckoutSession } from "@/lib/reports/store";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe =
  stripeSecret
    ? new Stripe(stripeSecret, {
        apiVersion: "2026-02-25.clover" as any,
      })
    : null;

type ResponseData =
  | {
      ok: true;
      reportRequestId: string;
      reference: string;
      checkoutUrl: string | null;
      requiresPayment: boolean;
    }
  | {
      ok: false;
      reason: string;
    };

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const sessionId = readAccessCookie(req);
    if (!sessionId) {
      return res.status(401).json({ ok: false, reason: "AUTH_REQUIRED" });
    }

    const ctx = await getSessionContext(sessionId);
    if (!ctx.ok || !ctx.valid) {
      return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });
    }

    if (!tierAtLeast(ctx.tier, "inner-circle")) {
      return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
    }

    const body = req.body || {};
    const packageKey = safeString(body.packageKey);
    const diagnosticRecordId = safeString(body.diagnosticRecordId) || null;
    const notes = safeString(body.notes) || null;

    const pkg = getReportPackage(packageKey);
    if (!pkg) {
      return res.status(400).json({ ok: false, reason: "INVALID_PACKAGE" });
    }

    const reportRequest = await createReportRequest({
      packageKey: pkg.key,
      title: pkg.title,
      diagnosticRecordId,
      diagnosticType: pkg.diagnosticType,
      amountGbp: pkg.amountGbp,
      currency: pkg.currency,
      userId: ctx.memberId || null,
      userEmail: (ctx as any).email || null,
      notes,
    });

    if (!stripe) {
      return res.status(200).json({
        ok: true,
        reportRequestId: reportRequest.id,
        reference: reportRequest.reference,
        checkoutUrl: null,
        requiresPayment: false,
      });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      `http://${req.headers.host}`;

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${siteUrl}/client/dashboard?report=success`,
      cancel_url: `${siteUrl}/client/dashboard?report=cancelled`,
      customer_email: (ctx as any).email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(pkg.amountGbp * 100),
            product_data: {
              name: pkg.title,
              description: pkg.description,
              metadata: {
                packageKey: pkg.key,
                diagnosticType: pkg.diagnosticType,
                reportRequestId: reportRequest.id,
                reference: reportRequest.reference,
              },
            },
          },
        },
      ],
      metadata: {
        reportRequestId: reportRequest.id,
        reference: reportRequest.reference,
        packageKey: pkg.key,
        diagnosticType: pkg.diagnosticType,
        userId: ctx.memberId || "",
        userEmail: (ctx as any).email || "",
      },
    });

    await attachCheckoutSession(reportRequest.id, {
      stripeCheckoutSessionId: checkout.id,
    });

    return res.status(200).json({
      ok: true,
      reportRequestId: reportRequest.id,
      reference: reportRequest.reference,
      checkoutUrl: checkout.url || null,
      requiresPayment: true,
    });
  } catch (error) {
    console.error("[REPORT_REQUEST_API_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "INTERNAL_ERROR" });
  }
}