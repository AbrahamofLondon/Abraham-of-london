import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRecaptchaDetailed } from "@/lib/recaptchaServer";
import { sendInnerCircleEmail, createOrUpdateMemberAndIssueKey } from "@/lib/inner-circle";
import { getClientIp } from "@/lib/server/ip";
import { limitIp, setRateLimitHeaders, limitEmail } from "@/lib/security/rateLimit";

type ResponseData = {
  ok: boolean;
  message?: string;
  error?: string;
};

const GENERIC_SUCCESS =
  "If your email is registered, your Inner Circle access email will be dispatched shortly.";

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method requires POST for secure dispatch." });
  }

  // IP rate limiting
  const ipLimit = limitIp(req, "inner-circle-resend", { windowMs: 60_000, max: 15 });
  setRateLimitHeaders(res, ipLimit);
  if (!ipLimit.allowed) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please wait before trying again." });
  }

  const { email, name, recaptchaToken, returnTo } = req.body || {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ ok: false, error: "Identity (email) is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    // still return generic success to prevent probing
    return res.status(200).json({ ok: true, message: GENERIC_SUCCESS });
  }

  // Email-based rate limit (prevents targeted flooding)
  const emailLimit = limitEmail(normalizedEmail, "inner-circle-resend", { windowMs: 10 * 60_000, max: 6 });
  if (!emailLimit.allowed) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please wait before requesting another dispatch." });
  }

  // reCAPTCHA (hard boundary)
  const token = typeof recaptchaToken === "string" ? recaptchaToken : "";
  const ip = getClientIp(req);

  const verification = await verifyRecaptchaDetailed(token, "inner_circle_resend", ip);
  if (!verification.success) {
    return res.status(403).json({ ok: false, error: "Security verification failed. Please refresh and try again." });
  }

  try {
    // Pragmatic resend strategy:
    // - If user exists in DB, the store issues a new key anyway (safe + simple).
    // - If DB unavailable, fallback key still flows (UX works).
    const keyRecord = await createOrUpdateMemberAndIssueKey({
      email: normalizedEmail,
      name: typeof name === "string" ? name.trim() : undefined,
      ipAddress: ip,
      context: "web-resend",
    });

    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const safeTo =
      typeof returnTo === "string" && returnTo.trim().startsWith("/") && !returnTo.trim().startsWith("//")
        ? returnTo.trim()
        : "/canon";

    await sendInnerCircleEmail({
      to: normalizedEmail,
      type: "resend",
      data: {
        name: (typeof name === "string" && name.trim()) ? name.trim() : "Builder",
        accessKey: keyRecord.key,
        unlockUrl: `${site}/inner-circle?key=${encodeURIComponent(keyRecord.key)}&returnTo=${encodeURIComponent(safeTo)}`,
      },
    });

    return res.status(200).json({ ok: true, message: GENERIC_SUCCESS });
  } catch (error) {
    // Do not leak details
    return res.status(200).json({ ok: true, message: GENERIC_SUCCESS });
  }
}