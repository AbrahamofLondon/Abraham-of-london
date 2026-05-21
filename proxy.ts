/* proxy.ts — INSTITUTIONAL PERIMETER V5.1 (Constitutional Gateway with Session Tracking) */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { ROLE_HIERARCHY } from "@/types/auth";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import {
  validateThreshold,
  type ConstitutionalAuthority,
} from "@/lib/constitution/constitutional-authority";
import { sessionTracker } from "@/lib/analytics/session-tracker";
import {
  coerceCanonicalSectionsEnvelope,
  type CanonicalSectionsEnvelope,
} from "@/lib/decision/canonical-sections";

/* -------------------------------------------------------------------------- */
/* CONSTANTS & CONFIGURATION                                                  */
/* -------------------------------------------------------------------------- */

const CANONICAL_HOST =
  process.env.NEXT_PUBLIC_CANONICAL_HOST || "www.abrahamoflondon.org";

const RATE_LIMIT_CONFIGS = {
  ADMIN: { limit: 60, windowMs: 60_000 },
  API_GENERAL: { limit: 200, windowMs: 60_000 },
  CONSTITUTIONAL: { limit: 30, windowMs: 60_000 },
  SOVEREIGN: { limit: 20, windowMs: 60_000 },
  AUTH: { limit: 10, windowMs: 60_000 },
} as const;

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
  "/api/auth/sovereign",
  "/api/auth/sovereign/login",
  "/api/auth/sovereign/logout",
  "/api/auth/sovereign/verify",
  "/api/auth/sovereign/register",
  "/api/sovereign/auth",
  "/api/sovereign/logout",
  "/api/constitutional/verify",
  "/api/system/lock-status",
  "/api/purpose-alignment",
  "/api/purpose-alignment/assessments",
  "/api/purpose-alignment/report",
  // Auth bootstrap — these endpoints CREATE the admin session and cannot require one.
  // Each endpoint enforces its own rate limiting and email allowlist internally.
  "/api/admin/auth/send-link",
  "/api/admin/auth/verify",
  "/api/admin/auth/callback",
  "/api/admin/auth/reset-rate-limit",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/assets",
  "/fonts",
  "/images",
  "/inner-circle/login",
  "/admin/login",
  "/restricted",
  "/strategy",
  "/consulting",
  "/speaking",
  "/founders",
  "/fatherhood",
  "/leadership",
  "/auth/access-denied",
  "/inner-circle/insufficient-clearance",
  "/diagnostics",
  "/purpose-alignment",
] as const;

const CONSTITUTIONAL_PROTECTED_PATHS: Record<
  string,
  {
    minAuthority: string;
    requireSignature: boolean;
    requireQuorum: boolean;
    auditLevel: "INFO" | "WARNING" | "CRITICAL";
    readOnly?: boolean;
  }
> = {
  "/pdf-dashboard": {
    minAuthority: "PARTICIPANT",
    requireSignature: false,
    requireQuorum: false,
    auditLevel: "INFO",
  },
  "/api/campaigns": {
    minAuthority: "PARTICIPANT",
    requireSignature: false,
    requireQuorum: false,
    auditLevel: "INFO",
    readOnly: true,
  },
  "/admin/reporting": {
    minAuthority: "AUTHORITY",
    requireSignature: false,
    requireQuorum: false,
    auditLevel: "WARNING",
  },
  "/api/reports": {
    minAuthority: "AUTHORITY",
    requireSignature: false,
    requireQuorum: false,
    auditLevel: "WARNING",
    readOnly: true,
  },
  "/admin/campaigns": {
    minAuthority: "DELEGATE",
    requireSignature: false,
    requireQuorum: false,
    auditLevel: "INFO",
  },
  "/api/admin/campaigns": {
    minAuthority: "AUTHORITY",
    requireSignature: true,
    requireQuorum: false,
    auditLevel: "WARNING",
  },
  "/api/constitutional/export": {
    minAuthority: "PARTICIPANT",
    requireSignature: false,
    requireQuorum: false,
    auditLevel: "INFO",
  },
  "/api/constitutional/appeal": {
    minAuthority: "PARTICIPANT",
    requireSignature: true,
    requireQuorum: false,
    auditLevel: "WARNING",
  },
  "/api/constitutional/audit": {
    minAuthority: "AUTHORITY",
    requireSignature: true,
    requireQuorum: false,
    auditLevel: "CRITICAL",
  },
  "/api/constitutional/override": {
    minAuthority: "SOVEREIGN",
    requireSignature: true,
    requireQuorum: true,
    auditLevel: "CRITICAL",
  },
  "/api/interventions": {
    minAuthority: "DELEGATE",
    requireSignature: true,
    requireQuorum: false,
    auditLevel: "WARNING",
  },
  // "/api/strategy-room" — removed from constitutional protection.
  // Strategy Room is commercially gated via HMAC-signed cookies, not sovereign sessions.
  // Paid users who came through Stripe do not have sovereign auth.
  "/api/strategy-room-legacy": {
    minAuthority: "PARTICIPANT",
    requireSignature: false,
    requireQuorum: false,
    auditLevel: "INFO",
  },
  "/api/alignment/assess": {
    minAuthority: "PARTICIPANT",
    requireSignature: false,
    requireQuorum: false,
    auditLevel: "INFO",
  },
};

