// proxy.ts — INSTITUTIONAL PERIMETER (Hardened for Build/Runtime)
// Edge-safe: MUST NOT import Node-only modules.
// This file is middleware and runs in the Edge runtime.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { ROLE_HIERARCHY } from "@/types/auth";
import {
  getClientIp,
  rateLimit,
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
} from "@/lib/server/rate-limit-unified";

import { isAllowedIp, isSensitiveOperation } from "@/lib/server/admin-security";
import { readAccessCookie } from "@/lib/server/auth/cookies";

const CANONICAL_HOST = "www.abrahamoflondon.org";

/**
 * Public prefixes that must NEVER be blocked by auth.
 * These include “bootstrap” endpoints that establish/verify access.
 */
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/contact",
  "/api/health",
  "/api/middleware-health",

  // ✅ Access bootstrap (do NOT lock these)
  "/api/access",
  "/api/inner-circle",
  "/api/check-access",
  "/api/access-check",
  "/api/v2/access",

  // Static / Next internals
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/assets",
  "/fonts",
  "/images",

  // Auth pages
  "/inner-circle/login",
  "/inner-circle/unlock",
  "/admin/login",

  // Strategy Room
  "/strategy-room",
  "/api/strategy-room/submit",
  "/api/strategy-room/analyze",
] as const;

export const config = {
  matcher: [
    "/admin/:path*",
    "/inner-circle/:path*",
    "/api/:path*",
    "/strategy-room/success/:path*",
  ],
};

function isPublicPath(pathname: string) {
  // Success page is private
  if (pathname === "/strategy-room/success") return false;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function safeReturnTo(req: NextRequest) {
  const u = req.nextUrl.clone();
  u.searchParams.delete("callbackUrl");
  u.searchParams.delete("returnTo");
  const path = u.pathname.startsWith("/") ? u.pathname : `/${u.pathname}`;
  return `${path}${u.search || ""}`;
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/vault");
}

function isInnerCirclePath(pathname: string) {
  return pathname.startsWith("/inner-circle") || pathname.startsWith("/strategy-room/success");
}

function canonicalizeHost(req: NextRequest) {
  const host = req.nextUrl.hostname;
  if (host === "abrahamoflondon.org") {
    const url = req.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }
  return null;
}

function jsonResponse(body: any, status: number, extraHeaders?: Record<string, string>) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...(extraHeaders || {}) },
  });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 0) Canonical host redirect
  const canonical = canonicalizeHost(req);
  if (canonical) return canonical;

  // 1) Public bypass
  if (isPublicPath(pathname)) return NextResponse.next();

  const ip = getClientIp(req);
  const admin = isAdminPath(pathname);
  const api = isApiPath(pathname);
  const inner = isInnerCirclePath(pathname);

  // 2) IP gate — Admin only
  if (admin) {
    if (!isAllowedIp(ip)) return new NextResponse("Access Denied", { status: 403 });
  }

  // 3) Rate limit — Admin + API
  if (admin || api) {
    const opts = admin ? RATE_LIMIT_CONFIGS.ADMIN : RATE_LIMIT_CONFIGS.API_GENERAL;
    const rl = await rateLimit(ip, opts).catch(() => ({ allowed: true } as any));

    if (rl && rl.allowed === false) {
      return jsonResponse(
        { error: "RATE_LIMIT_EXCEEDED", retryAfterMs: rl.retryAfterMs },
        429,
        createRateLimitHeaders(rl)
      );
    }
  }

  // 4) Auth gate — Admin + Inner-Circle PAGES only (not bootstrap APIs)
  const needsAuth = admin || inner;

  if (needsAuth) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Allow institutional session cookie to satisfy inner-circle page access
    let hasInstitutionalSession = false;

    if (!token && inner) {
      try {
        const sessionId = readAccessCookie(req);
        if (sessionId) hasInstitutionalSession = true;
      } catch (e) {
        console.error("[MIDDLEWARE_COOKIE_READ_ERROR]", e);
      }
    }

    if (!token && !hasInstitutionalSession) {
      const onAdminLogin = pathname.startsWith("/admin/login");
      const onInnerLogin = pathname.startsWith("/inner-circle/login");
      if (onAdminLogin || onInnerLogin) return NextResponse.next();

      const loginPath = admin ? "/admin/login" : "/inner-circle/login";
      const url = new URL(loginPath, req.url);
      url.searchParams.set("returnTo", safeReturnTo(req));
      return NextResponse.redirect(url, 307);
    }

    // 5) Role gate — Admin only
    if (admin && token) {
      const role = String((token as any)?.role ?? "guest").toLowerCase();
      const rank = ROLE_HIERARCHY[role] ?? 0;
      const required = ROLE_HIERARCHY.admin ?? 100;

      if (rank < required) {
        if (api) return jsonResponse({ error: "CLEARANCE_REQUIRED" }, 403);
        return NextResponse.redirect(new URL("/auth/access-denied", req.url));
      }
    }
  }

  // 6) Sensitive operations (secondary token)
  try {
    if (typeof isSensitiveOperation === "function" && isSensitiveOperation(pathname, req.method)) {
      if (!req.headers.get("x-confirmation-token")) {
        return jsonResponse(
          { error: "PRECONDITION_REQUIRED", message: "Secondary token required." },
          428
        );
      }
    }
  } catch {
    // silent fail
  }

  // 7) Success — perimeter headers
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (admin || inner) res.headers.set("Cache-Control", "no-store, private, must-revalidate");
  return res;
}

export const middleware = proxy;
export default proxy;