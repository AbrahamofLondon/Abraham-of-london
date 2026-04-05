import type { NextApiRequest, NextApiResponse } from "next";

interface VerifyResponseBody {
  ok: boolean;
  message: string;
  error?: string;
}

const ADMIN_NOTIFICATION_RECIPIENTS = [
  "info@abrahamoflondon.org",
  "seunadaramola@gmail.com",
  "abrahamadaramola@outlook.com",
];

async function sendVerificationNotification(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[VERIFY_NEWSLETTER] RESEND_API_KEY missing; admin notification skipped.");
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Abraham of London <info@abrahamoflondon.org>",
        to: ADMIN_NOTIFICATION_RECIPIENTS,
        reply_to: email,
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
      }),
    });
  } catch (error) {
    console.error("[VERIFY_NEWSLETTER] Failed to send notification:", error);
  }
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

    await sendVerificationNotification(email.trim().toLowerCase());

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