const LOCKDOWN_EXEMPT_PATHS = [
  "/admin/login",
  "/api/auth",
  "/api/admin/auth/send-link",
  "/api/admin/auth/verify",
  "/api/admin/auth/callback",
  "/api/admin/auth/reset-rate-limit",
  "/api/system/lock-status",
  "/restricted",
  "/inner-circle/insufficient-clearance",
  "/api/health",
  "/api/purpose-alignment",
  "/api/purpose-alignment/assessments",
  "/api/purpose-alignment/report",
];

function guardedPdfDownloadResponse(req: NextRequest, pathname: string): NextResponse | null {
  const match = pathname.match(/^\/assets\/downloads\/([^/]+)\.pdf$/i);
  if (!match) return null;

  const slug = match[1] || "";
  const url = req.nextUrl.clone();
  url.pathname = `/api/downloads/${slug}`;
  url.search = "";
  return NextResponse.redirect(url, 307);
}

const TRACKABLE_PATHS = [
  "/pdf-dashboard",
  "/admin/reporting",
  "/admin/campaigns",
  "/api/reports",
  "/api/constitutional",
  "/api/interventions",
  "/api/strategy-room",
];

const CONVERSION_PATHS = [
  "/api/interventions",
  "/api/constitutional/appeal",
  "/api/constitutional/override",
];

/* -------------------------------------------------------------------------- */
/* AUTH TIER CLASSIFICATION (merged from middleware.ts)                       */
/*                                                                            */
/* Option 3 Hybrid Identity + Entitlement:                                    */
/*   - NextAuth owns IDENTITY    (JWT in session cookie)                      */
/*   - AL token owns ENTITLEMENT (aol_access cookie)                          */
/*                                                                            */
/* Tier 0 — public (no auth)                                                  */
/* Tier 1 — NextAuth session required                                         */
/* Tier 2 — AL token required (NextAuth NOT required)                         */
/* Tier 3 — Admin only (token.isInternal === true)                            */
/*                                                                            */
/* This block is supplementary to proxy.ts's existing auth logic. It runs     */
/* at the end of the proxy() function, AFTER proxy.ts's existing checks have  */
/* had a chance to redirect or pass the request.                              */
/* -------------------------------------------------------------------------- */

const AUTH_PUBLIC_EXACT = new Set<string>([
  "/",
  "/favicon.ico",
  "/api/inner-circle/register",
  "/api/inner-circle/resend",
]);

const AUTH_PUBLIC_PREFIXES = [
  "/diagnostics",
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

const TIER3_PREFIXES = [
  "/inner-circle/admin",
  "/api/admin",
  "/directorate",
];

const TIER3_EXACT = new Set<string>([
]);

const TIER2_PREFIXES = [
  "/inner-circle",
  "/private",
  "/vault",
  "/board",
];

const TIER1_PREFIXES = [
  // /dashboard retired — redirects via getServerSideProps, no proxy gating needed
  // /diagnostics is PUBLIC — it is the product entry point, not a gated surface
  "/consulting",
  "/strategy",
];

function authTierMatchesPrefix(pathname: string, prefixes: string[]): boolean {
  for (const p of prefixes) {
    if (pathname === p || pathname.startsWith(p + "/")) return true;
  }
  return false;
}

/* --- Canonical Tier type (inlined for edge safety — no Prisma imports) --- */

type EdgeTier =
  | "public"
  | "member"
  | "inner_circle"
  | "client"
  | "architect"
  | "owner";

const EDGE_TIER_ORDER: Record<EdgeTier, number> = {
  public: 0,
  member: 1,
  inner_circle: 2,
  client: 3,
  architect: 4,
  owner: 5,
};

function edgeHasAccess(subjectTier: EdgeTier, requiredTier: EdgeTier): boolean {
  return (EDGE_TIER_ORDER[subjectTier] ?? 0) >= (EDGE_TIER_ORDER[requiredTier] ?? 999);
}

function edgeNormalizeTier(input: unknown): EdgeTier {
  if (!input || typeof input !== "string") return "public";
  const key = input.trim().toLowerCase().replace(/-/g, "_");
  if (key in EDGE_TIER_ORDER) return key as EdgeTier;
  const ALIASES: Record<string, EdgeTier> = {
    free: "public", anonymous: "public", guest: "public", viewer: "public",
    registered: "member", basic: "member", patron: "member",
    innercircle: "inner_circle", premium: "inner_circle", ic: "inner_circle",
    consulting: "client", enterprise: "client", restricted: "client",
    founder: "architect", legacy: "architect", editor: "architect", admin: "architect", superadmin: "architect",
    sovereign: "owner", top_secret: "owner", operator: "owner", system: "owner",
  };
  return ALIASES[key] ?? "public";
}

type EdgeResolvedIdentity = {
  authenticated: boolean;
  tier: EdgeTier;
  isInternal: boolean;
};

function resolveIdentityEdge(
  nextAuthToken: Record<string, unknown> | null,
  hasAccessCookie: boolean,
): EdgeResolvedIdentity {
  if (nextAuthToken) {
    const aol = (nextAuthToken as any).aol || {};
    return {
      authenticated: true,
      tier: edgeNormalizeTier(aol.tier || nextAuthToken.tier || nextAuthToken.role),
      isInternal: Boolean(aol.isInternal),
    };
  }
  if (hasAccessCookie) {
    return {
      authenticated: true,
      tier: "inner_circle",
      isInternal: false,
    };
  }
  return { authenticated: false, tier: "public", isInternal: false };
}

/* --- Route-to-tier classification functions --- */

function authTierIsPublicRoute(pathname: string): boolean {
  if (AUTH_PUBLIC_EXACT.has(pathname)) return true;
  if (pathname === "/inner-circle") return true;
  if (pathname === "/inner-circle/unlock") return true;
  if (pathname === "/inner-circle/login") return true;
  return authTierMatchesPrefix(pathname, AUTH_PUBLIC_PREFIXES);
}

function authTierIsTier3(pathname: string): EdgeTier | false {
  if (TIER3_EXACT.has(pathname)) return "architect";
  if (authTierMatchesPrefix(pathname, TIER3_PREFIXES)) return "architect";
  return false;
}

function authTierIsTier2(pathname: string): EdgeTier | false {
  if (authTierMatchesPrefix(pathname, TIER2_PREFIXES)) return "inner_circle";
  return false;
}

function authTierIsTier1(pathname: string): EdgeTier | false {
  if (authTierMatchesPrefix(pathname, TIER1_PREFIXES)) return "member";
  return false;
}

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
  limit: number;
};

