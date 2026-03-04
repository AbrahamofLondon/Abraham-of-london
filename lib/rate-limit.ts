// lib/rate-limit.ts — CLIENT-SAFE COMPAT LAYER (UX-only)
// API routes MUST import server limiter from "@/lib/server/rateLimit"

import type { NextApiRequest, NextApiResponse } from "next";

export type RateLimitConfig = {
  limit: number;
  windowSeconds: number;
  windowMs?: number;
  max?: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetSeconds: number;
  limit: number;
  allowed?: boolean;
  limited?: boolean;
  resetAt?: number;
};

export type RateLimitCheckResult = {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  limit: number;
  headers?: Record<string, string>;
};

// Export the configs - map to your server configs
export const RATE_LIMIT_CONFIGS = {
  SHORTS_INTERACTIONS: { limit: 30, windowSeconds: 60 }, // Match your server config
  CONTACT_FORM: { limit: 10, windowSeconds: 60 },
  standard: { limit: 60, windowSeconds: 60 },
  strict: { limit: 10, windowSeconds: 60 },
  save: { limit: 30, windowSeconds: 60 },
} as const;

import {
  withRateLimit as clientWithRateLimit,
  clearRateLimit as clientClearRateLimit,
} from "@/lib/rate-limit/client";

// Server-side rate limit check (for API routes) - matches the signature in your API route
export async function checkRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  config: RateLimitConfig
): Promise<RateLimitCheckResult> {
  try {
    // Try to import server implementation
    const { rateLimitForRequest, createRateLimitHeaders } = await import("@/lib/server/rateLimit");
    
    // Get client IP for key
    const xf = req.headers["x-forwarded-for"];
    const ip = (Array.isArray(xf) ? xf[0] : xf)?.split(",")[0]?.trim() || 
               (req.socket as any)?.remoteAddress || 
               "0.0.0.0";
    
    const key = `rate_limit:${ip}:${req.url || 'unknown'}`;
    
    // Use the server's rateLimitForRequest which sets headers automatically
    const result = rateLimitForRequest(req, res, config, key);
    
    // Create headers object for the response
    const headers = createRateLimitHeaders(result);
    
    return {
      allowed: result.ok ?? result.allowed ?? true,
      remaining: result.remaining,
      resetSeconds: result.resetSeconds,
      limit: result.limit,
      headers,
    };
  } catch (error) {
    console.warn("[Rate Limit] Server implementation unavailable, using client fallback");
    
    // Fallback to client-side implementation
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "0.0.0.0";
    const key = `rate_limit:${ip}:${req.url || 'unknown'}`;
    const windowMs = config.windowSeconds * 1000;
    
    const clientResult = await clientWithRateLimit({
      key,
      limit: config.limit,
      windowMs,
      persist: true,
    });
    
    return {
      allowed: clientResult.ok,
      remaining: clientResult.remaining,
      resetSeconds: Math.ceil((clientResult.resetAt - Date.now()) / 1000) || config.windowSeconds,
      limit: config.limit,
    };
  }
}

// Overloads support both object + positional styles.
export function withRateLimit(opts: RateLimitOptions): Promise<RateLimitResult>;
export function withRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  persist?: boolean
): Promise<RateLimitResult>;

export async function withRateLimit(
  a: RateLimitOptions | string,
  b?: number,
  c?: number,
  d?: boolean
): Promise<RateLimitResult> {
  if (typeof a === "object" && a) return clientWithRateLimit(a);

  const key = String(a || "").trim();
  const limit = Number.isFinite(b) ? Math.max(1, Math.floor(b as number)) : 1;
  const windowMs = Number.isFinite(c) ? Math.max(250, Math.floor(c as number)) : 1000;
  const persist = Boolean(d);

  return clientWithRateLimit({ key, limit, windowMs, persist });
}

export function clearRateLimit(key: string, persist = false) {
  clientClearRateLimit(String(key || "").trim(), persist);
}

export default withRateLimit;