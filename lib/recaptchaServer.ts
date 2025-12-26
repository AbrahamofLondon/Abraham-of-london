/* eslint-disable no-console */
/**
 * lib/recaptchaServer.ts
 * Canonical server-side reCAPTCHA v3 verification helper.
 *
 * Use in:
 * - pages/api/** (Node runtime)
 * - Netlify functions / server handlers
 *
 * Do NOT import this into client components.
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
  // Support both common names to avoid env drift
  const candidates = [
    process.env.RECAPTCHA_SECRET_KEY,
    process.env.RECAPTCHA_SECRET,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length >= 10) return c.trim();
  }
  return null;
}

function getMinScore(): number {
  const raw = process.env.RECAPTCHA_MIN_SCORE;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
  return DEFAULT_MIN_SCORE;
}

function normalizeErrorCodes(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((x) => typeof x === "string") as string[];
  return [];
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "AbortError"
  );
}

/**
 * Detailed verifier with score + action checks.
 * - Fails closed by default.
 * - Optional dev bypass if ALLOW_RECAPTCHA_BYPASS=true and NODE_ENV!=production.
 *
 * expectedAction:
 * - If provided, and Google returns an action, mismatches fail.
 */
export async function verifyRecaptchaDetailed(
  token: string,
  expectedAction?: string,
  remoteIp?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<RecaptchaVerificationResult> {
  const secret = getSecret();

  // Fail closed unless explicitly bypassing in dev
  if (!secret) {
    const isDev = process.env.NODE_ENV !== "production";
    const allowBypass = process.env.ALLOW_RECAPTCHA_BYPASS === "true";

    if (isDev && allowBypass) {
      console.warn(
        "[reCAPTCHA] Secret missing - bypass enabled via ALLOW_RECAPTCHA_BYPASS (development only)."
      );
      return {
        success: true,
        score: 1,
        action: expectedAction,
        errorCodes: ["bypassed:missing_secret"],
      };
    }

    console.error("[reCAPTCHA] Secret not set - verification will fail.");
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const params = new URLSearchParams();
    params.set("secret", secret);
    params.set("response", token.trim());
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
 * Backward-compatible boolean verifier (legacy call-sites).
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  remoteIp?: string
): Promise<boolean> {
  const result = await verifyRecaptchaDetailed(token, expectedAction, remoteIp);
  return result.success;
}

/**
 * Small config health snapshot (safe to log server-side).
 */
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