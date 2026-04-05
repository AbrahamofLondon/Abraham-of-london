import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { markDiagnosticReportPaid } from "@/lib/diagnostics/store";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const diagnosticWebhookSecret =
  process.env.STRIPE_DIAGNOSTIC_REPORT_WEBHOOK_SECRET?.trim();

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    })
  : null;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  if (!stripe || !diagnosticWebhookSecret) {
    return res.status(500).send("Stripe webhook configuration missing");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    return res.status(400).send("Missing stripe signature");
  }

  try {
    const rawBody = await buffer(req);
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      diagnosticWebhookSecret,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const diagnosticRecordId = String(
        session.metadata?.diagnosticRecordId || "",
      ).trim();

      const reportTier = String(
        session.metadata?.reportTier || "standard",
      ).trim() as "standard" | "premium";

      if (diagnosticRecordId) {
        await prisma.diagnosticReportOrder.updateMany({
          where: { stripeSessionId: session.id },
          data: {
            status: "paid",
            stripePaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            updatedAt: new Date(),
          },
        });

        await markDiagnosticReportPaid({
          diagnosticRecordId,
          reportTier,
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[DIAGNOSTIC_REPORT_WEBHOOK_ERROR]", error);
    return res.status(400).send("Webhook error");
  }
}