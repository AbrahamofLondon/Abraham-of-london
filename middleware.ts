// middleware.ts - Enterprise V6.3 with fallbacks
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ==================== SAFE IMPORTS WITH FALLBACKS ====================
let rateLimitRedis: any = null;
let rateLimitModule: any = null;
let RATE_LIMIT_CONFIGS: any = null;
let withEdgeRateLimit: any = null;
let createRateLimitedResponse: any = null;
let createRateLimitHeaders: any = null;

try {
  // Try to import rate limit redis
  const redisModule = require('@/lib/rate-limit-redis');
  rateLimitRedis = redisModule.rateLimitRedis || redisModule.default;
} catch (error) {
  console.warn('[Middleware] rate-limit-redis not available:', error.message);
}

try {
  // Try to import unified rate limit module
  const unifiedModule = require('@/lib/server/rate-limit-unified');
  rateLimitModule = unifiedModule;
  RATE_LIMIT_CONFIGS = unifiedModule.RATE_LIMIT_CONFIGS || {};
  withEdgeRateLimit = unifiedModule.withEdgeRateLimit;
  createRateLimitedResponse = unifiedModule.createRateLimitedResponse;
  createRateLimitHeaders = unifiedModule.createRateLimitHeaders;
} catch (error) {
  console.warn('[Middleware] rate-limit-unified not available, using fallbacks:', error.message);
  
  // Create fallback implementations
  RATE_LIMIT_CONFIGS = {
    API_GENERAL: { limit: 100, windowMs: 60000, keyPrefix: "api" },
    API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
    AUTH: { limit: 10, windowMs: 300000, keyPrefix: "auth" },
    CONTENT: { limit: 60, windowMs: 60000, keyPrefix: "content" }
  };
  
  withEdgeRateLimit = async () => ({ 
    allowed: true, 
    headers: {}, 
    result: { allowed: true, remaining: 100, limit: 100 } 
  });
  
  createRateLimitedResponse = (result: any) => new Response(
    JSON.stringify({ error: 'Too Many Requests' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
  
  createRateLimitHeaders = (result: any) => ({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '99',
    'X-RateLimit-Reset': Date.now().toString()
  });
}

// ==================== HELPER FUNCTIONS ====================
function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('cf-connecting-ip') || 
         'unknown';
}

// ==================== CONFIGURATION ====================
const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";
const PRODUCTION = process.env.NODE_ENV === 'production';

const ROUTE_SECURITY_CONFIG = {
  "/board": { 
    mode: "strict", 
    type: "board", 
    cache: "private, max-age=3600",
    rateLimit: RATE_LIMIT_CONFIGS?.API_STRICT || { limit: 30, windowMs: 60000 }
  },
  "/inner-circle": { 
    mode: "strict", 
    type: "system", 
    cache: "private, max-age=3600",
    rateLimit: RATE_LIMIT_CONFIGS?.AUTH || { limit: 10, windowMs: 300000 }
  },
  "/strategies": { 
    mode: "hybrid", 
    type: "strategy", 
    cache: "public, max-age=7200, stale-while-revalidate=86400",
    rateLimit: RATE_LIMIT_CONFIGS?.CONTENT || { limit: 60, windowMs: 60000 }
  },
  "/canons": { 
    mode: "hybrid", 
    type: "canon", 
    cache: "public, max-age=7200, stale-while-revalidate=86400",
    rateLimit: RATE_LIMIT_CONFIGS?.CONTENT || { limit: 60, windowMs: 60000 }
  },
  "/resources": { 
    mode: "public_default", 
    type: "resource", 
    cache: "public, max-age=86400, stale-while-revalidate=604800",
    rateLimit: RATE_LIMIT_CONFIGS?.API_GENERAL || { limit: 100, windowMs: 60000 }
  }
};

const SAFE_EXACT = [
  "/", 
  "/health", 
  "/ping", 
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
  "/icons/", 
  "/fonts/", 
  "/images/",
  "/assets/"
];

// ==================== SECURITY HEADERS ====================
function applySecurityHeaders(response: NextResponse, cacheControl?: string): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl);
  }
  
  return response;
}

