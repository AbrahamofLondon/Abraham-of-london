export type RateLimitConfig = {
  limit: number;
  windowMs: number;
  keyPrefix: string;
};

export type RateLimitKey =
  | "PUBLIC"
  | "AUTH"
  | "ADMIN"
  | "API_STRICT"
  | "API_GENERAL"
  | "INNER_CIRCLE_UNLOCK"
  | "CONTACT"
  | "DOWNLOAD";

export const RATE_LIMIT_CONFIGS: Record<RateLimitKey, RateLimitConfig> = {
  PUBLIC: { limit: 120, windowMs: 60_000, keyPrefix: "pub" },
  AUTH: { limit: 60, windowMs: 60_000, keyPrefix: "auth" },
  ADMIN: { limit: 100, windowMs: 60_000, keyPrefix: "admin" },
  API_STRICT: { limit: 30, windowMs: 60_000, keyPrefix: "api-strict" },
  API_GENERAL: { limit: 100, windowMs: 3_600_000, keyPrefix: "api" },
  INNER_CIRCLE_UNLOCK: { limit: 30, windowMs: 600_000, keyPrefix: "ic-unlock" },
  CONTACT: { limit: 5, windowMs: 3_600_000, keyPrefix: "contact" },
  DOWNLOAD: { limit: 20, windowMs: 3_600_000, keyPrefix: "download" },
};

export const LIMITS = RATE_LIMIT_CONFIGS;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: number;
  resetAt: number;
  retryAfterMs: number;
  windowMs: number;
  source: "redis" | "postgres" | "unavailable";
};

import {
  clearPersistentRateLimit,
  consumePersistentRateLimit,
  getPersistentRateLimitStats,
} from "@/lib/server/security/persistent-rate-limit";

function keyFor(config: RateLimitConfig, id: string): string {
  const safeId = String(id || "anon");
  return `${config.keyPrefix}:${safeId}`;
}

function normalizeResult(
  raw: Awaited<ReturnType<typeof consumePersistentRateLimit>>,
  windowMs: number,
): RateLimitResult {
  return {
    allowed: raw.allowed,
    remaining: raw.remaining,
    limit: raw.limit,
    resetAt: raw.resetAt,
    resetTime: raw.resetAt,
    retryAfterMs: raw.retryAfterMs,
    windowMs,
    source: raw.source,
  };
}

export function rateLimitCheck(params: {
  key: RateLimitKey;
  id: string;
}): Promise<RateLimitResult> {
  const cfg = RATE_LIMIT_CONFIGS[params.key];
  return rateLimit(params.id, cfg);
}

export async function rateLimit(
  id: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const raw = await consumePersistentRateLimit({
    key: keyFor(config, id),
    limit: config.limit,
    windowMs: config.windowMs,
    failClosed: true,
  });

  return normalizeResult(raw, config.windowMs);
}

export async function isRateLimited(params: {
  key: RateLimitKey;
  id: string;
}): Promise<boolean> {
  const result = await rateLimitCheck(params);
  return !result.allowed;
}

export function getClientIp(req: any): string {
  if (req?.headers?.get) {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "127.0.0.1";
  }

  const fwd = req?.headers?.["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : typeof fwd === "string" ? fwd.split(",")[0] : undefined) ??
    req?.headers?.["x-real-ip"] ??
    req?.socket?.remoteAddress;

  return String(ip || "127.0.0.1");
}

export function createRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetTime?: number;
  resetAt?: number;
  retryAfterMs: number;
}) {
  const reset =
    typeof result.resetTime === "number"
      ? result.resetTime
      : Number(result.resetAt || Date.now());

  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
    "Retry-After": result.retryAfterMs > 0
      ? String(Math.ceil(result.retryAfterMs / 1000))
      : "0",
  };
}

export function withApiRateLimit(handler: any, options: {
  key: RateLimitKey;
  id?: string;
}) {
  return async (req: any, res: any) => {
    const id = options.id || getClientIp(req);
    const cfg = RATE_LIMIT_CONFIGS[options.key];
    const result = await rateLimit(id, cfg);

    const headers = createRateLimitHeaders(result);
    for (const [headerKey, value] of Object.entries(headers)) {
      res.setHeader(headerKey, value);
    }

    if (!result.allowed) {
      return res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil(result.retryAfterMs / 1000),
      });
    }

    return handler(req, res);
  };
}

export function withEdgeRateLimit(handler: any, cfg: RateLimitConfig) {
  return async (req: any, res: any) => {
    const id = getClientIp(req);
    const result = await rateLimit(id, cfg);

    if (res && typeof res === "object") {
      (res.locals ??= {});
      res.locals.rateLimit = result;
    }

    return handler(req, res);
  };
}

export async function getRateLimiterStats() {
  return getPersistentRateLimitStats();
}

export async function resetRateLimit(params: {
  key: RateLimitKey;
  id: string;
}): Promise<boolean> {
  const cfg = RATE_LIMIT_CONFIGS[params.key];
  return clearPersistentRateLimit(keyFor(cfg, params.id));
}

export const unblock = resetRateLimit;

export default {
  LIMITS,
  RATE_LIMIT_CONFIGS,
  rateLimitCheck,
  rateLimit,
  isRateLimited,
  getClientIp,
  createRateLimitHeaders,
  withApiRateLimit,
  withEdgeRateLimit,
  getRateLimiterStats,
  resetRateLimit,
  unblock,
};
