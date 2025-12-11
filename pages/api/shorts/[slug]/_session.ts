// pages/api/shorts/[slug]/_session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

const COOKIE_NAME = "aofl_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return header.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.split("=");
    const key = rawKey.trim();
    const value = rest.join("=").trim();
    if (!key) return acc;
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);
}

export function getOrSetSessionId(
  req: NextApiRequest,
  res: NextApiResponse
): string {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[COOKIE_NAME]) {
    return cookies[COOKIE_NAME];
  }

  const sid = `sid_${crypto.randomBytes(16).toString("hex")}`;

  const isSecure = process.env.NODE_ENV === "production";
  const cookieParts = [
    `${COOKIE_NAME}=${encodeURIComponent(sid)}`,
    "Path=/",
    `Max-Age=${ONE_YEAR}`,
    "SameSite=Lax",
    isSecure ? "Secure" : "",
    "HttpOnly",
  ].filter(Boolean);

  res.setHeader("Set-Cookie", cookieParts.join("; "));

  return sid;
}