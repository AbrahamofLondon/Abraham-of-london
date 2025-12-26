import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRecaptchaDetailed } from "@/lib/recaptchaServer";
import innerCircleStore from "@/lib/server/inner-circle-store";
import { sendInnerCircleEmail } from "@/lib/inner-circle/email"; // Import directly from email module
import { getClientIp } from "@/lib/server/ip";
import { limitIp, setRateLimitHeaders, limitEmail } from "@/lib/security/rateLimit";

type ResponseData =
  | { ok: true; message: string; keySuffix?: string }
  | { ok: false; error: string };

function safeReturnTo(v: unknown): string {
  if (typeof v !== "string") return "/canon";
  const trimmed = v.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/canon";
  return trimmed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "System requires POST for registration." });
  }

  // IP rate limit (tight, protects endpoints)
  const ipLimit = limitIp(req, "inner-circle-register", { windowMs: 60_000, max: 20 });
  setRateLimitHeaders(res, ipLimit);
  if (!ipLimit.allowed) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please wait and try again." });
  }

  const { email, name, recaptchaToken, returnTo } = req.body || {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ ok: false, error: "Identity (email) is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ ok: false, error: "Invalid identity format." });
  }

  // Email rate limit (prevents abuse / enumeration attempts)
  const emailLimit = limitEmail(normalizedEmail, "inner-circle-register", { windowMs: 10 * 60_000, max: 10 });
  if (!emailLimit.allowed) {
    return res.status(429).json({ ok: false, error: "Too many attempts for this identity. Please wait and try again." });
  }

  // reCAPTCHA (hard boundary)
  const token = typeof recaptchaToken === "string" ? recaptchaToken : "";
  const ip = getClientIp(req);

  const verification = await verifyRecaptchaDetailed(token, "inner_circle_register", ip);
  if (!verification.success) {
    return res.status(403).json({ ok: false, error: "Security verification failed. Please refresh and try again." });
  }

  try {
    const keyRecord = await innerCircleStore.createOrUpdateMemberAndIssueKey({
      email: normalizedEmail,
      name: typeof name === "string" ? name.trim() : undefined,
      ipAddress: ip,
      context: "web-registration",
    });

    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const safeTo = safeReturnTo(returnTo);

    await sendInnerCircleEmail({
      to: normalizedEmail,
      type: "welcome",
      data: {
        name: (typeof name === "string" && name.trim()) ? name.trim() : "Builder",
        accessKey: keyRecord.key,
        unlockUrl: `${site}/inner-circle?key=${encodeURIComponent(keyRecord.key)}&returnTo=${encodeURIComponent(safeTo)}`,
      },
    });

    return res.status(200).json({
      ok: true,
      message: "Access granted. Check your inbox for the security key.",
      keySuffix: keyRecord.keySuffix,
    });
  } catch (e) {
    console.error("[InnerCircle] Registration error:", e);
    return res.status(500).json({ ok: false, error: "Internal server error during vault registration." });
  }
}