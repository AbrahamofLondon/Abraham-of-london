// pages/api/cron/security-sweep.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { executeSecuritySweep } from "@/lib/security/watchdog-delegate";

const MAX_SKEW_MS = 5 * 60 * 1000; // 5 minutes

function timingSafeEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function getBearerToken(req: NextApiRequest): string {
  const h = req.headers.authorization;
  if (!h) return "";
  const v = Array.isArray(h) ? h[0] : h;
  const m = v.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ?? "";
}

function getHeader(req: NextApiRequest, key: string): string {
  const v = req.headers[key.toLowerCase()];
  const one = Array.isArray(v) ? v[0] : v;
  return one ? String(one).trim() : "";
}

function isRecentTimestamp(ts: string): boolean {
  if (!ts) return true; // optional
  const n = Number(ts);
  if (!Number.isFinite(n)) return false;
  const t = n < 10_000_000_000 ? n * 1000 : n; // seconds or ms
  return Math.abs(Date.now() - t) <= MAX_SKEW_MS;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const secret = process.env.CRON_SECRET || "";
  if (!secret) return res.status(500).json({ ok: false, error: "CRON_SECRET missing" });

  const token = getBearerToken(req) || getHeader(req, "x-cron-secret");

  const ts = getHeader(req, "x-cron-timestamp");
  if (ts && !isRecentTimestamp(ts)) {
    return res.status(401).json({ ok: false, error: "Stale timestamp" });
  }

  if (!token || !timingSafeEqual(token, secret)) {
    return res.status(401).json({ ok: false });
  }

  try {
    const report = await executeSecuritySweep();
    return res.status(200).json({ ok: true, report });
  } catch (error: any) {
    console.error("[WATCHDOG_CRITICAL_FAILURE]:", error);
    const dev = process.env.NODE_ENV !== "production";
    return res.status(500).json({
      ok: false,
      error: "Watchdog failed to complete sweep.",
      ...(dev ? { detail: String(error?.message || error) } : {}),
    });
  }
}

// Optional: cron sends no body
// export const config = { api: { bodyParser: false } };