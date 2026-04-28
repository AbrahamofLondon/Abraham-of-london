// pages/api/inner-circle/register.ts — STRATEGIC ENROLLMENT (SSOT)
import type { NextApiRequest, NextApiResponse } from "next";
import { KeyStatus as PrismaKeyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { hubspotSync } from "@/lib/hubspot/sync";

import { normalizeUserTier } from "@/lib/access/tier-policy";
import { rateLimitCheck, getClientIp, createRateLimitHeaders } from "@/lib/server/rate-limit-unified";

import { hashAccessKey } from "@/lib/server/auth/tokenStore.postgres";
import { sendInnerCircleEmail } from "@/lib/email/sendInnerCircleEmail";

type Ok = { ok: true; message: string };
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

  // Rate limit: 30 requests per 10 minutes per IP (INNER_CIRCLE_UNLOCK preset)
  const ip = getClientIp(req);
  const rl = await rateLimitCheck({ key: "INNER_CIRCLE_UNLOCK", id: ip });
  const rlHeaders = createRateLimitHeaders(rl);
  for (const [k, v] of Object.entries(rlHeaders)) res.setHeader(k, v);

  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      error: "Too many requests. Please try again later.",
    });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const name = String(req.body?.name || "").trim();

  if (!isEmail(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email" });
  }

  const tier = normalizeUserTier(req.body?.tier ?? "member");
  const emailHash = buildEmailHash(email);

  try {
    // Phase 0 fix: generate IC- prefix keys to match client-side validation
    // in keys.client.ts (expects IC- prefix, 44 chars). The previous AL-
    // prefix caused client-side key verification to reject valid keys.
    const rawKey = `IC-${crypto.randomBytes(20).toString("hex")}`.toUpperCase();

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

    const mailResult = await sendInnerCircleEmail({
      to: email,
      type: "welcome",
      data: {
        name: name || "Principal",
        accessKey: result.rawKey,
        unlockUrl,
      },
    });

    if (!mailResult.ok) {
      console.error("[REGISTER_EMAIL_FAILED]", {
        email,
        provider: mailResult.provider,
        error: mailResult.error || "EMAIL_SEND_FAILED",
      });
      return res.status(502).json({
        ok: false,
        error: "Access was provisioned, but email delivery failed. Use Inner Circle recovery to request a fresh access link.",
      });
    }

    // Do not expose raw access key in the API response.
    // Key is delivered via email only.
    // HubSpot sync — fire and forget
    hubspotSync({
      event: "inner_circle_registered",
      email: String(email || ""),
      data: { fullName: String(name || ""), tier: "inner-circle" },
    }).catch(() => {});

    return res.status(200).json({
      ok: true,
      message: "Access provisioned. Check your inbox for your secure access key.",
    });
  } catch (error) {
    console.error("REGISTRATION_FAILURE:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Institutional provisioning failed." });
  }
}
