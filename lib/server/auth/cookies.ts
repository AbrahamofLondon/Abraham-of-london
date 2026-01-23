// lib/server/auth/cookies.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { type NextRequest, NextResponse } from "next/server";

export const COOKIE_NAME = "aol_access";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Checks if the current environment is production.
 */
function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Creates the standardized attributes for our institutional cookies.
 */
function getCookieOptions(maxAge: number) {
  return {
    path: "/",
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax" as const,
    maxAge,
  };
}

/**
 * Sets the access cookie on a standard Node.js response (Pages Router / API Routes).
 */
export function setAccessCookie(res: NextApiResponse, sessionId: string): void {
  const options = getCookieOptions(MAX_AGE_SECONDS);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    `Path=${options.path}`,
    "HttpOnly",
    `SameSite=${options.sameSite}`,
    `Max-Age=${options.maxAge}`,
  ];

  if (options.secure) parts.push("Secure");

  res.setHeader("Set-Cookie", parts.join("; "));
}

/**
 * Sets the access cookie on an App Router response or Middleware redirect.
 */
export function setAppRouterCookie(res: NextResponse, sessionId: string): void {
  res.cookies.set(COOKIE_NAME, sessionId, getCookieOptions(MAX_AGE_SECONDS));
}

/**
 * Robustly removes the access cookie.
 */
export function clearAccessCookie(res: NextApiResponse): void {
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];

  if (isProd()) parts.push("Secure");

  res.setHeader("Set-Cookie", parts.join("; "));
}

export const removeAccessCookie = clearAccessCookie;

/**
 * Unified cookie reader with improved type narrowing.
 */
export function readAccessCookie(
  req: NextRequest | NextApiRequest | Request
): string | null {
  // 1) NextRequest (App Router / Middleware)
  if (req instanceof Request || "cookies" in req) {
    const nextReq = req as NextRequest;
    if (typeof nextReq.cookies?.get === "function") {
      return nextReq.cookies.get(COOKIE_NAME)?.value || null;
    }
  }

  // 2) Standard Request / NextApiRequest (Pages)
  const headers = req.headers as Headers | Record<string, string | string[] | undefined>;
  const rawCookie = typeof (headers as Headers).get === "function" 
    ? (headers as Headers).get("cookie") 
    : (headers as Record<string, string | undefined>).cookie;

  if (!rawCookie) return null;

  const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const getAccessTokenFromReq = readAccessCookie;