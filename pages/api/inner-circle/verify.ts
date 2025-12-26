import type { NextApiRequest, NextApiResponse } from "next";
import innerCircleStore from "@/lib/server/inner-circle-store";

type VerifyResponse = {
  valid: boolean;
  reason?: string;
  keySuffix?: string;
  error?: string;
};

function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string") return xf.split(",")[0].trim();
  return (req.socket as any)?.remoteAddress || "unknown";
}

// Simple in-memory limiter (good enough to stop noise)
const BUCKET = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, limit = 30, windowSec = 60) {
  const now = Date.now();
  const resetAt = now + windowSec * 1000;
  const cur = BUCKET.get(ip);

  if (!cur || cur.resetAt < now) {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<VerifyResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ valid: false, error: "Method not allowed" });
  }

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
    const result = await innerCircleStore.verifyInnerCircleKey(key.trim());
    if (result.valid) {
      return res.status(200).json({ valid: true, keySuffix: result.keySuffix });
    }
    return res.status(200).json({ valid: false, reason: result.reason || "invalid_credentials" });
  } catch (e) {
    console.error("[InnerCircle] verify error:", e);
    return res.status(500).json({ valid: false, error: "Internal verification failure." });
  }
}