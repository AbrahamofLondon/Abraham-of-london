// lib/security/index.ts
// Central security configuration and utilities for AoL platform
// Production-ready with comprehensive security features

import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";

// -----------------------------------------------------------------------------
// 1. Configuration (lib/security/config.ts)
// -----------------------------------------------------------------------------
export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    algorithm: string;
    issuer: string;
    audience: string;
  };
  api: {
    rateLimit: {
      enabled: boolean;
      windowMs: number;
      maxRequests: number;
      skipSuccessfulRequests: boolean;
      trustProxy: boolean;
    };
    allowedOrigins: string[];
    corsHeaders: string[];
    maxBodySize: string;
    timeout: number;
  };
  cookies: {
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    prefix: string;
    domain?: string;
    path: string;
  };
  session: {
    maxAge: number;
    updateAge: number;
    rolling: boolean;
    sameSite: boolean;
  };
  csp: {
    enabled: boolean;
    directives: Record<string, string[]>;
    reportOnly: boolean;
    reportUri?: string;
  };
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    sampleRate: number;
    sentryDsn?: string;
  };
  featureFlags: {
    requireEmailVerification: boolean;
    enable2FA: boolean;
    enforceStrongPasswords: boolean;
    sessionTimeout: boolean;
    suspiciousActivityDetection: boolean;
  };
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  jwt: {
    secret: '',
    expiresIn: '7d',
    algorithm: 'HS256',
    issuer: 'art-of-learning',
    audience: 'art-of-learning-users',
  },
  api: {
    rateLimit: {
      enabled: true,
      windowMs: 900000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false,
      trustProxy: true,
    },
    allowedOrigins: ['http://localhost:3000', 'https://artoflearning.ai'],
    corsHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxBodySize: '10mb',
    timeout: 30000,
  },
  cookies: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    prefix: '__Secure-',
    path: '/',
  },
  session: {
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    updateAge: 24 * 60 * 60, // 1 day
    rolling: false,
    sameSite: true,
  },
  csp: {
    enabled: process.env.NODE_ENV === 'production',
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", 'https://*.artoflearning.ai'],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https:'],
      'connect-src': ["'self'", 'https://*.artoflearning.ai'],
      'frame-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
    },
    reportOnly: false,
    reportUri: '/api/csp-report',
  },
  hsts: {
    enabled: process.env.NODE_ENV === 'production',
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: false,
  },
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    logLevel: 'info',
    sampleRate: 0.1,
    sentryDsn: process.env.SENTRY_DSN,
  },
  featureFlags: {
    requireEmailVerification: true,
    enable2FA: false,
    enforceStrongPasswords: true,
    sessionTimeout: true,
    suspiciousActivityDetection: true,
  },
};

class SecurityConfiguration {
  private static instance: SecurityConfiguration;
  private config: SecurityConfig;
  private initialized = false;
  
  private constructor() {
    this.config = { ...DEFAULT_SECURITY_CONFIG };
  }
  
  static getInstance(): SecurityConfiguration {
    if (!SecurityConfiguration.instance) {
      SecurityConfiguration.instance = new SecurityConfiguration();
    }
    return SecurityConfiguration.instance;
  }
  
