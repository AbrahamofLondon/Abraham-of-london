/* pages/api/inner-circle/resend.ts — RECOVERY ENGINE (SSOT) */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

import { hashAccessKey } from "@/lib/server/auth/tokenStore.postgres";
import { sendInnerCircleEmail } from "@/lib/inner-circle/templates/InnerCircleEmail";

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (process.env.NODE_ENV === "development") return true;

  const secret = String(process.env.RECAPTCHA_SECRET_KEY || "").trim();
  if (!secret) return false;

  const res = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    { method: "POST" }
  );

  const data = (await res.json()) as any;
  return Boolean(data?.success);
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const email = String(req.body?.email || "").trim().toLowerCase();
  const name = String(req.body?.name || "").trim();
  const recaptchaToken = String(req.body?.recaptchaToken || "").trim();

  try {
    // 1) Perimeter security
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) return res.status(403).json({ ok: false, error: "Security verification failed." });

    if (!isEmail(email)) {
      // privacy-friendly response
      return res.status(200).json({ ok: true, message: "If this email is registered, a recovery link is on its way." });
    }

    // 2) Identify member
    const member = await prisma.innerCircleMember.findUnique({ where: { email } });

    if (!member) {
      // Do not reveal existence
      return res.status(200).json({ ok: true, message: "If this email is registered, a recovery link is on its way." });
    }

    // Keep existing tier; normalize defensively
    const memberTier: AccessTier = normalizeUserTier((member as any).tier ?? "member");

    // 3) Generate new key
    const rawKey = `AL-${crypto.randomBytes(4).toString("hex")}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
    const keyHash = hashAccessKey(rawKey);

    // 4) Update vault
    await prisma.$transaction([
      prisma.innerCircleKey.updateMany({
        where: { memberId: member.id, status: "active" },
        data: { status: "revoked" },
      }),
      prisma.innerCircleKey.create({
        data: {
          keyHash,
          memberId: member.id,
          status: "active",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.innerCircleMember.update({
        where: { id: member.id },
        data: { tier: memberTier }, // keep canonical
      }),
    ]);

    // 5) Dispatch activation link
    const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "").trim();
    const unlockUrl = `${appUrl}/inner-circle/unlock?key=${encodeURIComponent(rawKey)}`;

    await sendInnerCircleEmail(email, "Access Recovered | Abraham of London", {
      name: name || (member as any).name || "Principal",
      email,
      accessKey: rawKey,
      unlockUrl,
      mode: "recovery",
      requestIp: String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown"),
    });

    return res.status(200).json({
      ok: true,
      message: "Alignment synchronized. Check your inbox for the fresh access key.",
    });
  } catch (error) {
    console.error("RECOVERY_SYSTEM_ERROR:", error);
    return res.status(500).json({ ok: false, error: "Institutional recovery failed." });
  }
}