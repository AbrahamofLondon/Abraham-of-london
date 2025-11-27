import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SAFE_PREFIXES = [
  "/_next/",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
  "/assets/",
  "/icons/",
  "/api/webhooks/",
];

const PUBLIC_CANON = new Set([
  "canon-campaign",
  "canon-master-index-preview",
  "the-builders-catechism",
]);

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "same-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return res;
}

function isMalicious(req: NextRequest): boolean {
  const url = req.nextUrl.pathname.toLowerCase();

  const BAD_PATTERNS = [
    "wp-admin",
    ".php",
    ".env",
    "server-status",
    ".git",
    "admin",
    "login",
    "console",
  ];

  return BAD_PATTERNS.some((p) => url.includes(p));
}

// 🔒 Simple in-memory rate limiter (best-effort, per edge runtime)
const RATE_LIMIT_WINDOW_MS = 60_000; // 60s window
const RATE_LIMIT_MAX = 60; // 60 requests/minute per IP

const rateMap = new Map<string, { count: number; ts: number }>();

function isRateLimited(ip: string | null): boolean {
  if (!ip) return false;
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now - entry.ts > RATE_LIMIT_WINDOW_MS) {
    rateMap.set(ip, { count: 1, ts: now });
    return false;
  }

  entry.count += 1;
  entry.ts = now;

  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (SAFE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (isMalicious(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 🔒 Apply basic rate limiting (per IP)
  const ip =
    req.ip ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;

  if (isRateLimited(ip)) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // Canon gating
  if (pathname.startsWith("/canon/")) {
    let slug = pathname.replace("/canon/", "").replace(/\/$/, "").trim();
    const isPublic = PUBLIC_CANON.has(slug);
    const hasAccess = req.cookies.get("innerCircleAccess")?.value === "true";

    if (!isPublic && !hasAccess) {
      const url = req.nextUrl.clone();
      url.pathname = "/inner-circle/locked";
      const res = NextResponse.redirect(url);
      return applySecurityHeaders(res);
    }
  }

  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL;

    if (origin && allowedOrigin && origin !== allowedOrigin) {
      return new NextResponse("Invalid Origin", { status: 403 });
    }
  }

  const res = NextResponse.next();
  return applySecurityHeaders(res);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|sitemap.xml|robots.txt|assets/).*)",
  ],
};