// middleware/sovereign.ts
import { NextRequest, NextResponse } from 'next/server';
import { SovereignAuthService } from '@/lib/auth/sovereign/service';
import { validateAuthority, validateThreshold, type ConstitutionalAuthority } from '@/lib/constitution/constitutional-authority';
import { SovereignDataEncryption } from '@/lib/constitution/sovereign-data';

const authService = SovereignAuthService.getInstance();

// Sovereign protected routes with granular authority requirements
const SOVEREIGN_PROTECTED_ROUTES = {
  // Read-only access
  '/dashboard': { minAuthority: 'PARTICIPANT', audit: true },
  '/pdf-dashboard': { minAuthority: 'PARTICIPANT', audit: true },
  '/api/campaigns/:path*/report': { minAuthority: 'PARTICIPANT', audit: true },
  
  // Administrative actions
  '/admin/reporting': { minAuthority: 'AUTHORITY', audit: true, requireSignature: true },
  '/admin/campaigns': { minAuthority: 'DELEGATE', audit: true, requireSignature: false },
  '/api/admin/campaigns/:path*': { minAuthority: 'AUTHORITY', audit: true, requireSignature: true },
  
  // Constitutional operations
  '/api/constitutional/export': { minAuthority: 'PARTICIPANT', audit: true, requireSignature: false },
  '/api/constitutional/appeal': { minAuthority: 'PARTICIPANT', audit: true, requireSignature: true },
  '/api/constitutional/audit': { minAuthority: 'AUTHORITY', audit: true, requireSignature: true },
  '/api/constitutional/override': { minAuthority: 'SOVEREIGN', audit: true, requireSignature: true, requireQuorum: true },
  
  // Strategic interventions
  '/api/interventions': { minAuthority: 'DELEGATE', audit: true, requireSignature: true },
  '/api/strategy-room': { minAuthority: 'PARTICIPANT', audit: true, requireSignature: false },
  
  // Alignment assessments
  '/api/alignment/assess': { minAuthority: 'PARTICIPANT', audit: true, requireSignature: false },
  '/api/purpose-alignment': { minAuthority: 'PARTICIPANT', audit: true, requireSignature: false },
};

// Paths that are exempt from sovereign auth
const SOVEREIGN_EXEMPT_PATHS = [
  '/restricted',
  '/api/auth/sovereign',
  '/api/auth/sovereign/login',
  '/api/auth/sovereign/logout',
  '/api/auth/sovereign/verify',
  '/api/auth/sovereign/register',
  '/_next',
  '/favicon.ico',
  '/assets',
  '/public',
  '/api/health',
  '/api/webhooks',
];

// Rate limiting configuration
const RATE_LIMITS = {
  DEFAULT: { window: 60 * 1000, max: 100 }, // 100 requests per minute
  ADMIN: { window: 60 * 1000, max: 50 },     // 50 requests per minute
  CONSTITUTIONAL: { window: 60 * 1000, max: 20 }, // 20 requests per minute
};

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export function isSovereignProtected(pathname: string): { protected: boolean; config?: typeof SOVEREIGN_PROTECTED_ROUTES[keyof typeof SOVEREIGN_PROTECTED_ROUTES] } {
  // Check exempt paths
  if (SOVEREIGN_EXEMPT_PATHS.some(p => pathname === p)) return { protected: false };
  if (SOVEREIGN_EXEMPT_PATHS.some(p => pathname.startsWith(p))) return { protected: false };
  
  // Check protected routes with pattern matching
  for (const [pattern, config] of Object.entries(SOVEREIGN_PROTECTED_ROUTES)) {
    // Convert pattern to regex (handle :path* wildcards)
    const regexPattern = pattern
      .replace(/:[^/]+/g, '[^/]+')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    
    if (regex.test(pathname)) {
      return { protected: true, config };
    }
  }
  
  return { protected: false };
}

export function validateSovereignSession(request: NextRequest): { valid: boolean; authority?: ConstitutionalAuthority } {
  const sessionToken = request.cookies.get('sovereign_session')?.value;
  
  // Development bypass (never in production)
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_SOVEREIGN === 'true') {
    return { valid: true, authority: { 
      userId: 'dev-user',
      campaignId: 'dev-campaign',
      authorityLevel: 'SOVEREIGN',
      grantedAt: new Date().toISOString(),
      grantedBy: 'system',
      signature: 'dev-signature',
      scope: ['*'],
    } as ConstitutionalAuthority };
  }
  
  if (!sessionToken) {
    return { valid: false };
  }
  
  // Validate and decode session
  try {
    const authority = authService.validateSession(sessionToken);
    if (!authority) {
      return { valid: false };
    }
    
    // Check if authority has expired
    if (authority.expiresAt && new Date(authority.expiresAt) < new Date()) {
      return { valid: false };
    }
    
    return { valid: true, authority };
  } catch (error) {
    console.error('[Sovereign] Session validation failed:', error);
    return { valid: false };
  }
}

export function checkRateLimit(identifier: string, route: string): { allowed: boolean; resetAfter?: number } {
  // Determine rate limit config based on route
  let config = RATE_LIMITS.DEFAULT;
  if (route.includes('/admin/')) config = RATE_LIMITS.ADMIN;
  if (route.includes('/constitutional/')) config = RATE_LIMITS.CONSTITUTIONAL;
  
  const now = Date.now();
  const record = rateLimitStore[identifier];
  
  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore[identifier] = {
      count: 1,
      resetAt: now + config.window,
    };
    return { allowed: true };
  }
  
  if (record.count >= config.max) {
    return { 
      allowed: false, 
      resetAfter: Math.ceil((record.resetAt - now) / 1000) 
    };
  }
  
  record.count++;
  return { allowed: true };
}

