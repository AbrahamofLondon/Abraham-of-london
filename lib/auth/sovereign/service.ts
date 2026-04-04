// lib/auth/sovereign/service.ts
import crypto from 'crypto';
import { SovereignSession, SovereignValidationResult, SovereignAuthConfig } from './types';

const DEFAULT_CONFIG: SovereignAuthConfig = {
  sessionDuration: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3,
  lockoutDuration: 5 * 60 * 1000, // 5 minutes
  requireSecureCookie: process.env.NODE_ENV === 'production'
};

// In-memory rate limiting (replace with Redis in production)
const attemptStore = new Map<string, { count: number; lockedUntil: number }>();

export class SovereignAuthService {
  private static instance: SovereignAuthService;
  private config: SovereignAuthConfig;

  private constructor(config: Partial<SovereignAuthConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<SovereignAuthConfig>): SovereignAuthService {
    if (!SovereignAuthService.instance) {
      SovereignAuthService.instance = new SovereignAuthService(config);
    }
    return SovereignAuthService.instance;
  }

  /**
   * Validate sovereign access key
   */
  validateAccessKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    
    const validKey = process.env.SOVEREIGN_ACCESS_KEY;
    if (!validKey) {
      console.error('[SovereignAuth] SOVEREIGN_ACCESS_KEY not configured');
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(key.toUpperCase()),
      Buffer.from(validKey.toUpperCase())
    );
  }

  /**
   * Generate a secure session token
   */
  generateSessionToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  /**
   * Create a new sovereign session
   */
  createSession(ip?: string, userAgent?: string): SovereignSession {
    const now = Date.now();
    return {
      token: this.generateSessionToken(),
      createdAt: now,
      expiresAt: now + this.config.sessionDuration,
      ip,
      userAgent
    };
  }

  /**
   * Validate session token
   */
  validateSession(token: string, storedToken?: string): boolean {
    if (!token || !storedToken) return false;
    
    // Constant-time comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(token),
        Buffer.from(storedToken)
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(session: SovereignSession): boolean {
    return Date.now() >= session.expiresAt;
  }

  /**
   * Rate limiting for authentication attempts
   */
  checkRateLimit(identifier: string): { allowed: boolean; retryAfterMs?: number } {
    const record = attemptStore.get(identifier);
    const now = Date.now();
    
    // Check if locked
    if (record && record.lockedUntil > now) {
      return {
        allowed: false,
        retryAfterMs: record.lockedUntil - now
      };
    }
    
    // Reset if lock expired
    if (record && record.lockedUntil <= now) {
      attemptStore.delete(identifier);
      return { allowed: true };
    }
    
    return { allowed: true };
  }

  /**
   * Record authentication attempt
   */
  recordAttempt(identifier: string, success: boolean): void {
    if (success) {
      attemptStore.delete(identifier);
      return;
    }
    
    const now = Date.now();
    const record = attemptStore.get(identifier);
    
    if (!record) {
      attemptStore.set(identifier, { count: 1, lockedUntil: 0 });
      return;
    }
    
    const newCount = record.count + 1;
    
    if (newCount >= this.config.maxAttempts) {
      attemptStore.set(identifier, {
        count: newCount,
        lockedUntil: now + this.config.lockoutDuration
      });
    } else {
      attemptStore.set(identifier, {
        count: newCount,
        lockedUntil: 0
      });
    }
  }

  /**
   * Get cookie options
   */
  getCookieOptions(): { httpOnly: boolean; secure: boolean; sameSite: 'lax' | 'strict'; path: string; maxAge: number } {
    return {
      httpOnly: true,
      secure: this.config.requireSecureCookie,
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor(this.config.sessionDuration / 1000)
    };
  }
}