// lib/recaptchaServer.ts

/**
 * Server-side reCAPTCHA v3 verification helper.
 *
 * Expected usage in API routes:
 *
 *   import { verifyRecaptcha } from "@/lib/recaptchaServer";
 *
 *   const result = await verifyRecaptcha(token, "inner_circle_register", ip);
 *   if (!result.success || result.score < 0.2) { ... }
 */

export type RecaptchaVerificationResult = {
  success: boolean;
  score: number;
  action?: string;
  reasons?: string[];
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
 * Core verification function.
 *
 * @param token          The client reCAPTCHA token.
 * @param expectedAction Optional action string you passed on the client.
 * @param remoteIp       Optional client IP for Google auditing.
 */
export async function verifyRecaptcha(
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
      // eslint-disable-next-line no-console
      console.warn(
        "[reCAPTCHA] RECAPTCHA_SECRET_KEY missing – bypass enabled via ALLOW_RECAPTCHA_BYPASS (development only)."
      );
      return {
        success: true,
        score: 1,
        action: expectedAction,
        reasons: ["bypassed:missing_secret"],
      };
    }

    // eslint-disable-next-line no-console
    console.error(
      "[reCAPTCHA] RECAPTCHA_SECRET_KEY not set – verification will fail."
    );
    return {
      success: false,
      score: 0,
      action: expectedAction,
      reasons: ["missing_secret"],
    };
  }

  // Basic token sanity check
  if (!token || typeof token !== "string" || token.length < 30) {
    // eslint-disable-next-line no-console
    console.error("[reCAPTCHA] Invalid token format.");
    return {
      success: false,
      score: 0,
      action: expectedAction,
      reasons: ["invalid_token_format"],
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
      // eslint-disable-next-line no-console
      console.error(`[reCAPTCHA] HTTP error: ${response.status}`);
      return {
        success: false,
        score: 0,
        action: expectedAction,
        reasons: [`http_${response.status}`],
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
    const reasons =
      Array.isArray(data["error-codes"]) && data["error-codes"].length > 0
        ? (data["error-codes"].map((c) => String(c)) as string[])
        : undefined;

    // Optional: action match check
    if (expectedAction && action && expectedAction !== action) {
      // eslint-disable-next-line no-console
      console.warn(
        `[reCAPTCHA] Action mismatch: expected="${expectedAction}" got="${action}"`
      );
    }

    if (!success) {
      // eslint-disable-next-line no-console
      console.warn("[reCAPTCHA] Verification failed:", {
        action,
        score,
        reasons,
      });
      return {
        success: false,
        score,
        action,
        reasons: reasons ?? ["verification_failed"],
        raw: data,
      };
    }

    if (score < minScore) {
      // eslint-disable-next-line no-console
      console.warn(
        `[reCAPTCHA] Score below threshold: ${score} (min: ${minScore})`,
        { action, reasons }
      );
      return {
        success: false,
        score,
        action,
        reasons: reasons ?? ["low_score"],
        raw: data,
      };
    }

    if (score < 0.3) {
      // eslint-disable-next-line no-console
      console.warn(
        `[reCAPTCHA] Low but passing score: ${score} (min: ${minScore})`,
        { action }
      );
    }

    return {
      success: true,
      score,
      action,
      reasons,
      raw: data,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { name?: string }).name === "AbortError"
    ) {
      // eslint-disable-next-line no-console
      console.error("[reCAPTCHA] Verification timed out.");
      return {
        success: false,
        score: 0,
        action: expectedAction,
        reasons: ["timeout"],
      };
    }

    // eslint-disable-next-line no-console
    console.error("[reCAPTCHA] Verification failed with error:", error);
    return {
      success: false,
      score: 0,
      action: expectedAction,
      reasons: ["exception"],
    };
  }
}