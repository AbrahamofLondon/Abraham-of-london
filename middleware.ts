/* middleware.ts - Enterprise V6.2
 * Enhanced Security & Performance Middleware
 * Updated with unified rate limiting system
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { rateLimitRedis } from '@/lib/rate-limit-redis'; 

import { 
  withEdgeRateLimit,
  createRateLimitedResponse,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS 
} from "@/lib/server/rate-limit-unified";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";
const PRODUCTION = process.env.NODE_ENV === 'production';

/* -------------------------------------------------------------------------- */
/* 1. CONFIGURATION & CONSTANTS                                              */
/* -------------------------------------------------------------------------- */

const ROUTE_SECURITY_CONFIG = {
  "/board": { 
    mode: "strict", 
    type: "board", 
    cache: "private, max-age=3600",
    rateLimit: RATE_LIMIT_CONFIGS.API_STRICT
  },
  "/inner-circle": { 
    mode: "strict", 
    type: "system", 
    cache: "private, max-age=3600",
    rateLimit: RATE_LIMIT_CONFIGS.AUTH
  },
  "/strategies": { 
    mode: "hybrid", 
    type: "strategy", 
    cache: "public, max-age=7200, stale-while-revalidate=86400",
    rateLimit: RATE_LIMIT_CONFIGS.CONTENT
  },
  "/canons": { 
    mode: "hybrid", 
    type: "canon", 
    cache: "public, max-age=7200, stale-while-revalidate=86400",
    rateLimit: RATE_LIMIT_CONFIGS.CONTENT
  },
  "/resources": { 
    mode: "public_default", 
    type: "resource", 
    cache: "public, max-age=86400, stale-while-revalidate=604800",
    rateLimit: RATE_LIMIT_CONFIGS.API_GENERAL
  },
  "/blog": { 
    mode: "public", 
    type: "blog", 
    cache: "public, max-age=86400, stale-while-revalidate=2592000",
    rateLimit: RATE_LIMIT_CONFIGS.API_GENERAL
  },
  "/books": { 
    mode: "public", 
    type: "book", 
    cache: "public, max-age=86400, immutable",
    rateLimit: RATE_LIMIT_CONFIGS.API_GENERAL
  },
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
  "/manifest.json",
  "/api/auth/login",
  "/api/auth/register",
  "/api/health",
  "/api/ping"
];

const SAFE_PREFIXES = [
  "/_next/", 
  "/api/public/",
  "/icons/", 
  "/fonts/", 
  "/images/",
  "/assets/fonts/",
  "/assets/images/public/",
  "/assets/icons/"
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
  
  // Static files with extensions
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json'];
  if (staticExtensions.some(ext => pathname.endsWith(ext))) return true;
  
  // API routes (but not all, some need protection)
  if (pathname.startsWith('/api/')) {
    // Only bypass for specific public API routes
    const publicApiRoutes = ['/api/health', '/api/ping', '/api/public/', '/api/auth/login', '/api/auth/register'];
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

function shouldCacheAsset(pathname: string): boolean {
  const cacheableAssets = [
    '/_next/static/chunks/contentlayer',
    '/_next/static/',
    '/_next/image',
    '/assets/fonts/',
    '/assets/images/public/',
    '/assets/icons/',
    '/icons/',
    '/fonts/',
    '/images/'
  ];
  
  return cacheableAssets.some(prefix => pathname.startsWith(prefix));
}

/* -------------------------------------------------------------------------- */
/* 3. RATE LIMITING FUNCTION                                                 */
/* -------------------------------------------------------------------------- */

async function applyRouteSpecificRateLimit(
  req: NextRequest, 
  pathname: string,
  hasAccess: boolean
): Promise<{
  allowed: boolean;
  headers?: Record<string, string>;
  result?: any;
}> {
  const ip = getClientIp(req);
  
  // Find route-specific configuration
  let rateLimitConfig = RATE_LIMIT_CONFIGS.API_GENERAL;
  let routeKeyPrefix = 'general';
  
  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api/');
  
  // Find matching route configuration
  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      if (config.rateLimit) {
        rateLimitConfig = config.rateLimit;
      }
      routeKeyPrefix = config.type;
      break;
    }
  }
  
  // Special handling for authenticated vs unauthenticated users
  if (hasAccess) {
    // Inner circle members get higher limits
    if (rateLimitConfig === RATE_LIMIT_CONFIGS.API_STRICT) {
      rateLimitConfig = {
        ...rateLimitConfig,
        limit: Math.floor(rateLimitConfig.limit * 1.5), // 50% higher limit
        keyPrefix: `${routeKeyPrefix}_inner_circle`
      };
    }
  }
  
  try {
    // Try Redis-based rate limiting first
    if (rateLimitRedis) {
      const redisKey = `ratelimit:${routeKeyPrefix}:${ip}`;
      const result = await rateLimitRedis.check(ip, {
        windowMs: rateLimitConfig.windowMs,
        max: rateLimitConfig.limit,
        keyPrefix: rateLimitConfig.keyPrefix || routeKeyPrefix,
      });
      
      if (result.remaining === 0) {
        return {
          allowed: false,
          headers: createRateLimitHeaders(result),
          result
        };
      }
      
      return {
        allowed: true,
        headers: createRateLimitHeaders(result),
        result
      };
    }
    
    // Fallback to edge-based rate limiting
    const { allowed, headers, result } = await withEdgeRateLimit(
      req, 
      rateLimitConfig
    );
    
    return { allowed, headers, result };
    
  } catch (error) {
    console.error('[RateLimit] Error applying rate limit:', error);
    
    // On error, allow the request but log it
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Error': 'rate-limit-service-unavailable'
      }
    };
  }
}

