/* proxy.ts — PRODUCTION SAFE (NEXT 16 PROXY) */
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

const CANONICAL_HOST = "www.abrahamoflondon.org";

/**
 * Public prefixes that must NEVER be blocked by auth
 */
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/contact",
  "/api/health",
  "/api/middleware-health",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/assets",
  "/fonts",
  "/images",
  "/inner-circle/login",
  "/admin/login",
];

export const config = {
  matcher: ["/admin/:path*", "/inner-circle/:path*", "/api/:path*"],
};

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function safeReturnTo(req: NextRequest) {
  const u = req.nextUrl.clone();
  u.searchParams.delete("callbackUrl");
  u.searchParams.delete("returnTo");

  const path = u.pathname.startsWith("/") ? u.pathname : `/${u.pathname}`;
  return `${path}${u.search || ""}`;
}

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/vault");
}

function isInnerCirclePath(pathname: string) {
  return pathname.startsWith("/inner-circle");
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
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
    const rl = await rateLimit(ip, opts);

    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfterMs: rl.retryAfterMs,
          resetTime: rl.resetTime,
          remaining: rl.remaining,
          limit: rl.limit,
          source: rl.source,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...createRateLimitHeaders(rl),
          },
        }
      );
    }
  }

  // 4) Auth gate — ONLY admin + inner-circle (NOT all /api)
  const needsAuth = admin || inner;

  if (needsAuth) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const onAdminLogin = pathname.startsWith("/admin/login");
      const onInnerLogin = pathname.startsWith("/inner-circle/login");
      if (onAdminLogin || onInnerLogin) return NextResponse.next();

      const loginPath = admin ? "/admin/login" : "/inner-circle/login";
      const url = new URL(loginPath, req.url);
      url.searchParams.set("returnTo", safeReturnTo(req));

      return NextResponse.redirect(url, 307);
    }

    // 5) Role gate — Admin only
    if (admin) {
      const role = String((token as any)?.role ?? "guest").toLowerCase();
      const rank = ROLE_HIERARCHY[role] ?? 0;
      const required = ROLE_HIERARCHY.admin ?? 100;

      if (rank < required) {
        if (api) return NextResponse.json({ error: "Clearance Required" }, { status: 403 });
        return NextResponse.redirect(new URL("/auth/access-denied", req.url));
      }
    }
  }

  // 6) Sensitive operations precondition (optional)
  try {
    if (typeof isSensitiveOperation === "function" && isSensitiveOperation(pathname, req.method)) {
      if (!req.headers.get("x-confirmation-token")) {
        return NextResponse.json(
          { error: "Precondition Required", message: "Secondary token required." },
          { status: 428 }
        );
      }
    }
  } catch {
    // never crash perimeter
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