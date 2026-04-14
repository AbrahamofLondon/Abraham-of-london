// middleware.ts — AUTH ENFORCEMENT LAYER
//
// Architecture: Option 3 Hybrid Identity + Entitlement
//   - NextAuth owns IDENTITY    (who you are — JWT in session cookie)
//   - AL token owns ENTITLEMENT (what you can access — aol_access cookie)
//
// This middleware is the single gate that enforces both signals at the
// route layer. No page should duplicate this redirect logic.
//
// Four protection tiers:
//   Tier 0 — public (no auth)
//   Tier 1 — NextAuth session required
//   Tier 2 — NextAuth + AL token required
//   Tier 3 — Admin only (token.isInternal === true)

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// ============================================================================
// ROUTE CLASSIFICATION
// ============================================================================

// Tier 0 — Public routes (no authentication).
// Checked via exact-match on the root-level entries and startsWith() on the
// prefix entries.
const PUBLIC_EXACT = new Set<string>([
  "/",
  "/favicon.ico",
  "/api/inner-circle/register",
  "/api/inner-circle/resend",
]);

const PUBLIC_PREFIXES = [
  "/blog",
  "/canon",
  "/shorts",
  "/events",
  "/media",
  "/education-research",
  "/api/auth",
  "/_next",
  "/assets",
];

// Tier 3 — Admin only. Checked FIRST so that nested admin paths
// (e.g. /inner-circle/admin/**) override the broader Tier 2 member gate.
const TIER3_PREFIXES = [
  "/inner-circle/admin",
  "/api/admin",
  "/directorate",
];

// Tier 3 also includes specific exact paths.
const TIER3_EXACT = new Set<string>([
  "/board/dashboard",
]);

// Tier 2 — NextAuth + AL token required.
const TIER2_PREFIXES = [
  "/inner-circle",
  "/private",
  "/vault",
  "/board",
];

// Tier 1 — NextAuth session required.
const TIER1_PREFIXES = [
  "/dashboard",
  "/diagnostics",
  "/consulting",
  "/strategy",
];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  for (const p of prefixes) {
    if (pathname === p || pathname.startsWith(p + "/")) return true;
  }
  return false;
}

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return matchesPrefix(pathname, PUBLIC_PREFIXES);
}

function isTier3Route(pathname: string): boolean {
  if (TIER3_EXACT.has(pathname)) return true;
  return matchesPrefix(pathname, TIER3_PREFIXES);
}

function isTier2Route(pathname: string): boolean {
  return matchesPrefix(pathname, TIER2_PREFIXES);
}

function isTier1Route(pathname: string): boolean {
  return matchesPrefix(pathname, TIER1_PREFIXES);
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public routes before any token resolution.
  if (isPublicRoute(pathname)) return NextResponse.next();

  // Resolve NextAuth JWT once; reused across tier checks.
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isApi = pathname.startsWith("/api/");

  // Tier 3 — Admin only. Must run BEFORE Tier 2 because admin paths nest
  // under member paths (e.g. /inner-circle/admin/** is under /inner-circle).
  if (isTier3Route(pathname)) {
    if (!token || !token.isInternal) {
      if (isApi) {
        return NextResponse.json(
          { ok: false, error: "Forbidden", code: "ADMIN_REQUIRED" },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Tier 2 — NextAuth + AL token required.
  if (isTier2Route(pathname)) {
    if (!token) {
      if (isApi) {
        return NextResponse.json(
          { ok: false, error: "Inner Circle access required", code: "TOKEN_REQUIRED" },
          { status: 401 },
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/inner-circle";
      url.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(url);
    }
    const alCookie = req.cookies.get("aol_access");
    if (!alCookie) {
      if (isApi) {
        return NextResponse.json(
          { ok: false, error: "Inner Circle access required", code: "TOKEN_REQUIRED" },
          { status: 401 },
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/inner-circle";
      url.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Tier 1 — NextAuth session required.
  if (isTier1Route(pathname)) {
    if (!token) {
      if (isApi) {
        return NextResponse.json(
          { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" },
          { status: 401 },
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/api/auth/signin";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Default: unmatched routes are allowed through. Page-level auth (if any)
  // can still run, but the middleware does not enforce.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets).*)",
  ],
};
