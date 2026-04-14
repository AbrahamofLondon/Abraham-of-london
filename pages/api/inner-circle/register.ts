// pages/api/inner-circle/register.ts — STRATEGIC ENROLLMENT (SSOT)
import type { NextApiRequest, NextApiResponse } from "next";
import { KeyStatus as PrismaKeyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

import { normalizeUserTier } from "@/lib/access/tier-policy";

import { hashAccessKey } from "@/lib/server/auth/tokenStore.postgres";
import { sendInnerCircleEmail } from "@/lib/inner-circle/templates/InnerCircleEmail";

type Ok = { ok: true; message: string; accessKey: string };
type Fail = { ok: false; error: string };

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildEmailHash(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Fail>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const email = String(req.body?.email || "").trim().toLowerCase();
  const name = String(req.body?.name || "").trim();

  if (!isEmail(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email" });
  }

  const tier = normalizeUserTier(req.body?.tier ?? "member");
  const emailHash = buildEmailHash(email);

  try {
    const rawKey = `AL-${crypto.randomBytes(4).toString("hex")}-${crypto
      .randomBytes(4)
      .toString("hex")}`.toUpperCase();

    const keyHash = hashAccessKey(rawKey);

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.innerCircleMember.upsert({
        where: { email },
        update: {
          name: name || null,
          tier,
          emailHash,
        },
        create: {
          id: crypto.randomUUID(),
          email,
          emailHash,
          name: name || null,
          tier,
        },
      });

      await tx.innerCircleKey.updateMany({
        where: { memberId: member.id, status: PrismaKeyStatus.active },
        data: { status: PrismaKeyStatus.revoked },
      });

      await tx.innerCircleKey.create({
        data: {
          keyHash,
          keySuffix: rawKey.split("-").pop() ?? null,
          memberId: member.id,
          keyType: "access",
          status: PrismaKeyStatus.active,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return { member, rawKey };
    });

    const appUrl = String(
      process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://www.abrahamoflondon.org"
    ).trim();

    const unlockUrl = `${appUrl.replace(
      /\/+$/,
      ""
    )}/inner-circle/unlock?key=${encodeURIComponent(result.rawKey)}`;

    await sendInnerCircleEmail(email, "Access Granted | Abraham of London", {
      name: name || "Principal",
      email,
      accessKey: result.rawKey,
      unlockUrl,
      mode: "register",
      requestIp: String(
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown"
      ),
    });

    return res.status(200).json({
      ok: true,
      message: "Alignment confirmed. Asset key dispatched to inbox.",
      accessKey: result.rawKey,
    });
  } catch (error) {
    console.error("REGISTRATION_FAILURE:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Institutional provisioning failed." });
  }
}
