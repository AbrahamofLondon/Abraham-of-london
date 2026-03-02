// lib/inner-circle/server-utils.ts
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, normalizeRequiredTier } from "@/lib/access/tier-policy";
import { getInnerCircleAccess } from "./access.server";

/**
 * Extract client IP from request headers with strict type safety
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

export function rateLimitForRequestIp(req: Request): string {
  return `rate-limit:${getClientIp(req)}`;
}

export function rateLimitForUser(req: Request, userId: string): string {
  return `rate-limit:${userId}:${getClientIp(req)}`;
}

/**
 * SSOT access check wrapper.
 * - userTier may come in as legacy; normalize it.
 * - requiresTier may come in as legacy; normalize it.
 */
export function checkRequestAccess(
  req: Request,
  userTier?: unknown,
  requiresTier: AccessTier = "member"
) {
  return getInnerCircleAccess({
    userTier: normalizeUserTier(userTier),
    requiresTier: normalizeRequiredTier(requiresTier),
  });
}

/**
 * Extract authorization token from request
 */
export function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  return null;
}

/**
 * Create a secure session cookie string (SSOT cookie name)
 * NOTE: Prefer using lib/server/auth/cookies.ts setters in API routes.
 * This helper is only for environments where you must return a string.
 */
export function createSessionCookie(token: string, expiresInDays: number = 30): string {
  const t = encodeURIComponent(String(token ?? "").trim());
  if (!t) return clearSessionCookie();

  const expires = new Date();
  expires.setDate(expires.getDate() + expiresInDays);

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  // SSOT cookie: aol_access
  return `aol_access=${t}; Path=/; HttpOnly; SameSite=Lax${secure}; Expires=${expires.toUTCString()}`;
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `aol_access=; Path=/; HttpOnly; SameSite=Lax${secure}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getUserAgent(req: Request): string {
  return req.headers.get("user-agent") || "unknown";
}

export function isBot(req: Request): boolean {
  const ua = getUserAgent(req).toLowerCase();
  const botPatterns = ["bot", "crawler", "spider", "scraper", "headless", "python", "curl", "wget"];
  return botPatterns.some((p) => ua.includes(p));
}

export function createAuditLog(
  action: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  return {
    timestamp: new Date().toISOString(),
    action,
    userId,
    metadata,
  };
}

export function sanitizeForLogging<T extends Record<string, any>>(data: T): Partial<T> {
  const sensitiveFields = ["email", "password", "token", "secret", "key", "authorization", "cookie"];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) (sanitized as any)[field] = "[REDACTED]";
  }
  return sanitized;
}