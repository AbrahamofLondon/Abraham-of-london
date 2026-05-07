/* lib/auth/proxy.ts — INSTITUTIONAL PERIMETER (Edge-safe, production-grade) */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { ROLE_HIERARCHY } from "@/types/auth";
import { readAccessCookie } from "@/lib/auth/edge/cookies";
import { isAuthorizedAdminSubject } from "@/lib/auth/admin-authority";

const CANONICAL_HOST = "www.abrahamoflondon.org";

// --- CORE UTILITIES & CONFIGS ---

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

// Note: In a multi-node edge environment (Vercel), this Map resets per-isolate.
// For strict global enforcement, connect this to Upstash/Redis.
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

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
  "/inner-circle/insufficient-clearance"
] as const;

// --- PERIMETER FUNCTIONS ---

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((ip) => ip.trim()).filter(Boolean);
    if (parts[0]) return parts[0];
  }
  return req.headers.get("x-real-ip") || "0.0.0.0";
}

async function rateLimit(key: string, options: { limit: number; windowMs: number }): Promise<RateLimitResult> {
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / options.windowMs)}`;
  const current = rateLimitStore.get(windowKey);

  if (!current || now >= current.resetAt) {
    const resetAt = now + options.windowMs;
    rateLimitStore.set(windowKey, { count: 1, resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt, limit: options.limit };
  }

  if (current.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt, retryAfterMs: current.resetAt - now, limit: options.limit };
  }

  current.count += 1;
  return { allowed: true, remaining: options.limit - current.count, resetAt: current.resetAt, limit: options.limit };
}

function isAllowedIp(ip: string): boolean {
  const allowedIps = process.env.ADMIN_ALLOWED_IPS?.split(",").map((v) => v.trim()).filter(Boolean) || [];
  if (allowedIps.length === 0 || allowedIps.includes("0.0.0.0/0")) return true;
  return allowedIps.includes(ip);
}

function jsonResponse(body: unknown, status: number, headers?: Record<string, string>): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...(headers || {}) },
  });
}

/**
 * Stage 1.5: Institutional Lockdown Enforcement
 */
async function checkGlobalLock(req: NextRequest): Promise<boolean> {
  try {
    const res = await fetch(`${req.nextUrl.origin}/api/system/lock-status`, {
      next: { revalidate: 1 },
      headers: { "X-Institutional-Action": "true" }
    });
    const data = await res.json();
    return !!data.isLocked;
  } catch (e) {
    return false; // Fail-Open safety net
  }
}

// --- MAIN PROXY ENGINE ---

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/vault") || pathname.startsWith("/api/admin");
  const isInner = pathname.startsWith("/inner-circle");
  const requiresInstitutionalSession = isInner || pathname.startsWith("/api/premium");

  // 0. EMERGENCY BYPASS (Safety Net)
  const masterKey = process.env.INTERNAL_BYPASS_KEY;
  if (masterKey && req.headers.get("X-Directorate-Bypass") === masterKey) {
    const response = NextResponse.next();
    response.headers.set("X-Directorate-Safety-Active", "true");
    return response;
  }

  // 1. Canonical host redirect
  if (req.nextUrl.hostname === "abrahamoflondon.org") {
    const url = req.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  // 2. Lockdown Check (Exempting Auth/Login)
  const isLockdownExempt = pathname.startsWith("/admin/login") || pathname.startsWith("/api/auth") || pathname.includes("insufficient-clearance");
  if (!isLockdownExempt) {
    const isLocked = await checkGlobalLock(req);
    if (isLocked) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      const role = (token as any)?.role || "guest";
      if (role !== "admin" && role !== "root") {
        if (isApi) return jsonResponse({ error: "SYSTEM_LOCKED" }, 503);
        return NextResponse.redirect(new URL("/inner-circle/insufficient-clearance?reason=lockdown", req.url));
      }
    }
  }

  // 3. Public bypass
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    const response = NextResponse.next();
    response.headers.set("X-Request-ID", `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    return response;
  }

  const ip = getClientIp(req);

  // 4. Admin IP Gate
  if (isAdmin && !isAllowedIp(ip)) {
    return isApi ? jsonResponse({ error: "FORBIDDEN_NETWORK" }, 403) : NextResponse.redirect(new URL("/auth/access-denied", req.url));
  }

  // 5. Rate Limiting
  if (isAdmin || isApi) {
    const config = isAdmin ? RATE_LIMIT_CONFIGS.ADMIN : RATE_LIMIT_CONFIGS.API_GENERAL;
    const rl = await rateLimit(ip, config);
    if (!rl.allowed) return jsonResponse({ error: "RATE_LIMIT" }, 429, createRateLimitHeaders(rl));
  }

  // 6. Signature Validation for Admin APIs
  if (pathname.startsWith("/api/admin") && !isLockdownExempt) {
    if (req.headers.get("X-Institutional-Action") !== "true") {
      return jsonResponse({ error: "SIGNATURE_REQUIRED" }, 403);
    }
  }

  // 7. Auth Gate
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const hasInstitutionalCookie = Boolean(readAccessCookie(req));
    const hasInstitutionalSession = Boolean(token) || hasInstitutionalCookie;

    if (isAdmin) {
      if (!token) {
        if (pathname.includes("/login")) return NextResponse.next();
        const url = new URL("/admin/login", req.url);
        url.searchParams.set("returnTo", pathname);
        return NextResponse.redirect(url, 307);
      }

      // Enforce canonical admin authority: email + role at the edge.
      const tokenEmail = (token as any)?.email || (token as any)?.user?.email || (token as any)?.aol?.email;
      const tokenRole = (token as any)?.role || (token as any)?.user?.role || (token as any)?.aol?.role;

      if (!isAuthorizedAdminSubject({ email: tokenEmail, role: tokenRole })) {
        return isApi
          ? jsonResponse({ error: "ADMIN_CLEARANCE_REQUIRED" }, 403)
          : NextResponse.redirect(new URL("/auth/access-denied", req.url));
      }
    }

    if (requiresInstitutionalSession && !hasInstitutionalSession) {
      if (pathname.includes("/login")) return NextResponse.next();
      const url = new URL("/inner-circle/login", req.url);
      url.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(url, 307);
    }
  } catch (e) {
    return isApi ? jsonResponse({ error: "AUTH_EXCEPTION" }, 500) : NextResponse.next();
  }

  // 8. Security Header Injection
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  if (isAdmin || isInner) {
    response.headers.set("Cache-Control", "no-store, private, must-revalidate");
  }

  return response;
}

function createRateLimitHeaders(rl: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
  };
}

export default proxy;
