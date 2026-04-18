// pages/api/inner-circle/resend.ts — ACCESS RECOVERY API (HARDENED)

import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { KeyStatus as PrismaKeyStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { normalizeUserTier } from "@/lib/access/tier-policy";
import { rateLimitCheck, getClientIp, createRateLimitHeaders } from "@/lib/server/rate-limit-unified";
import { hashAccessKey, getSessionContext } from "@/lib/server/auth/tokenStore.postgres";
import { sendInnerCircleEmail } from "@/lib/inner-circle/templates/InnerCircleEmail";

type ApiResponse =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (process.env.NODE_ENV === "development") return true;

  const secret = String(process.env.RECAPTCHA_SECRET_KEY || "").trim();
  if (!secret) return false;
  if (!token) return false;

  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(
      secret
    )}&response=${encodeURIComponent(token)}`,
    { method: "POST" }
  );

  if (!response.ok) return false;

  const data = (await response.json()) as { success?: boolean };
  return Boolean(data?.success);
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);
}

function getBaseUrl(): string {
  return String(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.URL ||
      "https://www.abrahamoflondon.org"
  )
    .trim()
    .replace(/\/+$/, "");
}

function getRequestIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return (forwarded.split(",")[0] ?? "").trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0];
  }
  return req.socket.remoteAddress || "unknown";
}

function makeAccessKey(): string {
  // Must use IC- prefix to match client-side key validation in keys.client.ts
  return `IC-${crypto.randomBytes(20).toString("hex")}`.toUpperCase();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Rate limit: 30 requests per 10 minutes per IP
  const ip = getClientIp(req);
  const rl = rateLimitCheck({ key: "INNER_CIRCLE_UNLOCK", id: ip });
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
  const recaptchaToken = String(req.body?.recaptchaToken || "").trim();

  try {
    // Authenticated members bypass reCAPTCHA — they have already proven
    // identity via the aol_access cookie. Unauthenticated requests still
    // go through the standard reCAPTCHA check below.
    let isHuman = false;
    const cookie = req.cookies["aol_access"];
    if (cookie) {
      const ctx = await getSessionContext(cookie).catch(() => null);
      if (ctx?.ok) {
        isHuman = true;
      }
    }

    if (!isHuman) {
      isHuman = await verifyRecaptcha(recaptchaToken);
    }

    if (!isHuman) {
      return res
        .status(403)
        .json({ ok: false, error: "Security verification failed." });
    }

    if (!isEmail(email)) {
      return res.status(200).json({
        ok: true,
        message:
          "If this email is registered, a recovery link is on its way.",
      });
    }

    const member = await prisma.innerCircleMember.findUnique({
      where: { email },
    });

    if (!member) {
      return res.status(200).json({
        ok: true,
        message:
          "If this email is registered, a recovery link is on its way.",
      });
    }

    const tier = normalizeUserTier(member.tier ?? "member");

    const rawKey = makeAccessKey();
    const keyHash = hashAccessKey(rawKey);

    await prisma.$transaction([
      prisma.innerCircleKey.updateMany({
        where: {
          memberId: member.id,
          status: PrismaKeyStatus.active,
        },
        data: {
          status: PrismaKeyStatus.revoked,
          revokedAt: new Date(),
          revokedReason: "resend_rotation",
        },
      }),
      prisma.innerCircleKey.create({
        data: {
          keyHash,
          keySuffix: rawKey.split("-").pop() ?? null,
          memberId: member.id,
          keyType: "access",
          status: PrismaKeyStatus.active,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.innerCircleMember.update({
        where: { id: member.id },
        data: { tier },
      }),
    ]);

    const unlockUrl = `${getBaseUrl()}/inner-circle/unlock?key=${encodeURIComponent(
      rawKey
    )}`;

    await sendInnerCircleEmail(
      email,
      "Access Recovered | Abraham of London",
      {
        name: name || member.name || "Principal",
        email,
        accessKey: rawKey,
        unlockUrl,
        mode: "resend",
        requestIp: getRequestIp(req),
      }
    );

    return res.status(200).json({
      ok: true,
      message:
        "Alignment synchronized. Check your inbox for the fresh access key.",
    });
  } catch (error) {
    console.error("[RECOVERY_SYSTEM_ERROR]", error);
    return res.status(500).json({
      ok: false,
      error: "Institutional recovery failed.",
    });
  }
}
