/* pages/api/pressure/signal.ts — Phase 5: Hardened with Zod validation + Upstash/Redis rate limiting */
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import {
  evaluatePressureSignal,
  hashSensitiveInput,
  type PressureSignalRefusal,
  type PressureSignalResult,
} from "@/lib/inner-circle/operating-layer";
import { recordPressureSignalEvent } from "@/lib/inner-circle/operating-repository.server";
import { PressureSignalSchema } from "@/lib/inner-circle/validation";
import { consumeRateLimit, buildRateLimitKey, hashIpForRateLimit } from "@/lib/server/security/rate-limit-provider";

type Response =
  | { ok: true; result: PressureSignalResult }
  | { ok: false; refusal: PressureSignalRefusal }
  | { ok: false; error: string };

function hashOptional(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

function clientIp(req: NextApiRequest): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket.remoteAddress ?? undefined;
}

// In-memory rate limiter kept as secondary fallback (dev/local)
const memoryRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MEMORY_RATE_LIMIT_WINDOW_MS = 60_000;
const MEMORY_RATE_LIMIT_MAX = 20;

function checkMemoryRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = memoryRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    memoryRateLimitMap.set(ip, { count: 1, resetAt: now + MEMORY_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= MEMORY_RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  // Primary: Upstash/Redis rate limiting (10 requests per IP per hour)
  const ip = clientIp(req) || "unknown";
  const ipHash = hashIpForRateLimit(ip);
  const rateLimitKey = buildRateLimitKey("pressure-signal", ipHash);

  const verdict = await consumeRateLimit({
    key: rateLimitKey,
    limit: 10,
    windowMs: 3600_000, // 1 hour
    failClosed: false, // Fail open if all backends unavailable
  });

  if (!verdict.allowed) {
    res.setHeader("Retry-After", Math.ceil(verdict.retryAfterMs / 1000));
    return res.status(429).json({ ok: false, error: "RATE_LIMIT_EXCEEDED" });
  }

  // Secondary: in-memory burst protection (60s window, 20 requests)
  if (!checkMemoryRateLimit(ip)) {
    return res.status(429).json({ ok: false, error: "RATE_LIMIT_EXCEEDED" });
  }

  // Zod validation
  const parsed = PressureSignalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "VALIDATION_ERROR",
      details: parsed.error.flatten().fieldErrors,
    } as any);
  }

  const concern = parsed.data.concern;
  const evaluated = evaluatePressureSignal(concern);

  if ("error" in evaluated) {
    return res.status(200).json({ ok: false, refusal: evaluated });
  }

  try {
    const session = await getServerSession(req, res, authOptions).catch(() => null);
    await recordPressureSignalEvent({
      inputHash: hashSensitiveInput(concern),
      result: evaluated,
      userId: session?.user?.id || null,
      ipHash: hashOptional(clientIp(req)),
      userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null,
    });
  } catch (error) {
    console.error("[pressure-signal:event]", error);
  }

  return res.status(200).json({ ok: true, result: evaluated });
}
