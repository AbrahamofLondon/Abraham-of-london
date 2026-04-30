/**
 * POST /api/diagnostics/capture
 *
 * Privacy-safe email capture at result screens.
 * Uses the identity service to:
 * - Encrypt email at rest
 * - Store decision data separately from identity
 * - Link through SessionLink (never direct)
 *
 * Rate limited: max 5 captures per IP per 15 minutes.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { captureEmailForSession } from "@/lib/server/privacy/identity-service.server";

const schema = z.object({
  email: z.string().trim().email().max(320),
  source: z.string().trim().max(80),
  resultRef: z.string().trim().max(160).nullable().optional(),
});

// ─── Simple rate limiter ─────────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count++;
  return true;
}

function getIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  return (Array.isArray(xf) ? xf[0] : xf)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "0.0.0.0";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Rate limit
  if (!checkRateLimit(getIp(req))) {
    return res.status(429).json({ ok: false, error: "Too many requests" });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid request" });
  }

  try {
    const sessionId = parsed.data.resultRef ?? `${parsed.data.source}_${Date.now().toString(36)}`;

    const { isNew } = await captureEmailForSession({
      email: parsed.data.email,
      sessionId,
      source: parsed.data.source,
    });

    // Never confirm whether the email existed — privacy
    return res.status(200).json({ ok: true, saved: true });
  } catch (error) {
    console.error("[CAPTURE_ERROR]", error);
    return res.status(500).json({ ok: false, error: "Capture failed" });
  }
}
