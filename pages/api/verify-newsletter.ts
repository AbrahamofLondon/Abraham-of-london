import type { NextApiRequest, NextApiResponse } from "next";
import { sendEmail } from "@/lib/email/core/sendEmail";

interface VerifyResponseBody {
  ok: boolean;
  message: string;
  error?: string;
}

const ADMIN_NOTIFICATION_RECIPIENTS = [
  "info@abrahamoflondon.org",
  "admin@abrahamoflondon.org",
  "seunadaramola@gmail.com",
  "abrahamadaramola@outlook.com",
];

async function sendVerificationNotification(email: string) {
  return sendEmail({
    type: "SYSTEM",
    to: ADMIN_NOTIFICATION_RECIPIENTS,
    replyTo: email,
    subject: "New Verified Newsletter Subscriber",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5530;">New Verified Subscriber</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Verified At:</strong> ${new Date().toISOString()}</p>
        <p style="color: #2c5530; font-weight: bold;">
          This subscriber has successfully verified their email and is now fully subscribed.
        </p>
      </div>
    `,
    text: [
      "New Verified Newsletter Subscriber",
      `Email: ${email}`,
      `Verified At: ${new Date().toISOString()}`,
    ].join("\n"),
    meta: {
      source: "newsletter:verified-notify",
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponseBody>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      message: "Method Not Allowed",
    });
  }

  try {
    const { token, email } = req.query;

    if (
      !token ||
      !email ||
      typeof token !== "string" ||
      typeof email !== "string"
    ) {
      return res.status(400).json({
        ok: false,
        message: "Invalid verification link",
        error: "INVALID_PARAMETERS",
      });
    }

    /**
     * Replace this with real persistence-backed verification logic when ready.
     * For now, this endpoint remains structurally valid without pretending
     * there is a finished token store.
     */
    const isValid = Boolean(token.trim()) && Boolean(email.trim());

    if (!isValid) {
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired verification link",
        error: "INVALID_TOKEN",
      });
    }

    const notifyResult = await sendVerificationNotification(email.trim().toLowerCase());
    if (!notifyResult.ok) {
      return res.status(502).json({
        ok: false,
        message: "Verification succeeded, but notification delivery failed.",
        error: notifyResult.error || "EMAIL_SEND_FAILED",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Successfully verified! You are now subscribed to our newsletter.",
    });
  } catch (error) {
    console.error("[VERIFY_NEWSLETTER] Endpoint error:", error);

    return res.status(500).json({
      ok: false,
      message: "Verification failed. Please try again.",
      error: "VERIFICATION_FAILED",
    });
  }
}
