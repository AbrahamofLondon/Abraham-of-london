import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRecaptchaDetailed } from "@/lib/recaptcha";
import {
  createOrUpdateMemberAndIssueKey,
  sendInnerCircleEmail,
  getClientIp,
} from "@/lib/inner-circle";

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

  const { email, name, recaptchaToken, returnTo } = req.body || {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ ok: false, error: "Identity (email) is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ ok: false, error: "Invalid identity format." });
  }

  try {
    const verification = await verifyRecaptchaDetailed(recaptchaToken, "inner_circle_register");
    if (!verification.success) {
      return res.status(403).json({ ok: false, error: "Security verification failed. Please refresh and try again." });
    }
  } catch {
    return res.status(500).json({ ok: false, error: "Security subsystem offline." });
  }

  try {
    const keyRecord = await createOrUpdateMemberAndIssueKey({
      email: normalizedEmail,
      name: typeof name === "string" ? name.trim() : undefined,
      ipAddress: getClientIp(req),
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
    return res.status(500).json({ ok: false, error: "Internal server error during vault registration." });
  }
}