// middleware.ts - Enterprise V7.0 with Font Security & Performance
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
  const redisModule = require('@/lib/rate-limit-redis');
  rateLimitRedis = redisModule.rateLimitRedis || redisModule.default;
} catch (error) {
  console.warn('[Middleware] rate-limit-redis not available:', error.message);
}

try {
  const unifiedModule = require('@/lib/server/rate-limit-unified');
  rateLimitModule = unifiedModule;
  RATE_LIMIT_CONFIGS = unifiedModule.RATE_LIMIT_CONFIGS || {};
  withEdgeRateLimit = unifiedModule.withEdgeRateLimit;
  createRateLimitedResponse = unifiedModule.createRateLimitedResponse;
  createRateLimitHeaders = unifiedModule.createRateLimitHeaders;
} catch (error) {
  console.warn('[Middleware] rate-limit-unified not available, using fallbacks:', error.message);
  
  RATE_LIMIT_CONFIGS = {
    API_GENERAL: { limit: 100, windowMs: 60000, keyPrefix: "api" },
    API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
    AUTH: { limit: 10, windowMs: 300000, keyPrefix: "auth" },
    CONTENT: { limit: 60, windowMs: 60000, keyPrefix: "content" },
    FONT: { limit: 50, windowMs: 60000, keyPrefix: "font" }
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
         req.headers.get('x-real-ip') ||
         'unknown';
}

// ==================== FONT SECURITY CONFIG ====================
const FONT_SECURITY_CONFIG = {
  allowedFontTypes: ['woff2', 'woff', 'ttf', 'otf'],
  maxFontSize: 5 * 1024 * 1024, // 5MB
  allowedFontPaths: ['/fonts/', '/_next/static/media/'],
  fontCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Timing-Allow-Origin': '*',
    'Vary': 'Accept-Encoding'
  }
};

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
  "/manifest.json",
  "/font-manifest.json"
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
  const isFontRequest = response.headers.get('content-type')?.includes('font') || 
                       response.url.includes('/fonts/');
  
  // Core security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy for fonts
  if (!isFontRequest) {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
        "font-src 'self' data: https:",
        "img-src 'self' data: https:",
        "connect-src 'self'",
        "frame-ancestors 'none'"
      ].join('; ')
    );
  }
  
  // Cache headers
  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl);
  }
  
  // Feature Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  return response;
}

// ==================== FONT SECURITY ====================
function validateFontRequest(pathname: string): boolean {
  // Check if it's a font request
  const isFontPath = FONT_SECURITY_CONFIG.allowedFontPaths.some(path => pathname.startsWith(path));
  if (!isFontPath) return true;
  
  // Check font type
  const extension = pathname.split('.').pop()?.toLowerCase();
  if (!extension || !FONT_SECURITY_CONFIG.allowedFontTypes.includes(extension)) {
    return false;
  }
  
  return true;
}

