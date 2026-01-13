// middleware.ts - FIXED VERSION WITHOUT TOP-LEVEL AWAIT
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ==================== SAFE IMPORTS WITH FALLBACKS ====================
let rateLimitRedis: any = null;
let rateLimitModule: any = null;
let RATE_LIMIT_CONFIGS: any = null;
let withEdgeRateLimit: any = null;
let createRateLimitedResponse: any = null;
let createRateLimitHeaders: any = null;

// Function to load security modules lazily
async function loadSecurityModules() {
  if (!rateLimitRedis) {
    try {
      const redisModule = await import('@/lib/rate-limit-redis');
      rateLimitRedis = redisModule.rateLimitRedis || redisModule.default;
    } catch (error: any) {
      console.warn('[Middleware] rate-limit-redis not available:', error.message);
    }
  }

  if (!rateLimitModule) {
    try {
      const unifiedModule = await import('@/lib/server/rate-limit-unified');
      rateLimitModule = unifiedModule;
      RATE_LIMIT_CONFIGS = unifiedModule.RATE_LIMIT_CONFIGS || {};
      withEdgeRateLimit = unifiedModule.withEdgeRateLimit;
      createRateLimitedResponse = unifiedModule.createRateLimitedResponse;
      createRateLimitHeaders = unifiedModule.createRateLimitHeaders;
    } catch (error: any) {
      console.warn('[Middleware] rate-limit-unified not available, using fallbacks:', error.message);
      
      // Default configurations
      RATE_LIMIT_CONFIGS = {
        API_GENERAL: { limit: 100, windowMs: 60000, keyPrefix: "api" },
        API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
        AUTH: { limit: 10, windowMs: 300000, keyPrefix: "auth" },
        CONTENT: { limit: 60, windowMs: 60000, keyPrefix: "content" },
        FONT: { limit: 50, windowMs: 60000, keyPrefix: "font" },
        ADMIN: { limit: 30, windowMs: 60000, keyPrefix: "admin" }
      };
    }
  }
}

// ==================== AUTHENTICATION GATEWAY ====================
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

async function getAuthContext(req: NextRequest): Promise<AuthContext> {
  const adminSession = req.cookies.get('admin_session')?.value;
  const innerCircleToken = req.cookies.get('innerCircleToken')?.value;
  
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
      canAccessInnerCircle: false
    }
  };
  
  try {
    // Check admin session
    let adminUser = null;
    if (adminSession) {
      try {
        const { verifyAdminSession } = await import('@/lib/server/auth/admin-utils');
        adminUser = await verifyAdminSession(adminSession);
      } catch (error) {
        console.warn('[Middleware] Admin session verification failed:', error);
      }
    }
    
    // Check inner circle access
    let innerCircleAccess = false;
    if (innerCircleToken) {
      try {
        const { validateInnerCircleToken } = await import('@/lib/inner-circle/jwt');
        const result = await validateInnerCircleToken(innerCircleToken);
        innerCircleAccess = result.isValid;
      } catch (error) {
        console.warn('[Middleware] Inner circle token validation failed:', error);
      }
    }
    
    const isAdmin = !!adminUser;
    const isInnerCircle = innerCircleAccess;
    
    return {
      isAuthenticated: isAdmin || isInnerCircle,
      userId: adminUser?.id,
      userRole: adminUser?.role || (isInnerCircle ? 'inner-circle' : 'guest'),
      isAdmin,
      isInnerCircle,
      permissions: {
        canViewPDFs: isAdmin || isInnerCircle,
        canDownloadContent: isAdmin || isInnerCircle,
        canAccessBoard: isAdmin,
        canManageUsers: isAdmin && adminUser?.role === 'superadmin',
        canAccessInnerCircle: isInnerCircle || isAdmin
      }
    };
  } catch (error) {
    console.error('[Middleware] Auth context error:', error);
    return defaultContext;
  }
}

// ==================== HELPER FUNCTIONS ====================
function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('cf-connecting-ip') || 
         req.headers.get('x-real-ip') ||
         req.ip ||
         'unknown';
}

