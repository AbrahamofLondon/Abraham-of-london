// lib/verifyRecaptcha.ts
// =========================================================================
// Google reCAPTCHA v3 verification (server-side) - PRODUCTION GRADE
// =========================================================================

export interface RecaptchaVerificationResult {
  success: boolean;
  score: number;
  action?: string;
  hostname?: string;
  errorCodes?: string[];
  timestamp?: Date;
  reasons?: string[];
}

export interface RecaptchaConfig {
  secretKey: string;
  minScore: number;
  timeoutMs: number;
  enabled: boolean;
  requiredActions?: string[];
  allowedHostnames?: string[];
}

// Default configuration
const DEFAULT_CONFIG: RecaptchaConfig = {
  secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
  minScore: parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5'),
  timeoutMs: parseInt(process.env.RECAPTCHA_TIMEOUT_MS || '5000'),
  enabled: process.env.NODE_ENV === 'production' || process.env.RECAPTCHA_ENABLED === 'true',
  requiredActions: process.env.RECAPTCHA_REQUIRED_ACTIONS?.split(','),
  allowedHostnames: process.env.RECAPTCHA_ALLOWED_HOSTNAMES?.split(','),
};

// Cache for temporary token blacklisting (prevents replay attacks)
class TokenCache {
  private cache = new Map<string, number>();
  private readonly TTL = 2 * 60 * 1000; // 2 minutes

  has(token: string): boolean {
    const timestamp = this.cache.get(token);
    if (!timestamp) return false;
    
    if (Date.now() - timestamp > this.TTL) {
      this.cache.delete(token);
      return false;
    }
    
    return true;
  }

  add(token: string): void {
    this.cache.set(token, Date.now());
  }

  cleanup(): void {
    const now = Date.now();
    for (const [token, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.TTL) {
        this.cache.delete(token);
      }
    }
  }
}

const tokenCache = new TokenCache();

// Error types for better error handling
export class RecaptchaError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'RecaptchaError';
  }
}

/**
 * Enhanced reCAPTCHA v3 verification with security features
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  clientIp?: string
): Promise<RecaptchaVerificationResult> {
  const config = DEFAULT_CONFIG;
  const result: RecaptchaVerificationResult = {
    success: false,
    score: 0,
    timestamp: new Date(),
  };

  // Skip verification in development if not enabled
  if (!config.enabled) {
    console.warn('⚠️ reCAPTCHA verification disabled - skipping');
    return { ...result, success: true, score: 1.0 };
  }

  // Input validation
  if (!config.secretKey) {
    throw new RecaptchaError(
      'reCAPTCHA secret key not configured',
      'CONFIG_MISSING'
    );
  }

  if (!token || typeof token !== 'string' || token.length < 50) {
    throw new RecaptchaError(
      'Invalid or missing reCAPTCHA token',
      'INVALID_TOKEN'
    );
  }

  // Check for replay attacks
  if (tokenCache.has(token)) {
    throw new RecaptchaError(
      'Token already used (possible replay attack)',
      'TOKEN_REUSE'
    );
  }

  try {
    // Prepare request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    const params = new URLSearchParams();
    params.append('secret', config.secretKey);
    params.append('response', token);
    if (clientIp) {
      params.append('remoteip', clientIp);
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Recaptcha-Verification-Service/1.0',
      },
      body: params.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new RecaptchaError(
        `reCAPTCHA API responded with ${response.status}: ${response.statusText}`,
        'API_ERROR',
        { status: response.status, statusText: response.statusText }
      );
    }

    const responseData = await response.json();
    
    // Type guard for response data
    if (typeof responseData !== 'object' || responseData === null) {
      throw new RecaptchaError(
        'Invalid response format from reCAPTCHA API',
        'INVALID_RESPONSE'
      );
    }

    const {
      success,
      score = 0,
      action,
      hostname,
      'error-codes': errorCodes = [],
    } = responseData;

    // Update result with API response
    Object.assign(result, {
      success: Boolean(success),
      score: typeof score === 'number' ? score : 0,
      action: typeof action === 'string' ? action : undefined,
      hostname: typeof hostname === 'string' ? hostname : undefined,
      errorCodes: Array.isArray(errorCodes) ? errorCodes : [],
    });

    // Additional security checks
    const reasons: string[] = [];

    if (!result.success) {
      reasons.push('reCAPTCHA API reported failure');
    }

    if (result.score < config.minScore) {
      reasons.push(`Score ${result.score} below minimum ${config.minScore}`);
    }

    if (expectedAction && result.action !== expectedAction) {
      reasons.push(`Action mismatch: expected ${expectedAction}, got ${result.action}`);
    }

    if (config.allowedHostnames?.length && !config.allowedHostnames.includes(result.hostname || '')) {
      reasons.push(`Hostname ${result.hostname} not in allowed list`);
    }

    // Check for common error codes
    if (result.errorCodes.length > 0) {
      const errorMessages = result.errorCodes.map(code => {
        const knownErrors: Record<string, string> = {
          'missing-input-secret': 'Missing secret parameter',
          'invalid-input-secret': 'Invalid secret parameter',
          'missing-input-response': 'Missing token',
          'invalid-input-response': 'Invalid token',
          'bad-request': 'Bad request',
          'timeout-or-duplicate': 'Token timeout or duplicate',
        };
        return knownErrors[code] || code;
      });
      reasons.push(...errorMessages);
    }

    if (reasons.length > 0) {
      result.reasons = reasons;
      result.success = false;
    } else {
      // Token is valid - add to cache to prevent reuse
      tokenCache.add(token);
    }

    // Log security events
    if (!result.success) {
      console.warn('🔒 reCAPTCHA verification failed:', {
        score: result.score,
        action: result.action,
        hostname: result.hostname,
        reasons: result.reasons,
        clientIp,
        timestamp: result.timestamp,
      });
    } else if (result.score < 0.7) {
      console.info('🔍 reCAPTCHA low score detected:', {
        score: result.score,
        action: result.action,
        clientIp,
      });
    }

    return result;

  } catch (error) {
    if (error instanceof RecaptchaError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new RecaptchaError(
        'reCAPTCHA verification timeout',
        'TIMEOUT'
      );
    }

    console.error('💥 reCAPTCHA verification unexpected error:', error);
    
    throw new RecaptchaError(
      'reCAPTCHA verification failed',
      'VERIFICATION_FAILED',
      error
    );
  }
}

/**
 * Convenience function for simple boolean verification
 */
export async function isRecaptchaValid(
  token: string,
  expectedAction?: string,
  clientIp?: string
): Promise<boolean> {
  try {
    const result = await verifyRecaptcha(token, expectedAction, clientIp);
    return result.success;
  } catch (error) {
    // In case of errors, fail securely (don't allow through)
    console.error('reCAPTCHA validation error:', error);
    return false;
  }
}

/**
 * Get reCAPTCHA configuration status
 */
export function getRecaptchaConfig(): { enabled: boolean; minScore: number } {
  return {
    enabled: DEFAULT_CONFIG.enabled,
    minScore: DEFAULT_CONFIG.minScore,
  };
}

/**
 * Clean up token cache (call periodically)
 */
export function cleanupRecaptchaCache(): void {
  tokenCache.cleanup();
}

// Run cleanup every 5 minutes
setInterval(cleanupRecaptchaCache, 5 * 60 * 1000).unref();