/* middleware.ts - Enterprise V6.0
 * Enhanced Security & Performance Middleware
 * Merges existing enterprise features with additional security layers
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { 
  rateLimit, 
  getClientIp, 
  getRateLimitKeys, 
  checkMultipleRateLimits,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS 
} from "@/lib/server/rateLimit-edge";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";
const PRODUCTION = process.env.NODE_ENV === 'production';

/* -------------------------------------------------------------------------- */
/* 1. CONFIGURATION & CONSTANTS                                              */
/* -------------------------------------------------------------------------- */

const ROUTE_SECURITY_CONFIG = {
  "/board": { mode: "strict", type: "board", cache: "private, max-age=3600" },
  "/inner-circle": { mode: "strict", type: "system", cache: "private, max-age=3600" },
  "/strategies": { mode: "hybrid", type: "strategy", cache: "public, max-age=7200, stale-while-revalidate=86400" },
  "/canons": { mode: "hybrid", type: "canon", cache: "public, max-age=7200, stale-while-revalidate=86400" },
  "/resources": { mode: "public_default", type: "resource", cache: "public, max-age=86400, stale-while-revalidate=604800" },
  "/blog": { mode: "public", type: "blog", cache: "public, max-age=86400, stale-while-revalidate=2592000" },
  "/books": { mode: "public", type: "book", cache: "public, max-age=86400, immutable" },
};

// Routes that bypass all security checks
const SAFE_EXACT = [
  "/inner-circle/login", 
  "/inner-circle/register", 
  "/inner-circle/locked", 
  "/health", 
  "/ping", 
  "/", 
  "/privacy", 
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/manifest.json"
];

const SAFE_PREFIXES = [
  "/_next/", 
  "/api/health", 
  "/api/ping",
  "/api/public/",
  "/icons/", 
  "/fonts/", 
  "/images/",
  "/assets/fonts/",
  "/assets/images/"
];

// Bot whitelist (allowed crawlers)
const ALLOWED_BOTS = [
  'googlebot', 
  'bingbot', 
  'slurp', 
  'duckduckbot', 
  'baiduspider',
  'yandexbot', 
  'facebot', 
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest',
  'developers.google.com/+/web/snippet'
];

// Malicious patterns for WAF
const MALICIOUS_PATTERNS = [
  /wp-admin/i, 
  /wp-login/i, 
  /\.php$/i, 
  /\.env$/i, 
  /\.git/i, 
  /sql-injection/i, 
  /\.\.\//, 
  /eval\(/i,
  /union.*select/i,
  /<script.*>/i,
  /javascript:/i,
  /onload=/i,
  /onerror=/i,
  /base64,/i,
  /\.(bak|old|backup)$/i,
  /\.(asp|aspx|jsp|cfm)$/i,
  /\/vendor\//i,
  /\/\.env\./i,
  /\/phpmyadmin\//i,
  /\/mysql\//i,
  /\/adminer\//i
];

/* -------------------------------------------------------------------------- */
/* 2. UTILITY FUNCTIONS                                                       */
/* -------------------------------------------------------------------------- */

function isAllowedBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return ALLOWED_BOTS.some(bot => ua.includes(bot.toLowerCase()));
}

function isMaliciousRequest(pathname: string): boolean {
  const normalizedPath = pathname.toLowerCase();
  return MALICIOUS_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

function shouldBypassSecurity(pathname: string): boolean {
  // Exact match bypass
  if (SAFE_EXACT.includes(pathname)) return true;
  
  // Prefix match bypass
  if (SAFE_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true;
  
  // API routes (but not all, some need protection)
  if (pathname.startsWith('/api/')) {
    // Only bypass for specific public API routes
    const publicApiRoutes = ['/api/health', '/api/ping', '/api/public/'];
    return publicApiRoutes.some(route => pathname.startsWith(route));
  }
  
  return false;
}

function applySecurityHeaders(response: NextResponse, cacheControl?: string): NextResponse {
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Modern security headers
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  // CSP - Production vs Development
  const csp = PRODUCTION 
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:; media-src 'self'; object-src 'none'; frame-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: ws: wss:;";
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Performance headers
  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl);
  }
  
  // Additional headers for observability
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Download-Options', 'noopen');
  
  return response;
}

function redirectLocked(req: NextRequest, returnTo: string, reason: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/inner-circle/locked";
  url.searchParams.set("returnTo", returnTo);
  url.searchParams.set("reason", reason);
  url.searchParams.set("timestamp", Date.now().toString());
  
  const response = NextResponse.redirect(url);
  return applySecurityHeaders(response);
}

function createRateLimitedResponse(result: any): NextResponse {
  const response = new NextResponse(
    JSON.stringify({ 
      error: "Rate limit exceeded", 
      retryAfter: Math.ceil(result.retryAfterMs / 1000),
      limit: result.limit,
      remaining: result.remaining,
      resetTime: new Date(Date.now() + result.retryAfterMs).toISOString()
    }),
    { 
      status: 429, 
      headers: { 
        "Content-Type": "application/json", 
        ...createRateLimitHeaders(result),
        "Retry-After": Math.ceil(result.retryAfterMs / 1000).toString()
      } 
    }
  );
  
  return applySecurityHeaders(response);
}

