// middleware.ts - PRODUCTION READY
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ==================== TYPE DEFINITIONS ====================
type AuthContext = {
  isAuthenticated: boolean;
  userId?: string;
  userRole?: string;
  isAdmin: boolean;
  isInnerCircle: boolean;
  permissions: {
    canViewPDFs: boolean;
    canDownloadContent: boolean;
    canAccessBoard: boolean;
    canManageUsers: boolean;
    canAccessInnerCircle: boolean;
  };
};

type RouteSecurityConfig = {
  mode: "public" | "strict" | "hybrid";
  type: string;
  cache: string;
  rateLimit?: { limit: number; windowMs: number };
  requires?: "admin" | "inner-circle" | "authenticated";
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
};

// ==================== CONFIGURATION ====================
const PRODUCTION = process.env.NODE_ENV === "production";
const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL || "https://abrahamoflondon.com",
  process.env.SITE_URL || "https://abrahamoflondon.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

// Safe routes that bypass all security checks
const SAFE_EXACT = [
  "/",
  "/health",
  "/ping",
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/manifest.json",
  "/font-manifest.json",
  "/api/health",
  "/api/ping",
];

const SAFE_PREFIXES = [
  "/_next/",
  "/icons/",
  "/fonts/",
  "/images/",
  "/assets/",
  "/public/",
  "/api/public/",
];

// Rate limit configurations
const RATE_LIMIT_CONFIGS = {
  API_GENERAL: { limit: 100, windowMs: 60000, keyPrefix: "api" },
  API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
  AUTH: { limit: 10, windowMs: 300000, keyPrefix: "auth" },
  CONTENT: { limit: 60, windowMs: 60000, keyPrefix: "content" },
  FONT: { limit: 50, windowMs: 60000, keyPrefix: "font" },
  ADMIN: { limit: 30, windowMs: 60000, keyPrefix: "admin" },
};

// Route security configuration
const ROUTE_SECURITY_CONFIG: Record<string, RouteSecurityConfig> = {
  // Admin routes - strict authentication required
  "/admin": {
    mode: "strict",
    type: "admin",
    cache: "private, no-store, max-age=0",
    rateLimit: { limit: 30, windowMs: 60000 },
    requires: "admin",
  },

  // Board routes - admin access only
  "/board": {
    mode: "strict",
    type: "board",
    cache: "private, max-age=3600",
    rateLimit: { limit: 30, windowMs: 60000 },
    requires: "admin",
  },

  // Inner Circle routes - premium access
  "/inner-circle": {
    mode: "strict",
    type: "inner-circle",
    cache: "private, max-age=3600",
    rateLimit: { limit: 10, windowMs: 300000 },
    requires: "inner-circle",
  },

  // PDF/document routes
  "/pdfs": {
    mode: "hybrid",
    type: "pdf",
    cache: "private, max-age=7200",
    rateLimit: { limit: 60, windowMs: 60000 },
    requires: "authenticated",
  },

  "/download": {
    mode: "strict",
    type: "download",
    cache: "private, no-store",
    rateLimit: { limit: 20, windowMs: 60000 },
    requires: "authenticated",
  },

  // Content routes - public with caching
  "/strategies": {
    mode: "public",
    type: "strategy",
    cache: "public, max-age=7200, stale-while-revalidate=86400",
    rateLimit: { limit: 60, windowMs: 60000 },
  },

  "/canons": {
    mode: "public",
    type: "canon",
    cache: "public, max-age=7200, stale-while-revalidate=86400",
    rateLimit: { limit: 60, windowMs: 60000 },
  },

  // API routes
  "/api/admin": {
    mode: "strict",
    type: "admin-api",
    cache: "private, no-store",
    rateLimit: { limit: 30, windowMs: 60000 },
    requires: "admin",
  },

  "/api/inner-circle": {
    mode: "strict",
    type: "inner-circle-api",
    cache: "private, no-store",
    rateLimit: { limit: 10, windowMs: 300000 },
    requires: "inner-circle",
  },

  "/api/auth": {
    mode: "strict",
    type: "auth-api",
    cache: "private, no-store",
    rateLimit: { limit: 10, windowMs: 300000 },
    requires: "authenticated",
  },

  // Auth routes
  "/login": {
    mode: "public",
    type: "auth",
    cache: "private, no-store, max-age=0",
    rateLimit: { limit: 10, windowMs: 300000 },
  },
};

