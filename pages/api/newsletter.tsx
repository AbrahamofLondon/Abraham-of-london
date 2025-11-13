// pages/api/newsletter.tsx
import type { NextApiRequest, NextApiResponse } from "next";

interface NewsletterRequestBody {
  email?: string;
  name?: string;
}

interface NewsletterResponseBody {
  ok: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsletterResponseBody>,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res
      .status(405)
      .json({ ok: false, error: `Method ${req.method ?? "UNKNOWN"} Not Allowed` });
    return;
  }

  const body = (req.body ?? {}) as NewsletterRequestBody;
  const email = (body.email ?? "").trim();
  const name = (body.name ?? "").trim();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "Valid email is required" });
    return;
  }

  try {
    // 🔒 Hook in your provider here (Resend, Mailchimp, ConvertKit, etc.)
    // For now we just log and pretend we've subscribed them.
    // eslint-disable-next-line no-console
    console.log("Newsletter subscription:", { email, name });

    res.status(200).json({
      ok: true,
      message: "You have been subscribed successfully.",
    });
  } catch (err) {
    // Ensure err is used
    // eslint-disable-next-line no-console
    console.error("Newsletter API error:", err);
    res.status(500).json({
      ok: false,
      error: "Internal server error. Please try again later.",
    });
  }
}