// ==================== RATE LIMITING ====================
async function applyRouteRateLimit(req: NextRequest, pathname: string, hasAccess: boolean) {
  const ip = getClientIp(req);
  
  let rateLimitConfig = RATE_LIMIT_CONFIGS?.API_GENERAL || { limit: 100, windowMs: 60000 };
  let routeKeyPrefix = 'general';
  
  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      rateLimitConfig = config.rateLimit || rateLimitConfig;
      routeKeyPrefix = config.type;
      break;
    }
  }
  
  try {
    // Try Redis first
    if (rateLimitRedis) {
      const result = await rateLimitRedis.check(ip, {
        windowMs: rateLimitConfig.windowMs,
        max: rateLimitConfig.limit,
        keyPrefix: rateLimitConfig.keyPrefix || routeKeyPrefix,
      });
      
      if (result && result.remaining === 0) {
        return {
          allowed: false,
          headers: createRateLimitHeaders?.(result) || {},
          result
        };
      }
      
      return {
        allowed: true,
        headers: createRateLimitHeaders?.(result) || {},
        result
      };
    }
    
    // Fallback to unified rate limit
    if (withEdgeRateLimit) {
      const { allowed, headers, result } = await withEdgeRateLimit(req, rateLimitConfig);
      return { allowed, headers, result };
    }
    
    // Last resort: always allow
    return {
      allowed: true,
      headers: {},
      result: { allowed: true, remaining: rateLimitConfig.limit }
    };
    
  } catch (error) {
    console.warn('[Middleware] Rate limit error, failing open:', error);
    return {
      allowed: true,
      headers: {},
      result: { allowed: true, remaining: rateLimitConfig.limit }
    };
  }
}

// ==================== MAIN MIDDLEWARE ====================
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);
  const hasAccess = req.cookies.get(INNER_CIRCLE_COOKIE_NAME)?.value === "true";
  
  // Skip static files and safe routes
  if (SAFE_EXACT.includes(pathname) || 
      SAFE_PREFIXES.some(prefix => pathname.startsWith(prefix)) ||
      pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/)) {
    const response = NextResponse.next();
    
    // Cache static assets
    if (pathname.startsWith('/_next/') || pathname.startsWith('/assets/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    return applySecurityHeaders(response);
  }
  
  // Block malicious patterns
  const maliciousPatterns = [/wp-admin/i, /\.php$/i, /\.env$/i, /\.git/i, /\.\.\//];
  if (maliciousPatterns.some(pattern => pattern.test(pathname))) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // Apply rate limiting
  const rateLimitResult = await applyRouteRateLimit(req, pathname, hasAccess);
  
  if (!rateLimitResult.allowed) {
    console.warn(`[Middleware] Rate limited: ${ip} -> ${pathname}`);
    
    if (createRateLimitedResponse && rateLimitResult.result) {
      return createRateLimitedResponse(rateLimitResult.result);
    }
    
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  
  // Check access for protected routes
  let requiresAuth = false;
  let routeCache = 'public, max-age=3600';
  
  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      routeCache = config.cache || routeCache;
      
      if (config.mode === "strict" && !hasAccess) {
        requiresAuth = true;
        break;
      }
    }
  }
  
  if (requiresAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/inner-circle/locked";
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }
  
  // Prepare response
  const response = NextResponse.next();
  
  // Add rate limit headers
  if (rateLimitResult.headers) {
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  // Set cache control
  if (hasAccess && routeCache.includes('public')) {
    routeCache = routeCache.replace('public', 'private');
  }
  response.headers.set('Cache-Control', routeCache);
  
  // Apply security headers
  applySecurityHeaders(response, routeCache);
  
  // Add custom headers
  response.headers.set('X-Access-Level', hasAccess ? 'inner-circle' : 'public');
  response.headers.set('X-Client-IP', ip);
  
  // Handle API CORS
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers
      });
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
  ],
  runtime: 'experimental-edge',
};