  initialize(env: NodeJS.ProcessEnv = process.env): void {
    if (this.initialized) return;
    
    this.config = {
      ...this.config,
      jwt: {
        ...this.config.jwt,
        secret: env.INNER_CIRCLE_JWT_SECRET || env.JWT_SECRET || 'fallback-secret-change-in-production',
        expiresIn: env.JWT_EXPIRES_IN || this.config.jwt.expiresIn,
        algorithm: env.JWT_ALGORITHM || this.config.jwt.algorithm,
        issuer: env.JWT_ISSUER || this.config.jwt.issuer,
        audience: env.JWT_AUDIENCE || this.config.jwt.audience,
      },
      api: {
        ...this.config.api,
        allowedOrigins: (env.ALLOWED_ORIGINS || this.config.api.allowedOrigins.join(',')).split(','),
        rateLimit: {
          enabled: env.RATE_LIMIT_ENABLED !== 'false',
          windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || String(this.config.api.rateLimit.windowMs)),
          maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS || String(this.config.api.rateLimit.maxRequests)),
          skipSuccessfulRequests: env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
          trustProxy: env.RATE_LIMIT_TRUST_PROXY !== 'false',
        },
      },
      cookies: {
        ...this.config.cookies,
        secure: env.NODE_ENV === 'production',
        domain: env.COOKIE_DOMAIN,
        path: env.COOKIE_PATH || this.config.cookies.path,
      },
      monitoring: {
        ...this.config.monitoring,
        sentryDsn: env.SENTRY_DSN,
      },
      featureFlags: {
        requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION !== 'false',
        enable2FA: env.ENABLE_2FA === 'true',
        enforceStrongPasswords: env.ENFORCE_STRONG_PASSWORDS !== 'false',
        sessionTimeout: env.SESSION_TIMEOUT !== 'false',
        suspiciousActivityDetection: env.SUSPICIOUS_ACTIVITY_DETECTION !== 'false',
      },
    };
    
    this.initialized = true;
  }
  
  getConfig(): SecurityConfig {
    if (!this.initialized) {
      this.initialize();
    }
    return { ...this.config };
  }
  
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.getConfig();
    
    // JWT validation
    if (!config.jwt.secret || config.jwt.secret === 'fallback-secret-change-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
    
    if (config.jwt.secret.length < 32) {
      errors.push('JWT_SECRET should be at least 32 characters');
    }
    
    // API validation
    if (config.api.allowedOrigins.length === 0) {
      errors.push('At least one ALLOWED_ORIGIN must be configured');
    }
    
    if (config.api.rateLimit.maxRequests <= 0) {
      errors.push('RATE_LIMIT_MAX_REQUESTS must be positive');
    }
    
    if (config.api.rateLimit.windowMs <= 0) {
      errors.push('RATE_LIMIT_WINDOW_MS must be positive');
    }
    
    // Cookie validation
    if (config.cookies.secure && config.cookies.sameSite === 'none') {
      errors.push('Cookies with sameSite="none" must have secure=true');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  getPublicConfig(): Partial<SecurityConfig> {
    // Return only safe-to-expose configuration
    const config = this.getConfig();
    return {
      api: {
        timeout: config.api.timeout,
        maxBodySize: config.api.maxBodySize,
      },
      monitoring: {
        enabled: config.monitoring.enabled,
        logLevel: config.monitoring.logLevel,
      },
      featureFlags: config.featureFlags,
    };
  }
}

export const securityConfig = SecurityConfiguration.getInstance();

// -----------------------------------------------------------------------------
// 2. Monitoring (lib/security/middleware-utils.ts)
// -----------------------------------------------------------------------------
export interface SecurityMetrics {
  blockedRequests: number;
  rateLimitedRequests: number;
  maliciousPatterns: string[];
  suspiciousIPs: Set<string>;
  successfulLogins: number;
  failedLogins: number;
  suspiciousActivities: number;
  securityEvents: SecurityEvent[];
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'login' | 'access_denied' | 'rate_limit' | 'malicious_pattern' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  userId?: string;
  path: string;
  details: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface RequestLog {
  timestamp: string;
  ip: string;
  path: string;
  method: string;
  userAgent?: string;
  userId?: string;
  statusCode: number;
  responseTime: number;
  country?: string;
  userTier?: string;
}

export class SecurityMonitor {
  private metrics: SecurityMetrics;
  private requestLogs: RequestLog[] = [];
  private securityEvents: SecurityEvent[] = [];
  private maxLogSize = 10000;
  
  constructor() {
    this.metrics = {
      blockedRequests: 0,
      rateLimitedRequests: 0,
      maliciousPatterns: [],
      suspiciousIPs: new Set(),
      successfulLogins: 0,
      failedLogins: 0,
      suspiciousActivities: 0,
      securityEvents: [],
    };
  }
  
  logRequest(
    req: NextRequest | NextApiRequest, 
    action: 'allowed' | 'blocked' | 'rate-limited', 
    options?: {
      reason?: string;
      userId?: string;
      statusCode?: number;
      responseTime?: number;
      userTier?: string;
    }
  ): void {
    const ip = this.getClientIp(req);
    const path = this.getRequestPath(req);
    const method = this.getRequestMethod(req);
    const timestamp = new Date().toISOString();
    const userAgent = this.getUserAgent(req);
    const country = this.getRequestCountry(req);
    
    const logEntry: RequestLog = {
      timestamp,
      ip,
      path,
      method,
      userAgent,
      userId: options?.userId,
      statusCode: options?.statusCode || (action === 'allowed' ? 200 : action === 'blocked' ? 403 : 429),
      responseTime: options?.responseTime || 0,
      country,
      userTier: options?.userTier,
    };
    
    // Add to logs (with rotation)
    this.requestLogs.unshift(logEntry);
    if (this.requestLogs.length > this.maxLogSize) {
      this.requestLogs.pop();
    }
    
    // Update metrics
    switch (action) {
      case 'blocked':
        this.metrics.blockedRequests++;
        if (options?.reason?.includes('malicious')) {
          this.metrics.maliciousPatterns.push(options.reason);
          this.metrics.suspiciousIPs.add(ip);
          this.logSecurityEvent({
            type: 'malicious_pattern',
            severity: 'high',
            ip,
            path,
            details: { reason: options.reason },
          });
        }
        break;
      case 'rate-limited':
        this.metrics.rateLimitedRequests++;
        this.logSecurityEvent({
          type: 'rate_limit',
          severity: 'medium',
          ip,
          path,
          details: { 
            reason: options?.reason,
            userId: options?.userId,
          },
        });
        break;
    }
    
    // Console logging based on environment
    const config = securityConfig.getConfig();
    if (config.monitoring.enabled && config.monitoring.logLevel === 'debug') {
      const color = action === 'allowed' ? '✅' : action === 'blocked' ? '❌' : '⚠️';
      console.log(`${color} [${timestamp}] ${action.toUpperCase()} ${method} ${path} from ${ip}`);
    }
  }
  
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    this.securityEvents.unshift(securityEvent);
    this.metrics.securityEvents.unshift(securityEvent);
    
    // Keep only recent events
    if (this.metrics.securityEvents.length > 1000) {
      this.metrics.securityEvents.pop();
    }
    
    // Send to external monitoring if configured
    const config = securityConfig.getConfig();
    if (config.monitoring.enabled && config.monitoring.sentryDsn) {
      this.sendToSentry(securityEvent);
    }
  }
  
  logLogin(success: boolean, ip: string, userId?: string, userAgent?: string): void {
    if (success) {
      this.metrics.successfulLogins++;
    } else {
      this.metrics.failedLogins++;
      
      // Detect suspicious login patterns
      if (this.metrics.failedLogins % 5 === 0) {
        this.metrics.suspiciousActivities++;
        this.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'medium',
          ip,
          path: '/api/auth/login',
          userId,
          details: {
            event: 'multiple_failed_logins',
            count: this.metrics.failedLogins,
            userAgent,
          },
        });
      }
    }
  }
  
  getMetrics(): SecurityMetrics {
    return {
      ...this.metrics,
      suspiciousIPs: new Set(this.metrics.suspiciousIPs),
      securityEvents: [...this.metrics.securityEvents],
    };
  }
  
  getRequestLogs(limit = 100): RequestLog[] {
    return this.requestLogs.slice(0, limit);
  }
  
  clearOldLogs(maxAgeHours = 24): void {
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    this.requestLogs = this.requestLogs.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    );
  }
  
  private getClientIp(req: NextRequest | NextApiRequest): string {
    if ('headers' in req && req.headers) {
      const forwardedFor = req.headers.get?.('x-forwarded-for') || 
                          (req.headers as any)['x-forwarded-for'];
      if (forwardedFor) {
        return (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor).split(',')[0].trim();
      }
    }
    return 'unknown';
  }
  
  private getRequestPath(req: NextRequest | NextApiRequest): string {
    if ('nextUrl' in req) {
      return req.nextUrl.pathname;
    }
    return (req as NextApiRequest).url || 'unknown';
  }
  
  private getRequestMethod(req: NextRequest | NextApiRequest): string {
    if ('method' in req) {
      return req.method || 'unknown';
    }
    return 'unknown';
  }
  
  private getUserAgent(req: NextRequest | NextApiRequest): string | undefined {
    if ('headers' in req && req.headers) {
      return req.headers.get?.('user-agent') || 
             (req.headers as any)['user-agent'];
    }
    return undefined;
  }
  
  private getRequestCountry(req: NextRequest | NextApiRequest): string | undefined {
    if ('geo' in req && req.geo) {
      return (req as NextRequest).geo?.country;
    }
    return undefined;
  }
  
  private async sendToSentry(event: SecurityEvent): Promise<void> {
    // Implementation would depend on your monitoring setup
    // This is a placeholder for Sentry integration
    try {
      // const sentry = require('@sentry/nextjs');
      // sentry.captureEvent({
      //   message: `Security Event: ${event.type}`,
      //   level: event.severity as any,
      //   extra: event.details,
      // });
    } catch (error) {
      console.error('Failed to send to Sentry:', error);
    }
  }
}

