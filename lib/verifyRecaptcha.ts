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

const DEFAULT_CONFIG: RecaptchaConfig = {
  secretKey: process.env.RECAPTCHA_SECRET_KEY || "",
  minScore: parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5"),
  timeoutMs: parseInt(process.env.RECAPTCHA_TIMEOUT_MS || "5000", 10),
  enabled:
    process.env.NODE_ENV === "production" ||
    process.env.RECAPTCHA_ENABLED === "true",
  requiredActions: process.env.RECAPTCHA_REQUIRED_ACTIONS?.split(","),
  allowedHostnames: process.env.RECAPTCHA_ALLOWED_HOSTNAMES?.split(","),
};

// Replay-protection temporary cache
class TokenCache {
  private cache = new Map<string, number>();
  private readonly TTL = 2 * 60 * 1000; // 2 mins

  has(token: string): boolean {
    const ts = this.cache.get(token);
    if (!ts) return false;

    if (Date.now() - ts > this.TTL) {
      this.cache.delete(token);
      return false;
    }
    return true;
  }

  add(token: string): void {
    this.cache.set(token, Date.now());
  }

  cleanup(): void {
    const now = Date.now();
    for (const [token, ts] of this.cache.entries()) {
      if (now - ts > this.TTL) this.cache.delete(token);
    }
  }
}

const tokenCache = new TokenCache();

// Unified error class
export class RecaptchaError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "RecaptchaError";
  }
}

export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  clientIp?: string,
): Promise<RecaptchaVerificationResult> {
  const config = DEFAULT_CONFIG;

  const result: RecaptchaVerificationResult = {
    success: false,
    score: 0,
    timestamp: new Date(),
    errorCodes: [],
  };

  // Bypass in development
  if (!config.enabled) {
    return { ...result, success: true, score: 1.0 };
  }

  if (!config.secretKey) {
    throw new RecaptchaError("Missing secret key", "CONFIG_MISSING");
  }

  if (!token || token.length < 50) {
    throw new RecaptchaError("Invalid token", "INVALID_TOKEN");
  }

  if (tokenCache.has(token)) {
    throw new RecaptchaError("Token reuse detected", "TOKEN_REUSE");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    const params = new URLSearchParams();
    params.append("secret", config.secretKey);
    params.append("response", token);
    if (clientIp) params.append("remoteip", clientIp);

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

    const data = await response.json();

    const success = Boolean(data.success);
    const score = Number(data.score || 0);
    const action = data.action;
    const hostname = data.hostname;
    const errorCodes = Array.isArray(data["error-codes"]) ? data["error-codes"] : [];

    Object.assign(result, { success, score, action, hostname, errorCodes });

    const reasons: string[] = [];

    if (!success) reasons.push("API reported failure");
    if (score < config.minScore) reasons.push("Low score");
    if (expectedAction && action !== expectedAction)
      throw new RecaptchaError("Action mismatch", "ACTION_MISMATCH");
    if (
      config.allowedHostnames?.length &&
      hostname &&
      !config.allowedHostnames.includes(hostname)
    ) {
      reasons.push("Hostname not allowed");
    }

    if (errorCodes.length) {
      reasons.push(...errorCodes);
    }

    if (reasons.length) {
      result.reasons = reasons;
      result.success = false;
      return result;
    }

    tokenCache.add(token);
    return result;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new RecaptchaError("Timeout", "TIMEOUT");
    }
    if (err instanceof RecaptchaError) throw err;

    throw new RecaptchaError("Verification failed", "UNKNOWN", err);
  }
}

export function isRecaptchaValid(
  token: string,
  expectedAction?: string,
  clientIp?: string,
): Promise<boolean> {
  return verifyRecaptcha(token, expectedAction, clientIp)
    .then((res) => res.success)
    .catch(() => false);
}

// Cleanup
if (typeof setInterval !== "undefined") {
  setInterval(() => tokenCache.cleanup(), 5 * 60 * 1000);
}