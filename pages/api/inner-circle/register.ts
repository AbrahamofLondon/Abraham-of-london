/* pages/api/inner-circle/register.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRecaptchaDetailed } from "@/lib/recaptchaServer";
import prisma from "@/lib/prisma";
import { sendInnerCircleEmail } from "@/lib/inner-circle/email";
import { getClientIp } from "@/lib/server/ip";
import { limitIp, setRateLimitHeaders, limitEmail } from "@/lib/security/rateLimit";
import { generateAccessKey, getEmailHash } from "@/lib/inner-circle/keys";

type ResponseData =
  | { ok: true; message: string; keySuffix?: string }
  | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "System requires POST for registration." });
  }

  const ip = getClientIp(req);
  const ipLimit = limitIp(req, "inner-circle-register", { windowMs: 60_000, max: 20 });
  setRateLimitHeaders(res, ipLimit);
  if (!ipLimit.allowed) return res.status(429).json({ ok: false, error: "Too many requests." });

  const { email, name, recaptchaToken, returnTo } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, error: "Identity required." });

  const normalizedEmail = email.trim().toLowerCase();
  const emailLimit = limitEmail(normalizedEmail, "inner-circle-register", { windowMs: 600_000, max: 10 });
  if (!emailLimit.allowed) return res.status(429).json({ ok: false, error: "Too many attempts for this identity." });

  const verification = await verifyRecaptchaDetailed(recaptchaToken || "", "inner_circle_register", ip);
  if (!verification.success) return res.status(403).json({ ok: false, error: "Security verification failed." });

  const emailHash = getEmailHash(normalizedEmail);

  try {
    const { fullKey, suffix, hash } = generateAccessKey();

    /**
     * ATOMIC PRISMA UPSERT
     * Creates member if new, or updates 'lastSeenAt' if existing.
     * Always attaches a new active Key.
     */
    await prisma.innerCircleMember.upsert({
      where: { emailHash },
      update: {
        lastSeenAt: new Date(),
        lastIp: ip,
        keys: {
          create: {
            keyHash: hash,
            keySuffix: suffix,
            status: "active",
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            lastIp: ip,
          }
        }
      },
      create: {
        emailHash,
        emailHashPrefix: emailHash.slice(0, 8),
        name: name?.trim() || null,
        lastIp: ip,
        keys: {
          create: {
            keyHash: hash,
            keySuffix: suffix,
            status: "active",
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            lastIp: ip,
          }
        }
      }
    });

    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const safeTo = (typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")) ? returnTo : "/canon";

    await sendInnerCircleEmail({
      to: normalizedEmail,
      type: "welcome",
      data: {
        name: name?.trim() || "Builder",
        accessKey: fullKey,
        unlockUrl: `${site}/inner-circle/unlock?key=${encodeURIComponent(fullKey)}&returnTo=${encodeURIComponent(safeTo)}`,
      },
    });

    return res.status(200).json({ ok: true, message: "Access granted. Check your inbox.", keySuffix: suffix });
  } catch (e) {
    console.error("[InnerCircle] Register Error:", e);
    return res.status(500).json({ ok: false, error: "Internal server error during registration." });
  }
}
