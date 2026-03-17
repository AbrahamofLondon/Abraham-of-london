// pages/api/events/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import Stripe from "stripe";
import { getEventPrice } from "@/lib/pricing/event-pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover" as any,
});

interface CheckoutRequestBody {
  eventId: string;
  ticketId: string;
  quantity: number;
  formData: {
    email: string;
    name: string;
    requirements?: string;
  };
}

type LegacySessionUser = {
  id?: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const { eventId, ticketId, quantity, formData } =
      req.body as CheckoutRequestBody;

    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    if (
      !ticketId ||
      !["public", "member", "verified", "restricted", "top-secret"].includes(
        ticketId
      )
    ) {
      return res.status(400).json({ error: "Invalid ticket tier" });
    }

    if (!quantity || quantity < 1 || quantity > 10) {
      return res.status(400).json({ error: "Quantity must be between 1 and 10" });
    }

    if (!formData?.email || !formData?.name) {
      return res.status(400).json({ error: "Missing delegate information" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const dynamicAmount = await getEventPrice(eventId, ticketId);

    if (dynamicAmount <= 0) {
      console.error(
        `[PRICE ERROR] Invalid price ${dynamicAmount} for ${eventId}/${ticketId}`
      );
      return res.status(500).json({ error: "Invalid price configuration" });
    }

    const legacyUser = session?.user as LegacySessionUser | undefined;
    const userId = legacyUser?.id || "guest";

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: formData.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${eventId
                .split("-")
                .map(
                  (word) => word.charAt(0).toUpperCase() + word.slice(1)
                )
                .join(" ")}: ${
                ticketId.charAt(0).toUpperCase() + ticketId.slice(1)
              } Ticket`,
              description: `Clearance Tier: ${ticketId}`,
              metadata: {
                eventId,
                ticketId,
              },
            },
            unit_amount: dynamicAmount,
          },
          quantity,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/events/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/events/${eventId}`,
      metadata: {
        userId,
        eventId,
        ticketId,
        membershipTier: ticketId,
        delegateName: formData.name,
        delegateEmail: formData.email,
        quantity: String(quantity),
        priceAtPurchase: String(dynamicAmount),
        timestamp: new Date().toISOString(),
      },
    });

    console.log(
      `[CHECKOUT] Created session ${checkoutSession.id} for ${formData.email} at £${(
        dynamicAmount / 100
      ).toFixed(2)}`
    );

    return res.status(200).json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (err: any) {
    console.error("[STRIPE ERROR]", {
      message: err.message,
      type: err.type,
      code: err.code,
    });

    return res.status(500).json({
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Failed to create checkout session. Please try again.",
    });
  }
}