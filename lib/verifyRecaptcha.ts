// lib/verifyRecaptcha.ts
// =========================================================================
// Google reCAPTCHA v3 verification (server-side) - ENTERPRISE SECURITY
// =========================================================================

export interface RecaptchaVerificationResult {
  success: boolean;
  score: number;
  action?: string;
  hostname?: string;
  errorCodes: string[];
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

// Enhanced error types for better debugging
export type RecaptchaErrorCode =
  | "CONFIG_MISSING"
  | "INVALID_TOKEN"
  | "TOKEN_REUSE"
  | "TIMEOUT"
  | "ACTION_MISMATCH"
  | "HOSTNAME_MISMATCH"
  | "LOW_SCORE"
  | "API_FAILURE"
  | "NETWORK_ERROR"
  | "RATE_LIMIT"
  | "UNKNOWN";

interface GoogleRecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  "error-codes"?: unknown;
  challenge_ts?: string;
}

const DEFAULT_CONFIG: RecaptchaConfig = {
  secretKey: process.env.RECAPTCHA_SECRET_KEY || "",
  minScore: parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5"),
  timeoutMs: parseInt(process.env.RECAPTCHA_TIMEOUT_MS || "5000", 10),
  enabled:
    process.env.NODE_ENV === "production" ||
    process.env.RECAPTCHA_ENABLED === "true",
  requiredActions:
    process.env.RECAPTCHA_REQUIRED_ACTIONS?.split(",").filter(Boolean),
  allowedHostnames:
    process.env.RECAPTCHA_ALLOWED_HOSTNAMES?.split(",").filter(Boolean),
};

// -------------------------------------------------------------------------
// Replay-protection cache (token-level)
// -------------------------------------------------------------------------
class TokenCache {
  private cache = new Map<string, number>();
  private readonly TTL = 2 * 60 * 1000; // 2 minutes TTL
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes cleanup

  constructor() {
    this.startCleanup();
  }

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

  private startCleanup(): void {
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [token, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.TTL) {
        this.cache.delete(token);
      }
    }
  }
}

const tokenCache = new TokenCache();

// -------------------------------------------------------------------------
// IP / global rate limiting for the verifier itself
// -------------------------------------------------------------------------

interface RateBucket {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_CONFIG = {
  maxPerIpPerMinute: parseInt(
    process.env.RECAPTCHA_MAX_PER_IP_PER_MINUTE || "30",
    10
  ),
  maxGlobalPerMinute: parseInt(
    process.env.RECAPTCHA_MAX_GLOBAL_PER_MINUTE || "1000",
    10
  ),
};

class RecaptchaRateLimiter {
  private readonly windowMs = 60 * 1000; // 1 minute windows
  private ipBuckets = new Map<string, RateBucket>();
  private globalBucket: RateBucket = {
    count: 0,
    resetAt: Date.now() + this.windowMs,
  };

  check(ip?: string | null): void {
    const now = Date.now();
    const key = ip && ip.trim() ? ip : "anonymous";

    // Global window reset
    if (now > this.globalBucket.resetAt) {
      this.globalBucket = { count: 0, resetAt: now + this.windowMs };
    }

    // Per-IP window reset
    const existing = this.ipBuckets.get(key);
    if (!existing || now > existing.resetAt) {
      this.ipBuckets.set(key, { count: 0, resetAt: now + this.windowMs });
    }

    const bucket = this.ipBuckets.get(key)!;

    // Enforce global limit first
    if (this.globalBucket.count >= RATE_LIMIT_CONFIG.maxGlobalPerMinute) {
      throw new RecaptchaError(
        "Global reCAPTCHA verification rate limit exceeded",
        "RATE_LIMIT",
        { ip: key, scope: "global" }
      );
    }

    // Enforce per-IP limit
    if (bucket.count >= RATE_LIMIT_CONFIG.maxPerIpPerMinute) {
      throw new RecaptchaError(
        "Per-IP reCAPTCHA verification rate limit exceeded",
        "RATE_LIMIT",
        { ip: key, scope: "ip" }
      );
    }

    // Increment counters only after passing checks
    bucket.count += 1;
    this.globalBucket.count += 1;
  }