function isBotUserAgent(userAgent: string): boolean {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
    /python/i, /java/i, /php/i, /ruby/i, /perl/i, /node/i, /go/i,
    /apache-httpclient/i, /libwww/i, /httpclient/i
  ];
  
  // Common browser patterns (not bots)
  const browserPatterns = [
    /mozilla/i, /chrome/i, /safari/i, /firefox/i, /edge/i,
    /opera/i, /msie/i, /trident/i
  ];
  
  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  const isBrowser = browserPatterns.some(pattern => pattern.test(userAgent));
  
  // If it looks like a bot but not like a browser, it's a bot
  return isBot && !isBrowser;
}

// ==================== FONT SECURITY CONFIG ====================
const FONT_SECURITY_CONFIG = {
  allowedFontTypes: ['woff2', 'woff', 'ttf', 'otf'],
  maxFontSize: 5 * 1024 * 1024, // 5MB
  allowedFontPaths: ['/fonts/', '/_next/static/media/'],
  fontCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Timing-Allow-Origin': '*',
    'Vary': 'Accept-Encoding',
    'Cross-Origin-Resource-Policy': 'cross-origin'
  }
};

// ==================== CONFIGURATION ====================
const PRODUCTION = process.env.NODE_ENV === 'production';

// Route security configuration - using fallback configs until loaded
const ROUTE_SECURITY_CONFIG = {
  // Admin routes - strict authentication required
  "/admin": { 
    mode: "strict", 
    type: "admin", 
    cache: "private, no-store, max-age=0",
    rateLimit: { limit: 30, windowMs: 60000 },
    requires: "admin"
  },
  
  // Board routes - admin access only
  "/board": { 
    mode: "strict", 
    type: "board", 
    cache: "private, max-age=3600",
    rateLimit: { limit: 30, windowMs: 60000 },
    requires: "admin"
  },
  
  // Inner Circle routes - premium access
  "/inner-circle": { 
    mode: "strict", 
    type: "inner-circle", 
    cache: "private, max-age=3600",
    rateLimit: { limit: 10, windowMs: 300000 },
    requires: "inner-circle"
  },
  
  // PDF/document routes
  "/pdfs": { 
    mode: "hybrid", 
    type: "pdf", 
    cache: "private, max-age=7200",
    rateLimit: { limit: 60, windowMs: 60000 },
    requires: "authenticated"
  },
  
  "/download": { 
    mode: "strict", 
    type: "download", 
    cache: "private, no-store",
    rateLimit: { limit: 20, windowMs: 60000 },
    requires: "authenticated"
  },
  
  // Content routes - public with caching
  "/strategies": { 
    mode: "public", 
    type: "strategy", 
    cache: "public, max-age=7200, stale-while-revalidate=86400",
    rateLimit: { limit: 60, windowMs: 60000 }
  },
  
  "/canons": { 
    mode: "public", 
    type: "canon", 
    cache: "public, max-age=7200, stale-while-revalidate=86400",
    rateLimit: { limit: 60, windowMs: 60000 }
  },
  
  // API routes
  "/api/admin": { 
    mode: "strict", 
    type: "admin-api", 
    cache: "private, no-store",
    rateLimit: { limit: 30, windowMs: 60000 },
    requires: "admin"
  },
  
  "/api/inner-circle": { 
    mode: "strict", 
    type: "inner-circle-api", 
    cache: "private, no-store",
    rateLimit: { limit: 10, windowMs: 300000 },
    requires: "inner-circle"
  }
};

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
  "/api/ping"
];

const SAFE_PREFIXES = [
  "/_next/", 
  "/icons/", 
  "/fonts/", 
  "/images/",
  "/assets/",
  "/public/",
  "/api/public/"
];

// ==================== SECURITY HEADERS ====================
function applySecurityHeaders(response: NextResponse, cacheControl?: string): NextResponse {
  const isFontRequest = response.headers.get('content-type')?.includes('font') || 
                       response.url.includes('/fonts/');
  
  // Core security headers (OWASP recommended)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
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
      "form-action 'self'"
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);
  }
  
  // Cache headers
  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl);
  } else {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()'
  );
  
  // HSTS in production
  if (PRODUCTION) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Remove sensitive headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
  
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
  
  // Additional security: Check for path traversal
  if (pathname.includes('..') || pathname.includes('//')) {
    return false;
  }
  
  return true;
}

