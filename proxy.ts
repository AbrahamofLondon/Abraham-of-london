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
 * - Keep /api/auth public (NextAuth)
 * - Keep health/contact public
 * - Keep Next static assets public
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
  "/public",
  "/inner-circle/login",
  "/admin/login",
];

/**
 * Apply proxy only where it matters.
 * IMPORTANT: Next proxy/middleware matcher is honored only if the runner picks it up.
 */
export const config = {
  matcher: ["/admin/:path*", "/inner-circle/:path*", "/api/:path*"],
};

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Build a safe returnTo:
 * - strips callbackUrl/returnTo to prevent nesting loops
 * - keeps other query params
 * - guarantees a leading slash
 */
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

/**
 * Canonical host redirect guard:
 * - only redirect apex -> www
 * - never redirect if already www
 * - preserve path + query
 */
function canonicalizeHost(req: NextRequest) {
  const host = req.nextUrl.hostname;
  if (host === "abrahamoflondon.org") {
    const url = req.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }
  return null;
}

/**
 * Main proxy runner
 * Next 16 expects either:
 * - export async function proxy(req)
 * - OR default export function
 * We'll provide both + middleware alias at bottom.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 0) Canonical host redirect (apex -> www)
  const canonical = canonicalizeHost(req);
  if (canonical) return canonical;

  // 1) Bypass truly public paths immediately
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const ip = getClientIp(req);

  const admin = isAdminPath(pathname);
  const api = isApiPath(pathname);
  const inner = isInnerCirclePath(pathname);

  // 2) IP GATE – Admin only
  if (admin) {
    // If allowlist isn’t configured properly, isAllowedIp should still return false safely
    if (!isAllowedIp(ip)) {
      return new NextResponse("Access Denied", { status: 403 });
    }
  }

  // 3) RATE LIMIT – APIs + Admin perimeter
  // NOTE: Rate limiting runs before auth so abuse is throttled early.
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

  // 4) AUTH GATE – ONLY for /admin + /inner-circle (NOT all /api)
  const needsAuth = admin || inner;

  if (needsAuth) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Let login pages through without token (avoid lockout loops)
    if (!token) {
      const onAdminLogin = pathname.startsWith("/admin/login");
      const onInnerLogin = pathname.startsWith("/inner-circle/login");
      if (onAdminLogin || onInnerLogin) return NextResponse.next();

      const loginPath = admin ? "/admin/login" : "/inner-circle/login";
      const url = new URL(loginPath, req.url);

      // ✅ Use returnTo — never callbackUrl (prevents recursion hell)
      url.searchParams.set("returnTo", safeReturnTo(req));

      return NextResponse.redirect(url, 307);
    }

    // 5) ROLE GATE – Admin only
    if (admin) {
      const role = String((token as any)?.role ?? "guest").toLowerCase();
      const rank = ROLE_HIERARCHY[role] ?? 0;
      const required = ROLE_HIERARCHY.admin ?? 100;

      if (rank < required) {
        if (api) {
          return NextResponse.json({ error: "Clearance Required" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/auth/access-denied", req.url));
      }
    }
  }

  // 6) Sensitive operation MFA (optional)
  // Guard against admin-security being present but not exporting properly
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
    // Do nothing — never let MFA helper crash the perimeter
  }

  // 7) SUCCESS – Security headers
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (admin || inner) {
    res.headers.set("Cache-Control", "no-store, private, must-revalidate");
  }

  return res;
}

/**
 * Belt-and-braces exports for Next 16 runner expectations
 * - proxy: named
 * - middleware: compatibility alias
 * - default: compatibility
 */
export const middleware = proxy;
export default proxy;