/* -------------------------------------------------------------------------- */
/* 4. MAIN MIDDLEWARE LOGIC                                                   */
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
        'X-Blocked-Reason': 'malicious-pattern-detected',
        'X-Request-ID': crypto.randomUUID()
      }
    });
  }
  
  // Bot Protection: Block unwanted bots
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
  if (isBot && !isAllowedBot(userAgent)) {
    console.warn(`[BOT] Blocked unauthorized bot: ${userAgent} from ${ip}`);
    const response = new NextResponse('Access Denied', { 
      status: 403,
      headers: {
        'X-Blocked-By': 'Bot-Protection',
        'X-Request-ID': crypto.randomUUID()
      }
    });
    return applySecurityHeaders(response);
  }
  
  // ==================== PHASE 3: ASSET GUARD ====================
  if (pathname.startsWith("/assets/downloads/") || pathname.startsWith("/assets/private/")) {
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
  const rateLimitResult = await applyRouteSpecificRateLimit(req, pathname, hasAccess);
  
  if (!rateLimitResult.allowed) {
    console.warn(`[RATE_LIMIT] Blocked ${ip} for ${pathname}`, {
      remaining: rateLimitResult.result?.remaining,
      retryAfter: rateLimitResult.result?.retryAfterMs
    });
    
    if (rateLimitResult.result?.retryAfterMs && rateLimitResult.result.retryAfterMs > 0) {
      const response = createRateLimitedResponse(rateLimitResult.result);
      return applySecurityHeaders(response);
    }
    
    // Generic rate limit response if no retry time specified
    const response = new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'X-RateLimit-Reason': 'rate-limit-exceeded',
        'X-Request-ID': crypto.randomUUID()
      }
    });
    return applySecurityHeaders(response);
  }
  
  // ==================== PHASE 5: ROUTE CONTENT GATING ====================
  let routeCacheConfig = 'public, max-age=3600';
  let requiresAuth = false;
  let routeType = 'public';
  
  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      routeCacheConfig = config.cache || routeCacheConfig;
      routeType = config.type || 'public';
      
      if (config.mode === "strict" && !hasAccess) {
        // Allow access to login/register pages even in strict mode
        if (pathname === "/inner-circle/login" || pathname === "/inner-circle/register") {
          break; 
        }
        requiresAuth = true;
        break;
      }
      
      // Apply additional rate limiting for hybrid routes when user doesn't have access
      if (config.mode === "hybrid" && !hasAccess) {
        const hybridRateLimit = await applyRouteSpecificRateLimit(
          req, 
          pathname, 
          false
        );
        
        if (!hybridRateLimit.allowed) {
          console.warn(`[RATE_LIMIT] Content limit exceeded for ${ip} on ${pathname}`);
          const response = createRateLimitedResponse(hybridRateLimit.result);
          return applySecurityHeaders(response);
        }
      }
    }
  }
  
  if (requiresAuth) {
    return redirectLocked(req, pathname, `protected-${routeType}`);
  }
  
  // ==================== PHASE 6: RESPONSE PREPARATION ====================
  const response = NextResponse.next();
  
  // Apply rate limit headers if available
  if (rateLimitResult.headers) {
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  // Apply cache control based on route type and access level
  let finalCacheControl = routeCacheConfig;
  
  // Adjust cache control for authenticated users
  if (hasAccess && routeCacheConfig.includes('public')) {
    // Change public cache to private for authenticated users
    finalCacheControl = routeCacheConfig.replace('public', 'private');
  }
  
  response.headers.set('Cache-Control', finalCacheControl);
  
  // Apply security headers with cache config
  applySecurityHeaders(response, finalCacheControl);
  
  // Add observability headers
  response.headers.set('X-Access-Level', hasAccess ? 'inner-circle' : 'public');
  response.headers.set('X-Request-ID', crypto.randomUUID());
  response.headers.set('X-Route-Type', routeType);
  
  // Add rate limit info headers
  if (rateLimitResult.result) {
    response.headers.set('X-RateLimit-Limit', rateLimitResult.result.limit?.toString() || '100');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.result.remaining?.toString() || '99');
    response.headers.set('X-RateLimit-Reset', rateLimitResult.result.resetTime?.toString() || Date.now().toString());
  }
  
  // Add performance timing headers in development
  if (!PRODUCTION) {
    const startTime = Date.now();
    const endTime = Date.now();
    response.headers.set('Server-Timing', `middleware;dur=${endTime - startTime}`);
  }
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers
      });
    }
  }
  
  return response;
}

/* -------------------------------------------------------------------------- */
/* 5. MIDDLEWARE CONFIGURATION                                                */
/* -------------------------------------------------------------------------- */

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - Next.js internals
     * - Specific public routes (handled in shouldBypassSecurity)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.json).*)',
    
    // Also match API routes that need protection
    '/api/((?!health|ping|public/|auth/(login|register)).*)',
  ],
  
  // Run middleware on Edge Runtime
  runtime: 'edge',
};