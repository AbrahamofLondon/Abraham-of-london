/**
 * Server-side reCAPTCHA v3 verification helper
 */

export type RecaptchaVerificationResult = {
  success: boolean;
  score: number;
  action?: string;
  errors?: string[];
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

/**
 * Core verification function with detailed results
 */
export async function verifyRecaptchaDetailed(
  token: string,
  expectedAction?: string,
  remoteIp?: string
): Promise<RecaptchaVerificationResult> {
  const secret = getSecret();

  // If no secret configured:
  if (!secret) {
    const isDev = process.env.NODE_ENV !== "production";
    const allowBypass = process.env.ALLOW_RECAPTCHA_BYPASS === "true";

    // In dev you can explicitly opt into bypass; in prod we always fail closed.
    if (isDev && allowBypass) {
      console.warn(
        "[reCAPTCHA] RECAPTCHA_SECRET_KEY missing – bypass enabled via ALLOW_RECAPTCHA_BYPASS (development only)."
      );
      return {
        success: true,
        score: 1,
        action: expectedAction,
        errors: ["bypassed:missing_secret"],
      };
    }

    console.error(
      "[reCAPTCHA] RECAPTCHA_SECRET_KEY not set – verification will fail."
    );
    return {
      success: false,
      score: 0,
      action: expectedAction,
      errors: ["missing_secret"],
    };
  }

  // Basic token sanity check
  if (!token || typeof token !== "string" || token.length < 30) {
    console.error("[reCAPTCHA] Invalid token format.");
    return {
      success: false,
      score: 0,
      action: expectedAction,
      errors: ["invalid_token_format"],
    };
  }

  const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || DEFAULT_MIN_SCORE.toString());

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
        errors: [`http_${response.status}`],
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
    const errors = Array.isArray(data["error-codes"]) ? data["error-codes"] : [];

    // Optional: action match check (warning only, not a failure)
    if (expectedAction && action && expectedAction !== action) {
      console.warn(
        `[reCAPTCHA] Action mismatch: expected="${expectedAction}" got="${action}"`
      );
    }

    if (!success) {
      console.warn("[reCAPTCHA] Verification failed:", {
        action,
        score,
        errors,
      });
      return {
        success: false,
        score,
        action,
        errors: errors.length > 0 ? errors : ["verification_failed"],
        raw: data,
      };
    }

    if (score < minScore) {
      console.warn(
        `[reCAPTCHA] Score below threshold: ${score} (min: ${minScore})`,
        { action, errors }
      );
      return {
        success: false,
        score,
        action,
        errors: errors.length > 0 ? errors : ["low_score"],
        raw: data,
      };
    }

    if (score < 0.3) {
      console.warn(
        `[reCAPTCHA] Low but passing score: ${score} (min: ${minScore})`,
        { action }
      );
    }

    return {
      success: true,
      score,
      action,
      errors,
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
        errors: ["timeout"],
      };
    }

    console.error("[reCAPTCHA] Verification failed with error:", error);
    return {
      success: false,
      score: 0,
      action: expectedAction,
      errors: ["exception"],
    };
  }
}

/**
 * Backward-compatible verification function
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
 * Validate reCAPTCHA configuration
 */
export function validateRecaptchaConfig(): {
  hasSecret: boolean;
  minScore: number;
  bypassEnabled: boolean;
} {
  const hasSecret = !!getSecret();
  const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || DEFAULT_MIN_SCORE.toString());
  const bypassEnabled = process.env.ALLOW_RECAPTCHA_BYPASS === "true";
  
  return {
    hasSecret,
    minScore,
    bypassEnabled,
  };
}