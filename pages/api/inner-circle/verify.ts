/* pages/api/inner-circle/verify.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

type VerifyResponse = {
  valid: boolean;
  reason?: string;
  keySuffix?: string;
  error?: string;
};

/**
 * 1. NETWORK UTILITIES
 */
function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string") return xf.split(",")[0].trim();
  return (req.socket as any)?.remoteAddress || "unknown";
}

/**
 * 2. RATE LIMITING (Institutional Perimeter Guard)
 * Simple in-memory bucket to prevent automated probes.
 */
const BUCKET = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, limit = 30, windowSec = 60) {
  const now = Date.now();
  const cur = BUCKET.get(ip);

  if (!cur || cur.resetAt < now) {
    const resetAt = now + windowSec * 1000;
    BUCKET.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  cur.count += 1;
  BUCKET.set(ip, cur);

  return {
    allowed: cur.count <= limit,
    remaining: Math.max(0, limit - cur.count),
    resetAt: cur.resetAt,
  };
}

/**
 * 3. PRIMARY HANDLER
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<VerifyResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ valid: false, error: "Method not allowed" });
  }

  // A. Rate Limit Check
  const ip = getClientIp(req);
  const rl = rateLimit(`inner-circle-verify:${ip}`, 30, 60);
  
  res.setHeader("X-RateLimit-Limit", "30");
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.floor(rl.resetAt / 1000)));

  if (!rl.allowed) {
    return res.status(429).json({ valid: false, error: "Too many attempts. Please wait." });
  }

  const key = req.body?.key;
  if (!key || typeof key !== "string") {
    return res.status(400).json({ valid: false, error: "Access key is required." });
  }

  try {
    /**
     * B. PRISMA VERIFICATION ENGINE
     * Checks unique key record, ensuring it is 'active' and not expired.
     */
    const keyRecord = await prisma.innerCircleKey.findUnique({
      where: { keyHash: key.trim() },
      select: {
        status: true,
        expiresAt: true,
        keySuffix: true,
      }
    });

    // C. VALIDATION LOGIC
    if (!keyRecord) {
      return res.status(200).json({ valid: false, reason: "key_not_found" });
    }

    if (keyRecord.status !== "active") {
      return res.status(200).json({ valid: false, reason: "key_inactive" });
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return res.status(200).json({ valid: false, reason: "key_expired" });
    }

    // SUCCESS
    return res.status(200).json({ 
      valid: true, 
      keySuffix: keyRecord.keySuffix 
    });

  } catch (e) {
    console.error("[InnerCircle] Verify Subsystem Error:", e);
    return res.status(500).json({ valid: false, error: "Internal verification failure." });
  }
}
