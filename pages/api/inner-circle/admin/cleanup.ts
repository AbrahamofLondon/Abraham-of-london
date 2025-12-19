import type { NextApiRequest, NextApiResponse } from "next";
import { cleanupOldData } from "@/lib/inner-circle";

type CleanupResponse = {
  ok: boolean;
  message?: string;
  stats?: { deletedMembers: number; deletedKeys: number };
  error?: string;
  cleanedAt?: string;
};

function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string") return xf.split(",")[0].trim();
  return (req.socket as any)?.remoteAddress || "unknown";
}

function isAdminAuthenticated(req: NextApiRequest): boolean {
  const headerKey =
    (req.headers["x-inner-circle-admin-key"] as string | undefined) ||
    (req.headers["authorization"] as string | undefined);

  const token = headerKey?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const expected = process.env.INNER_CIRCLE_ADMIN_KEY;
  if (!expected) return false;

  return token === expected;
}

// small limiter: 3/hour per IP
const BUCKET = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, limit = 3, windowSec = 3600) {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<CleanupResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Maintenance requires POST." });
  }

  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized. Admin key required." });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(`inner-circle-cleanup:${ip}`, 3, 3600);
  res.setHeader("X-RateLimit-Limit", "3");
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.floor(rl.resetAt / 1000)));

  if (!rl.allowed) {
    return res.status(429).json({ ok: false, error: "Cleanup limited to 3 runs per hour." });
  }

  try {
    const result = await cleanupOldData();
    return res.status(200).json({
      ok: true,
      message: "Vault hygiene completed successfully.",
      stats: { deletedMembers: result.deletedMembers, deletedKeys: result.deletedKeys },
      cleanedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[InnerCircle] cleanup error:", e);
    return res.status(500).json({ ok: false, error: "hygiene subsystem failure." });
  }
}