// lib/auth/sovereign/service.ts
import crypto from 'crypto';
import { SovereignSession, SovereignValidationResult, SovereignAuthConfig } from './types';
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";

const DEFAULT_CONFIG: SovereignAuthConfig = {
  sessionDuration: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3,
  lockoutDuration: 5 * 60 * 1000, // 5 minutes
  requireSecureCookie: process.env.NODE_ENV === 'production'
};

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

    const configuredHashes = [
      process.env.SOVEREIGN_ACCESS_KEY_HASH,
      process.env.OGR_SOVEREIGN_KEY_HASH,
      process.env.SOVEREIGN_ACCESS_KEY
        ? crypto.createHash("sha256").update(process.env.SOVEREIGN_ACCESS_KEY, "utf8").digest("hex")
        : "",
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);

    if (!configuredHashes.length) {
      console.error('[SovereignAuth] SOVEREIGN_ACCESS_KEY not configured');
      return false;
    }

    const providedHash = crypto
      .createHash("sha256")
      .update(String(key).trim(), "utf8")
      .digest("hex");

    return configuredHashes.some((candidateHash) => {
      const left = Buffer.from(candidateHash, "hex");
      const right = Buffer.from(providedHash, "hex");
      return left.length === right.length && crypto.timingSafeEqual(left, right);
    });
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
  async checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    const result = await consumePersistentRateLimit({
      key: `sovereign-auth:${identifier}`,
      limit: this.config.maxAttempts,
      windowMs: this.config.lockoutDuration,
      failClosed: true,
    });

    return result.allowed
      ? { allowed: true }
      : { allowed: false, retryAfterMs: result.retryAfterMs };
  }

  /**
   * Record authentication attempt
   */
  async recordAttempt(_identifier: string, _success: boolean): Promise<void> {
    return;
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
