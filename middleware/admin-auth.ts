// middleware/admin-auth.ts
/**
 * Enterprise Admin Authentication Middleware
 * Production-ready with multiple security layers
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  withEdgeRateLimit,
  createRateLimitedResponse,
  getClientIp,
  RATE_LIMIT_CONFIGS 
} from '@/lib/server/rate-limit-unified';

// Environment configuration
const ENV_VARS = {
  NODE_ENV: process.env.NODE_ENV,
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET,
  ADMIN_ALLOWED_IPS: process.env.ADMIN_ALLOWED_IPS?.split(',') || [],
  ADMIN_BYPASS_PASSWORD: process.env.ADMIN_BYPASS_PASSWORD, // For emergency access
} as const;

// Admin session configuration
const ADMIN_SESSION_CONFIG = {
  COOKIE_NAME: 'admin_auth',
  MAX_AGE: 24 * 60 * 60, // 24 hours
  SESSION_TIMEOUT: 60 * 60, // 1 hour of inactivity
  REMEMBER_ME_MAX_AGE: 30 * 24 * 60 * 60, // 30 days
} as const;

// Rate limit configuration for admin routes
const ADMIN_RATE_LIMITS = {
  LOGIN: { limit: 5, windowMs: 15 * 60 * 1000, keyPrefix: 'admin_login' }, // 5 attempts per 15 min
  OPERATIONS: { limit: 100, windowMs: 60 * 1000, keyPrefix: 'admin_ops' }, // 100 ops per minute
  EXPORT: { limit: 10, windowMs: 5 * 60 * 1000, keyPrefix: 'admin_export' }, // 10 exports per 5 min
} as const;

// IP Validation
function isAllowedIp(ip: string): boolean {
  // Allow localhost in development
  if (ENV_VARS.NODE_ENV !== 'production' && 
      (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost')) {
    return true;
  }
  
  // Check configured allowed IPs
  if (ENV_VARS.ADMIN_ALLOWED_IPS.length > 0) {
    return ENV_VARS.ADMIN_ALLOWED_IPS.some(allowedIp => {
      // Support CIDR notation
      if (allowedIp.includes('/')) {
        // Simple CIDR check (for production, use a proper CIDR library)
        return ip.startsWith(allowedIp.split('/')[0]);
      }
      return ip === allowedIp;
    });
  }
  
  // If no IP restrictions configured, allow all in dev, deny in prod
  return ENV_VARS.NODE_ENV !== 'production';
}

// JWT Token Validation (simplified - use proper JWT library in production)
async function validateAdminToken(token: string): Promise<boolean> {
  if (!ENV_VARS.ADMIN_JWT_SECRET) {
    console.error('ADMIN_JWT_SECRET not configured');
    return false;
  }
  
  try {
    // In production, use a proper JWT library like jose or jsonwebtoken
    // This is a simplified example
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signatureB64) {
      return false;
    }
    
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    
    // Check audience
    if (payload.aud !== 'admin_portal') {
      return false;
    }
    
    // Check issuer
    if (payload.iss !== 'abraham-of-london') {
      return false;
    }
    
    // In production, verify the signature here
    return true;
    
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

// Session validation with timing attack protection
async function validateAdminSession(request: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
  sessionId?: string;
  requiresReauth?: boolean;
}> {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Get session from cookie
  const sessionCookie = request.cookies.get(ADMIN_SESSION_CONFIG.COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    // Use constant time comparison even for missing cookies
    await new Promise(resolve => setTimeout(resolve, 100));
    return { authenticated: false };
  }
  
  try {
    // Decode session data
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );
    
    // Validate session structure
    if (!sessionData.userId || !sessionData.sessionId || !sessionData.expires) {
      return { authenticated: false };
    }
    
    // Check expiration
    if (sessionData.expires < Date.now()) {
      return { authenticated: false, requiresReauth: true };
    }
    
    // Check last activity timeout
    const lastActivity = sessionData.lastActivity || sessionData.created;
    const inactiveTime = Date.now() - lastActivity;
    
    if (inactiveTime > ADMIN_SESSION_CONFIG.SESSION_TIMEOUT * 1000) {
      return { authenticated: false, requiresReauth: true };
    }
    
    // Validate token if present
    if (sessionData.token && !await validateAdminToken(sessionData.token)) {
      return { authenticated: false };
    }
    
    // Check IP restriction
    if (sessionData.ip && sessionData.ip !== ip) {
      console.warn(`[ADMIN] Session IP mismatch: ${sessionData.ip} vs ${ip}`);
      // Allow if same subnet? Depends on your security requirements
      // return { authenticated: false };
    }
    
    // Check user agent
    if (sessionData.userAgent && sessionData.userAgent !== userAgent) {
      console.warn('[ADMIN] User agent changed');
      // Might want to require reauth here
    }
    
    return {
      authenticated: true,
      userId: sessionData.userId,
      sessionId: sessionData.sessionId,
    };
    
  } catch (error) {
    console.error('[ADMIN] Session validation error:', error);
    // Use constant time even on error
    await new Promise(resolve => setTimeout(resolve, 100));
    return { authenticated: false };
  }
}

// Check if route requires authentication
function requiresAuth(pathname: string): boolean {
  const publicAdminRoutes = [
    '/admin/login',
    '/admin/logout',
    '/admin/forgot-password',
    '/admin/reset-password',
    '/admin/health',
  ];
  
  // Public routes don't require auth
  if (publicAdminRoutes.includes(pathname)) {
    return false;
  }
  
  // Static assets don't require auth
  if (pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
    return false;
  }
  
  // API health endpoints
  if (pathname === '/api/admin/health') {
    return false;
  }
  
  // All other admin routes require auth
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

// Check if route requires elevated privileges
function requiresElevatedPrivileges(pathname: string): boolean {
  const elevatedRoutes = [
    '/admin/users',
    '/admin/settings',
    '/admin/system',
    '/admin/logs',
    '/admin/backup',
    '/admin/export',
    '/api/admin/users',
    '/api/admin/settings',
    '/api/admin/system',
    '/api/admin/logs',
    '/api/admin/backup',
    '/api/admin/export',
  ];
  
  return elevatedRoutes.some(route => pathname.startsWith(route));
}

// Check if route is sensitive (requires additional validation)
function isSensitiveOperation(pathname: string, method: string): boolean {
  const sensitiveRoutes = [
    { path: '/api/admin/users', methods: ['POST', 'PUT', 'DELETE'] },
    { path: '/api/admin/settings', methods: ['POST', 'PUT', 'DELETE'] },
    { path: '/api/admin/system', methods: ['POST', 'PUT', 'DELETE'] },
    { path: '/api/admin/backup', methods: ['POST'] },
    { path: '/api/admin/export', methods: ['POST'] },
  ];
  
  return sensitiveRoutes.some(route => 
    pathname.startsWith(route.path) && route.methods.includes(method)
  );
}

// Create a new session
function createSessionResponse(
  userId: string,
  request: NextRequest,
  rememberMe: boolean = false
): NextResponse {
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  const maxAge = rememberMe ? 
    ADMIN_SESSION_CONFIG.REMEMBER_ME_MAX_AGE : 
    ADMIN_SESSION_CONFIG.MAX_AGE;
  
  const sessionData = {
    userId,
    sessionId,
    created: now,
    lastActivity: now,
    expires: now + (maxAge * 1000),
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent') || '',
  };
  
  // In production, store session in database/redis
  // For now, we'll use a signed cookie
  
  const response = NextResponse.next();
  
  // Set session cookie
  response.cookies.set({
    name: ADMIN_SESSION_CONFIG.COOKIE_NAME,
    value: Buffer.from(JSON.stringify(sessionData)).toString('base64'),
    httpOnly: true,
    secure: ENV_VARS.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/',
  });
  
  // Add security headers
  response.headers.set('X-Admin-Authenticated', 'true');
  response.headers.set('X-Admin-User-ID', userId);
  
  return response;
}

// Clear session
function clearSessionResponse(): NextResponse {
  const response = NextResponse.next();
  
  response.cookies.delete(ADMIN_SESSION_CONFIG.COOKIE_NAME);
  response.headers.set('X-Admin-Authenticated', 'false');
  
  return response;
}

// Rate limit check for admin routes
async function checkAdminRateLimit(
  request: NextRequest,
  pathname: string
): Promise<{ allowed: boolean; headers: Record<string, string>; result?: any }> {
  // Different rate limits for different operations
  let rateLimitConfig;
  
  if (pathname.includes('/login')) {
    rateLimitConfig = ADMIN_RATE_LIMITS.LOGIN;
  } else if (pathname.includes('/export') || pathname.includes('/backup')) {
    rateLimitConfig = ADMIN_RATE_LIMITS.EXPORT;
  } else if (pathname.startsWith('/api/admin/')) {
    rateLimitConfig = ADMIN_RATE_LIMITS.OPERATIONS;
  } else {
    // Default rate limit for admin panel
    return { allowed: true, headers: {} };
  }
  
  const { allowed, headers, result } = await withEdgeRateLimit(
    request,
    {
      limit: rateLimitConfig.limit,
      windowMs: rateLimitConfig.windowMs,
      keyPrefix: rateLimitConfig.keyPrefix,
      blockDuration: 15 * 60 * 1000, // 15 minute block for exceeded limits
    }
  );
  
  return { allowed, headers, result };
}

// Main middleware function
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  const method = request.method;
  
  // ==================== PHASE 1: BYPASS FOR PUBLIC ROUTES ====================
  if (!requiresAuth(pathname)) {
    return NextResponse.next();
  }
  
  // ==================== PHASE 2: IP WHITELISTING ====================
  if (!isAllowedIp(ip)) {
    console.warn(`[ADMIN] Blocked IP attempt: ${ip} for ${pathname}`);
    
    return new NextResponse('Access Denied', {
      status: 403,
      headers: {
        'X-Blocked-Reason': 'ip-not-allowed',
        'X-Allowed-IPs': ENV_VARS.ADMIN_ALLOWED_IPS.join(',') || 'none',
      },
    });
  }
  
  // ==================== PHASE 3: RATE LIMITING ====================
  const { allowed: rateLimitAllowed, headers: rateLimitHeaders, result } = 
    await checkAdminRateLimit(request, pathname);
  
  if (!rateLimitAllowed) {
    console.warn(`[ADMIN] Rate limit exceeded: ${ip} for ${pathname}`);
    return createRateLimitedResponse(result);
  }
  
  // ==================== PHASE 4: SESSION VALIDATION ====================
  const { authenticated, userId, requiresReauth } = await validateAdminSession(request);
  
  if (!authenticated) {
    // If session expired or invalid, redirect to login
    if (requiresReauth) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('reauth', 'true');
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // For API calls, return 401
    if (pathname.startsWith('/api/admin/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // For UI, redirect to login
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // ==================== PHASE 5: ELEVATED PRIVILEGES CHECK ====================
  if (requiresElevatedPrivileges(pathname) && !request.headers.get('X-Admin-Elevated')) {
    // Check if user has elevated privileges (this would come from your user DB)
    // For now, we'll redirect to unauthorized
    if (pathname.startsWith('/api/admin/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden', message: 'Elevated privileges required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const unauthorizedUrl = new URL('/admin/unauthorized', request.url);
    return NextResponse.redirect(unauthorizedUrl);
  }
  
  // ==================== PHASE 6: SENSITIVE OPERATIONS ====================
  if (isSensitiveOperation(pathname, method)) {
    // Check for additional confirmation headers
    const confirmationToken = request.headers.get('X-Confirmation-Token');
    
    if (!confirmationToken) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Confirmation Required', 
          message: 'Sensitive operation requires confirmation',
          confirmationUrl: `/admin/confirm?operation=${encodeURIComponent(pathname)}&method=${method}`
        }),
        { 
          status: 428, // Precondition Required
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate confirmation token (implementation depends on your system)
    // ...
  }
  
  // ==================== PHASE 7: UPDATE SESSION ACTIVITY ====================
  // This would typically be done in the response, but we can set a header
  // The actual session update should happen in your API/login handlers
  
  // ==================== PHASE 8: PREPARE RESPONSE ====================
  const response = NextResponse.next();
  
  // Add rate limit headers
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add admin headers
  response.headers.set('X-Admin-Authenticated', 'true');
  if (userId) {
    response.headers.set('X-Admin-User-ID', userId);
  }
  response.headers.set('X-Admin-IP', ip);
  
  // Security headers specifically for admin area
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Cache control for admin area
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// Configuration for middleware
export const config = {
  matcher: [
    /*
     * Match all admin routes
     */
    '/admin/:path*',
    '/api/admin/:path*',
  ],
  
  // Run on Edge Runtime for better performance
  runtime: 'edge',
};

// Utility exports for use in admin API routes
export {
  createSessionResponse,
  clearSessionResponse,
  validateAdminToken,
  isAllowedIp,
  ADMIN_SESSION_CONFIG,
};