// ==================== RATE LIMITING ====================
async function applyRouteRateLimit(req: NextRequest, pathname: string, hasAccess: boolean) {
  const ip = getClientIp(req);
  
  let rateLimitConfig = RATE_LIMIT_CONFIGS?.API_GENERAL || { limit: 100, windowMs: 60000 };
  let routeKeyPrefix = 'general';
  
  // Check for font-specific rate limiting
  if (pathname.includes('/fonts/') || pathname.includes('/_next/static/media/')) {
    rateLimitConfig = RATE_LIMIT_CONFIGS?.FONT || { limit: 50, windowMs: 60000, keyPrefix: 'font' };
    routeKeyPrefix = 'font';
  } else {
    // Check other routes
    for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
      if (pathname.startsWith(routePrefix)) {
        rateLimitConfig = config.rateLimit || rateLimitConfig;
        routeKeyPrefix = config.type;
        break;
      }
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
  const userAgent = req.headers.get('user-agent') || '';
  
  // Skip static files and safe routes
  if (SAFE_EXACT.includes(pathname) || 
      SAFE_PREFIXES.some(prefix => pathname.startsWith(prefix)) ||
      pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/)) {
    
    // Validate font requests
    if ((pathname.includes('/fonts/') || pathname.includes('/_next/static/media/')) && 
        pathname.match(/\.(woff|woff2|ttf|eot|otf)$/)) {
      
      if (!validateFontRequest(pathname)) {
        return new NextResponse('Forbidden', { status: 403 });
      }
      
      const response = NextResponse.next();
      
      // Apply font-specific headers
      Object.entries(FONT_SECURITY_CONFIG.fontCorsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // Long cache for fonts
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      
      // Content type
      if (pathname.endsWith('.woff2')) {
        response.headers.set('Content-Type', 'font/woff2');
      } else if (pathname.endsWith('.woff')) {
        response.headers.set('Content-Type', 'font/woff');
      } else if (pathname.endsWith('.ttf')) {
        response.headers.set('Content-Type', 'font/ttf');
      }
      
      return applySecurityHeaders(response);
    }
    
    const response = NextResponse.next();
    
    // Cache static assets
    if (pathname.startsWith('/_next/') || pathname.startsWith('/assets/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // Cache CSS/JS with versioning
    if (pathname.match(/\.(css|js)$/)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    return applySecurityHeaders(response);
  }
  
  // Block malicious patterns
  const maliciousPatterns = [
    /wp-admin/i, /\.php$/i, /\.env$/i, /\.git/i, /\.\.\//,
    /\.(exe|bat|sh|cmd|dmg|pkg)$/i,
    /(php|asp|jsp|perl|cgi)-/i
  ];
  
  if (maliciousPatterns.some(pattern => pattern.test(pathname))) {
    console.warn(`[Middleware] Blocked malicious request: ${ip} -> ${pathname}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // Block suspicious user agents
  const suspiciousAgents = [
    'sqlmap', 'nikto', 'acunetix', 'nessus', 'metasploit',
    'dirbuster', 'gobuster', 'wpscan', 'joomscan'
  ];
  
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    console.warn(`[Middleware] Blocked suspicious user agent: ${userAgent}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // Apply rate limiting
  const rateLimitResult = await applyRouteRateLimit(req, pathname, hasAccess);
  
  if (!rateLimitResult.allowed) {
    console.warn(`[Middleware] Rate limited: ${ip} -> ${pathname} (UA: ${userAgent})`);
    
    if (createRateLimitedResponse && rateLimitResult.result) {
      return createRateLimitedResponse(rateLimitResult.result);
    }
    
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'Content-Type': 'application/json'
      }
    });
  }
  
  // Check access for protected routes
  let requiresAuth = false;
  let routeCache = 'public, max-age=3600, stale-while-revalidate=86400';
  
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
      response.headers.set(key, value.toString());
    });
  }
  
  // Set cache control based on access level
  if (hasAccess && routeCache.includes('public')) {
    routeCache = routeCache.replace('public', 'private');
  }
  response.headers.set('Cache-Control', routeCache);
  
  // Apply security headers
  applySecurityHeaders(response, routeCache);
  
  // Add custom headers for monitoring
  response.headers.set('X-Access-Level', hasAccess ? 'inner-circle' : 'public');
  response.headers.set('X-Client-IP', ip);
  response.headers.set('X-Request-Path', pathname);
  
  // Add performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Download-Options', 'noopen');
  
  // Handle API CORS
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      process.env.SITE_URL || 'https://abrahamoflondon.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    const isAllowedOrigin = origin && allowedOrigins.some(allowed => 
      origin.startsWith(allowed)
    );
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 
      'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version'
    );
    response.headers.set('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers
      });
    }
  }
  
  // Add preload headers for critical fonts
  if (pathname === '/' || pathname === '') {
    response.headers.set(
      'Link',
      '</fonts/inter/Inter-Regular.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous'
    );
  }
  
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
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
  ],
  runtime: 'experimental-edge',
};