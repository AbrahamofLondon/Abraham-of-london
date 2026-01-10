/* eslint-disable no-console */
/**
 * lib/recaptchaServer.ts
 * Production-ready server-side reCAPTCHA v3 verification.
 * Optimized for Abraham of London Strategic Infrastructure.
 */

export type RecaptchaVerificationResult = {
  success: boolean;
  score: number;
  action?: string;
  timestamp?: string; // ISO timestamp of verification
  errorCodes?: string[];
  raw?: unknown;
  warning?: string; // Non-critical warnings
};

// Environment variable validation
const ENV_VARS = {
  RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY,
  RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET,
  RECAPTCHA_MIN_SCORE: process.env.RECAPTCHA_MIN_SCORE,
  ALLOW_RECAPTCHA_BYPASS: process.env.ALLOW_RECAPTCHA_BYPASS,
  NODE_ENV: process.env.NODE_ENV,
} as const;

// Configuration
const DEFAULT_MIN_SCORE = 0.5;
const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const DEFAULT_TIMEOUT_MS = 3000; // Reduced for better UX
const MAX_TIMEOUT_MS = 10000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 100;

// Cache configuration for development
const CACHE_TTL_MS = 60000; // 1 minute cache for identical tokens
const MAX_CACHE_SIZE = 1000;

// Simple in-memory cache for development
const verificationCache = new Map<string, {
  result: RecaptchaVerificationResult;
  timestamp: number;
}>();

/**
 * Validate and get reCAPTCHA secret
 */
function getSecret(): string | null {
  // Priority order for secrets
  const candidates = [
    ENV_VARS.RECAPTCHA_SECRET_KEY,
    ENV_VARS.RECAPTCHA_SECRET,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      // Validate format: should be a valid reCAPTCHA secret
      if (trimmed.length >= 10 && trimmed.length <= 100) {
        return trimmed;
      }
    }
  }
  
  console.warn("[reCAPTCHA] No valid secret found in environment variables");
  return null;
}

/**
 * Get minimum score with validation
 */
function getMinScore(): number {
  const raw = ENV_VARS.RECAPTCHA_MIN_SCORE;
  if (!raw) return DEFAULT_MIN_SCORE;
  
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0 && n <= 1) {
    // Ensure reasonable minimum score
    if (ENV_VARS.NODE_ENV === 'production' && n < 0.3) {
      console.warn(`[reCAPTCHA] Production minimum score (${n}) is too low, using 0.3`);
      return Math.max(0.3, n);
    }
    return n;
  }
  
  console.warn(`[reCAPTCHA] Invalid minimum score: ${raw}, using default: ${DEFAULT_MIN_SCORE}`);
  return DEFAULT_MIN_SCORE;
}

/**
 * Normalize error codes from API response
 */
function normalizeErrorCodes(value: unknown): string[] {
  if (!value) return [];
  
  if (Array.isArray(value)) {
    return value
      .filter((x): x is string => typeof x === "string" && x.length > 0)
      .map(code => code.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  }
  
  if (typeof value === 'string') {
    return [value.toLowerCase().replace(/[^a-z0-9_]/g, '_')];
  }
  
  return [];
}

/**
 * Check if error is an AbortError
 */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "AbortError"
  );
}

/**
 * Generate cache key for token
 */
function generateCacheKey(token: string, expectedAction?: string, remoteIp?: string): string {
  const parts = [
    token.substring(0, 32), // Use first 32 chars of token
    expectedAction || '',
    remoteIp || '',
  ];
  return parts.join('|');
}

/**
 * Get from cache if valid
 */
function getFromCache(key: string): RecaptchaVerificationResult | null {
  const cached = verificationCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL_MS) {
    verificationCache.delete(key);
    return null;
  }
  
  // Return a fresh copy to avoid mutation
  return { ...cached.result, warning: 'cached_response' };
}

/**
 * Add to cache with size limit
 */
function addToCache(key: string, result: RecaptchaVerificationResult): void {
  // Only cache successful verifications in development
  if (ENV_VARS.NODE_ENV === 'production') return;
  
  // Clean up cache if it's getting too large
  if (verificationCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = verificationCache.keys().next().value;
    if (oldestKey) verificationCache.delete(oldestKey);
  }
  
  verificationCache.set(key, {
    result: { ...result, warning: undefined }, // Strip warning from cached version
    timestamp: Date.now(),
  });
}

