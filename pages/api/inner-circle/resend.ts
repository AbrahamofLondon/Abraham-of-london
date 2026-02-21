/* pages/api/inner-circle/resend.ts — RECOVERY ENGINE */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { hashAccessKey } from "@/lib/server/auth/tokenStore.postgres";
import { sendInnerCircleEmail } from "@/lib/inner-circle/templates/InnerCircleEmail";

// Mock/Helper for reCAPTCHA (Ensure this matches your lib/recaptcha.ts)
async function verifyRecaptcha(token: string) {
  if (process.env.NODE_ENV === "development") return true;
  const res = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`, { method: "POST" });
  const data = await res.json();
  return data.success;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const { email, name, recaptchaToken } = req.body;

  try {
    // 1. Perimeter Security
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) return res.status(403).json({ ok: false, error: "Security verification failed." });

    const normalizedEmail = String(email || "").trim().toLowerCase();
    
    // 2. Identify Principal
    const member = await prisma.innerCircleMember.findUnique({
      where: { email: normalizedEmail }
    });

    if (!member) {
      // Security Best Practice: Don't reveal if email exists. 
      // But for a closed "Inner Circle", a gentle hint is often better UX.
      return res.status(200).json({ 
        ok: true, 
        message: "If this email is registered, a recovery link is on its way." 
      });
    }

    // 3. Generate High-Entropy Asset Key
    const rawKey = `AL-${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();
    const keyHash = hashAccessKey(rawKey);

    // 4. Update Vault (Revoke old keys, issue new one)
    await prisma.$transaction([
      prisma.innerCircleKey.updateMany({
        where: { memberId: member.id, status: "active" },
        data: { status: "revoked" }
      }),
      prisma.innerCircleKey.create({
        data: {
          keyHash,
          memberId: member.id,
          status: "active",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
        }
      })
    ]);

    // 5. Dispatch Activation Link
    const unlockUrl = `${process.env.NEXT_PUBLIC_APP_URL}/inner-circle/unlock?key=${rawKey}`;
    
    await sendInnerCircleEmail(normalizedEmail, "Access Recovered | Abraham of London", {
      name: name || member.name || "Principal",
      email: normalizedEmail,
      accessKey: rawKey,
      unlockUrl: unlockUrl,
      mode: "recovery",
      requestIp: String(req.headers["x-forwarded-for"] || req.socket.remoteAddress),
    });

    return res.status(200).json({ 
      ok: true, 
      message: "Alignment synchronized. Check your inbox for the fresh access key." 
    });

  } catch (error) {
    console.error("RECOVERY_SYSTEM_ERROR:", error);
    return res.status(500).json({ ok: false, error: "Institutional recovery failed." });
  }
}