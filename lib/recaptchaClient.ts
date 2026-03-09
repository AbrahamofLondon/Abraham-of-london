/**
 * lib/recaptchaClient.ts
 * Production-ready client-side reCAPTCHA v3 token generator.
 *
 * Principles:
 * - Never throw for missing config in the "safe" path.
 * - Allow controlled client-side bypass in non-production.
 * - Keep direct token path strict for callers that explicitly want failure.
 */

export type RecaptchaClientErrorCode =
  | "CONFIG_MISSING"
  | "INVALID_ACTION"
  | "SCRIPT_NOT_LOADED"
  | "SERVER_SIDE_CALL"
  | "TOKEN_GENERATION_FAILED"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INVALID_SITE_KEY";

export interface RecaptchaClientOptions {
  timeout?: number;
  action?: string;
  autoLoad?: boolean;
}

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

let scriptLoaded = false;
let scriptLoading = false;
let loadCallbacks: Array<() => void> = [];

const DEFAULT_TIMEOUT = 5000;
const SCRIPT_URL = "https://www.google.com/recaptcha/api.js?render=";

function env(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" ? value : undefined;
}

function isClientBypassAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    env("NEXT_PUBLIC_ALLOW_RECAPTCHA_BYPASS") === "true"
  );
}

export function getSiteKey(): string | null {
  const enabled = env("NEXT_PUBLIC_RECAPTCHA_ENABLED") !== "false";
  if (!enabled) return null;

  const key = env("NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
  if (!key || typeof key !== "string") return null;

  const trimmed = key.trim();
  if (trimmed.length < 10 || trimmed.length > 100) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;

  return trimmed;
}

export function isValidAction(action: string): boolean {
  return /^[a-z0-9_.-]{3,64}$/i.test(action);
}

function getGrecaptcha(): any {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.grecaptcha || w.grecaptchaV3 || null;
}

export async function loadRecaptchaScript(siteKey?: string): Promise<void> {
  if (scriptLoaded) return;

  if (scriptLoading) {
    return new Promise((resolve) => {
      loadCallbacks.push(resolve);
    });
  }

  scriptLoading = true;

  return new Promise((resolve, reject) => {
    const actualSiteKey = siteKey || getSiteKey();

    if (!actualSiteKey) {
      scriptLoading = false;
      reject(
        new RecaptchaClientError(
          "Cannot load reCAPTCHA without a valid site key",
          "CONFIG_MISSING"
        )
      );
      return;
    }

    const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
    if (existingScript) {
      scriptLoading = false;
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `${SCRIPT_URL}${actualSiteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;

      const checkInterval = setInterval(() => {
        if (getGrecaptcha()) {
          clearInterval(checkInterval);
          resolve();

          while (loadCallbacks.length > 0) {
            const callback = loadCallbacks.shift();
            callback?.();
          }
        }
      }, 50);

      setTimeout(() => {
        if (!getGrecaptcha()) {
          clearInterval(checkInterval);
          reject(
            new RecaptchaClientError(
              "reCAPTCHA script loaded but grecaptcha object not found",
              "SCRIPT_NOT_LOADED"
            )
          );
        }
      }, 3000);
    };

    script.onerror = () => {
      scriptLoading = false;
      reject(
        new RecaptchaClientError(
          "Failed to load reCAPTCHA script",
          "NETWORK_ERROR"
        )
      );
    };

    document.head.appendChild(script);

    setTimeout(() => {
      if (!scriptLoaded) {
        reject(
          new RecaptchaClientError(
            "reCAPTCHA script load timeout",
            "TIMEOUT"
          )
        );
      }
    }, DEFAULT_TIMEOUT);
  });
}

async function waitForRecaptchaReady(): Promise<void> {
  const grecaptcha = getGrecaptcha();

  if (!grecaptcha) {
    throw new RecaptchaClientError(
      "reCAPTCHA not available",
      "SCRIPT_NOT_LOADED"
    );
  }

  if (typeof grecaptcha.ready === "function") {
    return new Promise((resolve) => {
      grecaptcha.ready(() => resolve());
    });
  }

  return Promise.resolve();
}

export async function getRecaptchaToken(
  action: string,
  options: RecaptchaClientOptions = {}
): Promise<string> {
  if (typeof window === "undefined") {
    throw new RecaptchaClientError(
      "reCAPTCHA token requested on the server",
      "SERVER_SIDE_CALL"
    );
  }

  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const siteKey = getSiteKey();

  if (!siteKey) {
    if (isClientBypassAllowed()) {
      return "development-bypass-token";
    }

    throw new RecaptchaClientError(
      "Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
      "CONFIG_MISSING"
    );
  }

  if (!action || typeof action !== "string" || !isValidAction(action)) {
    throw new RecaptchaClientError(
      `Invalid reCAPTCHA action: ${action}`,
      "INVALID_ACTION",
      { action }
    );
  }

  try {
    if (!scriptLoaded && options.autoLoad !== false) {
      await loadRecaptchaScript(siteKey);
    }

    await waitForRecaptchaReady();

    const grecaptcha = getGrecaptcha();
    if (!grecaptcha || typeof grecaptcha.execute !== "function") {
      throw new RecaptchaClientError(
        "reCAPTCHA execute function not found",
        "SCRIPT_NOT_LOADED"
      );
    }

    const tokenPromise = grecaptcha.execute(siteKey, { action });

    const token = await Promise.race([
      tokenPromise,
      new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new RecaptchaClientError(
                "reCAPTCHA token generation timeout",
                "TIMEOUT"
              )
            ),
          timeout
        );
      }),
    ]);

    if (!token || typeof token !== "string" || token.length < 30) {
      throw new RecaptchaClientError(
        "Invalid token generated",
        "TOKEN_GENERATION_FAILED"
      );
    }

    return token;
  } catch (error) {
    if (error instanceof RecaptchaClientError) {
      throw error;
    }

    throw new RecaptchaClientError(
      "Failed to generate reCAPTCHA token",
      "TOKEN_GENERATION_FAILED",
      { originalError: error }
    );
  }
}

/**
 * Safe wrapper:
 * - returns bypass token in allowed non-production mode
 * - returns null quietly if config is absent or generation fails
 */
export async function getRecaptchaTokenSafe(
  action: string,
  options: RecaptchaClientOptions = {}
): Promise<string | null> {
  try {
    const siteKey = getSiteKey();

    if (!siteKey) {
      if (isClientBypassAllowed()) {
        return "development-bypass-token";
      }
      return null;
    }

    return await getRecaptchaToken(action, options);
  } catch (error) {
    console.error("[reCAPTCHA] Failed to get token:", error);
    if (isClientBypassAllowed()) {
      return "development-bypass-token";
    }
    return null;
  }
}

export async function preloadRecaptcha(): Promise<void> {
  if (typeof window === "undefined") return;
  if (scriptLoaded || scriptLoading) return;

  const siteKey = getSiteKey();
  if (!siteKey) return;

  try {
    await loadRecaptchaScript(siteKey);
  } catch (error) {
    console.warn("[reCAPTCHA] Preload failed:", error);
  }
}

export function getRecaptchaStatus(): {
  configured: boolean;
  scriptLoaded: boolean;
  scriptLoading: boolean;
  siteKey: string | null;
  bypassAllowed: boolean;
} {
  const siteKey = getSiteKey();

  return {
    configured: !!siteKey,
    scriptLoaded,
    scriptLoading,
    siteKey,
    bypassAllowed: isClientBypassAllowed(),
  };
}

export function resetRecaptcha(): void {
  scriptLoaded = false;
  scriptLoading = false;
  loadCallbacks = [];

  if (typeof document !== "undefined") {
    const script = document.querySelector('script[src*="recaptcha/api.js"]');
    if (script) script.remove();
  }
}

export async function withRecaptcha<T>(
  action: string,
  callback: (token: string) => Promise<T> | T,
  options: RecaptchaClientOptions = {}
): Promise<T> {
  const token = await getRecaptchaToken(action, options);
  return callback(token);
}

export async function getRecaptchaTokenForActions(
  actions: string[],
  options: RecaptchaClientOptions = {}
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const action of actions) {
    try {
      const token = await getRecaptchaTokenSafe(action, options);
      results[action] = token || "";
    } catch (error) {
      console.error(`[reCAPTCHA] Failed for action "${action}":`, error);
      results[action] = "";
    }
  }

  return results;
}

const recaptchaClientApi = {
  getRecaptchaToken,
  getRecaptchaTokenSafe,
  loadRecaptchaScript,
  preloadRecaptcha,
  getRecaptchaStatus,
  resetRecaptcha,
  withRecaptcha,
  getRecaptchaTokenForActions,
  getSiteKey,
  isValidAction,
};

export default recaptchaClientApi;