/**
 * Make the actual API request with retries
 */
async function makeVerificationRequest(
  secret: string,
  token: string,
  remoteIp?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<any> {
  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token.trim());
  if (remoteIp) params.set("remoteip", remoteIp);

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Abraham-of-London/1.0",
        },
        body: params.toString(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry timeout errors or abort errors
      if (isAbortError(error)) break;
      
      // Don't retry network errors after first attempt
      if (attempt === RETRY_ATTEMPTS || error instanceof TypeError) break;
    }
  }
  
  throw lastError || new Error("Verification request failed");
}

/**
 * DETAILED VERIFIER with caching and enhanced error handling
 */
export async function verifyRecaptchaDetailed(
  token: string,
  expectedAction?: string,
  remoteIp?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  bypassAllowed: boolean = ENV_VARS.NODE_ENV !== 'production' && ENV_VARS.ALLOW_RECAPTCHA_BYPASS === "true"
): Promise<RecaptchaVerificationResult> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  
  // Check cache first (development only)
  if (ENV_VARS.NODE_ENV !== 'production') {
    const cacheKey = generateCacheKey(token, expectedAction, remoteIp);
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      console.debug(`[reCAPTCHA] Using cached verification for ${expectedAction || 'unknown'}`);
      return { ...cachedResult, timestamp };
    }
  }
  
  // Validate input
  if (!token || typeof token !== "string" || token.trim().length < 30) {
    return { 
      success: false, 
      score: 0, 
      action: expectedAction,
      timestamp,
      errorCodes: ["invalid_token_format"] 
    };
  }
  
  const secret = getSecret();
  const minScore = getMinScore();
  
  // Handle missing secret
  if (!secret) {
    if (bypassAllowed) {
      console.warn(`[reCAPTCHA] Secret missing - bypass enabled for ${expectedAction || 'unknown'}`);
      const result = { 
        success: true, 
        score: 1, 
        action: expectedAction, 
        timestamp,
        errorCodes: ["bypassed:missing_secret"],
        warning: "development_bypass" 
      };
      
      // Cache the bypass result
      if (ENV_VARS.NODE_ENV !== 'production') {
        const cacheKey = generateCacheKey(token, expectedAction, remoteIp);
        addToCache(cacheKey, result);
      }
      
      return result;
    }
    
    console.error("[reCAPTCHA] Secret not set and bypass not allowed");
    return { 
      success: false, 
      score: 0, 
      action: expectedAction,
      timestamp,
      errorCodes: ["missing_secret"] 
    };
  }
  
  // Validate timeout
  const safeTimeoutMs = Math.min(Math.max(timeoutMs, 100), MAX_TIMEOUT_MS);
  
  try {
    const data = await makeVerificationRequest(secret, token, remoteIp, safeTimeoutMs);
    
    const success = Boolean(data.success);
    const score = typeof data.score === "number" ? Number(data.score.toFixed(3)) : 0;
    const action = typeof data.action === "string" ? data.action : undefined;
    const errorCodes = normalizeErrorCodes(data["error-codes"]);
    const duration = Date.now() - startTime;
    
    // Log verification for monitoring
    if (ENV_VARS.NODE_ENV === 'production' || duration > 1000) {
      console.log(`[reCAPTCHA] ${expectedAction || 'unknown'} verification: success=${success}, score=${score}, duration=${duration}ms`);
    }
    
    // Security boundary: Action mismatch check
    if (expectedAction && action && expectedAction !== action) {
      console.warn(`[reCAPTCHA] Action mismatch: expected="${expectedAction}" got="${action}" token=${token.substring(0, 10)}...`);
      const result = { 
        success: false, 
        score, 
        action,
        timestamp,
        errorCodes: ["action_mismatch", ...errorCodes], 
        raw: data 
      };
      
      // Don't cache failed verifications
      return result;
    }
    
    // Score validation
    if (!success || score < minScore) {
      const resultCodes = errorCodes.length ? errorCodes : ["low_score_or_failed"];
      if (!success) resultCodes.unshift("verification_failed");
      if (score < minScore) resultCodes.unshift("score_too_low");
      
      const result = { 
        success: false, 
        score, 
        action,
        timestamp,
        errorCodes: resultCodes, 
        raw: data 
      };
      
      // Cache failed verifications (short TTL) to prevent abuse
      if (ENV_VARS.NODE_ENV !== 'production') {
        const cacheKey = generateCacheKey(token, expectedAction, remoteIp);
        addToCache(cacheKey, result);
      }
      
      return result;
    }
    
    // Successful verification
    const result = { 
      success: true, 
      score, 
      action,
      timestamp,
      errorCodes, 
      raw: data 
    };
    
    // Cache successful verification
    if (ENV_VARS.NODE_ENV !== 'production') {
      const cacheKey = generateCacheKey(token, expectedAction, remoteIp);
      addToCache(cacheKey, result);
    }
    
    return result;
    
  } catch (error: unknown) {
    const isTimeout = isAbortError(error);
    const duration = Date.now() - startTime;
    
    console.error(`[reCAPTCHA] Verification error for ${expectedAction || 'unknown'}:`, error);
    
    const result = { 
      success: false, 
      score: 0, 
      action: expectedAction,
      timestamp,
      errorCodes: [isTimeout ? "timeout" : "verification_exception"] 
    };
    
    // Cache timeout/error responses (short TTL)
    if (ENV_VARS.NODE_ENV !== 'production') {
      const cacheKey = generateCacheKey(token, expectedAction, remoteIp);
      addToCache(cacheKey, result);
    }
    
    return result;
  }
}

