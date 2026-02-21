/* pages/api/inner-circle/register.ts — STRATEGIC ENROLLMENT */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { hashAccessKey } from "@/lib/server/auth/tokenStore.postgres";
import { sendInnerCircleEmail } from "@/lib/inner-circle/templates/InnerCircleEmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const email = String(req.body?.email || "").trim().toLowerCase();
  const name = String(req.body?.name || "").trim();

  if (!email.includes("@")) {
    return res.status(400).json({ ok: false, error: "Invalid institutional email" });
  }

  try {
    // 1. Generate High-Entropy Asset Key
    const rawKey = `AL-${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();
    const keyHash = hashAccessKey(rawKey);

    // 2. Transactional Provisioning
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.innerCircleMember.upsert({
        where: { email },
        update: { name }, 
        create: { email, name, role: "MEMBER", tier: "standard" },
      });

      // Clear existing active keys to prevent credential stuffing
      await tx.innerCircleKey.updateMany({
        where: { memberId: member.id, status: "active" },
        data: { status: "revoked" }
      });

      await tx.innerCircleKey.create({
        data: {
          keyHash,
          memberId: member.id,
          status: "active",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
        }
      });

      return { member, rawKey };
    });

    // 3. Dispatch Activation Link
    const unlockUrl = `${process.env.NEXT_PUBLIC_APP_URL}/inner-circle/unlock?key=${result.rawKey}`;
    
    await sendInnerCircleEmail(email, "Access Granted | Abraham of London", {
      name: name || "Principal",
      email: email,
      accessKey: result.rawKey,
      unlockUrl: unlockUrl,
      mode: "register",
      requestIp: String(req.headers["x-forwarded-for"] || req.socket.remoteAddress),
    });

    return res.status(200).json({ 
      ok: true, 
      message: "Alignment confirmed. Asset key dispatched to inbox.",
      accessKey: result.rawKey // Also returned for immediate UI copy-paste
    });

  } catch (error) {
    console.error("REGISTRATION_FAILURE:", error);
    return res.status(500).json({ ok: false, error: "Institutional provisioning failed." });
  }
}