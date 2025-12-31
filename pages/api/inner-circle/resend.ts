/* pages/api/inner-circle/resend.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRecaptchaDetailed } from "@/lib/recaptchaServer";
import prisma from "@/lib/prisma";
import { sendInnerCircleEmail } from "@/lib/inner-circle/email";
import { getClientIp } from "@/lib/server/ip";
import { limitIp, setRateLimitHeaders, limitEmail } from "@/lib/security/rateLimit";
import { generateAccessKey, getEmailHash } from "@/lib/inner-circle/keys";

type ResponseData = { ok: boolean; message?: string; error?: string };
const GENERIC_SUCCESS = "If your email is registered, your access email will be dispatched shortly.";

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "POST required." });
  }

  const ip = getClientIp(req);
  const ipLimit = limitIp(req, "inner-circle-resend", { windowMs: 60_000, max: 15 });
  setRateLimitHeaders(res, ipLimit);
  if (!ipLimit.allowed) return res.status(429).json({ ok: false, error: "Too many requests." });

  const { email, name, recaptchaToken, returnTo } = req.body || {};
  const normalizedEmail = email?.trim().toLowerCase();
  
  // reCAPTCHA Gate
  const verification = await verifyRecaptchaDetailed(recaptchaToken || "", "inner_circle_resend", ip);
  if (!verification.success) return res.status(403).json({ ok: false, error: "Security check failed." });

  try {
    const emailHash = getEmailHash(normalizedEmail);
    const { fullKey, suffix, hash } = generateAccessKey();

    /**
     * PRISMA TRANSACTIONAL UPDATE
     * We issue a new key only if the member already exists.
     * This prevents attackers from using 'Resend' to register new accounts.
     */
    const member = await prisma.innerCircleMember.findUnique({ where: { emailHash } });

    if (member) {
      await prisma.innerCircleKey.create({
        data: {
          memberId: member.id,
          keyHash: hash,
          keySuffix: suffix,
          status: "active",
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          lastIp: ip,
        }
      });

      const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const safeTo = (typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")) ? returnTo : "/canon";

      await sendInnerCircleEmail({
        to: normalizedEmail,
        type: "resend",
        data: {
          name: member.name || name?.trim() || "Builder",
          accessKey: fullKey,
          unlockUrl: `${site}/inner-circle/unlock?key=${encodeURIComponent(fullKey)}&returnTo=${encodeURIComponent(safeTo)}`,
        },
      });
    }

    // Always return success to prevent email enumeration (Privacy standard)
    return res.status(200).json({ ok: true, message: GENERIC_SUCCESS });
  } catch (error) {
    console.error("[InnerCircle] Resend Error:", error);
    return res.status(200).json({ ok: true, message: GENERIC_SUCCESS });
  }
}
