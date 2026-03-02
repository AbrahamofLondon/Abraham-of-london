/* pages/api/inner-circle/register.ts — STRATEGIC ENROLLMENT (SSOT) */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

import { hashAccessKey } from "@/lib/server/auth/tokenStore.postgres";
import { sendInnerCircleEmail } from "@/lib/inner-circle/templates/InnerCircleEmail";

type Ok = { ok: true; message: string; accessKey: string };
type Fail = { ok: false; error: string };

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const email = String(req.body?.email || "").trim().toLowerCase();
  const name = String(req.body?.name || "").trim();

  if (!isEmail(email)) return res.status(400).json({ ok: false, error: "Invalid email" });

  // Default SSOT tier for new registrants (adjust policy here)
  const requestedTier: AccessTier = normalizeUserTier(req.body?.tier ?? "member");

  try {
    // 1) Generate high-entropy key
    const rawKey = `AL-${crypto.randomBytes(4).toString("hex")}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
    const keyHash = hashAccessKey(rawKey);

    // 2) Transactional provisioning
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.innerCircleMember.upsert({
        where: { email },
        update: { name: name || undefined, tier: requestedTier },
        create: {
          email,
          name: name || null,
          tier: requestedTier,
        },
      });

      // Revoke any active keys
      await tx.innerCircleKey.updateMany({
        where: { memberId: member.id, status: "active" },
        data: { status: "revoked" },
      });

      await tx.innerCircleKey.create({
        data: {
          keyHash,
          memberId: member.id,
          status: "active",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return { member, rawKey };
    });

    // 3) Dispatch activation link
    const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "").trim();
    const unlockUrl = `${appUrl}/inner-circle/unlock?key=${encodeURIComponent(result.rawKey)}`;

    await sendInnerCircleEmail(email, "Access Granted | Abraham of London", {
      name: name || "Principal",
      email,
      accessKey: result.rawKey,
      unlockUrl,
      mode: "register",
      requestIp: String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown"),
    });

    return res.status(200).json({
      ok: true,
      message: "Alignment confirmed. Asset key dispatched to inbox.",
      accessKey: result.rawKey,
    });
  } catch (error) {
    console.error("REGISTRATION_FAILURE:", error);
    return res.status(500).json({ ok: false, error: "Institutional provisioning failed." });
  }
}