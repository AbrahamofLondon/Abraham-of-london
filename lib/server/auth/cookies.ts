// lib/server/auth/cookies.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

export const ACCESS_COOKIE = "aol_access";
export const TIER_COOKIE = "aol_tier";

// Optional backwards-compat tier cookie keys (read-only)
export const LEGACY_TIER_COOKIE_KEYS = [
  "aol_tier",
  "aol_ic_tier",
  "inner_circle_tier",
  "ic_tier",
] as const;

export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

type SameSite = "lax" | "strict" | "none";

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    path: "/",
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax" as SameSite,
    maxAge: maxAgeSeconds,
  };
}

function setCookieHeader(res: NextApiResponse, value: string) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) res.setHeader("Set-Cookie", value);
  else if (Array.isArray(existing)) res.setHeader("Set-Cookie", [...existing, value]);
  else res.setHeader("Set-Cookie", [String(existing), value]);
}

/**
 * Pages Router: set session cookie via NextApiResponse header
 */
export function setAccessCookie(res: NextApiResponse, sessionId: string): void {
  const token = encodeURIComponent(String(sessionId ?? "").trim());
  if (!token) throw new Error("setAccessCookie: sessionId is empty");

  const opt = cookieOptions(MAX_AGE_SECONDS);

  const parts = [
    `${ACCESS_COOKIE}=${token}`,
    `Path=${opt.path}`,
    "HttpOnly",
    `SameSite=${opt.sameSite}`,
    `Max-Age=${opt.maxAge}`,
  ];
  if (opt.secure) parts.push("Secure");

  setCookieHeader(res, parts.join("; "));
}

/**
 * App Router / middleware: set session cookie via NextResponse.cookies
 */
export function setAppRouterCookie(res: NextResponse, sessionId: string): void {
  const token = String(sessionId ?? "").trim();
  if (!token) throw new Error("setAppRouterCookie: sessionId is empty");
  res.cookies.set(ACCESS_COOKIE, token, cookieOptions(MAX_AGE_SECONDS));
}

/**
 * Pages Router: clear session cookie via header
 */
export function clearAccessCookie(res: NextApiResponse): void {
  const secure = isProd() ? "; Secure" : "";
  const expired =
    `${ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ` +
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
  setCookieHeader(res, expired);
}

export const removeAccessCookie = clearAccessCookie;

/**
 * Read a named cookie from:
 * - NextRequest (req.cookies.get)
 * - NextApiRequest (req.headers.cookie)
 * - standard Request (headers.get("cookie"))
 */
export function readCookie(
  req: NextRequest | NextApiRequest | Request | any,
  name: string
): string | null {
  // NextRequest style
  try {
    const anyReq = req as any;
    if (anyReq?.cookies && typeof anyReq.cookies.get === "function") {
      const v = anyReq.cookies.get(name)?.value;
      return v ? String(v) : null;
    }
  } catch {
    // fall through
  }

  // NextApiRequest style
  try {
    const anyReq = req as any;
    const cookieStr =
      typeof anyReq?.headers?.cookie === "string" ? anyReq.headers.cookie : "";
    if (cookieStr) {
      const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]+)`));
      return match ? decodeURIComponent(match[1]) : null;
    }
  } catch {
    // fall through
  }

  // Standard Request style
  try {
    const anyReq = req as any;
    const hdrs = anyReq?.headers;
    const cookieStr =
      hdrs && typeof hdrs.get === "function" ? String(hdrs.get("cookie") || "") : "";
    if (!cookieStr) return null;

    const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** SSOT: read session token cookie */
export function readAccessCookie(req: NextRequest | NextApiRequest | Request | any): string | null {
  return readCookie(req, ACCESS_COOKIE);
}

/**
 * Optional: read tier cookie (supports legacy keys).
 * Never grants privilege by accident: normalizes through tier-policy.
 */
export function readTierCookie(req: NextRequest | NextApiRequest | Request | any): AccessTier {
  for (const key of LEGACY_TIER_COOKIE_KEYS) {
    const v = readCookie(req, key);
    if (v) return normalizeUserTier(v);
  }
  return "public";
}

/**
 * Pages Router: set tier cookie (not HttpOnly by default so client can render UI if you want)
 * If you want it HttpOnly, set httpOnly: true.
 */
export function setTierCookie(
  res: NextApiResponse,
  tier: AccessTier,
  opts?: { httpOnly?: boolean; maxAgeSeconds?: number }
) {
  const t = normalizeUserTier(tier);
  const maxAge = opts?.maxAgeSeconds ?? MAX_AGE_SECONDS;

  const parts = [
    `${TIER_COOKIE}=${encodeURIComponent(t)}`,
    `Path=/`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
  ];

  // Tier cookie is often useful for UI — default non-HttpOnly.
  if (opts?.httpOnly) parts.push("HttpOnly");
  if (isProd()) parts.push("Secure");

  setCookieHeader(res, parts.join("; "));
}

/** Pages Router: clear tier cookie */
export function clearTierCookie(res: NextApiResponse) {
  const secure = isProd() ? "; Secure" : "";
  const expired =
    `${TIER_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
  setCookieHeader(res, expired);
}

// Legacy aliases expected by older imports
export const COOKIE_NAME = ACCESS_COOKIE;
export const getAccessCookie = readAccessCookie;
export const getAccessTokenFromReq = readAccessCookie;