/* lib/server/admin-security.ts — PRODUCTION SAFE, DEV FRIENDLY */
import type { NextRequest } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Normalize IP values coming from:
 * - req.ip (middleware)
 * - x-forwarded-for (first hop)
 * - custom getClientIp helpers
 */
function normalizeIp(ip?: string | null): string {
  if (!ip) return "";

  let v = String(ip).trim();
  if (!v) return "";

  // If it's "x-forwarded-for" style: "a, b, c"
  if (v.includes(",")) {
    const first = v.split(",")[0];
    v = typeof first === "string" ? first.trim() : "";
  }

  if (!v) return "";

  // Strip port if present (rare)
  v = v.replace(/:\d+$/, "");

  return v.trim();
}

/**
 * In dev, allow localhost variants.
 */
const LOCALHOST_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

/**
 * Parse allowlist:
 * ADMIN_IP_ALLOWLIST="1.2.3.4, 5.6.7.8, 192.168.0., 2a00:abcd:"
 * Supports exact matches and prefix matches.
 */
function parseAllowlist(raw?: string | null): string[] {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * IP allow gate:
 * - Production: requires ADMIN_IP_ALLOWLIST to be set and match.
 * - Dev: always allow localhost; if allowlist is set, also allow matches.
 */
export function isAllowedIp(ipRaw?: string | null): boolean {
  const ip = normalizeIp(ipRaw);

  // Dev convenience: never lock yourself out locally
  if (!IS_PROD && LOCALHOST_IPS.has(ip)) return true;

  const allowlist = parseAllowlist(process.env.ADMIN_IP_ALLOWLIST);

  // Production: strict. No allowlist = deny by default.
  if (IS_PROD) {
    if (allowlist.length === 0) return false;
  } else {
    // Non-prod: no allowlist => allow everything
    if (allowlist.length === 0) return true;
  }

  // Match exact or prefix
  return allowlist.some((rule) => {
    const basePart = rule.includes("/") ? rule.split("/")[0] : rule;
    const base = typeof basePart === "string" ? basePart.trim() : "";
    if (!base) return false;
    return ip === base || ip.startsWith(base);
  });
}

/**
 * Sensitive operations requiring secondary confirmation.
 * Keep explicit and conservative.
 */
export function isSensitiveOperation(pathname: string, method: string): boolean {
  const m = method.toUpperCase();
  const isWrite = m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE";
  if (!isWrite) return false;

  // Only admin/vault/pdf mutation surfaces
  const sensitivePrefixes = [
    "/api/admin",
    "/api/vault",
    "/api/pdfs",
    "/admin",
  ];

  return sensitivePrefixes.some((p) => pathname.startsWith(p));
}

/**
 * Single source of IP extraction for middleware.
 */
export function getRequestIp(req: NextRequest): string {
  // Trust platform/CDN header first
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return normalizeIp(xf);

  // Next middleware may expose req.ip depending on platform/runtime
  const direct = (req as NextRequest & { ip?: string }).ip;
  return normalizeIp(direct);
}