/**
 * Simplified verification (boolean only)
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  remoteIp?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<boolean> {
  try {
    const result = await verifyRecaptchaDetailed(token, expectedAction, remoteIp, timeoutMs);
    return result.success;
  } catch (error) {
    console.error("[reCAPTCHA] Simplified verification failed:", error);
    return false;
  }
}

/**
 * Validate reCAPTCHA configuration
 */
export function validateRecaptchaConfig() {
  const secret = getSecret();
  const minScore = getMinScore();
  
  return {
    hasSecret: Boolean(secret),
    secretLength: secret?.length || 0,
    minScore,
    bypassEnabled: ENV_VARS.ALLOW_RECAPTCHA_BYPASS === "true",
    environment: ENV_VARS.NODE_ENV,
    cacheSize: verificationCache.size,
    recommendations: secret ? [] : [
      "RECAPTCHA_SECRET_KEY or RECAPTCHA_SECRET environment variable is required",
      "Get your secret key from Google reCAPTCHA Admin Console",
      "In development, you can set ALLOW_RECAPTCHA_BYPASS=true to bypass verification"
    ]
  };
}

/**
 * Clear the verification cache
 */
export function clearVerificationCache(): void {
  verificationCache.clear();
  console.debug("[reCAPTCHA] Cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: verificationCache.size,
    entries: Array.from(verificationCache.entries()).map(([key, value]) => ({
      key: key.substring(0, 20) + '...',
      age: Date.now() - value.timestamp,
      success: value.result.success,
      score: value.result.score,
    }))
  };
}

/**
 * Middleware helper for API routes
 */
export function withRecaptcha(
  action: string,
  options: {
    minScore?: number;
    remoteIpHeader?: string;
    timeoutMs?: number;
  } = {}
) {
  return async function checkRecaptcha(req: any, res?: any) {
    const token = req.headers['x-recaptcha-token'] || req.body?.recaptchaToken;
    const remoteIp = options.remoteIpHeader ? 
      req.headers[options.remoteIpHeader] : 
      req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    
    if (!token) {
      throw new Error('reCAPTCHA token is required');
    }
    
    const result = await verifyRecaptchaDetailed(
      token,
      action,
      remoteIp,
      options.timeoutMs
    );
    
    if (!result.success) {
      throw new Error(`reCAPTCHA verification failed: ${result.errorCodes?.join(', ') || 'Unknown error'}`);
    }
    
    if (options.minScore !== undefined && result.score < options.minScore) {
      throw new Error(`reCAPTCHA score too low: ${result.score} (minimum: ${options.minScore})`);
    }
    
    return result;
  };
}

export default {
  verifyRecaptchaDetailed,
  verifyRecaptcha,
  validateRecaptchaConfig,
  clearVerificationCache,
  getCacheStats,
  withRecaptcha,
};
