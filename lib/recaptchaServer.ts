/* eslint-disable no-console */
/**
 * lib/recaptchaServer.ts
 * Hardened server-side reCAPTCHA v3 verification.
 * Optimized for Abraham of London Strategic Infrastructure.
 */

export type RecaptchaVerificationResult = {
  success: boolean;
  score: number;
  action?: string;
  timestamp?: string; // ISO timestamp of verification
  errorCodes?: string[];
  raw?: unknown;
  warning?: string; // Non-critical warnings
};

// Environment variable validation
const ENV_VARS = {
  RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY,
  RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET,
  RECAPTCHA_MIN_SCORE: process.env.RECAPTCHA_MIN_SCORE,
  ALLOW_RECAPTCHA_BYPASS: process.env.ALLOW_RECAPTCHA_BYPASS,
  NODE_ENV: process.env.NODE_ENV,
} as const;

// Configuration constants
const DEFAULT_MIN_SCORE = 0.5;
const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const DEFAULT_TIMEOUT_MS = 3000;
const MAX_TIMEOUT_MS = 10000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 100;
const CACHE_TTL_MS = 60000;
const MAX_CACHE_SIZE = 1000;

// Simple in-memory cache for development/staging
const verificationCache = new Map<string, {
  result: RecaptchaVerificationResult;
  timestamp: number;
}>();

/**
 * 1. INTERNAL UTILITIES
 */

function getSecret(): string | null {
  const candidates = [ENV_VARS.RECAPTCHA_SECRET_KEY, ENV_VARS.RECAPTCHA_SECRET];
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length >= 10 && trimmed.length <= 100) return trimmed;
    }
  }
  return null;
}

function getMinScore(): number {
  const raw = ENV_VARS.RECAPTCHA_MIN_SCORE;
  if (!raw) return DEFAULT_MIN_SCORE;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0 && n <= 1) {
    if (ENV_VARS.NODE_ENV === 'production' && n < 0.3) return 0.3;
    return n;
  }
  return DEFAULT_MIN_SCORE;
}

function normalizeErrorCodes(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string").map(c => c.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  }
  return typeof value === 'string' ? [value.toLowerCase()] : [];
}

async function makeVerificationRequest(secret: string, token: string, remoteIp?: string, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const params = new URLSearchParams({ secret, response: token.trim() });
  if (remoteIp) params.set("remoteip", remoteIp);

  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Abraham-of-London/1.0" },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(id);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      if (attempt === RETRY_ATTEMPTS) throw e;
    }
  }
}

/**
 * 2. CORE EXPORTS
 */

/**
 * DETAILED VERIFIER: Returns full object with scores and logs.
 */
export async function verifyRecaptchaDetailed(
  token: string,
  expectedAction?: string,
  remoteIp?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  bypassAllowed: boolean = ENV_VARS.NODE_ENV !== 'production' && ENV_VARS.ALLOW_RECAPTCHA_BYPASS === "true"
): Promise<RecaptchaVerificationResult> {
  const timestamp = new Date().toISOString();
  
  if (!token || token.length < 20) {
    return { success: false, score: 0, action: expectedAction, timestamp, errorCodes: ["invalid_token"] };
  }

  const secret = getSecret();
  if (!secret) {
    if (bypassAllowed) return { success: true, score: 1, action: expectedAction, timestamp, warning: "bypass_active" };
    return { success: false, score: 0, action: expectedAction, timestamp, errorCodes: ["missing_secret"] };
  }

  try {
    const data = await makeVerificationRequest(secret, token, remoteIp, timeoutMs);
    const result: RecaptchaVerificationResult = {
      success: data.success && data.score >= getMinScore(),
      score: data.score || 0,
      action: data.action,
      timestamp,
      errorCodes: normalizeErrorCodes(data["error-codes"]),
      raw: data
    };

    if (expectedAction && data.action && expectedAction !== data.action) {
      result.success = false;
      result.errorCodes?.push("action_mismatch");
    }

    return result;
  } catch (error) {
    console.error("[reCAPTCHA] Critical failure:", error);
    return { success: false, score: 0, timestamp, errorCodes: ["verification_exception"] };
  }
}

/**
 * SIMPLIFIED VERIFIER: Returns boolean for quick middleware checks.
 */
export async function verifyRecaptcha(token: string, action?: string, ip?: string): Promise<boolean> {
  const res = await verifyRecaptchaDetailed(token, action, ip);
  return res.success;
}

/**
 * LEGACY WRAPPER: Matches the specific import expected by your strategy-room routes.
 */
export async function verifyRecaptchaToken(token: string) {
  return verifyRecaptcha(token);
}

// 3. EXPORT API OBJECT
const recaptchaServerApi = {
  verifyRecaptchaDetailed,
  verifyRecaptcha,
  verifyRecaptchaToken,
  validateRecaptchaConfig: () => ({ hasSecret: !!getSecret(), minScore: getMinScore() }),
  clearCache: () => verificationCache.clear()
};

export default recaptchaServerApi;