/* proxy.ts — INSTITUTIONAL PERIMETER V4.0 (Pages Router / Edge-safe) */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { ROLE_HIERARCHY } from "@/types/auth";
import { readAccessCookie } from "@/lib/server/auth/cookies";

const CANONICAL_HOST = "www.abrahamoflondon.org";

const RATE_LIMIT_CONFIGS = {
  ADMIN: { limit: 30, windowMs: 60_000 },
  API_GENERAL: { limit: 100, windowMs: 60_000 },
} as const;

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
  limit: number;
};

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",").map((v) => v.trim()).filter(Boolean)[0];
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || "0.0.0.0";
}

async function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / options.windowMs)}`;
  const current = rateLimitStore.get(windowKey);

  if (!current || now >= current.resetAt) {
    const resetAt = now + options.windowMs;
    rateLimitStore.set(windowKey, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetAt,
      limit: options.limit,
    };
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterMs: current.resetAt - now,
      limit: options.limit,
    };
  }

  current.count += 1;

  return {
    allowed: true,
    remaining: options.limit - current.count,
    resetAt: current.resetAt,
    limit: options.limit,
  };
}

function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(typeof result.retryAfterMs === "number"
      ? { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) }
      : {}),
  };
}

function isAllowedIp(ip: string): boolean {
  const allowedIps =
    process.env.ADMIN_ALLOWED_IPS?.split(",").map((v) => v.trim()).filter(Boolean) || [];

  if (allowedIps.length === 0 || allowedIps.includes("0.0.0.0/0")) return true;
  return allowedIps.includes(ip);
}

function safeReturnTo(req: NextRequest): string {
  const pathname = req.nextUrl.pathname;
  const search = req.nextUrl.search;
  const url = new URL(`${pathname}${search}`, "http://localhost");
  url.searchParams.delete("callbackUrl");
  url.searchParams.delete("returnTo");
  return `${url.pathname}${url.search}`;
}

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders?: Record<string, string>
): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(extraHeaders || {}),
    },
  });
}

function makeRequestId(req: NextRequest): string {
  return (
    req.headers.get("x-request-id") ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
}

const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/contact",
  "/api/health",
  "/api/middleware-health",
  "/api/access",
  "/api/check-access",
  "/api/inner-circle",
  "/api/pdfs",
  "/api/premium/content",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/assets",
  "/fonts",
  "/images",
  "/inner-circle/login",
  "/admin/login",
  "/strategy",
  "/consulting",
  "/speaking",
  "/founders",
  "/fatherhood",
  "/leadership",
  "/auth/access-denied",
  "/inner-circle/insufficient-clearance",
] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") ||
    pathname.startsWith("/api/vault") ||
    pathname.startsWith("/api/admin");
}

function needsInstitutionalSession(pathname: string): boolean {
  return pathname.startsWith("/inner-circle") ||
    pathname.startsWith("/api/premium") ||
    pathname.startsWith("/api/dl/");
}

async function checkGlobalLock(req: NextRequest): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${req.nextUrl.origin}/api/system/lock-status`, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "X-Institutional-Action": "true",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return false;

    const data = (await res.json()) as { isLocked?: boolean };
    return Boolean(data?.isLocked);
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isAdmin = isAdminPath(pathname);
  const requiresInstitutionalSession = needsInstitutionalSession(pathname);

  const masterKey = process.env.INTERNAL_BYPASS_KEY;
  if (masterKey && req.headers.get("X-Directorate-Bypass") === masterKey) {
    const response = NextResponse.next();
    response.headers.set("X-Directorate-Safety-Active", "true");
    response.headers.set("X-Request-ID", makeRequestId(req));
    return response;
  }

  if (
    req.headers.get("X-Institutional-Action") === "true" ||
    pathname === "/api/system/lock-status"
  ) {
    return NextResponse.next();
  }

  if (
    process.env.NODE_ENV === "production" &&
    req.nextUrl.hostname === "abrahamoflondon.org"
  ) {
    const url = req.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  const isLockdownExempt =
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/system/lock-status") ||
    pathname.includes("insufficient-clearance");

  if (!isLockdownExempt) {
    const isLocked = await checkGlobalLock(req);
    if (isLocked) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      const role = String((token as any)?.role || "guest").toLowerCase();
      const isAdminUser = role === "admin" || role === "root";

      if (!isAdminUser) {
        if (isApi) {
          return jsonResponse(
            { error: "SYSTEM_LOCKED", message: "Emergency Lockdown" },
            503
          );
        }

        return NextResponse.redirect(
          new URL("/inner-circle/insufficient-clearance?reason=lockdown", req.url)
        );
      }
    }
  }

  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set("X-Request-ID", makeRequestId(req));
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  }

  const ip = getClientIp(req);

  if (isAdmin && !isAllowedIp(ip)) {
    if (isApi) return jsonResponse({ error: "ACCESS_DENIED" }, 403);
    return NextResponse.redirect(new URL("/auth/access-denied", req.url));
  }

  if (isAdmin || isApi) {
    const config = isAdmin
      ? RATE_LIMIT_CONFIGS.ADMIN
      : RATE_LIMIT_CONFIGS.API_GENERAL;

    const rl = await rateLimit(ip, config);

    if (!rl.allowed) {
      return jsonResponse(
        { error: "RATE_LIMIT_EXCEEDED" },
        429,
        createRateLimitHeaders(rl)
      );
    }
  }

  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const hasInstitutionalCookie = Boolean(readAccessCookie(req));
    const hasInstitutionalSession = Boolean(token) || hasInstitutionalCookie;

    if (isAdmin) {
      if (!token) {
        if (pathname.includes("/login")) return NextResponse.next();

        const url = new URL("/admin/login", req.url);
        url.searchParams.set("returnTo", safeReturnTo(req));
        return NextResponse.redirect(url, 307);
      }

      const role = String((token as any)?.role ?? "guest").toLowerCase();
      const rank = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] ?? 0;
      const requiredRank = ROLE_HIERARCHY.admin ?? 100;

      if (rank < requiredRank) {
        return isApi
          ? jsonResponse({ error: "CLEARANCE_REQUIRED" }, 403)
          : NextResponse.redirect(new URL("/auth/access-denied", req.url));
      }
    }

    if (requiresInstitutionalSession && !hasInstitutionalSession) {
      if (pathname.includes("/login")) return NextResponse.next();

      const url = new URL("/inner-circle/login", req.url);
      url.searchParams.set("returnTo", safeReturnTo(req));
      return NextResponse.redirect(url, 307);
    }
  } catch {
    return isApi
      ? jsonResponse({ error: "AUTH_ERROR" }, 500)
      : NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set("X-Request-ID", makeRequestId(req));
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (isAdmin || pathname.startsWith("/inner-circle")) {
    response.headers.set("Cache-Control", "no-store, private, must-revalidate");
  }

  return response;
}

export default proxy;