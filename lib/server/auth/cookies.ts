// lib/server/auth/cookies.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { type NextRequest, NextResponse } from "next/server";

export const COOKIE_NAME = "aol_access";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function isProd(): boolean { return process.env.NODE_ENV === "production"; }

function getCookieOptions(maxAge: number) {
  return { path: "/", httpOnly: true, secure: isProd(), sameSite: "lax" as const, maxAge };
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
  res.cookies.set(COOKIE_NAME, sessionId, getCookieOptions(MAX_AGE_SECONDS));
}

export function clearAccessCookie(res: NextApiResponse): void {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isProd() ? "; Secure" : ""}`);
}

export const removeAccessCookie = clearAccessCookie;

export function readAccessCookie(req: NextRequest | NextApiRequest | Request): string | null {
  if (req instanceof Request || "cookies" in req) {
    const nextReq = req as NextRequest;
    if (typeof nextReq.cookies?.get === "function") {
      return nextReq.cookies.get(COOKIE_NAME)?.value || null;
    }
  }
  const headers = req.headers as Record<string, any>;
  const rawCookie = headers.cookie || "";
  const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ALIAS BRIDGE: Support existing API route imports
export const getAccessCookie = readAccessCookie;
export const getAccessTokenFromReq = readAccessCookie;