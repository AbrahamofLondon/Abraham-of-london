// pages/api/teaser.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRecaptcha, RecaptchaError } from "@/lib/verifyRecaptcha";
import { rateLimit } from "@/lib/server/rateLimit";
import { getClientIp } from "@/lib/server/ip";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface TeaserRequestBody {
  email?: string;
  name?: string;
  website?: string; // honeypot
  recaptchaToken?: string;
}

interface TeaserResponse {
  ok: boolean;
  message: string;
  errorCode?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TeaserResponse>,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res
      .status(405)
      .json({ ok: false, message: `Method ${req.method ?? "UNKNOWN"} Not Allowed` });
    return;
  }

  const body = (req.body ?? {}) as TeaserRequestBody;
  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const honeypot = (body.website ?? "").trim();
  const recaptchaToken = body.recaptchaToken || "";
  const ip = getClientIp(req);

  // honeypot – silently succeed
  if (honeypot) {
    res.status(200).json({
      ok: true,
      message: "Teaser sent.",
    });
    return;
  }

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, message: "Valid email is required." });
    return;
  }

  // 🔒 rate-limit: e.g. 5 teaser requests per 15 min per IP
  const rl = rateLimit(ip, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    keyPrefix: "teaser",
  });

  if (!rl.allowed) {
    res.status(429).json({
      ok: false,
      message: "Too many requests. Please try again later.",
      errorCode: "RATE_LIMIT",
    });
    return;
  }

  // 🔒 reCAPTCHA verification
  try {
    const result = await verifyRecaptcha(recaptchaToken, "teaser_request", ip);
    if (!result.success) {
      res.status(400).json({
        ok: false,
        message: "Security check failed. Please try again.",
        errorCode: "RECAPTCHA_FAILED",
      });
      return;
    }
  } catch (err) {
    const e = err as RecaptchaError;
    console.error("[teaser] reCAPTCHA error:", e);
    res.status(400).json({
      ok: false,
      message: "Security check failed.",
      errorCode: e.code ?? "RECAPTCHA_ERROR",
    });
    return;
  }

  // TODO: plug in Resend / Mail provider.
  // For now, just log so you can see it in server logs.
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[teaser] request:", { email, name, ip });
  }

  // You can call your Netlify function or Resend here if you want:
  // await sendTeaserEmail({ email, name });

  res.status(200).json({
    ok: true,
    message: "Teaser link sent. Please check your inbox.",
  });
}