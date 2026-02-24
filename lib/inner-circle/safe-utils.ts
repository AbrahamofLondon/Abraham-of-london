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

// Client-side only safe check
export function checkInnerCircleAccessSafe(): SafeInnerCircleAccess {
  if (typeof window === 'undefined') {
    return {
      hasAccess: false,
      reason: 'missing',
    };
  }

  try {
    const token = localStorage.getItem('innerCircleToken');
    const userData = localStorage.getItem('innerCircleUser');

    if (!token || !userData) {
      return {
        hasAccess: false,
        reason: 'missing',
      };
    }

    // Simple token validation (not cryptographically secure on client)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      localStorage.removeItem('innerCircleToken');
      localStorage.removeItem('innerCircleUser');
      return {
        hasAccess: false,
        reason: 'invalid',
      };
    }

    // Check if token is expired (basic check)
    try {
      // ✅ FIX: Ensure tokenParts[1] exists before using it
      const payloadPart = tokenParts[1];
      if (!payloadPart) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(atob(payloadPart));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp < now) {
        localStorage.removeItem('innerCircleToken');
        localStorage.removeItem('innerCircleUser');
        return {
          hasAccess: false,
          reason: 'expired',
        };
      }

      const user = JSON.parse(userData);
      return {
        hasAccess: true,
        reason: 'valid',
        user,
      };
    } catch (error) {
      localStorage.removeItem('innerCircleToken');
      localStorage.removeItem('innerCircleUser');
      return {
        hasAccess: false,
        reason: 'invalid',
      };
    }
  } catch (error) {
    console.error('Safe access check failed:', error);
    return {
      hasAccess: false,
      reason: 'invalid',
    };
  }
}

// Safe storage helpers
export function storeInnerCircleDataSafe(token: string, userData: any): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem('innerCircleToken', token);
    localStorage.setItem('innerCircleUser', JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Failed to store inner circle data:', error);
    return false;
  }
}

export function clearInnerCircleDataSafe(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem('innerCircleToken');
    localStorage.removeItem('innerCircleUser');
    return true;
  } catch (error) {
    console.error('Failed to clear inner circle data:', error);
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