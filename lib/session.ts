/* lib/session.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";

const COOKIE_NAME = "aofl_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Atomic Header Management
 * Logic: Prevents header clobbering by appending to existing Set-Cookie arrays.
 */
function appendSetCookie(res: NextApiResponse, cookie: string) {
  const prev = res.getHeader("Set-Cookie");
  if (!prev) return res.setHeader("Set-Cookie", cookie);
  const next = Array.isArray(prev) ? [...prev, cookie] : [String(prev), cookie];
  res.setHeader("Set-Cookie", next);
}

export function getOrSetSessionId(req: NextApiRequest, res: NextApiResponse): string {
  // Respect existing session to maintain principal continuity
  const existing = req.cookies?.[COOKIE_NAME];
  if (existing && existing.startsWith("sid_")) return existing;

  const sid = `sid_${crypto.randomBytes(16).toString("hex")}`;
  const isSecure = process.env.NODE_ENV === "production";

  const cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(sid)}`,
    "Path=/",
    `Max-Age=${ONE_YEAR}`,
    "SameSite=Lax",
    "HttpOnly",
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  appendSetCookie(res, cookie);
  return sid;
}

export function getSlugParam(req: NextApiRequest): string | null {
  const raw = req.query.slug;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s || typeof s !== "string" || !s.trim()) return null;
  return s.trim().toLowerCase();
}

