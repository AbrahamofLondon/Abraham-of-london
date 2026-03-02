// pages/api/access/check.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import type { InnerCircleAccess } from "@/lib/inner-circle/access.client";

export const config = {
  api: {
    responseLimit: false,
  },
};

const MAX_COOKIE_SIZE = 4096;
const MAX_VAL_LEN = 1024;
const UA_MAX_LEN = 256;
const TIMEOUT_MS = 3000;

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader || cookieHeader.length > MAX_COOKIE_SIZE) return {};
  
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(";");

  for (const rawPair of pairs) {
    const pair = rawPair.trim();
    if (!pair) continue;

    const eqPos = pair.indexOf("=");
    if (eqPos === -1) continue;

    const key = pair.substring(0, eqPos).trim();
    if (!/^[a-zA-Z0-9_\-]+$/.test(key)) continue;

    let value = pair.substring(eqPos + 1).trim();
    if (value.length > MAX_VAL_LEN) value = value.substring(0, MAX_VAL_LEN);

    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }

  return cookies;
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded) 
    ? forwarded[0] 
    : forwarded?.split(",")[0]?.trim();
  
  const ip = req.socket?.remoteAddress || forwardedIp || "";
  return ip.length > 45 ? "" : ip;
}

function createSafeResponse(data: Partial<InnerCircleAccess>, status = 200): InnerCircleAccess {
  return {
    hasAccess: !!data.hasAccess,
    reason: data.reason || "internal_error",
    tier: data.tier,
    expiresAt: data.expiresAt,
    rateLimit: data.rateLimit,
  };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InnerCircleAccess>
) {
  // Set security headers
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Handle HEAD requests (lightweight check)
  if (req.method === "HEAD") {
    const hasToken = String(req.headers.cookie || "").includes("innerCircleAccess=");
    return res.status(hasToken ? 200 : 401).end();
  }

  // Only allow GET and HEAD
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).json({ hasAccess: false, reason: "no_request" });
  }

  try {
    const cookieHeader = req.headers.cookie;
    const userAgent = (req.headers["user-agent"] as string || "unknown").substring(0, UA_MAX_LEN);
    const cookies = parseCookies(cookieHeader);
    const ip = getClientIp(req);

    const accessInput = {
      cookies: { innerCircleAccess: cookies.innerCircleAccess || "" },
      headers: { "user-agent": userAgent },
      ip,
    };

    const accessResult = await withTimeout(
      getInnerCircleAccess(accessInput as any),
      TIMEOUT_MS
    );

    return res.status(200).json(createSafeResponse(accessResult as InnerCircleAccess, 200));
  } catch (error: any) {
    const msg = String(error?.message || "").toLowerCase();
    const isTimeout = msg === "timeout";

    return res.status(isTimeout ? 504 : 500).json(
      createSafeResponse(
        { hasAccess: false, reason: isTimeout ? "internal_error" : "internal_error" },
        isTimeout ? 504 : 500
      )
    );
  }
}