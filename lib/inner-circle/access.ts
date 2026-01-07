// lib/inner-circle/access.ts
import crypto from "crypto";
import type { NextApiRequest } from "next";
import { rateLimitInnerCircleAccess } from "@/lib/inner-circle/rate-limit";

const COOKIE_NAME = "innerCircleAccess";
const TOKEN_SECRET = process.env.INNER_CIRCLE_TOKEN_SECRET!;
const TOKEN_TTL_DAYS = 30;

export type AccessTier = "member" | "patron" | "founder";

export interface AccessState {
  hasAccess: boolean;
  tier?: AccessTier;
  memberId?: string;
  expiresAt?: Date;
  rateLimit?: {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  };
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string) {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
}

export function createAccessToken(input: {
  memberId: string;
  tier: AccessTier;
}): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    sub: input.memberId,
    tier: input.tier,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_DAYS * 86400,
  }));
  const sig = sign(`${header}.${payload}`);
  return `${header}.${payload}.${sig}`;
}

function verifyToken(token: string): AccessState {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return { hasAccess: false };

    const expected = sign(`${h}.${p}`);
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) {
      return { hasAccess: false };
    }

    const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { hasAccess: false };
    }

    return {
      hasAccess: true,
      tier: payload.tier,
      memberId: payload.sub,
      expiresAt: new Date(payload.exp * 1000),
    };
  } catch {
    return { hasAccess: false };
  }
}

export async function getInnerCircleAccess(req: NextApiRequest): Promise<AccessState> {
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || "unknown";

  const rl = await rateLimitInnerCircleAccess(ip);
  if (!rl.allowed) {
    return { hasAccess: false, rateLimit: rl };
  }

  const token =
    req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : req.cookies?.[COOKIE_NAME];

  if (!token) return { hasAccess: false };

  const verified = verifyToken(token);
  return { ...verified, rateLimit: rl };
}