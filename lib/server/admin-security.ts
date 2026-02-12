/* lib/server/admin-security.ts — DEPLOY SAFE, FULLY FEATURED */
import type { NextRequest } from "next/server";
import { getClientIp, withEdgeRateLimit } from "@/lib/server/rate-limit-unified";

// ------------------------------------------------------------------
// IP ALLOWLIST – Deploy‑safe default: if env var not set, allow all.
// ------------------------------------------------------------------
const NODE_ENV = process.env.NODE_ENV;
const rawAllowlist = (process.env.ADMIN_IP_ALLOWLIST || "").trim();

/**
 * Allowlist can be:
 *   - empty string → null → allow all (deploy‑safe)
 *   - comma‑separated values, each an exact IP or prefix
 *     e.g. "203.0.113.10,198.51.100.,127.0.0.1"
 */
const allowlist = rawAllowlist
  ? rawAllowlist.split(",").map(s => s.trim()).filter(Boolean)
  : null;

/**
 * Check if an IP is allowed to access admin routes.
 * 
 * - If allowlist is null (env var not set) → allow all (safety first).
 * - In development, always allow localhost.
 * - Otherwise, match against exact IP or prefix (CIDR supported via split).
 */
export function isAllowedIp(ip: string): boolean {
  // 1) Deploy‑safe: no allowlist configured → allow everything
  if (!allowlist) return true;

  // 2) Always allow localhost in development
  if (NODE_ENV !== 'production') {
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  }

  // 3) Check against allowlist rules
  return allowlist.some(rule => {
    // Strip CIDR suffix (e.g., "192.168.1.0/24" → "192.168.1.")
    const base = rule.includes('/') ? rule.split('/')[0] : rule;
    return ip === base || ip.startsWith(base);
  });
}

// ------------------------------------------------------------------
// SENSITIVE OPERATIONS – only protect destructive admin actions.
// ------------------------------------------------------------------
export function isSensitiveOperation(pathname: string, method: string): boolean {
  const m = method.toUpperCase();
  const isWrite = m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
  if (!isWrite) return false;

  const sensitiveRoutes = [
    '/api/admin/system',
    '/api/admin/backup',
    '/api/vault',
    '/admin',              // catches all /admin/* pages
  ];

  return sensitiveRoutes.some(route => pathname.startsWith(route));
}

// ------------------------------------------------------------------
// ADMIN RATE LIMITING – tuned per endpoint.
// ------------------------------------------------------------------
export async function checkAdminRateLimit(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let config = { limit: 100, windowMs: 60_000, keyPrefix: 'admin_ops' };

  // Stricter limits for authentication endpoints
  if (pathname.includes('/login')) {
    config = { limit: 5, windowMs: 900_000, keyPrefix: 'admin_login' };
  }

  // Special case: vault operations – medium limit
  if (pathname.startsWith('/api/vault')) {
    config = { limit: 30, windowMs: 60_000, keyPrefix: 'vault' };
  }

  // Returns { allowed: boolean, headers: Headers, result: RateLimitResult }
  return withEdgeRateLimit(request, config);
}