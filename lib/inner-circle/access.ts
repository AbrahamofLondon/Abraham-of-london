// lib/inner-circle/access.ts
import { verifyInnerCircleKeyWithRateLimit } from '@/lib/inner-circle';
import { rateLimitInnerCircleAccess } from '@/lib/inner-circle';

const COOKIE_NAME = "innerCircleAccess";
const TOKEN_PREFIX = "ic_access_";
const DEFAULT_TOKEN_EXPIRY_DAYS = 30;
const REFRESH_WINDOW_DAYS = 7;

// Environment configuration
const ENV = {
  NODE_ENV: process.env.NODE_ENV,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  TOKEN_SECRET: process.env.INNER_CIRCLE_TOKEN_SECRET,
} as const;

/**
 * Type representing the access state of a user
 */
export interface AccessState {
  /** Whether the user has access to inner circle content */
  hasAccess: boolean;
  /** Compatible with older code expecting 'ok' property */
  ok: boolean;
  /** Reason for access status (for debugging/UI) */
  reason: "granted" | "missing" | "expired" | "invalid" | "suspended" | "rate_limited";
  /** The access token value if present */
  token?: string | null;
  /** Timestamp when access was last checked */
  checkedAt: Date;
  /** Optional: Expiry timestamp if the token has an expiration */
  expiresAt?: Date;
  /** Optional: User's tier/level within the inner circle */
  tier?: "member" | "patron" | "founder" | "guest";
  /** Optional: Member information if available */
  member?: {
    id: string;
    email?: string;
    name?: string;
    joinedAt?: Date;
  };
  /** Optional: Rate limiting information */
  rateLimit?: {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    blocked?: boolean;
    blockUntil?: Date;
  };
  /** Optional: Metadata for debugging */
  metadata?: {
    tokenType?: 'cookie' | 'bearer' | 'query';
    source?: 'client' | 'server';
    validationTime?: number;
  };
}

/**
 * Enhanced token validation result
 */
interface TokenValidationResult {
  isValid: boolean;
  reason: AccessState['reason'];
  member?: AccessState['member'];
  tier?: AccessState['tier'];
  expiresAt?: Date;
  tokenData?: {
    type: string;
    version: number;
    issuedAt: Date;
  };
}

/**
 * Parse token to extract information
 */
function parseToken(token: string): TokenValidationResult {
  if (!token || token.length < 10) {
    return { isValid: false, reason: 'invalid' };
  }

  // Check if it's a simple cookie token (legacy format)
  if (token === 'true' || token === 'false') {
    return { 
      isValid: token === 'true', 
      reason: token === 'true' ? 'granted' : 'invalid' 
    };
  }

  // Check if it's an access key (IC- format)
  if (token.startsWith('IC-')) {
    // This is an access key that needs verification
    return { isValid: false, reason: 'invalid' }; // Will be validated separately
  }

  // Check if it's a JWT-like token (enhanced format)
  if (token.includes('.')) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { isValid: false, reason: 'invalid' };
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { isValid: false, reason: 'expired' };
      }

      return {
        isValid: true,
        reason: 'granted',
        member: payload.sub ? {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          joinedAt: payload.joinedAt ? new Date(payload.joinedAt) : undefined,
        } : undefined,
        tier: payload.tier,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
        tokenData: {
          type: payload.type || 'access',
          version: payload.ver || 1,
          issuedAt: payload.iat ? new Date(payload.iat * 1000) : new Date(),
        }
      };
    } catch (error) {
      return { isValid: false, reason: 'invalid' };
    }
  }

  // Default: assume it's a legacy access token
  return { isValid: true, reason: 'granted' };
}

/**
 * Validate access key against the database
 */
