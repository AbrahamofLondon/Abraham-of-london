/**
 * Server-side reCAPTCHA v3 verification helper.
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
  if (!secret || secret.trim().length < 10) {
    return null;
  }
  return secret.trim();
}

export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  remoteIp?: string
): Promise<boolean | RecaptchaVerificationResult> {
  // Get the secret first
  const secret = getSecret();

  // If no secret configured:
  if (!secret) {
    const isDev = process.env.NODE_ENV !== "production";
    const allowBypass = process.env.ALLOW_RECAPTCHA_BYPASS === "true";

    if (isDev && allowBypass) {
      console.warn("[reCAPTCHA] RECAPTCHA_SECRET_KEY missing – bypass enabled.");
      return {
        success: true,
        score: 1,
        action: expectedAction,
        errorCodes: ["bypassed:missing_secret"],
      };
    }

    console.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY not set.");
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

  const minScore =
    Number.isFinite(Number(process.env.RECAPTCHA_MIN_SCORE))
      ? Number(process.env.RECAPTCHA_MIN_SCORE)
      : DEFAULT_MIN_SCORE;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const params = new URLSearchParams();
    params.set("secret", secret);
    params.set("response", token);
    if (remoteIp) {
      params.set("remoteip", remoteIp);
    }

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
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
    const errorCodes = data["error-codes"];

    // Optional: action match check
    if (expectedAction && action && expectedAction !== action) {
      console.warn(`[reCAPTCHA] Action mismatch: expected="${expectedAction}" got="${action}"`);
      return {
        success: false,
        score: 0,
        action,
        errorCodes: errorCodes || ["action_mismatch"],
        raw: data,
      };
    }

    if (!success) {
      console.warn("[reCAPTCHA] Verification failed:", {
        action,
        score,
        errorCodes,
      });
      return {
        success: false,
        score,
        action,
        errorCodes: errorCodes || ["verification_failed"],
        raw: data,
      };
    }

    if (score < minScore) {
      console.warn(`[reCAPTCHA] Score below threshold: ${score} (min: ${minScore})`, { action });
      return {
        success: false,
        score,
        action,
        errorCodes: errorCodes || ["low_score"],
        raw: data,
      };
    }

    if (score < 0.3) {
      console.warn(`[reCAPTCHA] Low but passing score: ${score} (min: ${minScore})`, { action });
    }

    // For legacy mode, return boolean
    if (process.env.RECAPTCHA_LEGACY_MODE === "true") {
      return success;
    }

    return {
      success: true,
      score,
      action,
      errorCodes,
      raw: data,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { name?: string }).name === "AbortError"
    ) {
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