/* eslint-disable no-console */
/**
 * Server-side reCAPTCHA v3 verification helper (canonical).
 * - verifyRecaptchaDetailed(): returns rich result
 * - verifyRecaptcha(): returns boolean for legacy call-sites
 * - validateRecaptchaConfig(): small config health snapshot
 */

export type RecaptchaVerificationResult = {
  success: boolean;
  score: number;
  action?: string;
  errorCodes?: string[];
  raw?: unknown;
};

const DEFAULT_MIN_SCORE = 0.5;
const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

function getSecret(): string | null {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret || secret.trim().length < 10) return null;
  return secret.trim();
}

function getMinScore(): number {
  const n = Number(process.env.RECAPTCHA_MIN_SCORE);
  if (Number.isFinite(n)) return n;
  return DEFAULT_MIN_SCORE;
}

function normalizeErrorCodes(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((x) => typeof x === "string") as string[];
  return [];
}

export async function verifyRecaptchaDetailed(
  token: string,
  expectedAction?: string,
  remoteIp?: string
): Promise<RecaptchaVerificationResult> {
  const secret = getSecret();

  // Fail closed unless explicitly bypassing in dev
  if (!secret) {
    const isDev = process.env.NODE_ENV !== "production";
    const allowBypass = process.env.ALLOW_RECAPTCHA_BYPASS === "true";

    if (isDev && allowBypass) {
      console.warn(
        "[reCAPTCHA] RECAPTCHA_SECRET_KEY missing – bypass enabled via ALLOW_RECAPTCHA_BYPASS (development only)."
      );
      return {
        success: true,
        score: 1,
        action: expectedAction,
        errorCodes: ["bypassed:missing_secret"],
      };
    }

    console.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY not set – verification will fail.");
    return {
      success: false,
      score: 0,
      action: expectedAction,
      errorCodes: ["missing_secret"],
    };
  }

  // Basic token sanity check
  if (!token || typeof token !== "string" || token.length < 30) {
    console.error("[reCAPTCHA] Invalid token format.");
    return {
      success: false,
      score: 0,
      action: expectedAction,
      errorCodes: ["invalid_token_format"],
    };
  }

  const minScore = getMinScore();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const params = new URLSearchParams();
    params.set("secret", secret);
    params.set("response", token);
    if (remoteIp) params.set("remoteip", remoteIp);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[reCAPTCHA] HTTP error: ${response.status}`);
      return {
        success: false,
        score: 0,
        action: expectedAction,
        errorCodes: [`http_${response.status}`],
      };
    }

    const data: {
      success?: boolean;
      score?: number;
      action?: string;
      "error-codes"?: string[];
      [key: string]: unknown;
    } = await response.json();

    const success = Boolean(data.success);
    const score = typeof data.score === "number" ? data.score : 0;
    const action = typeof data.action === "string" ? data.action : undefined;
    const errorCodes = normalizeErrorCodes(data["error-codes"]);

    // Action mismatch = failure (security boundary)
    if (expectedAction && action && expectedAction !== action) {
      console.warn(
        `[reCAPTCHA] Action mismatch: expected="${expectedAction}" got="${action}"`
      );
      return {
        success: false,
        score: 0,
        action,
        errorCodes: errorCodes.length ? errorCodes : ["action_mismatch"],
        raw: data,
      };
    }

    if (!success) {
      console.warn("[reCAPTCHA] Verification failed:", { action, score, errorCodes });
      return {
        success: false,
        score,
        action,
        errorCodes: errorCodes.length ? errorCodes : ["verification_failed"],
        raw: data,
      };
    }

    if (score < minScore) {
      console.warn(`[reCAPTCHA] Score below threshold: ${score} (min: ${minScore})`, { action });
      return {
        success: false,
        score,
        action,
        errorCodes: errorCodes.length ? errorCodes : ["low_score"],
        raw: data,
      };
    }

    return {
      success: true,
      score,
      action,
      errorCodes,
      raw: data,
    };
  } catch (error: unknown) {
    const isAbort =
      typeof error === "object" &&
      error !== null &&
      (error as { name?: string }).name === "AbortError";

    if (isAbort) {
      console.error("[reCAPTCHA] Verification timed out.");
      return {
        success: false,
        score: 0,
        action: expectedAction,
        errorCodes: ["timeout"],
      };
    }

    console.error("[reCAPTCHA] Verification failed with error:", error);
    return {
      success: false,
      score: 0,
      action: expectedAction,
      errorCodes: ["exception"],
    };
  }
}

/**
 * Backward-compatible boolean verifier.
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  remoteIp?: string
): Promise<boolean> {
  const result = await verifyRecaptchaDetailed(token, expectedAction, remoteIp);
  return result.success;
}

export function validateRecaptchaConfig(): {
  hasSecret: boolean;
  minScore: number;
  bypassEnabled: boolean;
} {
  return {
    hasSecret: Boolean(getSecret()),
    minScore: getMinScore(),
    bypassEnabled: process.env.ALLOW_RECAPTCHA_BYPASS === "true",
  };
}

// ----------------------------------------------------------------------
// Client-side reCAPTCHA functions (compatible with recaptchaClient.ts)
// ----------------------------------------------------------------------

// These types and functions are exported for client-side compatibility
// They should be imported from '@/lib/recaptchaClient' in client components

// Re-export types for server-side compatibility
export type RecaptchaClientErrorCode = 
  | "CONFIG_MISSING"
  | "INVALID_ACTION"
  | "INVALID_ACTION_FORMAT"
  | "INVALID_TOKEN_FORMAT"
  | "SCRIPT_LOAD_FAILED"
  | "READY_FAILED"
  | "TOKEN_GENERATION_FAILED"
  | "TIMEOUT"
  | "MAX_ATTEMPTS_EXCEEDED"
  | "SERVER_SIDE_CALL"
  | "UNEXPECTED_ERROR"
  | "UNKNOWN_ERROR";

export class RecaptchaClientError extends Error {
  constructor(
    message: string,
    public code: RecaptchaClientErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = "RecaptchaClientError";
  }
}

export class RecaptchaTimeoutError extends RecaptchaClientError {
  constructor(message: string = "reCAPTCHA operation timed out") {
    super(message, "TIMEOUT");
    this.name = "RecaptchaTimeoutError";
  }
}

export class RecaptchaScriptError extends RecaptchaClientError {
  constructor(message: string = "Failed to load reCAPTCHA script") {
    super(message, "SCRIPT_LOAD_FAILED");
    this.name = "RecaptchaScriptError";
  }
}

/**
 * Server-side wrapper for client reCAPTCHA token generation
 * Returns null on server side - this is intentional
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  // This function is server-side only, return null
  // Client components should import from '@/lib/recaptchaClient'
  return null;
}

/**
 * Safe version that returns null instead of throwing
 */
export async function getRecaptchaTokenSafe(action: string): Promise<string | null> {
  return null;
}

/**
 * Check if reCAPTCHA is available (server-side returns false)
 */
export async function isRecaptchaAvailable(): Promise<boolean> {
  return false;
}

/**
 * Wait for reCAPTCHA to be ready (no-op server-side)
 */
export async function waitForRecaptchaReady(): Promise<void> {
  // No-op server-side
}

/**
 * Preload reCAPTCHA script (no-op server-side)
 */
export function preloadRecaptcha(): void {
  // No-op server-side
}

/**
 * Reset reCAPTCHA state (no-op server-side)
 */
export function resetRecaptcha(): void {
  // No-op server-side
}

// Default export for backward compatibility
export default {
  verifyRecaptchaDetailed,
  verifyRecaptcha,
  validateRecaptchaConfig,
  getRecaptchaToken,
  getRecaptchaTokenSafe,
  isRecaptchaAvailable,
  waitForRecaptchaReady,
  preloadRecaptcha,
  resetRecaptcha,
};