async function validateAccessKey(key: string, req?: any): Promise<TokenValidationResult> {
  try {
    const { verification, rateLimit } = await verifyInnerCircleKeyWithRateLimit(key, req);
    
    if (!verification.valid) {
      return { 
        isValid: false, 
        reason: verification.status === 'revoked' ? 'suspended' : 'invalid',
      };
    }

    return {
      isValid: true,
      reason: 'granted',
      member: verification.member ? {
        id: verification.member.id,
        email: verification.member.email,
        name: verification.member.name,
        joinedAt: verification.member.createdAt,
      } : undefined,
      tier: 'member', // Default tier
      expiresAt: verification.expiresAt,
    };
  } catch (error) {
    console.error('[Access] Key validation error:', error);
    return { isValid: false, reason: 'invalid' };
  }
}

function getCookieValueFromDocument(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!match || !match[1]) return null;
  return decodeURIComponent(match[1]);
}

function getCookieValueFromHeader(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    const k = p.slice(0, eq);
    const v = p.slice(eq + 1);
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

/**
 * Extract token from various sources (cookie, Authorization header, query param)
 */
function extractTokenFromRequest(req?: any): { token: string | null; source: 'cookie' | 'bearer' | 'query' | 'none' } {
  if (!req) {
    // Client-side: get from cookie
    const token = getCookieValueFromDocument(COOKIE_NAME);
    return { token, source: token ? 'cookie' : 'none' };
  }

  // Server-side: check multiple sources
  
  // 1. Check Authorization header (Bearer token)
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token && token.length > 10) {
      return { token, source: 'bearer' };
    }
  }

  // 2. Check cookie
  const cookieHeader = req.headers?.cookie;
  const cookieToken = getCookieValueFromHeader(cookieHeader, COOKIE_NAME);
  if (cookieToken) {
    return { token: cookieToken, source: 'cookie' };
  }

  // 3. Check query parameter (for direct access links)
  const queryToken = req.query?.accessKey || req.query?.key;
  if (queryToken && typeof queryToken === 'string' && queryToken.length > 10) {
    return { token: queryToken, source: 'query' };
  }

  // 4. Check body (for API requests)
  if (req.body?.accessKey || req.body?.key) {
    const bodyToken = req.body.accessKey || req.body.key;
    if (bodyToken && typeof bodyToken === 'string' && bodyToken.length > 10) {
      return { token: bodyToken, source: 'query' }; // Treat as query for consistency
    }
  }

  return { token: null, source: 'none' };
}

/**
 * Enhanced access check with Redis rate limiting
 * 
 * Client call: getInnerCircleAccess()
 * Server call: getInnerCircleAccess(req)
 * 
 * Returns: AccessState object with detailed access information
 */
