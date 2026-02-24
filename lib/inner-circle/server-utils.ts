import { getInnerCircleAccess, type InnerCircleTier, type InnerCircleAccess } from './access.server';

/**
 * Extract client IP from request headers with strict type safety
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  
  if (forwarded) {
    // Explicitly handle the potential for an empty split result
    const parts = forwarded.split(',');
    const firstIp = parts[0]?.trim();
    if (firstIp) return firstIp;
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  return 'unknown';
}

/**
 * Create a rate limit key based on IP
 */
export function rateLimitForRequestIp(req: Request): string {
  const ip = getClientIp(req);
  return `rate-limit:${ip}`;
}

/**
 * Create a rate limit key based on IP and user ID
 */
export function rateLimitForUser(req: Request, userId: string): string {
  const ip = getClientIp(req);
  return `rate-limit:${userId}:${ip}`;
}

/**
 * Check if a request has access to a specific tier
 */
export function checkRequestAccess(
  req: Request,
  userTier?: InnerCircleTier,
  requiresTier: InnerCircleTier = 'basic'
): InnerCircleAccess {
  return getInnerCircleAccess({
    userTier,
    requiresTier
  });
}

/**
 * Extract authorization token from request
 */
export function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Create a secure session cookie string
 */
export function createSessionCookie(token: string, expiresInDays: number = 90): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + expiresInDays);
  
  return `innerCircleToken=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expires.toUTCString()}`;
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): string {
  return 'innerCircleToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Get user agent for analytics
 */
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown';
}

/**
 * Check if request is from a bot/crawler
 */
export function isBot(req: Request): boolean {
  const ua = getUserAgent(req).toLowerCase();
  const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'headless', 'python', 'curl', 'wget'];
  return botPatterns.some(pattern => ua.includes(pattern));
}

/**
 * Create audit log entry
 */
export function createAuditLog(
  action: string,
  userId?: string,
  metadata?: Record<string, any>
): {
  timestamp: string;
  action: string;
  userId?: string;
  metadata?: Record<string, any>;
} {
  return {
    timestamp: new Date().toISOString(),
    action,
    userId,
    metadata
  };
}

/**
 * Sanitize user data for logging (remove PII)
 */
export function sanitizeForLogging<T extends Record<string, any>>(data: T): Partial<T> {
  const sensitiveFields = ['email', 'password', 'token', 'secret', 'key', 'authorization', 'cookie'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field as keyof T] = '[REDACTED]' as any;
    }
  }
  
  return sanitized;
}