// ==================== HELPER FUNCTIONS ====================
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isBotUserAgent(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /php/i,
    /ruby/i,
    /perl/i,
    /node/i,
    /go/i,
    /apache-httpclient/i,
    /libwww/i,
    /httpclient/i,
  ];

  const browserPatterns = [
    /mozilla/i,
    /chrome/i,
    /safari/i,
    /firefox/i,
    /edge/i,
    /opera/i,
    /msie/i,
    /trident/i,
  ];

  const isBot = botPatterns.some((pattern) => pattern.test(userAgent));
  const isBrowser = browserPatterns.some((pattern) => pattern.test(userAgent));

  return isBot && !isBrowser;
}

// ==================== AUTHENTICATION ====================
async function getAuthContext(req: NextRequest): Promise<AuthContext> {
  const adminSession = req.cookies.get("admin_session")?.value;
  const innerCircleToken = req.cookies.get("innerCircleToken")?.value;

  // Default context for unauthenticated users
  const defaultContext: AuthContext = {
    isAuthenticated: false,
    isAdmin: false,
    isInnerCircle: false,
    permissions: {
      canViewPDFs: false,
      canDownloadContent: false,
      canAccessBoard: false,
      canManageUsers: false,
      canAccessInnerCircle: false,
    },
  };

  try {
    let adminUser = null;
    let innerCircleAccess = false;

    // Check admin session
    if (adminSession) {
      try {
        // Dynamic import to avoid build-time issues
        const { verifyAdminSession } = await import(
          "@/lib/server/auth/admin-utils"
        );
        adminUser = await verifyAdminSession(adminSession);
      } catch (error) {
        console.warn("[Middleware] Admin session verification failed:", error);
      }
    }

    // Check inner circle access
    if (innerCircleToken) {
      try {
        const { validateInnerCircleToken } = await import(
          "@/lib/inner-circle/jwt"
        );
        const result = await validateInnerCircleToken(innerCircleToken);
        innerCircleAccess = result.isValid;
      } catch (error) {
        console.warn(
          "[Middleware] Inner circle token validation failed:",
          error
        );
      }
    }

    const isAdmin = !!adminUser;
    const isInnerCircle = innerCircleAccess;

    return {
      isAuthenticated: isAdmin || isInnerCircle,
      userId: adminUser?.id,
      userRole: adminUser?.role || (isInnerCircle ? "inner-circle" : "guest"),
      isAdmin,
      isInnerCircle,
      permissions: {
        canViewPDFs: isAdmin || isInnerCircle,
        canDownloadContent: isAdmin || isInnerCircle,
        canAccessBoard: isAdmin,
        canManageUsers: isAdmin && adminUser?.role === "superadmin",
        canAccessInnerCircle: isInnerCircle || isAdmin,
      },
    };
  } catch (error) {
    console.error("[Middleware] Auth context error:", error);
    return defaultContext;
  }
}

// ==================== RATE LIMITING ====================
async function applyRouteRateLimit(
  req: NextRequest,
  pathname: string,
  authContext: AuthContext
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "";

  // Determine rate limit configuration
  let rateLimitConfig = RATE_LIMIT_CONFIGS.API_GENERAL;
  let routeKeyPrefix = "general";
  let key = ip;

  // Apply different limits based on route
  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      rateLimitConfig = config.rateLimit || rateLimitConfig;
      routeKeyPrefix = config.type;

      // Use user ID for authenticated users
      if (authContext.userId && config.mode === "strict") {
        key = `user:${authContext.userId}`;
      }
      break;
    }
  }

  // Special handling for fonts
  if (pathname.includes("/fonts/") || pathname.includes("/_next/static/media/")) {
    rateLimitConfig = RATE_LIMIT_CONFIGS.FONT;
    routeKeyPrefix = "font";
  }

  // More generous limits for authenticated users
  if (authContext.isAuthenticated) {
    rateLimitConfig = {
      ...rateLimitConfig,
      limit: Math.floor(rateLimitConfig.limit * 1.5),
    };
  }

  // Stricter limits for bots
  if (isBotUserAgent(userAgent)) {
    rateLimitConfig = {
      ...rateLimitConfig,
      limit: Math.floor(rateLimitConfig.limit * 0.5),
    };
  }

  try {
    // Try to use Redis-based rate limiting if available
    const { rateLimit } = await import("@/lib/server/rate-limit-unified");
    const result: RateLimitResult = await rateLimit(
      `${routeKeyPrefix}:${key}`,
      {
        maxRequests: rateLimitConfig.limit,
        windowMs: rateLimitConfig.windowMs,
        keyPrefix: rateLimitConfig.keyPrefix,
      }
    );

    const headers: Record<string, string> = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.resetTime.toString(),
    };

    if (!result.allowed) {
      headers["Retry-After"] = Math.ceil(
        (result.resetTime - Date.now()) / 1000
      ).toString();
    }

    return {
      allowed: result.allowed,
      headers,
    };
  } catch (error) {
    console.warn("[Middleware] Rate limiting failed, using fallback:", error);
    // Fallback: always allow if rate limiting fails
    return {
      allowed: true,
      headers: {},
    };
  }
}

