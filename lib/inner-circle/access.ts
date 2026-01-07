// lib/inner-circle/access.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import type { NextApiRequest } from "next";
import { rateLimit } from "@/lib/server/rate-limit-unified";
import { RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit-unified";
import { getKey, isExpired } from "@/lib/inner-circle/keys";

const COOKIE_NAME = "innerCircleAccess";
const SECRET = process.env.INNER_CIRCLE_TOKEN_SECRET!;

export type AccessTier = "member" | "patron" | "founder";

export type AccessState = {
  ok: boolean;
  hasAccess: boolean;
  reason:
    | "granted"
    | "missing"
    | "invalid"
    | "expired"
    | "revoked"
    | "rate_limited";
  memberId?: string;
  tier?: AccessTier;
  token?: string;
  checkedAt: string;
  expiresAt?: string;
  rateLimit?: {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  };
};

function sign(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

function safeEqual(a: string, b: string) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function parseJwt(token: string): { ok: boolean; sub?: string; tier?: AccessTier; exp?: number } {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return { ok: false };

    const expected = sign(`${h}.${p}`);
    if (!safeEqual(s, expected)) return { ok: false };

    const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
    return { ok: true, sub: payload.sub, tier: payload.tier, exp: payload.exp };
  } catch {
    return { ok: false };
  }
}

export function createAccessToken(input: { memberId: string; tier: AccessTier; ttlDays?: number }): string {
  const ttlDays = input.ttlDays ?? 30;
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: input.memberId,
      tier: input.tier,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + ttlDays * 86400,
    })
  ).toString("base64url");

  const sig = sign(`${header}.${payload}`);
  return `${header}.${payload}.${sig}`;
}

function extract(req: NextApiRequest): { token: string | null; source: "bearer" | "cookie" | "query" | "none" } {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return { token: auth.slice(7), source: "bearer" };

  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return { token: cookieToken, source: "cookie" };

  const q = req.query?.accessKey || req.query?.key;
  if (typeof q === "string") return { token: q, source: "query" };

  return { token: null, source: "none" };
}

export async function getInnerCircleAccess(req: NextApiRequest): Promise<AccessState> {
  const checkedAt = new Date().toISOString();

  // Rate limit access validation itself
  const ip =
    (req.headers["x-nf-client-connection-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    "unknown";

  const rl = await rateLimit(ip, RATE_LIMIT_CONFIGS.AUTH);

  if (!rl.allowed) {
    return {
      ok: false,
      hasAccess: false,
      reason: "rate_limited",
      checkedAt,
      rateLimit: { allowed: false, remaining: rl.remaining, resetAt: rl.resetTime },
    };
  }

  const { token } = extract(req);
  if (!token) {
    return {
      ok: false,
      hasAccess: false,
      reason: "missing",
      checkedAt,
      rateLimit: { allowed: true, remaining: rl.remaining, resetAt: rl.resetTime },
    };
  }

  // Access Key path
  if (token.startsWith("IC-")) {
    const rec = await getKey(token);
    if (!rec) return { ok: false, hasAccess: false, reason: "invalid", checkedAt };

    if (rec.revoked) return { ok: false, hasAccess: false, reason: "revoked", checkedAt };
    if (isExpired(rec.expiresAt)) return { ok: false, hasAccess: false, reason: "expired", checkedAt };

    return {
      ok: true,
      hasAccess: true,
      reason: "granted",
      checkedAt,
      memberId: rec.memberId,
      tier: rec.tier,
      token,
      expiresAt: rec.expiresAt,
      rateLimit: { allowed: true, remaining: rl.remaining, resetAt: rl.resetTime },
    };
  }

  // JWT path
  const parsed = parseJwt(token);
  if (!parsed.ok) return { ok: false, hasAccess: false, reason: "invalid", checkedAt };

  if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, hasAccess: false, reason: "expired", checkedAt };
  }

  return {
    ok: true,
    hasAccess: true,
    reason: "granted",
    checkedAt,
    memberId: parsed.sub,
    tier: parsed.tier,
    token,
    expiresAt: parsed.exp ? new Date(parsed.exp * 1000).toISOString() : undefined,
    rateLimit: { allowed: true, remaining: rl.remaining, resetAt: rl.resetTime },
  };
}