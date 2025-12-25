/* eslint-disable no-console */
/**
 * lib/recaptcha.ts (CANONICAL SERVER MODULE)
 *
 * - verifyRecaptchaDetailed(): rich result object
 * - verifyRecaptcha(): boolean wrapper for legacy call-sites
 * - validateRecaptchaConfig(): config health snapshot
 *
 * Security posture:
 * - Fail closed in production unless explicitly bypassed in dev.
 * - Expected action mismatch is treated as failure (hard boundary).
 * - Score threshold enforced.
 * - Network timeout bounded.
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
const DEFAULT_TIMEOUT_MS = 5000;

function getSecret(): string | null {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret || secret.trim().length < 10) return null;
  return secret.trim();
}

function getMinScore(): number {
  const n = Number(process.env.RECAPTCHA_MIN_SCORE);
  if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
  return DEFAULT_MIN_SCORE;
}

function getTimeoutMs(): number {
  const n = Number(process.env.RECAPTCHA_TIMEOUT_MS);
  if (Number.isFinite(n) && n >= 1000 && n <= 15000) return n;
  return DEFAULT_TIMEOUT_MS;
}

function normalizeErrorCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => typeof x === "string") as string[];
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "AbortError"
  );
}

/**
 * Canonical verifier returning a rich result object.
 */
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
        "[reCAPTCHA] RECAPTCHA_SECRET_KEY missing - bypass enabled via ALLOW_RECAPTCHA_BYPASS (development only)."
      );
      return {
        success: true,
        score: 1,
        action: expectedAction,
        errorCodes: ["bypassed:missing_secret"],
      };
    }

    console.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY not set - verification will fail.");
    return {
      success: false,
      score: 0,
      action: expectedAction,
      errorCodes: ["missing_secret"],
    };
  }

  // Basic token sanity check
  if (!token || typeof token !== "string" || token.trim().length < 30) {
    console.error("[reCAPTCHA] Invalid token format.");
    return {
      success: false,
      score: 0,
      action: expectedAction,
      errorCodes: ["invalid_token_format"],
    };
  }

  const minScore = getMinScore();
  const timeoutMs = getTimeoutMs();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const params = new URLSearchParams();
    params.set("secret", secret);
    params.set("response", token.trim());
    if (remoteIp && typeof remoteIp === "string") {
      params.set("remoteip", remoteIp);
    }

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

    // Action mismatch = failure (hard security boundary)
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
      console.warn(
        `[reCAPTCHA] Score below threshold: ${score} (min: ${minScore})`,
        { action }
      );
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
    if (isAbortError(error)) {
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
 * Backward-compatible boolean verifier for legacy call-sites.
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
  timeoutMs: number;
  bypassEnabled: boolean;
} {
  return {
    hasSecret: Boolean(getSecret()),
    minScore: getMinScore(),
    timeoutMs: getTimeoutMs(),
    bypassEnabled: process.env.ALLOW_RECAPTCHA_BYPASS === "true",
  };
}