type AuditEntry = {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  path: string;
  method: string;
  ip: string;
  userAgent: string;
  authorityLevel: string;
  success: boolean;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

/* -------------------------------------------------------------------------- */
/* IN-MEMORY STORES                                                           */
/* -------------------------------------------------------------------------- */

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const participantCountCache = new Map<
  string,
  { count: number; timestamp: number }
>();
const thresholdCache = new Map<string, { threshold: number; timestamp: number }>();
const auditBuffer: AuditEntry[] = [];

let lockCache: { isLocked: boolean; timestamp: number } | null = null;

/* -------------------------------------------------------------------------- */
/* UTILITIES                                                                  */
/* -------------------------------------------------------------------------- */

function now(): number {
  return Date.now();
}

function cleanupExpiredEntries(): void {
  const t = now();

  for (const [key, value] of rateLimitStore.entries()) {
    if (t >= value.resetAt) rateLimitStore.delete(key);
  }

  for (const [key, value] of participantCountCache.entries()) {
    if (t - value.timestamp > 300_000) participantCountCache.delete(key);
  }

  for (const [key, value] of thresholdCache.entries()) {
    if (t - value.timestamp > 300_000) thresholdCache.delete(key);
  }

  if (lockCache && t - lockCache.timestamp > 15_000) {
    lockCache = null;
  }
}

function makeRequestId(req: NextRequest): string {
  return (
    req.headers.get("x-request-id") ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff
      .split(",")
      .map((v) => v.trim())
      .find(Boolean);
    if (first && first !== "::1" && !first.startsWith("::ffff:127.0.0.1")) {
      return first;
    }
  }

  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "0.0.0.0"
  );
}

function getRateLimitConfig(pathname: string): { limit: number; windowMs: number } {
  if (pathname.includes("/constitutional/")) {
    return RATE_LIMIT_CONFIGS.CONSTITUTIONAL;
  }
  if (pathname.includes("/admin/")) {
    return RATE_LIMIT_CONFIGS.ADMIN;
  }
  if (pathname.includes("/api/sovereign/") || pathname.includes("/sovereign/")) {
    return RATE_LIMIT_CONFIGS.SOVEREIGN;
  }
  if (pathname.includes("/auth/")) {
    return RATE_LIMIT_CONFIGS.AUTH;
  }
  return RATE_LIMIT_CONFIGS.API_GENERAL;
}

async function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  cleanupExpiredEntries();

  const t = now();
  const windowKey = `${key}:${Math.floor(t / options.windowMs)}`;
  const current = rateLimitStore.get(windowKey);

  if (!current || t >= current.resetAt) {
    const resetAt = t + options.windowMs;
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
      retryAfterMs: current.resetAt - t,
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
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(typeof result.retryAfterMs === "number" && result.retryAfterMs > 0
      ? { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) }
      : {}),
  };
}

