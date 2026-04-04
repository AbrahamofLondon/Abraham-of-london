import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { prisma } from "@/lib/prisma.server";
import { markDiagnosticReportPaid } from "@/lib/diagnostics/store";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover" as any,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_DIAGNOSTIC_REPORT_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return res.status(400).send("Missing webhook secret or signature");
  }

  try {
    const rawBody = await buffer(req);
    const event = stripe.webhooks.constructEvent(rawBody, sig, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const diagnosticRecordId = session.metadata?.diagnosticRecordId;
      const reportTier = (session.metadata?.reportTier || "standard") as "standard" | "premium";

      if (diagnosticRecordId) {
        await prisma.diagnosticReportOrder.updateMany({
          where: { stripeSessionId: session.id },
          data: {
            status: "paid",
            stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
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