// proxy.ts — INSTITUTIONAL PERIMETER (Edge-safe, production-grade)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { ROLE_HIERARCHY } from "@/types/auth";
import { readAccessCookie } from "@/lib/auth/edge/cookies";

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
    const parts = xff.split(",").map((ip) => ip.trim()).filter(Boolean);
    if (parts[0]) return parts[0];
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "0.0.0.0";
}

async function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
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
    process.env.ADMIN_ALLOWED_IPS?.split(",").map((value) => value.trim()).filter(Boolean) ||
    [];

  if (allowedIps.length === 0) return true;
  if (allowedIps.includes("0.0.0.0/0")) return true;

  return allowedIps.includes(ip);
}

function safeReturnTo(req: NextRequest): string {
  const url = req.nextUrl.clone();
  url.searchParams.delete("callbackUrl");
  url.searchParams.delete("returnTo");
  return `${url.pathname}${url.search}`;
}

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders?: Record<string, string>,
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
  const existing = req.headers.get("x-request-id");
  if (existing) return existing;

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  "/api/premium/content", // allow premium launch endpoint
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
] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPremiumDownloadPath(pathname: string): boolean {
  return pathname.startsWith("/api/premium/content/download/");
}

function isLegacyDownloadPath(pathname: string): boolean {
  return pathname.startsWith("/api/dl/");
}

function needsInstitutionalSession(pathname: string): boolean {
  return (
    pathname.startsWith("/inner-circle") ||
    pathname.startsWith("/api/premium") ||
    pathname.startsWith("/api/dl/")
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/vault");
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/inner-circle/:path*",
    "/api/:path*",
    "/strategy-room/success/:path*",
  ],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isAdmin = isAdminPath(pathname);
  const isInner = pathname.startsWith("/inner-circle");
  const requiresInstitutionalSession = needsInstitutionalSession(pathname);

  // 1. Canonical host redirect
  if (req.nextUrl.hostname === "abrahamoflondon.org") {
    const url = req.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  // 2. Public bypass
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set("X-Request-ID", makeRequestId(req));
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    return response;
  }

  const ip = getClientIp(req);

  // 3. Admin IP gate
  if (isAdmin && !isAllowedIp(ip)) {
    if (isApi) {
      return jsonResponse({ error: "ACCESS_DENIED" }, 403);
    }
    return NextResponse.redirect(new URL("/auth/access-denied", req.url));
  }

  // 4. Rate limiting
  if (isAdmin || isApi) {
    const config = isAdmin
      ? RATE_LIMIT_CONFIGS.ADMIN
      : RATE_LIMIT_CONFIGS.API_GENERAL;

    const rl = await rateLimit(ip, config);

    if (!rl.allowed) {
      return jsonResponse(
        { error: "RATE_LIMIT_EXCEEDED" },
        429,
        createRateLimitHeaders(rl),
      );
    }
  }

  // 5. Auth and access gate
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const hasInstitutionalCookie = Boolean(readAccessCookie(req));
    const hasInstitutionalSession = Boolean(token) || hasInstitutionalCookie;

    // Admin routes always require authenticated token
    if (isAdmin) {
      if (!token) {
        if (pathname.includes("/login")) {
          return NextResponse.next();
        }

        const url = new URL("/admin/login", req.url);
        url.searchParams.set("returnTo", safeReturnTo(req));
        return NextResponse.redirect(url, 307);
      }

      const role = String((token as { role?: unknown })?.role ?? "guest").toLowerCase();
      const rank = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] ?? 0;

      if (rank < (ROLE_HIERARCHY.admin ?? 100)) {
        return isApi
          ? jsonResponse({ error: "CLEARANCE_REQUIRED" }, 403)
          : NextResponse.redirect(new URL("/auth/access-denied", req.url));
      }
    }

    // Inner-circle / premium / legacy download routes accept either token or institutional cookie
    if (requiresInstitutionalSession && !isAdmin) {
      if (!hasInstitutionalSession) {
        if (pathname.includes("/login")) {
          return NextResponse.next();
        }

        const loginPath = "/inner-circle/login";
        const url = new URL(loginPath, req.url);
        url.searchParams.set("returnTo", safeReturnTo(req));
        return NextResponse.redirect(url, 307);
      }
    }
  } catch (_error) {
    return isApi
      ? jsonResponse({ error: "AUTH_ERROR" }, 500)
      : NextResponse.next();
  }

  // 6. Security headers
  const response = NextResponse.next();

  response.headers.set("X-Request-ID", makeRequestId(req));
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  if (isAdmin || isInner || isPremiumDownloadPath(pathname) || isLegacyDownloadPath(pathname)) {
    response.headers.set("Cache-Control", "no-store, private, must-revalidate");
  }

  return response;
}

export default proxy;