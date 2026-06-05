/* pages/api/inner-circle/rise-decay-scorecard.ts — Phase 5: Hardened with Zod + Upstash rate limiting */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import {
  ensureOperatingProfile,
  saveRiseDecayResult,
} from "@/lib/inner-circle/operating-repository.server";
import { RiseDecayAnswersSchema } from "@/lib/inner-circle/validation";
import { consumeRateLimit, buildRateLimitKey, hashIpForRateLimit } from "@/lib/server/security/rate-limit-provider";

type Response =
  | { ok: true; profile?: Awaited<ReturnType<typeof ensureOperatingProfile>>; result?: Awaited<ReturnType<typeof saveRiseDecayResult>> }
  | { ok: false; error: string; latestResult?: unknown; details?: unknown };

function clientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return (forwarded.split(",")[0]?.trim()) ?? "0.0.0.0";
  if (Array.isArray(forwarded)) return forwarded[0] ?? "0.0.0.0";
  return req.socket.remoteAddress ?? "0.0.0.0";
}

async function requireSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;
  return {
    userId,
    email: session.user?.email ?? null,
    name: session.user?.name ?? null,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  const identity = await requireSession(req, res);
  if (!identity) {
    return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });
  }

  // Rate limit: 5 submissions per user per hour
  const rateLimitKey = buildRateLimitKey("rise-decay-scorecard", identity.userId);
  const verdict = await consumeRateLimit({
    key: rateLimitKey,
    limit: 5,
    windowMs: 3600_000, // 1 hour
    failClosed: false,
  });

  if (!verdict.allowed) {
    res.setHeader("Retry-After", Math.ceil(verdict.retryAfterMs / 1000));
    return res.status(429).json({ ok: false, error: "RATE_LIMIT_EXCEEDED" });
  }

  if (req.method === "GET") {
    const profile = await ensureOperatingProfile(identity);
    return res.status(200).json({ ok: true, profile });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  // Zod validation
  const parsed = RiseDecayAnswersSchema.safeParse(req.body?.answers ?? req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "VALIDATION_ERROR",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    await ensureOperatingProfile(identity);
    const result = await saveRiseDecayResult({
      userId: identity.userId,
      answers: parsed.data,
    });

    return res.status(200).json({ ok: true, result });
  } catch (error: any) {
    if (error?.message === "FREE_DIAGNOSTIC_LIMIT_REACHED") {
      return res.status(403).json({
        ok: false,
        error: "FREE_DIAGNOSTIC_LIMIT_REACHED",
        latestResult: error.latestResult,
      });
    }

    console.error("[rise-decay-scorecard]", error);
    return res.status(500).json({ ok: false, error: "SCORECARD_FAILED" });
  }
}
