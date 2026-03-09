/* eslint-disable no-console */
/**
 * lib/recaptchaServer.ts
 * PAGES/API SAFE SERVER-SIDE reCAPTCHA v3 VERIFICATION
 */

export type RecaptchaVerificationResult = {
  success: boolean;
  score: number;
  action?: string;
  timestamp: string;
  errorCodes: string[];
  raw?: unknown;
  warning?: string;
};

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const DEFAULT_MIN_SCORE = 0.5;
const DEFAULT_TIMEOUT_MS = 3000;
const MAX_TIMEOUT_MS = 10000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 150;

function env(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : undefined;
}

function getSecret(): string | null {
  const candidates = [env("RECAPTCHA_SECRET_KEY"), env("RECAPTCHA_SECRET")];

  for (const candidate of candidates) {
    if (candidate && candidate.length >= 10 && candidate.length <= 200) {
      return candidate;
    }
  }

  return null;
}

function getMinScore(): number {
  const raw = env("RECAPTCHA_MIN_SCORE");
  if (!raw) return DEFAULT_MIN_SCORE;

  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return DEFAULT_MIN_SCORE;

  if (process.env.NODE_ENV === "production" && n < 0.3) return 0.3;
  return n;
}

function isBypassAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    env("ALLOW_RECAPTCHA_BYPASS") === "true"
  );
}

function isDevelopmentBypassToken(token: string): boolean {
  return token === "development-bypass-token";
}

function clampTimeout(timeoutMs?: number): number {
  const n = Number(timeoutMs);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(n, 500), MAX_TIMEOUT_MS);
}

function normalizeErrorCodes(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
  }

  if (typeof value === "string" && value.trim()) {
    return [value.toLowerCase().replace(/[^a-z0-9_]/g, "_")];
  }

  return [];
}

async function makeVerificationRequest(
  secret: string,
  token: string,
  remoteIp?: string,
  timeoutMs?: number
): Promise<any> {
  const params = new URLSearchParams({
    secret,
    response: token.trim(),
  });

  if (remoteIp && remoteIp.trim()) {
    params.set("remoteip", remoteIp.trim());
  }

  const effectiveTimeout = clampTimeout(timeoutMs);
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * attempt)
        );
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), effectiveTimeout);

      try {
        const response = await fetch(VERIFY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Abraham-of-London/1.0",
          },
          body: params.toString(),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP_${response.status}`);
        }

        return await response.json();
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("verification_failed");
}

export async function verifyRecaptchaDetailed(
  token: string,
  expectedAction?: string,
  remoteIp?: string,
  timeoutMs?: number
): Promise<RecaptchaVerificationResult> {
  const timestamp = new Date().toISOString();
  const trimmedToken = String(token || "").trim();

  if (isDevelopmentBypassToken(trimmedToken) && isBypassAllowed()) {
    return {
      success: true,
      score: 1,
      action: expectedAction,
      timestamp,
      errorCodes: [],
      warning: "bypass_active_client_token",
    };
  }

  if (!trimmedToken || trimmedToken.length < 20) {
    return {
      success: false,
      score: 0,
      action: expectedAction,
      timestamp,
      errorCodes: ["invalid_token"],
    };
  }

  const secret = getSecret();

  if (!secret) {
    if (isBypassAllowed()) {
      return {
        success: true,
        score: 1,
        action: expectedAction,
        timestamp,
        errorCodes: [],
        warning: "bypass_active_missing_secret",
      };
    }

    return {
      success: false,
      score: 0,
      action: expectedAction,
      timestamp,
      errorCodes: ["missing_secret"],
    };
  }

  try {
    const data = await makeVerificationRequest(
      secret,
      trimmedToken,
      remoteIp,
      timeoutMs
    );
    const score = typeof data?.score === "number" ? data.score : 0;
    const action = typeof data?.action === "string" ? data.action : undefined;
    const errorCodes = normalizeErrorCodes(data?.["error-codes"]);
    const minScore = getMinScore();

    let success = Boolean(data?.success) && score >= minScore;

    if (expectedAction && action && expectedAction !== action) {
      success = false;
      errorCodes.push("action_mismatch");
    }

    return {
      success,
      score,
      action,
      timestamp,
      errorCodes,
      raw: data,
    };
  } catch (error) {
    console.error("[reCAPTCHA] Verification failure:", error);

    if (isBypassAllowed()) {
      return {
        success: true,
        score: 1,
        action: expectedAction,
        timestamp,
        errorCodes: [],
        warning: "bypass_active_verification_exception",
      };
    }

    return {
      success: false,
      score: 0,
      action: expectedAction,
      timestamp,
      errorCodes: ["verification_exception"],
    };
  }
}

export async function verifyRecaptcha(
  token: string,
  action?: string,
  ip?: string
): Promise<boolean> {
  const result = await verifyRecaptchaDetailed(token, action, ip);
  return result.success;
}

export async function verifyRecaptchaToken(
  token: string,
  action?: string,
  ip?: string
): Promise<boolean> {
  return verifyRecaptcha(token, action, ip);
}

export function validateRecaptchaConfig() {
  return {
    hasSecret: Boolean(getSecret()),
    minScore: getMinScore(),
    bypassAllowed: isBypassAllowed(),
    environment: process.env.NODE_ENV || "development",
  };
}

const recaptchaServerApi = {
  verifyRecaptchaDetailed,
  verifyRecaptcha,
  verifyRecaptchaToken,
  validateRecaptchaConfig,
};

export default recaptchaServerApi;