// ==================== THREAT DETECTION ====================
function detectThreats(req: NextRequest): { isThreat: boolean; reason?: string } {
  const { pathname } = req.nextUrl;
  const userAgent = req.headers.get("user-agent") || "";
  const ip = getClientIp(req);

  // Block malicious patterns
  const maliciousPatterns = [
    /wp-admin/i,
    /\.php$/i,
    /\.env$/i,
    /\.git/i,
    /\.\.\//,
    /\.(exe|bat|sh|cmd|dmg|pkg)$/i,
    /(php|asp|jsp|perl|cgi)-/i,
    /config\./i,
    /backup\./i,
    /dump\./i,
    /\.(sql|bak|old|tar|gz|zip)$/i,
    /\/\.well-known\/(?!acme-challenge)/i,
  ];

  if (maliciousPatterns.some((pattern) => pattern.test(pathname))) {
    console.warn(`[Threat] Blocked malicious path: ${ip} -> ${pathname}`);
    return { isThreat: true, reason: "malicious_path" };
  }

  // Block suspicious user agents
  const suspiciousAgents = [
    "sqlmap",
    "nikto",
    "acunetix",
    "nessus",
    "metasploit",
    "dirbuster",
    "gobuster",
    "wpscan",
    "joomscan",
    "hydra",
    "slowhttptest",
    "ffuf",
    "wfuzz",
    "patator",
    "medusa",
  ];

  if (suspiciousAgents.some((agent) => userAgent.toLowerCase().includes(agent))) {
    console.warn(`[Threat] Blocked suspicious UA: ${ip} -> ${userAgent}`);
    return { isThreat: true, reason: "suspicious_agent" };
  }

  // Block excessive query parameters
  const queryParams = req.nextUrl.searchParams.toString();
  if (queryParams.length > 2048) {
    return { isThreat: true, reason: "excessive_query" };
  }

  return { isThreat: false };
}

// ==================== SECURITY HEADERS ====================
function applySecurityHeaders(response: NextResponse, cacheControl?: string): NextResponse {
  const isFontRequest = response.headers.get("content-type")?.includes("font") ||
    response.url.includes("/fonts/");

  // Core security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  if (!isFontRequest) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data: https:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://www.google.com/recaptcha/",
      "frame-src 'self' https://www.google.com/",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    response.headers.set("Content-Security-Policy", csp);
  }

  // Cache headers
  if (cacheControl) {
    response.headers.set("Cache-Control", cacheControl);
  } else {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()"
  );

  // HSTS in production
  if (PRODUCTION) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Remove sensitive headers
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");

  return response;
}

// ==================== FONT SECURITY ====================
const FONT_SECURITY_CONFIG = {
  allowedFontTypes: ["woff2", "woff", "ttf", "otf"],
  allowedFontPaths: ["/fonts/", "/_next/static/media/"],
  fontCorsHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Timing-Allow-Origin": "*",
    Vary: "Accept-Encoding",
    "Cross-Origin-Resource-Policy": "cross-origin",
  },
};

function validateFontRequest(pathname: string): boolean {
  const isFontPath = FONT_SECURITY_CONFIG.allowedFontPaths.some((path) =>
    pathname.startsWith(path)
  );
  if (!isFontPath) return true;

  const extension = pathname.split(".").pop()?.toLowerCase();
  if (!extension || !FONT_SECURITY_CONFIG.allowedFontTypes.includes(extension)) {
    return false;
  }

  if (pathname.includes("..") || pathname.includes("//")) {
    return false;
  }

  return true;
}

