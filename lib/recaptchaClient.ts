// lib/recaptchaClient.ts
/**
 * Client-side reCAPTCHA v3 token generator (canonical).
 *
 * Use in:
 * - pages/** (client components)
 * - UI submit flows (forms) to obtain a token before calling an API route
 *
 * Do NOT import this into API routes / server code.
 */

export type RecaptchaClientErrorCode =
  | "CONFIG_MISSING"
  | "INVALID_ACTION"
  | "SCRIPT_NOT_LOADED"
  | "SERVER_SIDE_CALL"
  | "TOKEN_GENERATION_FAILED";

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

function getSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!key || key.trim().length < 10) return null;
  return key.trim();
}

function isValidAction(action: string): boolean {
  // strict: safe chars only, stable keys for audit trails
  return /^[a-z0-9_]{3,64}$/i.test(action);
}

function getGrecaptcha(): unknown {
  if (typeof window === "undefined") return null;
  return (window as unknown as { grecaptcha?: unknown }).grecaptcha ?? null;
}

type GrecaptchaLike = {
  ready?: (cb: () => void) => void;
  execute?: (siteKey: string, opts: { action: string }) => Promise<string>;
};

export async function getRecaptchaToken(action: string): Promise<string> {
  if (typeof window === "undefined") {
    throw new RecaptchaClientError(
      "reCAPTCHA token requested on the server.",
      "SERVER_SIDE_CALL"
    );
  }

  const siteKey = getSiteKey();
  if (!siteKey) {
    throw new RecaptchaClientError(
      "Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY.",
      "CONFIG_MISSING"
    );
  }

  if (!action || typeof action !== "string" || !isValidAction(action)) {
    throw new RecaptchaClientError(
      "Invalid reCAPTCHA action.",
      "INVALID_ACTION",
      { action }
    );
  }

  const grecaptcha = getGrecaptcha() as GrecaptchaLike | null;

  if (!grecaptcha || typeof grecaptcha.execute !== "function") {
    throw new RecaptchaClientError(
      "reCAPTCHA script not loaded.",
      "SCRIPT_NOT_LOADED"
    );
  }

  // Ensure ready() runs when available
  if (typeof grecaptcha.ready === "function") {
    await new Promise<void>((resolve) => grecaptcha.ready?.(() => resolve()));
  }

  const token = await grecaptcha.execute(siteKey, { action });

  if (!token || typeof token !== "string" || token.length < 30) {
    throw new RecaptchaClientError(
      "Failed to generate token.",
      "TOKEN_GENERATION_FAILED"
    );
  }

  return token;
}

/**
 * Safe wrapper for UI flows:
 * - never throws
 * - returns null on failure
 */
export async function getRecaptchaTokenSafe(action: string): Promise<string | null> {
  try {
    return await getRecaptchaToken(action);
  } catch {
    return null;
  }
}