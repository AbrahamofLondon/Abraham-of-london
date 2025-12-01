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
  | "UNKNOWN";

interface GoogleRecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
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

// Replay-protection temporary cache with enhanced security
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

// Enhanced error class with better typing
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

// Validate configuration at startup
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

// Validate token format before processing
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

export async function verifyRecaptcha(
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

  // Validate token format
  validateTokenFormat(token);

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
    if (clientIp && /^[a-fA-F0-9.:]+$/.test(clientIp)) {
      params.append("remoteip", clientIp);
    }

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        signal: controller.signal,
      }
    );

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
    const action = data.action;
    const hostname = data.hostname;
    const errorCodes = Array.isArray(data["error-codes"])
      ? data["error-codes"]
      : [];

    Object.assign(result, { success, score, action, hostname, errorCodes });

    const reasons: string[] = [];

    if (!success) {
      reasons.push("API reported failure");
    }

    if (score < config.minScore) {
      reasons.push(`Low score: ${score} < ${config.minScore}`);
      console.warn(
        `Low reCAPTCHA score detected: ${score} from IP: ${clientIp}`
      );
    }

    if (expectedAction && action !== expectedAction) {
      reasons.push(
        `Action mismatch: expected ${expectedAction}, got ${action}`
      );
      throw new RecaptchaError("Action mismatch", "ACTION_MISMATCH");
    }

    if (
      config.allowedHostnames?.length &&
      hostname &&
      !config.allowedHostnames.includes(hostname)
    ) {
      reasons.push(`Hostname not allowed: ${hostname}`);
      throw new RecaptchaError("Hostname mismatch", "HOSTNAME_MISMATCH");
    }

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

      console.warn(`reCAPTCHA verification failed: ${reasons.join(", ")}`, {
        clientIp,
        action,
        score,
        hostname,
      });

      return result;
    }

    tokenCache.add(token);

    console.info(`reCAPTCHA verification successful`, {
      score,
      action,
      hostname,
      clientIp,
      timestamp: result.timestamp,
    });

    return result;
  } catch (error: unknown) {
    if (error instanceof RecaptchaError) {
      throw error;
    }

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

// Simplified version for boolean responses
export async function isRecaptchaValid(
  token: string,
  expectedAction?: string,
  clientIp?: string
): Promise<boolean> {
  try {
    const result = await verifyRecaptcha(token, expectedAction, clientIp);
    return result.success;
  } catch (error: unknown) {
    console.error("reCAPTCHA validation error:", error);
    return false;
  }
}

// Utility function to check if reCAPTCHA is configured
export function isRecaptchaConfigured(): boolean {
  return !!(
    process.env.RECAPTCHA_SECRET_KEY &&
    process.env.RECAPTCHA_SECRET_KEY.length > 10
  );
}

// Health check function
export async function checkRecaptchaHealth(): Promise<boolean> {
  if (!isRecaptchaConfigured()) {
    return false;
  }

  try {
    const result = await verifyRecaptcha("test-token", "healthcheck");
    return result.errorCodes.includes("invalid-input-response");
  } catch {
    return false;
  }
}