export async function getInnerCircleAccess(req?: any): Promise<AccessState> {
  const startTime = Date.now();
  const { token, source } = extractTokenFromRequest(req);
  const now = new Date();
  
  // Prepare default response
  const defaultResponse: AccessState = {
    hasAccess: false,
    ok: false,
    reason: 'missing',
    checkedAt: now,
    metadata: {
      tokenType: source !== 'none' ? source : undefined,
      source: req ? 'server' : 'client',
      validationTime: 0,
    }
  };

  if (!token) {
    return defaultResponse;
  }

  try {
    // Apply rate limiting for server requests
    let rateLimitResult;
    if (req) {
      const { getClientIp } = await import('@/lib/rate-limit');
      const ip = getClientIp(req);
      rateLimitResult = await rateLimitInnerCircleAccess(ip);
      
      if (!rateLimitResult.allowed) {
        return {
          ...defaultResponse,
          token,
          reason: 'rate_limited',
          rateLimit: {
            allowed: rateLimitResult.allowed,
            remaining: rateLimitResult.remaining,
            resetAt: new Date(rateLimitResult.resetAt),
            blocked: rateLimitResult.blocked,
            blockUntil: rateLimitResult.blockUntil ? new Date(rateLimitResult.blockUntil) : undefined,
          },
          metadata: {
            ...defaultResponse.metadata,
            validationTime: Date.now() - startTime,
          }
        };
      }
    }

    // Validate the token
    let validationResult: TokenValidationResult;
    
    if (token.startsWith('IC-')) {
      // Validate as access key (requires database check)
      validationResult = await validateAccessKey(token, req);
    } else {
      // Validate as token (local validation)
      validationResult = parseToken(token);
    }

    const validationTime = Date.now() - startTime;

    // Build response
    const response: AccessState = {
      hasAccess: validationResult.isValid,
      ok: validationResult.isValid,
      reason: validationResult.reason,
      token: validationResult.isValid ? token : null,
      checkedAt: now,
      expiresAt: validationResult.expiresAt,
      tier: validationResult.tier,
      member: validationResult.member,
      rateLimit: rateLimitResult ? {
        allowed: rateLimitResult.allowed,
        remaining: rateLimitResult.remaining,
        resetAt: new Date(rateLimitResult.resetAt),
        blocked: rateLimitResult.blocked,
        blockUntil: rateLimitResult.blockUntil ? new Date(rateLimitResult.blockUntil) : undefined,
      } : undefined,
      metadata: {
        tokenType: source,
        source: req ? 'server' : 'client',
        validationTime,
        ...validationResult.tokenData,
      }
    };

    return response;

  } catch (error) {
    console.error('[Access] Validation error:', error);
    return {
      ...defaultResponse,
      token,
      reason: 'invalid',
      metadata: {
        ...defaultResponse.metadata,
        validationTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    };
  }
}

/**
 * Legacy function for backward compatibility
 * Returns: boolean indicating if user has access
 */
export async function hasInnerCircleAccess(req?: any): Promise<boolean> {
  const accessState = await getInnerCircleAccess(req);
  return accessState.hasAccess;
}

/**
 * Create an access token for a member
 * In production, this should use proper JWT with signing
 */
export function createAccessToken(member: {
  id: string;
  email?: string;
  name?: string;
  tier?: AccessState['tier'];
}): string {
  const payload = {
    sub: member.id,
    email: member.email,
    name: member.name,
    tier: member.tier || 'member',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (DEFAULT_TOKEN_EXPIRY_DAYS * 24 * 60 * 60),
    type: 'access',
    ver: 2,
  };

  // In production, sign this with a secret key
  // For now, we'll use a simple base64 encoding
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = btoa('unsigned'); // Placeholder
  
  return `${header}.${body}.${signature}`;
}

/**
 * Set access cookie (client-side only)
 */
export function setAccessCookie(token: string, options?: {
  expiresInDays?: number;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}): void {
  if (typeof document === 'undefined') {
    throw new Error('setAccessCookie can only be called on the client');
  }

  const expiresInDays = options?.expiresInDays || DEFAULT_TOKEN_EXPIRY_DAYS;
  const secure = options?.secure ?? ENV.NODE_ENV === 'production';
  const sameSite = options?.sameSite ?? 'strict';

  const expires = new Date();
  expires.setDate(expires.getDate() + expiresInDays);

  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; expires=${expires.toUTCString()}; path=/; ${secure ? 'secure; ' : ''}sameSite=${sameSite}`;
}

/**
 * Clear access cookie (client-side only)
 */
export function clearAccessCookie(): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Generate access headers for API requests
 */
export function generateAccessHeaders(token?: string): Record<string, string> {
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'X-Inner-Circle-Access': 'true',
  };
}

/**
 * Check if token needs refresh (within refresh window)
 */
export function needsTokenRefresh(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  
  const now = new Date();
  const refreshWindow = new Date(expiresAt);
  refreshWindow.setDate(refreshWindow.getDate() - REFRESH_WINDOW_DAYS);
  
  return now >= refreshWindow && now < expiresAt;
}

export default {
  getInnerCircleAccess,
  hasInnerCircleAccess,
  createAccessToken,
  setAccessCookie,
  clearAccessCookie,
  generateAccessHeaders,
  needsTokenRefresh,
  COOKIE_NAME,
};