function shouldCacheAsset(pathname: string): boolean {
  const cacheableAssets = [
    '/_next/static/chunks/contentlayer',
    '/_next/static/',
    '/_next/image',
    '/assets/downloads/',
    '/assets/fonts/',
    '/assets/images/',
    '/icons/',
    '/fonts/',
    '/images/'
  ];
  
  return cacheableAssets.some(prefix => pathname.startsWith(prefix));
}

/* -------------------------------------------------------------------------- */
/* 3. MAIN MIDDLEWARE LOGIC                                                   */
/* -------------------------------------------------------------------------- */

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);
  const hasAccess = req.cookies.get(INNER_CIRCLE_COOKIE_NAME)?.value === "true";
  const userAgent = req.headers.get('user-agent') || '';
  
  // ==================== PHASE 1: BYPASS CHECKS ====================
  if (shouldBypassSecurity(pathname)) {
    const response = NextResponse.next();
    
    // Apply aggressive caching for static assets
    if (shouldCacheAsset(pathname)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    return applySecurityHeaders(response);
  }
  
  // ==================== PHASE 2: WAF & BOT PROTECTION ====================
  
  // WAF: Block malicious requests
  if (isMaliciousRequest(pathname)) {
    console.warn(`[WAF] Blocked malicious request: ${pathname} from ${ip}`, { userAgent });
    return new NextResponse('Forbidden', { 
      status: 403,
      headers: {
        'X-Blocked-By': 'WAF',
        'X-Blocked-Reason': 'malicious-pattern-detected'
      }
    });
  }
  
  // Bot Protection: Block unwanted bots
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
  if (isBot && !isAllowedBot(userAgent)) {
    console.warn(`[BOT] Blocked unauthorized bot: ${userAgent} from ${ip}`);
    return NextResponse.rewrite(new URL('/api/blocked', req.url));
  }
  
  // ==================== PHASE 3: ASSET GUARD ====================
  if (pathname.startsWith("/assets/downloads/")) {
    if (!hasAccess) {
      console.warn(`[SECURITY] Blocked unauthorized asset request: ${pathname} from ${ip}`);
      return redirectLocked(req, pathname, "unauthorized-asset-access");
    }
    
    // Allow access, set appropriate caching for authorized users
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, max-age=3600, stale-while-revalidate=7200');
    return applySecurityHeaders(response);
  }
  
  // ==================== PHASE 4: RATE LIMITING ====================
  const globalKeys = getRateLimitKeys(req, "global");
  const { worstResult: globalResult } = checkMultipleRateLimits(globalKeys, RATE_LIMIT_CONFIGS.API_GENERAL);
  
  if (!globalResult.allowed) {
    console.warn(`[RATE_LIMIT] Blocked ${ip} for ${pathname}: ${globalResult.reason}`);
    return createRateLimitedResponse(globalResult);
  }
  
  // ==================== PHASE 5: ROUTE CONTENT GATING ====================
  let routeCacheConfig = 'public, max-age=3600';
  let requiresAuth = false;
  
  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      routeCacheConfig = config.cache || routeCacheConfig;
      
      if (config.mode === "strict" && !hasAccess) {
        if (pathname === "/inner-circle/login") break;
        requiresAuth = true;
        break;
      }
      
      if (config.mode === "hybrid") {
        const resourceResult = rateLimit(`resource:${ip}`, { limit: 30, windowMs: 60000 });
        if (!resourceResult.allowed) {
          console.warn(`[RATE_LIMIT] Resource limit exceeded for ${ip} on ${pathname}`);
          return createRateLimitedResponse(resourceResult);
        }
      }
    }
  }
  
  if (requiresAuth) {
    return redirectLocked(req, pathname, `protected-${ROUTE_SECURITY_CONFIG[pathname]?.type || 'resource'}`);
  }
  
  // ==================== PHASE 6: RESPONSE PREPARATION ====================
  const response = NextResponse.next();
  
  // Apply rate limit headers
  Object.entries(createRateLimitHeaders(globalResult)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Apply cache control
  response.headers.set('Cache-Control', routeCacheConfig);
  
  // Apply security headers with cache config
  applySecurityHeaders(response, routeCacheConfig);
  
  // Add observability headers
  response.headers.set('X-Access-Level', hasAccess ? 'inner-circle' : 'public');
  response.headers.set('X-Request-ID', crypto.randomUUID());
  response.headers.set('X-Request-Path', pathname);
  
  // Add performance timing headers in development
  if (!PRODUCTION) {
    response.headers.set('Server-Timing', 'middleware;dur=1');
  }
  
  return response;
}

/* -------------------------------------------------------------------------- */
/* 4. MIDDLEWARE CONFIGURATION                                                */
/* -------------------------------------------------------------------------- */

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - Static files with extensions (js, css, png, etc.)
     * - Next.js internals
     * - Specific public routes
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.(?:ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$).*)',
    
    // Also match API routes that need protection
    '/api/((?!health|ping|public/).*)',
  ],
  
  // Run middleware on Edge Runtime
  runtime: 'experimental-edge',
};