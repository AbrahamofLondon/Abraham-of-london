// lib/server/auth/cookies.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { type NextRequest, NextResponse } from "next/server";

export const COOKIE_NAME = "aol_access";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

type SameSite = "lax" | "strict" | "none";

function getCookieOptions(maxAge: number) {
  return {
    path: "/",
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax" as SameSite,
    maxAge,
  };
}

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

export function setAppRouterCookie(res: NextResponse, sessionId: string): void {
  const options = getCookieOptions(MAX_AGE_SECONDS);
  res.cookies.set(COOKIE_NAME, sessionId, options);
}

export function clearAccessCookie(res: NextApiResponse): void {
  const secure = isProd() ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`
  );
}

export const removeAccessCookie = clearAccessCookie;

export function readAccessCookie(req: NextRequest | NextApiRequest | Request): string | null {
  // NextRequest (middleware / edge / app router)
  try {
    const maybeNext = req as any;
    if (maybeNext?.cookies && typeof maybeNext.cookies.get === "function") {
      return maybeNext.cookies.get(COOKIE_NAME)?.value || null;
    }
  } catch {
    // fall through
  }

  // NextApiRequest (pages router) or standard Request
  const headersAny = (req as any)?.headers as any;
  const rawCookie =
    typeof headersAny?.get === "function"
      ? String(headersAny.get("cookie") || "")
      : String(headersAny?.cookie || "");

  if (!rawCookie) return null;

  const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ALIAS BRIDGE: Support existing imports
export const getAccessCookie = readAccessCookie;
export const getAccessTokenFromReq = readAccessCookie;