// ==================== RATE LIMITING ====================
async function applyRouteRateLimit(req: NextRequest, pathname: string, authContext: AuthContext) {
  // Load modules if not already loaded
  if (!RATE_LIMIT_CONFIGS) {
    await loadSecurityModules();
  }
  
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || '';
  
  // Determine rate limit configuration
  let rateLimitConfig = RATE_LIMIT_CONFIGS?.API_GENERAL || { limit: 100, windowMs: 60000 };
  let routeKeyPrefix = 'general';
  let key = ip;
  
  // Apply different limits based on route and authentication
  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      rateLimitConfig = config.rateLimit || rateLimitConfig;
      routeKeyPrefix = config.type;
      
      // Use user ID for authenticated users (more accurate)
      if (authContext.userId && config.mode === "strict") {
        key = `user:${authContext.userId}`;
      }
      break;
    }
  }
  
  // Special handling for fonts
  if (pathname.includes('/fonts/') || pathname.includes('/_next/static/media/')) {
    rateLimitConfig = RATE_LIMIT_CONFIGS?.FONT || { limit: 50, windowMs: 60000, keyPrefix: 'font' };
    routeKeyPrefix = 'font';
  }
  
  // More generous limits for authenticated users
  if (authContext.isAuthenticated) {
    rateLimitConfig = {
      ...rateLimitConfig,
      limit: Math.floor(rateLimitConfig.limit * 1.5) // 50% more for authenticated users
    };
  }
  
  // Stricter limits for bots
  if (isBotUserAgent(userAgent)) {
    rateLimitConfig = {
      ...rateLimitConfig,
      limit: Math.floor(rateLimitConfig.limit * 0.5) // 50% less for bots
    };
  }
  
  try {
    // Try Redis rate limiting first
    if (rateLimitRedis) {
      const result = await rateLimitRedis.check(`${routeKeyPrefix}:${key}`, {
        windowMs: rateLimitConfig.windowMs,
        max: rateLimitConfig.limit,
        keyPrefix: rateLimitConfig.keyPrefix || routeKeyPrefix,
        blockDuration: rateLimitConfig.blockDuration || 300000,
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
    
    // Last resort
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

// ==================== THREAT DETECTION ====================
function detectThreats(req: NextRequest): { isThreat: boolean; reason?: string } {
  const { pathname } = req.nextUrl;
  const userAgent = req.headers.get('user-agent') || '';
  const ip = getClientIp(req);
  
  // Block malicious patterns
  const maliciousPatterns = [
    /wp-admin/i, /\.php$/i, /\.env$/i, /\.git/i, /\.\.\//,
    /\.(exe|bat|sh|cmd|dmg|pkg)$/i,
    /(php|asp|jsp|perl|cgi)-/i,
    /config\./i, /backup\./i, /dump\./i,
    /\.(sql|bak|old|tar|gz|zip)$/i,
    /\/\.well-known\/(?!acme-challenge)/i
  ];
  
  if (maliciousPatterns.some(pattern => pattern.test(pathname))) {
    console.warn(`[Threat] Blocked malicious path: ${ip} -> ${pathname}`);
    return { isThreat: true, reason: 'malicious_path' };
  }
  
  // Block suspicious user agents
  const suspiciousAgents = [
    'sqlmap', 'nikto', 'acunetix', 'nessus', 'metasploit',
    'dirbuster', 'gobuster', 'wpscan', 'joomscan', 'hydra',
    'slowhttptest', 'ffuf', 'wfuzz', 'patator', 'medusa'
  ];
  
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    console.warn(`[Threat] Blocked suspicious UA: ${ip} -> ${userAgent}`);
    return { isThreat: true, reason: 'suspicious_agent' };
  }
  
  // Block excessive query parameters
  const queryParams = req.nextUrl.searchParams.toString();
  if (queryParams.length > 2048) { // 2KB max for query string
    return { isThreat: true, reason: 'excessive_query' };
  }
  
  // Block suspicious headers
  const suspiciousHeaders = ['x-attack', 'x-inject', 'x-shell', 'cmd='];
  for (const [key, value] of req.headers.entries()) {
    if (suspiciousHeaders.some(term => 
      key.toLowerCase().includes(term) || value.toLowerCase().includes(term)
    )) {
      return { isThreat: true, reason: 'suspicious_header' };
    }
  }
  
  return { isThreat: false };
}

// ==================== MAIN MIDDLEWARE ====================
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const startTime = Date.now();
  
  // Skip static files and safe routes
  if (SAFE_EXACT.includes(pathname) || 
      SAFE_PREFIXES.some(prefix => pathname.startsWith(prefix)) ||
      pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|webp|avif)$/)) {
    
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
  
  // Threat detection
  const threatCheck = detectThreats(req);
  if (threatCheck.isThreat) {
    // Log the threat
    console.warn(`[Security] Threat detected: ${threatCheck.reason} - ${getClientIp(req)} - ${pathname}`);
    
    // Return 403 with no information
    return new NextResponse('Forbidden', { 
      status: 403,
      headers: {
        'Cache-Control': 'no-store',
        'X-Threat-Detected': threatCheck.reason || 'unknown'
      }
    });
  }
  
  // Get authentication context
  const authContext = await getAuthContext(req);
  
  // Apply rate limiting
  const rateLimitResult = await applyRouteRateLimit(req, pathname, authContext);
  
  if (!rateLimitResult.allowed) {
    const ip = getClientIp(req);
    console.warn(`[RateLimit] Blocked: ${ip} -> ${pathname}`);
    
    if (createRateLimitedResponse && rateLimitResult.result) {
      return createRateLimitedResponse(rateLimitResult.result);
    }
    
    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'Content-Type': 'application/json',
        'X-RateLimit-Reason': 'quota_exceeded'
      }
    });
  }
  
  // Check route-specific access requirements
  let requiresAuth = false;
  let requiresRole: 'admin' | 'inner-circle' | 'authenticated' | null = null;
  let routeCache = 'public, max-age=3600, stale-while-revalidate=86400';
  let redirectTo = '/admin/login';
  
  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      routeCache = config.cache || routeCache;
      
      if (config.mode === "strict" || config.requires) {
        requiresAuth = true;
        requiresRole = config.requires as any;
        
        // Set appropriate redirect based on route type
        if (config.type === 'inner-circle' || config.requires === 'inner-circle') {
          redirectTo = '/inner-circle/locked';
        } else if (config.type === 'admin' || config.requires === 'admin') {
          redirectTo = '/admin/login';
        }
        break;
      }
    }
  }
  
  // Check if user has required access
  if (requiresAuth) {
    let hasAccess = false;
    
    if (requiresRole === 'admin') {
      hasAccess = authContext.isAdmin;
    } else if (requiresRole === 'inner-circle') {
      hasAccess = authContext.isInnerCircle || authContext.isAdmin;
    } else if (requiresRole === 'authenticated') {
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
  if (rateLimitResult.headers) {
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value.toString());
    });
  }
  
  // Set cache control based on access level
  if (authContext.isAuthenticated && routeCache.includes('public')) {
    routeCache = routeCache.replace('public', 'private');
  }
  response.headers.set('Cache-Control', routeCache);
  
  // Apply security headers
  applySecurityHeaders(response, routeCache);
  
  // Add custom headers for monitoring and debugging
  response.headers.set('X-Access-Level', authContext.userRole || 'guest');
  response.headers.set('X-Client-IP', getClientIp(req));
  response.headers.set('X-Request-Path', pathname);
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  // Add performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Handle API CORS
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXTAUTH_URL || 'https://abrahamoflondon.com',
      process.env.SITE_URL || 'https://abrahamoflondon.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    const isAllowedOrigin = origin && allowedOrigins.some(allowed => 
      origin.startsWith(allowed)
    );
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins[0]) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 
      'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, X-Client-Version'
    );
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
    
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers
      });
    }
  }
  
  // Add preload headers for critical fonts on homepage
  if (pathname === '/' || pathname === '') {
    response.headers.set(
      'Link',
      '</fonts/inter/Inter-Regular.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous, ' +
      '</fonts/inter/Inter-Bold.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous'
    );
  }
  
  // Add monitoring header
  response.headers.set('X-Middleware-Processed', 'true');
  response.headers.set('X-Middleware-Version', '7.1');
  
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
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|public/).*)',
  ],
  runtime: 'experimental-edge',
};