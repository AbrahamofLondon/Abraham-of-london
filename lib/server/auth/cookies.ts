import type { NextApiResponse } from "next";
import type { NextRequest } from "next/server";

export const ACCESS_COOKIE = "aol_access";
export const TIER_COOKIE = "aol_tier";
export const NEXTAUTH_COOKIE = "next-auth.session-token";
export const NEXTAUTH_SECURE_COOKIE = "__Secure-next-auth.session-token";

export const LEGACY_TIER_COOKIE_KEYS = [
  "aol_tier",
  "aol_ic_tier",
  "inner_circle_tier",
  "ic_tier",
] as const;

export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SameSite = "lax" | "strict" | "none";

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = String(cookieHeader || "");
  if (!raw) return out;

  for (const part of raw.split(";")) {
    const [keyPart, ...valueParts] = part.split("=");
    const key = keyPart?.trim();
    if (!key) continue;

    const valueRaw = valueParts.join("=").trim();
    if (!valueRaw) continue;

    try {
      out[key] = decodeURIComponent(valueRaw);
    } catch {
      out[key] = valueRaw;
    }
  }

  return out;
}

function readCookieFromAnyReq(req: unknown, name: string): string | null {
  const candidate = req as
    | NextRequest
    | { cookies?: { get?: (name: string) => unknown }; headers?: any }
    | undefined;

  try {
    if (candidate?.cookies && typeof candidate.cookies.get === "function") {
      const value = candidate.cookies.get(name) as
        | string
        | { value?: string }
        | undefined;

      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "object" && typeof value?.value === "string" && value.value.trim()) {
        return value.value.trim();
      }
    }
  } catch {
    // fall through
  }

  try {
    const headers = candidate?.headers;
    const cookieHeader =
      headers && typeof headers.get === "function"
        ? headers.get("cookie") || ""
        : headers?.cookie || "";

    const parsed = parseCookieHeader(cookieHeader);
    const value = parsed[name];
    return typeof value === "string" && value.trim() ? value.trim() : null;
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

export function readAccessCookie(req: NextRequest | any): string | null {
  return (
    readCookieFromAnyReq(req, NEXTAUTH_SECURE_COOKIE) ||
    readCookieFromAnyReq(req, NEXTAUTH_COOKIE) ||
    readCookieFromAnyReq(req, ACCESS_COOKIE) ||
    readCookieFromAnyReq(req, "aol_session") ||
    null
  );
}

export function readTierCookie(): "public" {
  return "public";
}

function appendSetCookie(res: NextApiResponse, cookieLine: string) {
  const existing = res.getHeader("Set-Cookie");

  if (!existing) {
    res.setHeader("Set-Cookie", cookieLine);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookieLine]);
    return;
  }

  res.setHeader("Set-Cookie", [String(existing), cookieLine]);
}

export function setAccessCookie(res: NextApiResponse, sessionId: string): void {
  const value = encodeURIComponent(String(sessionId || "").trim());
  if (!value) throw new Error("setAccessCookie: sessionId is empty");

  const opt = cookieOptions(MAX_AGE_SECONDS);
  const parts = [
    `${ACCESS_COOKIE}=${value}`,
    `Path=${opt.path}`,
    "HttpOnly",
    `SameSite=${opt.sameSite}`,
    `Max-Age=${opt.maxAge}`,
  ];

  if (opt.secure) parts.push("Secure");
  appendSetCookie(res, parts.join("; "));
}

export function clearAccessCookie(res: NextApiResponse): void {
  const names = [
    ACCESS_COOKIE,
    "aol_session",
    NEXTAUTH_COOKIE,
    NEXTAUTH_SECURE_COOKIE,
  ];

  for (const name of names) {
    const secure = name.startsWith("__Secure-") ? "; Secure" : "";
    appendSetCookie(
      res,
      `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`,
    );
  }
}

export const removeAccessCookie = clearAccessCookie;
export const COOKIE_NAME = ACCESS_COOKIE;
export const getAccessCookie = readAccessCookie;
export const getAccessTokenFromReq = readAccessCookie;
