// lib/security.ts
import crypto from "crypto";

export function hashEmail(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "****";
  if (local.length <= 2) return `***@${domain}`;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

type RateLimitConfig = {
  windowMs: number;
  maxHits: number;
};

type Bucket = {
  hits: number;
  expiresAt: number;
};

const rateLimitStore = new Map<string, Bucket>();

/**
 * Simple in-memory IP-based rate limiter for API routes.
 * NOTE: Works per Lambda instance; good enough as a first line of defence.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.expiresAt < now) {
    rateLimitStore.set(key, {
      hits: 1,
      expiresAt: now + config.windowMs,
    });
    return true;
  }

  if (existing.hits < config.maxHits) {
    existing.hits += 1;
    return true;
  }

  return false;
}

/**
 * Extract a best-effort client identifier (IP) from a Next API request.
 * We don't store it anywhere long-term; only for rate limiting in-memory.
 */
export function getClientKeyFromReq(req: { headers: any; socket?: any }) {
  const xf = req.headers["x-forwarded-for"];
  const raw =
    (Array.isArray(xf) ? xf[0] : xf?.split(",")[0]) ||
    req.socket?.remoteAddress ||
    "unknown";
  return String(raw);
}