// Singleton instance
export const securityMonitor = new SecurityMonitor();

// -----------------------------------------------------------------------------
// 3. Rate Limiting (lib/security/rateLimit.ts)
// -----------------------------------------------------------------------------
type Bucket = { 
  count: number; 
  resetAt: number;
  blockedUntil?: number;
};

export type LimitConfig = {
  windowMs: number;
  max: number;
  blockDuration?: number;
  keyGenerator?: (req: NextApiRequest) => string;
  skipSuccessfulRequests?: boolean;
};

export type LimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  key: string;
  blocked?: boolean;
  blockUntil?: number;
  retryAfter?: number;
};

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Clean up expired buckets every hour
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
  
  limit(
    key: string, 
    config: LimitConfig,
    increment = true
  ): LimitResult {
    const now = Date.now();
    
    // Check if blocked
    const existing = this.buckets.get(key);
    if (existing?.blockedUntil && now < existing.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.blockedUntil,
        limit: config.max,
        key,
        blocked: true,
        blockUntil: existing.blockedUntil,
        retryAfter: Math.ceil((existing.blockedUntil - now) / 1000),
      };
    }
    
    // Get or create bucket
    const bucket = this.getOrInitBucket(key, config.windowMs, now);
    
    // Increment if requested
    if (increment) {
      bucket.count += 1;
    }
    
    const allowed = bucket.count <= config.max;
    
    // Check if we should block this key
    if (!allowed && config.blockDuration) {
      bucket.blockedUntil = now + config.blockDuration;
    }
    
    const remaining = Math.max(0, config.max - bucket.count);
    
    return {
      allowed,
      remaining,
      resetAt: bucket.resetAt,
      limit: config.max,
      key,
      blocked: !!bucket.blockedUntil && now < bucket.blockedUntil,
      blockUntil: bucket.blockedUntil,
      retryAfter: bucket.blockedUntil ? Math.ceil((bucket.blockedUntil - now) / 1000) : undefined,
    };
  }
  
  /**
   * IP-based rate limiting with anonymization
   */
  limitByIp(
    req: NextApiRequest, 
    prefix: string, 
    config: LimitConfig
  ): LimitResult {
    const ip = getClientIp(req);
    const anon = anonymizeIp(ip);
    const key = `${prefix}:ip:${anon}`;
    
    return this.limit(key, config);
  }
  
  /**
   * User-based rate limiting
   */
  limitByUser(
    userId: string, 
    prefix: string, 
    config: LimitConfig
  ): LimitResult {
    const key = `${prefix}:user:${userId}`;
    return this.limit(key, config);
  }
  
  /**
   * Email-based rate limiting (prevents resend abuse)
   */
  limitByEmail(
    email: string, 
    prefix: string, 
    config: LimitResult
  ): LimitResult {
    const normalized = (email || "").trim().toLowerCase();
    const key = `${prefix}:email:${normalized || "unknown"}`;
    return this.limit(key, config);
  }
  
  /**
   * Endpoint-based rate limiting
   */
  limitByEndpoint(
    req: NextApiRequest,
    config: LimitConfig
  ): LimitResult {
    const path = req.url?.split('?')[0] || 'unknown';
    const method = req.method || 'GET';
    const ip = getClientIp(req);
    const anon = anonymizeIp(ip);
    
    const key = `endpoint:${method}:${path}:${anon}`;
    return this.limit(key, config);
  }
  
  /**
   * Set rate limit headers on response
   */
  setRateLimitHeaders(res: NextApiResponse, result: LimitResult): void {
    res.setHeader('X-RateLimit-Limit', String(result.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
    
    if (result.blocked) {
      res.setHeader('X-RateLimit-Blocked', 'true');
      res.setHeader('Retry-After', String(result.retryAfter));
    }
  }
  
  /**
   * Check rate limit without incrementing (for monitoring)
   */
  check(key: string, config: LimitConfig): LimitResult {
    return this.limit(key, config, false);
  }
  
  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }
  
  /**
   * Get current rate limit stats
   */
  getStats(): {
    totalBuckets: number;
    activeBuckets: number;
    blockedBuckets: number;
  } {
    const now = Date.now();
    let activeBuckets = 0;
    let blockedBuckets = 0;
    
    for (const bucket of this.buckets.values()) {
      if (now < bucket.resetAt) activeBuckets++;
      if (bucket.blockedUntil && now < bucket.blockedUntil) blockedBuckets++;
    }
    
    return {
      totalBuckets: this.buckets.size,
      activeBuckets,
      blockedBuckets,
    };
  }
  
  private getOrInitBucket(key: string, windowMs: number, now: number): Bucket {
    const existing = this.buckets.get(key);
    
    if (!existing || now > existing.resetAt) {
      const fresh = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, fresh);
      return fresh;
    }
    
    return existing;
  }
  
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, bucket] of this.buckets.entries()) {
      // Delete if bucket is expired and not blocked
      if (now > bucket.resetAt && (!bucket.blockedUntil || now > bucket.blockedUntil)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.buckets.delete(key);
    }
    
    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired rate limit buckets`);
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// -----------------------------------------------------------------------------
// Helper functions (moved from external files)
// -----------------------------------------------------------------------------
export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function anonymizeIp(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown';
  
  // IPv4: Replace last octet with 0
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
  }
  
  // IPv6: Replace last 64 bits with 0
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      // Keep first 4 segments, zero out the rest
      return `${parts.slice(0, 4).join(':')}::`;
    }
  }
  
  return ip;
}

// -----------------------------------------------------------------------------
// Middleware helpers
// -----------------------------------------------------------------------------
export function createSecurityHeaders(config: SecurityConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
  
  // HSTS
  if (config.hsts.enabled) {
    let hstsValue = `max-age=${config.hsts.maxAge}`;
    if (config.hsts.includeSubDomains) hstsValue += '; includeSubDomains';
    if (config.hsts.preload) hstsValue += '; preload';
    headers['Strict-Transport-Security'] = hstsValue;
  }
  
  // CSP
  if (config.csp.enabled) {
    const directives: string[] = [];
    for (const [directive, sources] of Object.entries(config.csp.directives)) {
      directives.push(`${directive} ${sources.join(' ')}`);
    }
    
    const headerName = config.csp.reportOnly 
      ? 'Content-Security-Policy-Report-Only' 
      : 'Content-Security-Policy';
    
    headers[headerName] = directives.join('; ');
    
    if (config.csp.reportUri) {
      headers['Content-Security-Policy'] += `; report-uri ${config.csp.reportUri}`;
    }
  }
  
  return headers;
}

export function validateOrigin(req: NextApiRequest, config: SecurityConfig): boolean {
  const origin = req.headers.origin;
  if (!origin) return true; // Allow same-origin requests
  
  return config.api.allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.includes('*')) {
      const pattern = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
      return pattern.test(origin);
    }
    return allowed === origin;
  });
}

// -----------------------------------------------------------------------------
// Export unified interface
// -----------------------------------------------------------------------------
const indexApi = {

  config: securityConfig,
  monitor: securityMonitor,
  rateLimiter,
  utils: {
    getClientIp,
    anonymizeIp,
    createSecurityHeaders,
    validateOrigin,
  },

};
export default indexApi;

// Type exports for convenience
export type { SecurityEvent, RequestLog, LimitConfig, LimitResult };

