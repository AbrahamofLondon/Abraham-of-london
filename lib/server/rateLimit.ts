// lib/server/rateLimit.ts - Simplified version for Netlify
import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";
import { logAuditEvent } from "./audit";

// --- Types & Interfaces ---
export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetTime: number;
  limit: number;
  windowMs: number;
}

// --- Store Implementation ---
interface RateLimitEntry {
  count: number;
  first: number;
  resetTime: number;
}

class MemoryRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private lastCleanup = Date.now();

  private cleanupIfNeeded(): void {
    const now = Date.now();
    // Cleanup every minute
    if (now - this.lastCleanup > 60000) {
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key);
        }
      }
      this.store = new Map([...this.store.entries()].filter(([_, entry]) => now <= entry.resetTime));
      this.lastCleanup = now;
    }
  }

  get(key: string): RateLimitEntry | undefined {
    this.cleanupIfNeeded();
    const entry = this.store.get(key);
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

const store = new MemoryRateLimitStore();

// --- Core Rate Limiting Functions ---

export async function rateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const { limit, windowMs, keyPrefix = "rl" } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  const resetTime = now + windowMs;
  
  const entry = store.get(storeKey);

  if (!entry || (now - entry.first) > windowMs) {
    store.set(storeKey, { 
      count: 1, 
      first: now, 
      resetTime 
    });
    return { 
      allowed: true, 
      remaining: limit - 1, 
      retryAfterMs: 0, 
      resetTime, 
      limit, 
      windowMs 
    };
  }

  if (entry.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      retryAfterMs: Math.max(0, windowMs - (now - entry.first)), 
      resetTime: entry.resetTime, 
      limit, 
      windowMs 
    };
  }

  entry.count += 1;
  store.set(storeKey, entry);
  return { 
    allowed: true, 
    remaining: Math.max(0, limit - entry.count), 
    retryAfterMs: 0, 
    resetTime: entry.resetTime, 
    limit, 
    windowMs 
  };
}

export function getClientIp(req: NextApiRequest | NextRequest): string {
  // Edge Runtime (NextRequest)
  if ('headers' in req && typeof (req as any).headers?.get === 'function') {
    const edgeReq = req as NextRequest;
    
    const netlifyIp = edgeReq.headers.get("x-nf-client-connection-ip");
    if (netlifyIp) return netlifyIp;
    
    const forwarded = edgeReq.headers.get("x-forwarded-for");
    if (forwarded) {
      const ips = forwarded.split(",").map(ip => ip.trim());
      return ips[0] || "unknown";
    }
    
    return edgeReq.headers.get("x-real-ip") || "unknown";
  }
  
  // Node Runtime (NextApiRequest)
  const nodeReq = req as NextApiRequest;
  
  const netlifyIp = nodeReq.headers["x-nf-client-connection-ip"];
  if (netlifyIp) return Array.isArray(netlifyIp) ? netlifyIp[0] : netlifyIp;
  
  const forwarded = nodeReq.headers["x-forwarded-for"];
  if (forwarded) {
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0]?.trim() || "unknown";
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
      return forwarded[0].trim();
    }
  }
  
  const cfConnectingIp = nodeReq.headers["cf-connecting-ip"];
  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  }
  
  return nodeReq.socket?.remoteAddress || 
         (nodeReq as any).connection?.remoteAddress || 
         "unknown";
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    ...(result.retryAfterMs > 0 ? {
      "Retry-After": Math.ceil(result.retryAfterMs / 1000).toString()
    } : {})
  };
}

export const RATE_LIMIT_CONFIGS = {
  API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
  API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
  AUTH_API: { limit: 10, windowMs: 300000, keyPrefix: "auth" },
  DOWNLOAD_API: { limit: 30, windowMs: 600000, keyPrefix: "download" },
  CONTACT_FORM: { limit: 5, windowMs: 600000, keyPrefix: "contact" },
  NEWSLETTER_SUBSCRIBE: { limit: 5, windowMs: 600000, keyPrefix: "news" },
  ADMIN_API: { limit: 50, windowMs: 300000, keyPrefix: "admin" },
  STRATEGY_ROOM_INTAKE: { limit: 10, windowMs: 3600000, keyPrefix: "strategy" },
  INNER_CIRCLE_REGISTER: { limit: 20, windowMs: 900000, keyPrefix: "ic-reg" },
  TEASER_REQUEST: { limit: 10, windowMs: 900000, keyPrefix: "teaser" },
  INNER_CIRCLE_UNLOCK: { limit: 30, windowMs: 600000, keyPrefix: "ic-unlock" },
  INNER_CIRCLE_ADMIN_EXPORT: { limit: 5, windowMs: 300000, keyPrefix: "ic-admin-export" },
  INNER_CIRCLE_REGISTER_EMAIL: { limit: 3, windowMs: 3600000, keyPrefix: "ic-reg-email" }
} as const;

export default { 
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS 
};