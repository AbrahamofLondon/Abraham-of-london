// lib/inner-circle/safe-utils.ts
/**
 * Safe utilities that don't depend on external libraries
 * Can be used on both client and server
 */

export interface SafeInnerCircleAccess {
  hasAccess: boolean;
  reason: 'valid' | 'expired' | 'missing' | 'invalid';
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * NEUTRALIZED — Client-side JWT validation removed.
 *
 * Previously parsed JWTs from localStorage and validated expiry client-side.
 * This was a security risk: tokens were XSS-exfiltrable and expiry could be
 * forged by modifying the base64 payload.
 *
 * Now: always returns { hasAccess: false, reason: 'missing' }.
 * Server session (NextAuth) is the sole authority.
 * Use useSession() client-side or getUserAccess() server-side.
 */
export function checkInnerCircleAccessSafe(): SafeInnerCircleAccess {
  return { hasAccess: false, reason: 'missing' };
}

/** @deprecated No-op. Tokens are not stored client-side. */
export function storeInnerCircleDataSafe(_token: string, _userData: any): boolean {
  return false;
}

/** Cleans up any legacy localStorage data. */
export function clearInnerCircleDataSafe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.removeItem('innerCircleToken');
    localStorage.removeItem('innerCircleUser');
    return true;
  } catch {
    return false;
  }
}

// Rate limiting helper (simple)
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  constructor(private maxAttempts: number = 5, private timeWindow: number = 15 * 60 * 1000) {}
  
  attempt(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return { allowed: true, remaining: this.maxAttempts - 1 };
    }
    
    // Reset if outside time window
    if (now - record.lastAttempt > this.timeWindow) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return { allowed: true, remaining: this.maxAttempts - 1 };
    }
    
    // Check if exceeded attempts
    if (record.count >= this.maxAttempts) {
      return { allowed: false, remaining: 0 };
    }
    
    // Increment attempt
    record.count++;
    record.lastAttempt = now;
    return { allowed: true, remaining: this.maxAttempts - record.count };
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}