export async function handleSovereignRedirect(request: NextRequest, returnTo?: string): Promise<NextResponse> {
  const url = new URL('/restricted', request.url);
  if (returnTo) {
    url.searchParams.set('returnTo', returnTo);
  } else {
    url.searchParams.set('returnTo', request.nextUrl.pathname);
  }
  return NextResponse.redirect(url, 307);
}

export async function auditConstitutionalAction(
  request: NextRequest,
  action: string,
  authority: ConstitutionalAuthority,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Log audit entry asynchronously
  const auditEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId: authority.userId,
    action,
    path: request.nextUrl.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    authorityLevel: authority.authorityLevel,
    metadata,
  };
  
  // In production, send to audit service/database
  if (process.env.NODE_ENV === 'production') {
    try {
      await fetch(`${process.env.INTERNAL_API_URL}/api/audit/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditEntry),
      });
    } catch (error) {
      console.error('[Sovereign] Audit logging failed:', error);
    }
  } else {
    console.log('[Sovereign Audit]', auditEntry);
  }
}

export async function sovereignMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  
  // Check if path is sovereign protected
  const { protected: isProtected, config } = isSovereignProtected(pathname);
  
  if (!isProtected) {
    return null; // Continue to next middleware
  }
  
  // Validate session
  const { valid: sessionValid, authority } = validateSovereignSession(request);
  
  if (!sessionValid) {
    // Redirect to restricted page with return URL
    return await handleSovereignRedirect(request);
  }
  
  // Check rate limiting
  const rateLimitKey = `${authority?.userId || 'anonymous'}:${pathname}`;
  const rateLimit = checkRateLimit(rateLimitKey, pathname);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Rate limit exceeded',
        resetAfter: rateLimit.resetAfter,
      },
      { status: 429 }
    );
  }
  
  // Validate authority level if required
  if (config && authority) {
    const authorityLevels = {
      OBSERVER: 0,
      PARTICIPANT: 1,
      DELEGATE: 2,
      AUTHORITY: 3,
      SOVEREIGN: 4,
    };
    
    const requiredLevel = authorityLevels[config.minAuthority as keyof typeof authorityLevels];
    const currentLevel = authorityLevels[authority.authorityLevel];
    
    if (currentLevel < requiredLevel) {
      // Audit unauthorized access attempt
      await auditConstitutionalAction(request, 'UNAUTHORIZED_ACCESS_ATTEMPT', authority, {
        required: config.minAuthority,
        actual: authority.authorityLevel,
      });
      
      return NextResponse.json(
        { 
          ok: false, 
          error: `Insufficient authority: ${authority.authorityLevel} < ${config.minAuthority}`,
          requiredLevel: config.minAuthority,
        },
        { status: 403 }
      );
    }
    
    // Check scope if authority has restricted scope
    if (authority.scope && authority.scope.length > 0 && !authority.scope.includes('*')) {
      const pathMatchesScope = authority.scope.some(scope => pathname.startsWith(scope));
      if (!pathMatchesScope) {
        return NextResponse.json(
          { ok: false, error: 'Action outside authorized scope' },
          { status: 403 }
        );
      }
    }
    
    // Check for signature requirement on mutating operations
    if (config.requireSignature && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const signature = request.headers.get('X-Constitutional-Signature');
      if (!signature) {
        return NextResponse.json(
          { ok: false, error: 'Constitutional signature required for this operation' },
          { status: 400 }
        );
      }
      
      // Validate signature
      const isValidSignature = await authService.validateSignature(signature, authority, {
        path: pathname,
        method: request.method,
        timestamp: request.headers.get('X-Request-Timestamp') || Date.now().toString(),
      });
      
      if (!isValidSignature) {
        await auditConstitutionalAction(request, 'INVALID_SIGNATURE', authority);
        return NextResponse.json(
          { ok: false, error: 'Invalid constitutional signature' },
          { status: 401 }
        );
      }
    }
    
    // Check quorum requirement for sovereign operations
    if (config.requireQuorum) {
      const campaignId = pathname.split('/')[3]; // Extract campaign ID
      const participantCount = await getParticipantCount(campaignId);
      const threshold = await getThreshold(campaignId);
      const quorumValidation = validateThreshold(participantCount, threshold);
      
      if (!quorumValidation.valid) {
        return NextResponse.json(
          { 
            ok: false, 
            error: quorumValidation.reason,
            requiredThreshold: threshold,
            currentParticipants: participantCount,
          },
          { status: 403 }
        );
      }
    }
    
    // Audit the request
    await auditConstitutionalAction(request, 'API_ACCESS', authority, {
      config,
    });
  }
  
  // Add sovereignty headers
  const response = NextResponse.next();
  response.headers.set('X-Sovereign-Authority', authority?.authorityLevel || 'NONE');
  response.headers.set('X-Sovereign-Session', 'active');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add CSP for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
  }
  
  return response;
}

async function getParticipantCount(campaignId: string): Promise<number> {
  // In production, fetch from database
  // This is a placeholder - implement actual DB query
  return 0;
}

async function getThreshold(campaignId: string): Promise<number> {
  // In production, fetch from campaign settings
  // Default threshold is 5
  return 5;
}

// Export for use in middleware.ts
export default sovereignMiddleware;