async function sendAuditBatch(batch: AuditEntry[]): Promise<void> {
  try {
    await fetch(
      `${process.env.AUDIT_SERVICE_URL || "http://localhost:3003"}/api/audit/batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": process.env.INTERNAL_API_KEY || "",
        },
        body: JSON.stringify(batch),
      }
    ).catch(() => undefined);
  } catch {
    // deliberately silent
  }
}

async function auditLog(entry: AuditEntry): Promise<void> {
  auditBuffer.push(entry);

  if (process.env.NODE_ENV !== "production") {
    console.log("[AUDIT]", JSON.stringify(entry, null, 2));
    return;
  }

  if (auditBuffer.length >= 25) {
    const batch = auditBuffer.splice(0, auditBuffer.length);
    await sendAuditBatch(batch);
  }
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
      "Cache-Control": "no-store, private",
      ...(extraHeaders || {}),
    },
  });
}

function safeReturnTo(req: NextRequest): string {
  const { pathname, search } = req.nextUrl;
  const returnTo = `${pathname}${search}`;

  if (returnTo.startsWith("//") || returnTo.includes("://")) {
    return encodeURIComponent("/");
  }

  return encodeURIComponent(returnTo);
}

function setSecurityHeaders(response: NextResponse, req: NextRequest): void {
  response.headers.set("X-Request-ID", makeRequestId(req));
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://*.neon.tech https://api.stripe.com https://*.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
    );
  }
}

function isAllowedIp(ip: string): boolean {
  if (process.env.NODE_ENV === "development") return true;

  const allowedIps = (process.env.ADMIN_ALLOWED_IPS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (allowedIps.length === 0) return true;
  if (ip === "127.0.0.1" || ip === "::1") return true;

  return allowedIps.includes(ip);
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/vault") ||
    pathname.startsWith("/api/admin")
  );
}

export function isProxyAdminRole(role: unknown): boolean {
  const normalizedRole = String(role ?? "guest").toLowerCase();
  const hierarchyRole =
    normalizedRole === "owner" || normalizedRole === "root"
      ? "founder"
      : normalizedRole;
  const rank = ROLE_HIERARCHY[hierarchyRole as keyof typeof ROLE_HIERARCHY] ?? 0;

  return rank >= (ROLE_HIERARCHY.admin ?? 100);
}

function needsInstitutionalSession(pathname: string): boolean {
  return (
    pathname.startsWith("/inner-circle") ||
    pathname.startsWith("/api/premium") ||
    pathname.startsWith("/api/dl/")
  );
}

function getConstitutionalConfig(
  pathname: string,
  method: string
): (typeof CONSTITUTIONAL_PROTECTED_PATHS)[string] | null {
  for (const [pattern, config] of Object.entries(CONSTITUTIONAL_PROTECTED_PATHS)) {
    if (pathname.startsWith(pattern)) {
      if (config.readOnly && method === "GET") {
        return {
          ...config,
          requireSignature: false,
          minAuthority: "PARTICIPANT",
        };
      }
      return config;
    }
  }

  return null;
}

function isConstitutionalPath(pathname: string): boolean {
  return getConstitutionalConfig(pathname, "GET") !== null;
}

function extractCampaignId(req: NextRequest): string | undefined {
  const pathname = req.nextUrl.pathname;

  const campaignMatch = pathname.match(/\/campaigns\/([^/]+)/);
  if (campaignMatch?.[1]) return campaignMatch[1];

  const adminMatch = pathname.match(/\/admin\/campaigns\/([^/]+)/);
  if (adminMatch?.[1]) return adminMatch[1];

  const reportMatch = pathname.match(/\/api\/reports\/([^/]+)/);
  if (reportMatch?.[1]) return reportMatch[1];

  return req.nextUrl.searchParams.get("campaignId") || undefined;
}

/* -------------------------------------------------------------------------- */
/* EDGE CRYPTO HELPERS                                                        */
/* -------------------------------------------------------------------------- */

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function timingSafeHexEqual(a: string, b: string): Promise<boolean> {
  if (!a || !b || a.length !== b.length) return false;

  const ah = await sha256Hex(a);
  const bh = await sha256Hex(b);

  return ah === bh;
}

/* -------------------------------------------------------------------------- */
/* CANONICAL SNAPSHOT EXTRACTION                                              */
/* -------------------------------------------------------------------------- */

async function extractCanonicalSnapshot(
  req: NextRequest
): Promise<CanonicalSectionsEnvelope | null> {
  const method = req.method;

  const headerSnapshot = req.headers.get("X-Canonical-Snapshot");
  if (headerSnapshot) {
    try {
      const parsed = JSON.parse(headerSnapshot);
      return coerceCanonicalSectionsEnvelope(parsed);
    } catch {
      // ignore
    }
  }

  const querySnapshot = req.nextUrl.searchParams.get("canonical");
  if (querySnapshot) {
    try {
      const parsed = JSON.parse(decodeURIComponent(querySnapshot));
      return coerceCanonicalSectionsEnvelope(parsed);
    } catch {
      // ignore
    }
  }

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    try {
      const clonedReq = req.clone();
      const body = await clonedReq.json();

      if (body?.canonicalSnapshot) {
        return coerceCanonicalSectionsEnvelope(body.canonicalSnapshot);
      }

      if (body?.canonical) {
        return coerceCanonicalSectionsEnvelope(body.canonical);
      }

      if (body?.sections) {
        return coerceCanonicalSectionsEnvelope({ sections: body.sections });
      }
    } catch {
      // ignore
    }
  }

  const sessionId = req.cookies.get("constitutional_session_id")?.value;
  if (sessionId) {
    try {
      const session = await sessionTracker.getSession(sessionId);
      if (session?.initialCanonicalSnapshot) {
        return session.initialCanonicalSnapshot;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* SESSION TRACKING                                                           */
/* -------------------------------------------------------------------------- */

async function trackSessionEvent(
  req: NextRequest,
  userId: string,
  campaignId: string | undefined,
  canonicalSnapshot: CanonicalSectionsEnvelope | null,
  sessionId?: string
): Promise<string | undefined> {
  const pathname = req.nextUrl.pathname;
  const method = req.method;
  const shouldTrack = TRACKABLE_PATHS.some((path) => pathname.startsWith(path));

  if (!shouldTrack) return sessionId;

  let currentSessionId = sessionId;
  const isConversion =
    CONVERSION_PATHS.some((path) => pathname.startsWith(path)) && method === "POST";

  if (currentSessionId && canonicalSnapshot) {
    try {
      if (isConversion) {
        await sessionTracker.recordConversion(
          currentSessionId,
          campaignId || "unknown",
          userId,
          "CONVERSION",
          canonicalSnapshot,
          null,
          { url: pathname, method, isConversion: true }
        );
      } else {
        await sessionTracker.recordEvent(
          currentSessionId,
          campaignId || "unknown",
          userId,
          "IMPRESSION",
          canonicalSnapshot,
          null,
          { url: pathname, method }
        );
      }
    } catch (error) {
      console.error("[Proxy] Session tracking error:", error);
    }
  }

  if (!currentSessionId && userId && campaignId && canonicalSnapshot) {
    try {
      const session = await sessionTracker.initSession(
        campaignId,
        userId,
        canonicalSnapshot,
        {
          userAgent: req.headers.get("user-agent") || undefined,
          ip: getClientIp(req),
          source: "proxy",
          url: pathname,
        }
      );

      currentSessionId = session.id;
    } catch (error) {
      console.error("[Proxy] Session init error:", error);
    }
  }

  return currentSessionId;
}

/* -------------------------------------------------------------------------- */
/* CONSTITUTIONAL AUTHORITY                                                   */
/* -------------------------------------------------------------------------- */

async function getSovereignAuthority(
  req: NextRequest
): Promise<ConstitutionalAuthority | null> {
  const primaryCookie = req.cookies.get("ogr_sovereign_session")?.value;
  const sessionSecret = String(process.env.OGR_SESSION_SECRET || "").trim();

  // Primary cookie:
  // payload.mac where mac = HMAC(payload, secret)
  if (primaryCookie && sessionSecret) {
    try {
      const idx = primaryCookie.lastIndexOf(".");
      if (idx > 0) {
        const payload = primaryCookie.slice(0, idx);
        const providedMac = primaryCookie.slice(idx + 1);
        const expectedMac = await hmacSha256Hex(sessionSecret, payload);

        if (await timingSafeHexEqual(providedMac, expectedMac)) {
          return {
            userId: "sovereign-user",
            campaignId: "system",
            authorityLevel: "SOVEREIGN",
            grantedAt: new Date().toISOString(),
            grantedBy: "system",
            signature: providedMac,
            scope: ["*"],
          };
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

async function isSovereignAuthenticated(
  req: NextRequest
): Promise<{ authenticated: boolean; authority?: ConstitutionalAuthority }> {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.BYPASS_SOVEREIGN === "true"
  ) {
    return {
      authenticated: true,
      authority: {
        userId: "dev-user",
        campaignId: "dev-campaign",
        authorityLevel: "SOVEREIGN",
        grantedAt: new Date().toISOString(),
        grantedBy: "system",
        signature: "dev-signature",
        scope: ["*"],
      } as ConstitutionalAuthority,
    };
  }

  const authority = await getSovereignAuthority(req);
  if (authority) {
    if (authority.expiresAt && new Date(authority.expiresAt) < new Date()) {
      return { authenticated: false };
    }
    return { authenticated: true, authority };
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const validToken = process.env.SOVEREIGN_ACCESS_TOKEN;

    if (validToken && token === validToken) {
      return {
        authenticated: true,
        authority: {
          userId: "api-client",
          campaignId: "system",
          authorityLevel: "AUTHORITY",
          grantedAt: new Date().toISOString(),
          grantedBy: "system",
          signature: "api-token",
          scope: ["*"],
        },
      };
    }
  }

  return { authenticated: false };
}

async function validateConstitutionalAuthority(
  authority: ConstitutionalAuthority,
  config: { minAuthority: string; requireSignature: boolean; requireQuorum: boolean },
  req: NextRequest,
  campaignId?: string
): Promise<{ valid: boolean; reason?: string; requiredLevel?: string }> {
  const authorityLevels: Record<string, number> = {
    OBSERVER: 0,
    PARTICIPANT: 1,
    DELEGATE: 2,
    AUTHORITY: 3,
    SOVEREIGN: 4,
  };

  const requiredLevel = authorityLevels[config.minAuthority];
  const currentLevel = authorityLevels[authority.authorityLevel];

  if (currentLevel < requiredLevel) {
    return {
      valid: false,
      reason: `Insufficient authority: ${authority.authorityLevel} < ${config.minAuthority}`,
      requiredLevel: config.minAuthority,
    };
  }

  if (authority.scope && authority.scope.length > 0 && !authority.scope.includes("*")) {
    const pathMatchesScope = authority.scope.some((scope) =>
      req.nextUrl.pathname.startsWith(scope)
    );

    if (!pathMatchesScope) {
      return { valid: false, reason: "Action outside authorized scope" };
    }
  }

  if (
    config.requireSignature &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
  ) {
    const signature = req.headers.get("X-Constitutional-Signature");
    if (!signature) {
      return { valid: false, reason: "Constitutional signature required" };
    }

    const [userId, hash, timestamp] = signature.split(":");
    if (!userId || !hash || !timestamp) {
      return { valid: false, reason: "Invalid signature format" };
    }

    const signatureTime = Number.parseInt(timestamp, 10);
    if (!Number.isFinite(signatureTime) || Date.now() - signatureTime > 300_000) {
      return { valid: false, reason: "Signature expired" };
    }

    if (userId !== authority.userId) {
      return { valid: false, reason: "Signature user mismatch" };
    }
  }

  if (config.requireQuorum && campaignId) {
    const participantCount = await getParticipantCount(campaignId, req);
    const threshold = await getThreshold(campaignId, req);
    const quorumValidation = validateThreshold(participantCount, threshold);

    if (!quorumValidation.valid) {
      return { valid: false, reason: quorumValidation.reason };
    }
  }

  return { valid: true };
}

/* -------------------------------------------------------------------------- */
/* DATABASE / INTERNAL API HELPERS                                            */
/* -------------------------------------------------------------------------- */

async function getParticipantCount(
  campaignId: string,
  req: NextRequest
): Promise<number> {
  const cached = participantCountCache.get(campaignId);
  if (cached && Date.now() - cached.timestamp < 300_000) {
    return cached.count;
  }

  try {
    const origin = req.nextUrl.origin;
    const response = await fetch(
      `${origin}/api/campaigns/${campaignId}/participant-count`,
      {
        headers: {
          "X-Internal-Key": process.env.INTERNAL_API_KEY || "",
        },
        cache: "no-store",
      }
    );

    if (response.ok) {
      const data = (await response.json()) as { count?: number };
      const count = Number(data.count || 0);
      participantCountCache.set(campaignId, { count, timestamp: Date.now() });
      return count;
    }
  } catch {
    // ignore
  }

  return 0;
}

async function getThreshold(
  campaignId: string,
  req: NextRequest
): Promise<number> {
  const cached = thresholdCache.get(campaignId);
  if (cached && Date.now() - cached.timestamp < 300_000) {
    return cached.threshold;
  }

  try {
    const origin = req.nextUrl.origin;
    const response = await fetch(`${origin}/api/campaigns/${campaignId}/threshold`, {
      headers: {
        "X-Internal-Key": process.env.INTERNAL_API_KEY || "",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = (await response.json()) as { threshold?: number };
      const threshold = Number(data.threshold || 5);
      thresholdCache.set(campaignId, {
        threshold,
        timestamp: Date.now(),
      });
      return threshold;
    }
  } catch {
    // ignore
  }

  return 5;
}

async function checkGlobalLock(req: NextRequest): Promise<boolean> {
  if (lockCache && Date.now() - lockCache.timestamp < 15_000) {
    return lockCache.isLocked;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${req.nextUrl.origin}/api/system/lock-status`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "X-Internal-Request": "true" },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return false;

    const data = (await res.json()) as { isLocked?: boolean };
    const isLocked = Boolean(data?.isLocked);
    lockCache = { isLocked, timestamp: Date.now() };
    return isLocked;
  } catch {
    lockCache = { isLocked: false, timestamp: Date.now() };
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* MAIN PROXY HANDLER                                                         */
/* -------------------------------------------------------------------------- */

export async function proxy(req: NextRequest) {
  cleanupExpiredEntries();

  const startTime = Date.now();
  const pathname = req.nextUrl.pathname;
  const method = req.method;

  const guardedPdf = guardedPdfDownloadResponse(req, pathname);
  if (guardedPdf) {
    setSecurityHeaders(guardedPdf, req);
    guardedPdf.headers.set("X-PDF-Access", "download-surface-required");
    return guardedPdf;
  }

  const isApi = pathname.startsWith("/api/");
  const isAdmin = isAdminPath(pathname);
  const requiresInstitutionalSession = needsInstitutionalSession(pathname);
  const isConstitutional = isConstitutionalPath(pathname);
  const constitutionalConfig = getConstitutionalConfig(pathname, method);

  const clientIp = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  /* DEVELOPMENT BYPASS */
  if (
    process.env.NODE_ENV === "development" &&
    process.env.BYPASS_SOVEREIGN === "true"
  ) {
    const response = NextResponse.next();
    response.headers.set("X-Development-Bypass", "true");
    setSecurityHeaders(response, req);
    return response;
  }

  /* INTERNAL BYPASS — development only */
  const masterKey = process.env.INTERNAL_BYPASS_KEY;
  if (
    process.env.NODE_ENV === "development" &&
    masterKey &&
    req.headers.get("X-Directorate-Bypass") === masterKey
  ) {
    const response = NextResponse.next();
    response.headers.set("X-Directorate-Bypass-Active", "true");
    setSecurityHeaders(response, req);
    return response;
  }

  /* INSTITUTIONAL ACTION EXEMPTION — REMOVED (Phase 0 security fix).
   * This header was spoofable by any HTTP client, granting a full auth
   * bypass to anyone who set X-Institutional-Action: true. Banned per
   * auth-migration/05-ban-list.md §2. */

  /* CANONICAL REDIRECT */
  if (
    process.env.NODE_ENV === "production" &&
    CANONICAL_HOST &&
    req.nextUrl.hostname !== CANONICAL_HOST &&
    req.nextUrl.hostname !== "localhost" &&
    !req.nextUrl.hostname.includes("vercel.app")
  ) {
    const url = req.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  /* GLOBAL LOCKDOWN */
  const isLockdownExempt = LOCKDOWN_EXEMPT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isLockdownExempt && !isPublicPath(pathname)) {
    const isLocked = await checkGlobalLock(req);

    if (isLocked) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!isProxyAdminRole((token as any)?.role)) {
        if (isApi) {
          return jsonResponse(
            { error: "SYSTEM_LOCKED", message: "Emergency maintenance" },
            503,
            { "Retry-After": "300" }
          );
        }

        return NextResponse.redirect(
          new URL("/restricted?reason=maintenance", req.url)
        );
      }
    }
  }

  /* PUBLIC PATHS */
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    setSecurityHeaders(response, req);
    return response;
  }

  /* RATE LIMITING */
  const rateConfig = getRateLimitConfig(pathname);
  const rl = await rateLimit(`${clientIp}:${pathname}`, rateConfig);

  if (!rl.allowed) {
    return jsonResponse(
      { error: "RATE_LIMIT_EXCEEDED", retryAfter: rl.retryAfterMs },
      429,
      createRateLimitHeaders(rl)
    );
  }

  /* CONSTITUTIONAL AUTHORITY ENFORCEMENT & SESSION TRACKING */
  let constitutionalAuthority: ConstitutionalAuthority | null = null;
  let sessionId: string | undefined =
    req.cookies.get("constitutional_session_id")?.value;
  let canonicalSnapshot: CanonicalSectionsEnvelope | null = null;

  if (isConstitutional && constitutionalConfig) {
    const { authenticated, authority } = await isSovereignAuthenticated(req);

    if (!authenticated || !authority) {
      await auditLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userId: "anonymous",
        action: "CONSTITUTIONAL_ACCESS_DENIED",
        path: pathname,
        method,
        ip: clientIp,
        userAgent,
        authorityLevel: "NONE",
        success: false,
        metadata: { reason: "Not authenticated" },
      });

      if (isApi) {
        return jsonResponse(
          { error: "CONSTITUTIONAL_ACCESS_REQUIRED" },
          401,
          { "WWW-Authenticate": 'Bearer realm="Constitutional Access"' }
        );
      }

      const url = new URL("/restricted", req.url);
      url.searchParams.set("returnTo", safeReturnTo(req));
      return NextResponse.redirect(url, 307);
    }

    constitutionalAuthority = authority;
    canonicalSnapshot = await extractCanonicalSnapshot(req);
    const campaignId = extractCampaignId(req);

    const validation = await validateConstitutionalAuthority(
      constitutionalAuthority,
      constitutionalConfig,
      req,
      campaignId
    );

    if (!validation.valid) {
      await auditLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userId: constitutionalAuthority.userId,
        action: "CONSTITUTIONAL_AUTHORITY_DENIED",
        path: pathname,
        method,
        ip: clientIp,
        userAgent,
        authorityLevel: constitutionalAuthority.authorityLevel,
        success: false,
        metadata: {
          reason: validation.reason,
          required: validation.requiredLevel,
        },
      });

      if (isApi) {
        return jsonResponse(
          {
            error: validation.reason,
            requiredLevel: validation.requiredLevel,
          },
          403
        );
      }

      return NextResponse.redirect(new URL("/auth/access-denied", req.url));
    }

    sessionId = await trackSessionEvent(
      req,
      constitutionalAuthority.userId,
      campaignId,
      canonicalSnapshot,
      sessionId
    );
  }

  /* IP RESTRICTION */
  if (isAdmin && !isAllowedIp(clientIp)) {
    return isApi
      ? jsonResponse({ error: "ACCESS_DENIED" }, 403)
      : NextResponse.redirect(new URL("/auth/access-denied", req.url));
  }

  /* SESSION & ROLE VALIDATION */
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const hasInstitutionalCookie = Boolean(readAccessCookie(req));
    const hasInstitutionalSession = Boolean(token) || hasInstitutionalCookie;

    if (isAdmin && !pathname.includes("/login")) {
      if (!token) {
        const url = new URL("/admin/login", req.url);
        url.searchParams.set("returnTo", safeReturnTo(req));
        return NextResponse.redirect(url, 307);
      }

      if (!isProxyAdminRole((token as any)?.role)) {
        return isApi
          ? jsonResponse({ error: "CLEARANCE_REQUIRED" }, 403)
          : NextResponse.redirect(new URL("/auth/access-denied", req.url));
      }
    }

    if (
      requiresInstitutionalSession &&
      !hasInstitutionalSession &&
      !pathname.includes("/login")
    ) {
      const url = new URL("/inner-circle/login", req.url);
      url.searchParams.set("returnTo", safeReturnTo(req));
      return NextResponse.redirect(url, 307);
    }
  } catch (error) {
    console.error("[Proxy] Auth error:", error);
  }

  /* SUCCESSFUL ACCESS AUDIT */
  if (constitutionalAuthority && constitutionalConfig) {
    await auditLog({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: constitutionalAuthority.userId,
      action: "CONSTITUTIONAL_ACCESS",
      path: pathname,
      method,
      ip: clientIp,
      userAgent,
      authorityLevel: constitutionalAuthority.authorityLevel,
      success: true,
      durationMs: Date.now() - startTime,
      metadata: {
        config: constitutionalConfig,
      },
    });
  }

  /* AUTH TIER ENFORCEMENT (unified via resolveIdentityEdge)                  */
  /*                                                                          */
  /* Supplementary tier check. Runs AFTER all existing proxy.ts auth logic.   */
  /* Uses the edge-safe identity resolver (inlined above) to determine the    */
  /* caller's tier, then checks against the route's required tier.            */
  {
    const tierPathname = req.nextUrl.pathname;

    if (!authTierIsPublicRoute(tierPathname)) {
      const tierIsApi = tierPathname.startsWith("/api/");

      // Determine required tier for this route
      const requiredTier: EdgeTier | false =
        authTierIsTier3(tierPathname) ||
        authTierIsTier2(tierPathname) ||
        authTierIsTier1(tierPathname);

      if (requiredTier) {
        // Resolve identity at the edge (JWT claims + cookie presence only)
        const edgeToken = await getToken({
          req,
          secret: process.env.NEXTAUTH_SECRET,
        });
        const hasAccessCookie = Boolean(req.cookies.get("aol_access"));
        const edgeIdentity = resolveIdentityEdge(
          edgeToken as Record<string, unknown> | null,
          hasAccessCookie,
        );

        if (!edgeHasAccess(edgeIdentity.tier, requiredTier)) {
          // Not authenticated at all
          if (!edgeIdentity.authenticated) {
            if (tierIsApi) {
              return jsonResponse(
                { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" },
                401,
              );
            }
            // Redirect based on what tier is required
            if (requiredTier === "architect" || requiredTier === "owner") {
              const url = new URL("/admin/login", req.url);
              url.searchParams.set("returnTo", safeReturnTo(req));
              return NextResponse.redirect(url, 307);
            }
            if (requiredTier === "inner_circle" || requiredTier === "client") {
              const url = req.nextUrl.clone();
              url.pathname = "/inner-circle";
              url.searchParams.set("returnTo", tierPathname);
              return NextResponse.redirect(url);
            }
            // member tier — redirect to sign-in
            const url = req.nextUrl.clone();
            url.pathname = "/api/auth/signin";
            url.searchParams.set("callbackUrl", tierPathname);
            return NextResponse.redirect(url);
          }

          // Authenticated but insufficient tier
          if (tierIsApi) {
            return jsonResponse(
              { ok: false, error: "Insufficient clearance", code: "CLEARANCE_REQUIRED" },
              403,
            );
          }
          return NextResponse.redirect(new URL("/auth/access-denied", req.url));
        }
      }
    }
  }

  /* FINAL RESPONSE */
  const response = NextResponse.next();
  setSecurityHeaders(response, req);

  for (const [key, value] of Object.entries(createRateLimitHeaders(rl))) {
    response.headers.set(key, value);
  }

  if (isAdmin || pathname.startsWith("/inner-circle") || isConstitutional) {
    response.headers.set("Cache-Control", "no-store, private, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  if (constitutionalConfig) {
    response.headers.set("X-Constitutional-Protected", "true");
    response.headers.set(
      "X-Constitutional-Authority",
      constitutionalAuthority?.authorityLevel || "NONE"
    );
  }

  if (sessionId) {
    response.cookies.set("constitutional_session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
