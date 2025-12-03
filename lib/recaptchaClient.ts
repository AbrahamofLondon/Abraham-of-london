// lib/recaptchaClient.ts

interface Grecaptcha {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
  render: (container: string | Element, parameters: unknown) => number;
}

declare global {
  interface Window {
    grecaptcha: Grecaptcha;
  }
}

let scriptLoaded = false;
let loadingPromise: Promise<void> | null = null;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

interface RecaptchaConfig {
  siteKey: string;
  scriptUrl: string;
  timeoutMs: number;
  maxRetries: number;
}

const DEFAULT_CONFIG: RecaptchaConfig = {
  siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
  scriptUrl: "https://www.google.com/recaptcha/api.js",
  timeoutMs: parseInt(process.env.RECAPTCHA_CLIENT_TIMEOUT_MS || "10000", 10),
  maxRetries: parseInt(process.env.RECAPTCHA_MAX_RETRIES || "2", 10),
};

const IS_DEV = process.env.NODE_ENV !== "production";

export class RecaptchaClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "RecaptchaClientError";
    Object.setPrototypeOf(this, RecaptchaClientError.prototype);
  }
}

export class RecaptchaTimeoutError extends RecaptchaClientError {
  constructor(message: string = "reCAPTCHA operation timed out") {
    super(message, "TIMEOUT");
    this.name = "RecaptchaTimeoutError";
  }
}

export class RecaptchaScriptError extends RecaptchaClientError {
  constructor(message: string = "Failed to load reCAPTCHA script") {
    super(message, "SCRIPT_LOAD_FAILED");
    this.name = "RecaptchaScriptError";
  }
}

// Relaxed but sane site key validation
function validateSiteKey(siteKey: string): boolean {
  if (!siteKey || typeof siteKey !== "string") return false;

  if (siteKey.length < 20 || siteKey.length > 80) return false;

  return /^[a-zA-Z0-9_-]+$/.test(siteKey);
}

function getSiteKey(): string {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!key) {
    if (IS_DEV) {
      console.warn("[reCAPTCHA] NEXT_PUBLIC_RECAPTCHA_SITE_KEY not set");
    }
    return "";
  }

  if (!validateSiteKey(key)) {
    console.error("[reCAPTCHA] Invalid site key format");
    return "";
  }

  return key;
}

function injectScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (scriptLoaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  const siteKey = getSiteKey();
  if (!siteKey) {
    return Promise.reject(
      new RecaptchaClientError(
        "reCAPTCHA site key not configured",
        "CONFIG_MISSING"
      )
    );
  }

  if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
    return Promise.reject(
      new RecaptchaClientError(
        "Maximum reCAPTCHA initialization attempts exceeded",
        "MAX_ATTEMPTS_EXCEEDED"
      )
    );
  }

  initializationAttempts++;

  loadingPromise = new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(
      () => reject(new RecaptchaTimeoutError("reCAPTCHA script loading timeout")),
      DEFAULT_CONFIG.timeoutMs
    );

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src^="${DEFAULT_CONFIG.scriptUrl}"]`
    );

    if (existingScript) {
      clearTimeout(timeoutId);
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `${DEFAULT_CONFIG.scriptUrl}?render=${encodeURIComponent(
      siteKey
    )}`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";

    if (process.env.RECAPTCHA_SCRIPT_INTEGRITY_HASH) {
      script.integrity = process.env.RECAPTCHA_SCRIPT_INTEGRITY_HASH;
    }

    script.onload = (): void => {
      clearTimeout(timeoutId);

      setTimeout(() => {
        if (typeof window.grecaptcha === "undefined") {
          reject(
            new RecaptchaScriptError(
              "grecaptcha object not available after script load"
            )
          );
          return;
        }

        if (typeof window.grecaptcha.ready !== "function") {
          reject(
            new RecaptchaScriptError("grecaptcha.ready method not available")
          );
          return;
        }

        if (typeof window.grecaptcha.execute !== "function") {
          reject(
            new RecaptchaScriptError("grecaptcha.execute method not available")
          );
          return;
        }

        scriptLoaded = true;
        if (IS_DEV) {
          console.debug("[reCAPTCHA] Script loaded successfully");
        }
        resolve();
      }, 100);
    };

    script.onerror = (event: string | Event): void => {
      clearTimeout(timeoutId);
      const error = new RecaptchaScriptError(
        `Failed to load reCAPTCHA script: ${event}`
      );
      console.error("[reCAPTCHA] Script load error:", error);
      reject(error);
    };

    const cspNonce = document
      .querySelector('meta[property="csp-nonce"]')
      ?.getAttribute("content");
    if (cspNonce) {
      script.nonce = cspNonce;
    }

    document.head.appendChild(script);
  });

  return loadingPromise;
}

export async function isRecaptchaAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    await injectScript();
    return (
      typeof window.grecaptcha !== "undefined" &&
      typeof window.grecaptcha.ready === "function" &&
      typeof window.grecaptcha.execute === "function"
    );
  } catch {
    return false;
  }
}

export async function waitForRecaptchaReady(): Promise<void> {
  if (typeof window === "undefined") return;

  await injectScript();

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(
      () => reject(new RecaptchaTimeoutError("reCAPTCHA ready timeout")),
      DEFAULT_CONFIG.timeoutMs
    );

    try {
      window.grecaptcha.ready(() => {
        clearTimeout(timeoutId);
        resolve();
      });
    } catch (error) {
      clearTimeout(timeoutId);
      reject(
        new RecaptchaClientError(
          "grecaptcha.ready failed",
          "READY_FAILED",
          error
        )
      );
    }
  });
}

export async function getRecaptchaToken(
  action: string,
  retryCount: number = 0
): Promise<string> {
  if (typeof window === "undefined") {
    throw new RecaptchaClientError(
      "getRecaptchaToken can only be called client-side",
      "SERVER_SIDE_CALL"
    );
  }

  if (!action || typeof action !== "string") {
    throw new RecaptchaClientError(
      "Action parameter is required and must be a string",
      "INVALID_ACTION"
    );
  }

  if (action.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(action)) {
    throw new RecaptchaClientError(
      "Action must be alphanumeric and less than 50 characters",
      "INVALID_ACTION_FORMAT"
    );
  }

  const siteKey = getSiteKey();
  if (!siteKey) {
    throw new RecaptchaClientError(
      "reCAPTCHA site key not configured",
      "CONFIG_MISSING"
    );
  }

  try {
    await injectScript();
    await waitForRecaptchaReady();

    const token = await new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(
        () => reject(new RecaptchaTimeoutError("reCAPTCHA token generation timeout")),
        DEFAULT_CONFIG.timeoutMs
      );

      try {
        window.grecaptcha
          .execute(siteKey, { action })
          .then((tokenValue: string) => {
            clearTimeout(timeoutId);

            if (
              !tokenValue ||
              typeof tokenValue !== "string" ||
              tokenValue.length < 50
            ) {
              reject(
                new RecaptchaClientError(
                  "Invalid token received from reCAPTCHA",
                  "INVALID_TOKEN_FORMAT"
                )
              );
              return;
            }

            if (IS_DEV) {
              console.debug(
                `[reCAPTCHA] Token generated for action: ${action}`,
                {
                  tokenPrefix: tokenValue.substring(0, 10) + "...",
                  action,
                  timestamp: new Date().toISOString(),
                }
              );
            }

            resolve(tokenValue);
          })
          .catch((error: unknown) => {
            clearTimeout(timeoutId);
            console.error("[reCAPTCHA] Token generation error:", error);

            if (retryCount < DEFAULT_CONFIG.maxRetries) {
              if (IS_DEV) {
                console.warn(
                  `[reCAPTCHA] Retrying token generation (attempt ${
                    retryCount + 1
                  })`
                );
              }
              setTimeout(
                () => {
                  getRecaptchaToken(action, retryCount + 1)
                    .then(resolve)
                    .catch(reject);
                },
                Math.pow(2, retryCount) * 1000
              );
            } else {
              reject(
                new RecaptchaClientError(
                  "Failed to generate reCAPTCHA token after retries",
                  "TOKEN_GENERATION_FAILED",
                  error
                )
              );
            }
          });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(
          new RecaptchaClientError(
            "Unexpected error during token generation",
            "UNEXPECTED_ERROR",
            error
          )
        );
      }
    });

    return token;
  } catch (error) {
    if (error instanceof RecaptchaClientError) {
      throw error;
    }
    throw new RecaptchaClientError(
      "Unknown error during reCAPTCHA token generation",
      "UNKNOWN_ERROR",
      error
    );
  }
}

export async function getRecaptchaTokenSafe(
  action: string
): Promise<string | null> {
  try {
    return await getRecaptchaToken(action);
  } catch (error) {
    if (IS_DEV) {
      console.warn("[reCAPTCHA] Safe token generation failed:", error);
    }
    return null;
  }
}

export function preloadRecaptcha(): void {
  if (typeof window === "undefined") return;

  if (!scriptLoaded && !loadingPromise) {
    injectScript().catch((error) => {
      if (IS_DEV) {
        console.debug("[reCAPTCHA] Preload failed (non-critical):", error);
      }
    });
  }
}

export function resetRecaptcha(): void {
  scriptLoaded = false;
  loadingPromise = null;
  initializationAttempts = 0;
}

if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => {
      preloadRecaptcha();
    });
  } else {
    setTimeout(preloadRecaptcha, 1000);
  }
}

export default {
  getRecaptchaToken,
  getRecaptchaTokenSafe,
  isRecaptchaAvailable,
  waitForRecaptchaReady,
  preloadRecaptcha,
  resetRecaptcha,
};