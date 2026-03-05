// lib/server/auth/cookies.ts — Edge + Node compatible cookie SSOT
// - Middleware/App Router: uses req.cookies.get()
// - Pages Router (NextApiRequest): parses req.headers.cookie
// - Exposes stable legacy aliases expected across the codebase

import type { NextApiResponse } from "next";
import type { NextRequest } from "next/server";

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

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = String(cookieHeader || "");
  if (!raw) return out;

  // minimal, safe parser: "a=b; c=d"
  const parts = raw.split(";");

  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    const key = (k || "").trim();
    if (!key) continue;

    const valueRaw = rest.join("=").trim();
    if (!valueRaw) continue;

    try {
      out[key] = decodeURIComponent(valueRaw);
    } catch {
      out[key] = valueRaw;
    }
  }

  return out;
}

function readCookieFromAnyReq(req: any, name: string): string | null {
  // 1) Edge-style cookies store (NextRequest / middleware / app router)
  try {
    if (req?.cookies && typeof req.cookies.get === "function") {
      const v = req.cookies.get(name)?.value;
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  } catch {
    // fall through
  }

  // 2) Pages Router: req.headers.cookie string
  try {
    const cookieStr =
      req?.headers?.cookie ||
      (typeof req?.headers?.get === "function" ? req.headers.get("cookie") : "") ||
      "";

    const parsed = parseCookieHeader(cookieStr);
    const v = parsed[name];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
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

/* ============================================================================
  READERS
============================================================================ */

/** Edge-safe: explicit for middleware/app router */
export function readAccessCookieFromRequest(req: NextRequest): string | null {
  // Prefer canonical cookie name, allow a legacy alt if you used it
  return (
    readCookieFromAnyReq(req, ACCESS_COOKIE) ||
    readCookieFromAnyReq(req, "aol_session") ||
    null
  );
}

/** Edge-safe: tier reader */
export function readTierCookieFromRequest(req: NextRequest): AccessTier {
  for (const key of LEGACY_TIER_COOKIE_KEYS) {
    const v = readCookieFromAnyReq(req, key);
    if (v) return normalizeUserTier(v);
  }
  return "public";
}

/** Pages Router only: NextApiRequest reader */
export function readAccessCookieFromApi(req: any): string | null {
  return (
    readCookieFromAnyReq(req, ACCESS_COOKIE) ||
    readCookieFromAnyReq(req, "aol_session") ||
    null
  );
}

/** Universal: works in Edge or Node */
export function readAccessCookie(req: NextRequest | any): string | null {
  return (
    readCookieFromAnyReq(req, ACCESS_COOKIE) ||
    readCookieFromAnyReq(req, "aol_session") ||
    null
  );
}

/** Universal tier reader */
export function readTierCookie(req: NextRequest | any): AccessTier {
  for (const key of LEGACY_TIER_COOKIE_KEYS) {
    const v = readCookieFromAnyReq(req, key);
    if (v) return normalizeUserTier(v);
  }
  return "public";
}

/* ============================================================================
  WRITERS (Pages Router)
============================================================================ */

function appendSetCookie(res: NextApiResponse, cookieLine: string) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) res.setHeader("Set-Cookie", cookieLine);
  else if (Array.isArray(existing)) res.setHeader("Set-Cookie", [...existing, cookieLine]);
  else res.setHeader("Set-Cookie", [String(existing), cookieLine]);
}

/** Pages Router: set session cookie */
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
  appendSetCookie(res, parts.join("; "));
}

/** Pages Router: clear access cookie */
export function clearAccessCookie(res: NextApiResponse): void {
  const secure = isProd() ? "; Secure" : "";
  const expired =
    `${ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ` +
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;

  appendSetCookie(res, expired);
}

export const removeAccessCookie = clearAccessCookie;

/** Pages Router: set tier cookie (optionally httpOnly) */
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

  if (opts?.httpOnly) parts.push("HttpOnly");
  if (isProd()) parts.push("Secure");

  appendSetCookie(res, parts.join("; "));
}

/** Pages Router: clear tier cookie */
export function clearTierCookie(res: NextApiResponse) {
  const secure = isProd() ? "; Secure" : "";
  const expired =
    `${TIER_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;

  appendSetCookie(res, expired);
}

/* ============================================================================
  WRITERS (App Router / middleware)
  NOTE: These require a Response object that supports cookies.set(...)
============================================================================ */

export function setAppRouterCookie(res: any, sessionId: string): void {
  const token = String(sessionId ?? "").trim();
  if (!token) throw new Error("setAppRouterCookie: sessionId is empty");

  if (!res?.cookies || typeof res.cookies.set !== "function") {
    throw new Error("setAppRouterCookie: response does not support cookies.set");
  }

  res.cookies.set(ACCESS_COOKIE, token, cookieOptions(MAX_AGE_SECONDS));
}

/* ============================================================================
  LEGACY ALIASES (do not remove)
============================================================================ */

export const COOKIE_NAME = ACCESS_COOKIE;
export const getAccessCookie = readAccessCookie;
export const getAccessTokenFromReq = readAccessCookie;