// ==================== MAIN MIDDLEWARE ====================
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const startTime = Date.now();

  // Skip static files and safe routes
  if (
    SAFE_EXACT.includes(pathname) ||
    SAFE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|webp|avif)$/)
  ) {
    // Handle font requests
    if (
      (pathname.includes("/fonts/") || pathname.includes("/_next/static/media/")) &&
      pathname.match(/\.(woff|woff2|ttf|eot|otf)$/)
    ) {
      if (!validateFontRequest(pathname)) {
        return new NextResponse("Forbidden", { status: 403 });
      }

      const response = NextResponse.next();

      // Apply font-specific headers
      Object.entries(FONT_SECURITY_CONFIG.fontCorsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Long cache for fonts
      response.headers.set("Cache-Control", "public, max-age=31536000, immutable");

      // Content type
      if (pathname.endsWith(".woff2")) {
        response.headers.set("Content-Type", "font/woff2");
      } else if (pathname.endsWith(".woff")) {
        response.headers.set("Content-Type", "font/woff");
      } else if (pathname.endsWith(".ttf")) {
        response.headers.set("Content-Type", "font/ttf");
      }

      return applySecurityHeaders(response);
    }

    const response = NextResponse.next();

    // Cache static assets
    if (pathname.startsWith("/_next/") || pathname.startsWith("/assets/")) {
      response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    // Cache CSS/JS with versioning
    if (pathname.match(/\.(css|js)$/)) {
      response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    return applySecurityHeaders(response);
  }

  // Threat detection
  const threatCheck = detectThreats(req);
  if (threatCheck.isThreat) {
    console.warn(
      `[Security] Threat detected: ${threatCheck.reason} - ${getClientIp(req)} - ${pathname}`
    );

    return new NextResponse("Forbidden", {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "X-Threat-Detected": threatCheck.reason || "unknown",
      },
    });
  }

  // Get authentication context
  const authContext = await getAuthContext(req);

  // Apply rate limiting
  const rateLimitResult = await applyRouteRateLimit(req, pathname, authContext);

  if (!rateLimitResult.allowed) {
    console.warn(`[RateLimit] Blocked: ${getClientIp(req)} -> ${pathname}`);

    return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), {
      status: 429,
      headers: {
        "Retry-After": "60",
        "Content-Type": "application/json",
        "X-RateLimit-Reason": "quota_exceeded",
        ...rateLimitResult.headers,
      },
    });
  }

  // Check route-specific access requirements
  let requiresAuth = false;
  let requiresRole: "admin" | "inner-circle" | "authenticated" | null = null;
  let routeCache = "public, max-age=3600, stale-while-revalidate=86400";
  let redirectTo = "/login";

  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      routeCache = config.cache || routeCache;

      if (config.mode === "strict" || config.requires) {
        requiresAuth = true;
        requiresRole = config.requires as any;

        // Set appropriate redirect based on route type
        if (config.type === "inner-circle" || config.requires === "inner-circle") {
          redirectTo = "/inner-circle/locked";
        } else if (config.type === "admin" || config.requires === "admin") {
          redirectTo = "/admin/login";
        }
        break;
      }
    }
  }

  // Check if user has required access
  if (requiresAuth) {
    let hasAccess = false;

    if (requiresRole === "admin") {
      hasAccess = authContext.isAdmin;
    } else if (requiresRole === "inner-circle") {
      hasAccess = authContext.isInnerCircle || authContext.isAdmin;
    } else if (requiresRole === "authenticated") {
      hasAccess = authContext.isAuthenticated;
    }

    if (!hasAccess) {
      const url = req.nextUrl.clone();
      url.pathname = redirectTo;
      url.searchParams.set("returnTo", pathname);
      url.searchParams.set("reason", "access_denied");
      return NextResponse.redirect(url);
    }
  }

  // Prepare response
  const response = NextResponse.next();

  // Add rate limit headers
  Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Set cache control based on access level
  if (authContext.isAuthenticated && routeCache.includes("public")) {
    routeCache = routeCache.replace("public", "private");
  }
  response.headers.set("Cache-Control", routeCache);

  // Apply security headers
  applySecurityHeaders(response, routeCache);

  // Add custom headers for monitoring
  response.headers.set("X-Access-Level", authContext.userRole || "guest");
  response.headers.set("X-Client-IP", getClientIp(req));
  response.headers.set("X-Request-Path", pathname);
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);

  // Add performance headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  // Handle API CORS
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    const isAllowedOrigin = origin && ALLOWED_ORIGINS.some((allowed) =>
      origin.startsWith(allowed)
    );

    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    } else if (ALLOWED_ORIGINS[0]) {
      response.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
    }

    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, X-Client-Version"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
    response.headers.set(
      "Access-Control-Expose-Headers",
      "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset"
    );

    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }
  }

  // Add monitoring header
  response.headers.set("X-Middleware-Processed", "true");
  response.headers.set("X-Middleware-Version", "1.0.0");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml (sitemap)
     * - robots.txt (robots file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|public/).*)",
  ],
  runtime: "experimental-edge",
};