  snapshot() {
    return {
      global: { ...this.globalBucket },
      ipBucketsSize: this.ipBuckets.size,
    };
  }
}

const rateLimiter = new RecaptchaRateLimiter();

// -------------------------------------------------------------------------
// Error class & helpers
// -------------------------------------------------------------------------

export class RecaptchaError extends Error {
  constructor(
    message: string,
    public code: RecaptchaErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = "RecaptchaError";
    Object.setPrototypeOf(this, RecaptchaError.prototype);
  }
}

// Type guard for Node-style errors
type NodeLikeError = Error & { code?: string };

function isNodeLikeError(error: unknown): error is NodeLikeError {
  return (
    error instanceof Error &&
    Object.prototype.hasOwnProperty.call(error, "code")
  );
}

function normalizeErrorCodes(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

// -------------------------------------------------------------------------
// Validation helpers
// -------------------------------------------------------------------------

function validateConfig(config: RecaptchaConfig): void {
  if (config.enabled && !config.secretKey) {
    throw new RecaptchaError(
      "RECAPTCHA_SECRET_KEY is required when reCAPTCHA is enabled",
      "CONFIG_MISSING"
    );
  }

  if (config.minScore < 0 || config.minScore > 1) {
    throw new RecaptchaError(
      "RECAPTCHA_MIN_SCORE must be between 0 and 1",
      "CONFIG_MISSING"
    );
  }
}

function validateTokenFormat(token: string): void {
  if (!token || typeof token !== "string") {
    throw new RecaptchaError("Token is required", "INVALID_TOKEN");
  }

  if (token.length < 50 || token.length > 5000) {
    throw new RecaptchaError("Invalid token format", "INVALID_TOKEN");
  }

  // Basic pattern validation for reCAPTCHA tokens
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
    throw new RecaptchaError(
      "Token contains invalid characters",
      "INVALID_TOKEN"
    );
  }
}

// -------------------------------------------------------------------------
// Public API (stable contracts)
// -------------------------------------------------------------------------

/**
 * Returns a *detailed* result object (matches your Netlify guard logging).
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  clientIp?: string
): Promise<RecaptchaVerificationResult> {
  return verifyRecaptchaDetailed(token, expectedAction, clientIp);
}

/**
 * Boolean helper for legacy call-sites.
 */
export async function verifyRecaptchaOk(
  token: string,
  expectedAction?: string,
  clientIp?: string
): Promise<boolean> {
  const result = await verifyRecaptchaDetailed(token, expectedAction, clientIp);
  return result.success;
}

/**
 * Backwards-compatible alias for older imports.
 * (Fixes Netlify bundler error when _utils imports isRecaptchaValid.)
 */
export async function isRecaptchaValid(
  token: string,
  expectedAction?: string,
  clientIp?: string
): Promise<boolean> {
  return verifyRecaptchaOk(token, expectedAction, clientIp);
}

/**
 * Core verifier returning the detailed result.
 */
export async function verifyRecaptchaDetailed(
  token: string,
  expectedAction?: string,
  clientIp?: string
): Promise<RecaptchaVerificationResult> {
  const config = DEFAULT_CONFIG;

  // Validate configuration
  validateConfig(config);

  const result: RecaptchaVerificationResult = {
    success: false,
    score: 0,
    timestamp: new Date(),
    errorCodes: [],
  };

  // Bypass in development with security warning
  if (!config.enabled) {
    if (process.env.NODE_ENV === "production") {
      console.warn("reCAPTCHA is disabled in production - security risk");
    }
    return { ...result, success: true, score: 1.0 };
  }

  // Validate token format early (cheap)
  validateTokenFormat(token);

  // Apply process-local rate limiting by IP / global
  rateLimiter.check(clientIp);

  // Check for token reuse (replay attack protection)
  if (tokenCache.has(token)) {
    throw new RecaptchaError(
      "Token reuse detected - possible replay attack",
      "TOKEN_REUSE"
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    const params = new URLSearchParams();
    params.append("secret", config.secretKey);
    params.append("response", token);

    // Only pass remoteip if it's plausibly an IP literal (avoid garbage)
    if (clientIp && /^[a-fA-F0-9.:]+$/.test(clientIp)) {
      params.append("remoteip", clientIp);
    }

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new RecaptchaError(
        `API responded with status ${response.status}`,
        "API_FAILURE"
      );
    }

    const data: GoogleRecaptchaResponse = await response.json();

    if (typeof data.success !== "boolean") {
      throw new RecaptchaError("Invalid API response format", "API_FAILURE");
    }

    const success = data.success;
    const score = Number(data.score ?? 0);
    const action = typeof data.action === "string" ? data.action : undefined;
    const hostname =
      typeof data.hostname === "string" ? data.hostname : undefined;
    const errorCodes = normalizeErrorCodes(data["error-codes"]);

    Object.assign(result, { success, score, action, hostname, errorCodes });

    const reasons: string[] = [];

    if (!success) {
      reasons.push("API reported failure");
    }

    // Score threshold check
    if (score < config.minScore) {
      reasons.push(`Low score: ${score} < ${config.minScore}`);
    }

    // Action check (strict)
    if (expectedAction && action !== expectedAction) {
      reasons.push(
        `Action mismatch: expected ${expectedAction}, got ${action ?? "none"}`
      );
      result.reasons = reasons;
      result.success = false;
      throw new RecaptchaError("Action mismatch", "ACTION_MISMATCH", {
        expectedAction,
        action,
      });
    }

    // Hostname allowlist check (strict)
    if (
      config.allowedHostnames?.length &&
      hostname &&
      !config.allowedHostnames.includes(hostname)
    ) {
      reasons.push(`Hostname not allowed: ${hostname}`);
      result.reasons = reasons;
      result.success = false;
      throw new RecaptchaError("Hostname mismatch", "HOSTNAME_MISMATCH", {
        hostname,
      });
    }

    // Required actions allowlist (soft fail -> mark invalid, do not throw)
    if (
      config.requiredActions?.length &&
      action &&
      !config.requiredActions.includes(action)
    ) {
      reasons.push(`Action not allowed: ${action}`);
    }

    if (errorCodes.length > 0) {
      reasons.push(...errorCodes.map((code) => `API error: ${code}`));
    }

    if (reasons.length > 0) {
      result.reasons = reasons;
      result.success = false;

      if (process.env.NODE_ENV !== "production") {
        console.warn(`[reCAPTCHA] verification failed: ${reasons.join(", ")}`, {
          clientIp,
          action,
          score,
          hostname,
        });
      }

      return result;
    }

    // Mark token as used after a clean pass
    tokenCache.add(token);

    if (process.env.NODE_ENV !== "production") {
      console.info(`[reCAPTCHA] verification successful`, {
        score,
        action,
        hostname,
      });
    }

    return result;
  } catch (error: unknown) {
    if (error instanceof RecaptchaError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new RecaptchaError("Verification timeout", "TIMEOUT");
    }

    if (isNodeLikeError(error) && error.code === "ECONNREFUSED") {
      throw new RecaptchaError(
        "Network connection failed",
        "NETWORK_ERROR",
        error.message
      );
    }

    throw new RecaptchaError(
      "Verification failed",
      "UNKNOWN",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// -------------------------------------------------------------------------
// Configuration validation helper
// -------------------------------------------------------------------------

export function validateRecaptchaConfig(): {
  hasSecret: boolean;
  minScore: number;
  enabled: boolean;
  configured: boolean;
} {
  return {
    hasSecret: !!process.env.RECAPTCHA_SECRET_KEY?.trim(),
    minScore: DEFAULT_CONFIG.minScore,
    enabled: DEFAULT_CONFIG.enabled,
    configured: !!(
      process.env.RECAPTCHA_SECRET_KEY &&
      process.env.RECAPTCHA_SECRET_KEY.length > 10
    ),
  };
}