/* eslint-disable no-console */
/**
 * lib/recaptchaServer.ts
 * Canonical server-side reCAPTCHA v3 verification helper.
 * Optimized for Abraham of London Strategic Infrastructure.
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

/**
 * RESOLVE SECRET:
 * Prioritizes the validated RECAPTCHA_SECRET_KEY from the environment.
 */
function getSecret(): string | null {
  const candidates = [
    process.env.RECAPTCHA_SECRET_KEY, // Primary (validated by scripts/validate-env.mjs)
    process.env.RECAPTCHA_SECRET,     // Legacy fallback
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
 * DETAILED VERIFIER:
 * - Fails closed by default.
 * - Validates score threshold.
 * - Validates expectedAction to prevent token reuse across handlers.
 */
export async function verifyRecaptchaDetailed(
  token: string,
  expectedAction?: string,
  remoteIp?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<RecaptchaVerificationResult> {
  const secret = getSecret();

  // Fail closed unless in Dev with explicit bypass
  if (!secret) {
    const isDev = process.env.NODE_ENV !== "production";
    const allowBypass = process.env.ALLOW_RECAPTCHA_BYPASS === "true";

    if (isDev && allowBypass) {
      console.warn("[reCAPTCHA] Secret missing - bypass enabled via ALLOW_RECAPTCHA_BYPASS.");
      return { success: true, score: 1, action: expectedAction, errorCodes: ["bypassed:missing_secret"] };
    }

    console.error("[reCAPTCHA] Secret not set - failing verification.");
    return { success: false, score: 0, action: expectedAction, errorCodes: ["missing_secret"] };
  }

  if (!token || typeof token !== "string" || token.trim().length < 30) {
    return { success: false, score: 0, action: expectedAction, errorCodes: ["invalid_token_format"] };
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
      return { success: false, score: 0, action: expectedAction, errorCodes: [`http_${response.status}`] };
    }

    const data: any = await response.json();
    const success = Boolean(data.success);
    const score = typeof data.score === "number" ? data.score : 0;
    const action = typeof data.action === "string" ? data.action : undefined;
    const errorCodes = normalizeErrorCodes(data["error-codes"]);

    // Security boundary: Action mismatch check
    if (expectedAction && action && expectedAction !== action) {
      console.warn(`[reCAPTCHA] Action mismatch: expected="${expectedAction}" got="${action}"`);
      return { success: false, score: 0, action, errorCodes: ["action_mismatch"], raw: data };
    }

    if (!success || score < minScore) {
      return { success: false, score, action, errorCodes: errorCodes.length ? errorCodes : ["low_score_or_failed"], raw: data };
    }

    return { success: true, score, action, errorCodes, raw: data };
  } catch (error: unknown) {
    const isTimeout = isAbortError(error);
    return { success: false, score: 0, action: expectedAction, errorCodes: [isTimeout ? "timeout" : "exception"] };
  }
}

export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  remoteIp?: string
): Promise<boolean> {
  const result = await verifyRecaptchaDetailed(token, expectedAction, remoteIp);
  return result.success;
}

export function validateRecaptchaConfig() {
  return {
    hasSecret: Boolean(getSecret()),
    minScore: getMinScore(),
    bypassEnabled: process.env.ALLOW_RECAPTCHA_BYPASS === "true",
  };
}