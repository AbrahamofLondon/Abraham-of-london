// lib/recaptchaClient.ts
/**
 * Production-ready client-side reCAPTCHA v3 token generator.
 * Optimized for Edge Runtime compatibility and better error handling.
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
  timeout?: number; // Timeout in milliseconds
  action?: string; // Default action name
  autoLoad?: boolean; // Whether to auto-load the script
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

// Global state
let scriptLoaded = false;
let scriptLoading = false;
let loadCallbacks: Array<() => void> = [];

// Configuration
const DEFAULT_TIMEOUT = 5000; // 5 seconds
const SCRIPT_URL = "https://www.google.com/recaptcha/api.js?render=";

// Environment validation
const ENV_VARS = {
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  NEXT_PUBLIC_RECAPTCHA_ENABLED: process.env.NEXT_PUBLIC_RECAPTCHA_ENABLED,
} as const;

/**
 * Get and validate site key
 */
export function getSiteKey(): string | null {
  const key = ENV_VARS.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  
  // Check if reCAPTCHA is disabled
  const isEnabled = ENV_VARS.NEXT_PUBLIC_RECAPTCHA_ENABLED !== 'false';
  if (!isEnabled) return null;
  
  if (!key || typeof key !== 'string') return null;
  
  const trimmed = key.trim();
  
  // Basic validation of reCAPTCHA site key format
  if (trimmed.length < 10 || trimmed.length > 100) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  
  return trimmed;
}

/**
 * Validate action name format
 */
export function isValidAction(action: string): boolean {
  // Allow letters, numbers, underscores, hyphens, dots
  // Length: 3-64 characters
  return /^[a-z0-9_.-]{3,64}$/i.test(action);
}

/**
 * Get grecaptcha from global window object
 */
function getGrecaptcha(): any {
  if (typeof window === "undefined") return null;
  
  // Check multiple possible global locations
  const globalWindow = window as any;
  return globalWindow.grecaptcha || 
         globalWindow.grecaptchaV3 || 
         null;
}

/**
 * Load reCAPTCHA script dynamically
 */
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
      reject(new RecaptchaClientError(
        "Cannot load reCAPTCHA without a valid site key",
        "CONFIG_MISSING"
      ));
      scriptLoading = false;
      return;
    }
    
    // Check if script is already in DOM
    const existingScript = document.querySelector(`script[src*="recaptcha"]`);
    if (existingScript) {
      scriptLoading = false;
      scriptLoaded = true;
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = `${SCRIPT_URL}${actualSiteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      
      // Wait for grecaptcha to be available
      const checkInterval = setInterval(() => {
        if (getGrecaptcha()) {
          clearInterval(checkInterval);
          resolve();
          
          // Call any pending callbacks
          while (loadCallbacks.length > 0) {
            const callback = loadCallbacks.shift();
            callback?.();
          }
        }
      }, 50);
      
      // Timeout after 3 seconds
      setTimeout(() => {
        if (!getGrecaptcha()) {
          clearInterval(checkInterval);
          reject(new RecaptchaClientError(
            "reCAPTCHA script loaded but grecaptcha object not found",
            "SCRIPT_NOT_LOADED"
          ));
        }
      }, 3000);
    };
    
    script.onerror = () => {
      scriptLoading = false;
      reject(new RecaptchaClientError(
        "Failed to load reCAPTCHA script",
        "NETWORK_ERROR"
      ));
    };
    
    document.head.appendChild(script);
    
    // Timeout for script loading
    setTimeout(() => {
      if (!scriptLoaded) {
        reject(new RecaptchaClientError(
          "reCAPTCHA script load timeout",
          "TIMEOUT"
        ));
      }
    }, DEFAULT_TIMEOUT);
  });
}

/**
 * Wait for reCAPTCHA to be ready
 */
async function waitForRecaptchaReady(): Promise<void> {
  const grecaptcha = getGrecaptcha();
  
  if (!grecaptcha) {
    throw new RecaptchaClientError(
      "reCAPTCHA not available",
      "SCRIPT_NOT_LOADED"
    );
  }
  
  // Use ready() if available
  if (typeof grecaptcha.ready === "function") {
    return new Promise((resolve) => {
      grecaptcha.ready(() => resolve());
    });
  }
  
  // Otherwise just resolve immediately
  return Promise.resolve();
}

/**
 * Main function to get reCAPTCHA token
 */
export async function getRecaptchaToken(
  action: string,
  options: RecaptchaClientOptions = {}
): Promise<string> {
  // Server-side check
  if (typeof window === "undefined") {
    throw new RecaptchaClientError(
      "reCAPTCHA token requested on the server",
      "SERVER_SIDE_CALL"
    );
  }
  
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const siteKey = getSiteKey();
  
  // Check configuration
  if (!siteKey) {
    // Check if we're in development and bypass is allowed
    const isDev = process.env.NODE_ENV !== 'production';
    const allowBypass = process.env.NEXT_PUBLIC_ALLOW_RECAPTCHA_BYPASS === 'true';
    
    if (isDev && allowBypass) {
      console.warn('[reCAPTCHA] Bypassing in development mode');
      return 'development-bypass-token';
    }
    
    throw new RecaptchaClientError(
      "Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
      "CONFIG_MISSING"
    );
  }
  
  // Validate action
  if (!action || typeof action !== "string" || !isValidAction(action)) {
    throw new RecaptchaClientError(
      `Invalid reCAPTCHA action: ${action}`,
      "INVALID_ACTION",
      { action }
    );
  }
  
  try {
    // Ensure script is loaded
    if (!scriptLoaded && options.autoLoad !== false) {
      await loadRecaptchaScript(siteKey);
    }
    
    // Wait for ready
    await waitForRecaptchaReady();
    
    const grecaptcha = getGrecaptcha();
    
    if (!grecaptcha || typeof grecaptcha.execute !== "function") {
      throw new RecaptchaClientError(
        "reCAPTCHA execute function not found",
        "SCRIPT_NOT_LOADED"
      );
    }
    
    // Execute with timeout
    const tokenPromise = grecaptcha.execute(siteKey, { action });
    
    const token = await Promise.race([
      tokenPromise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new RecaptchaClientError(
          "reCAPTCHA token generation timeout",
          "TIMEOUT"
        )), timeout);
      })
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
 * Safe wrapper that returns null on failure
 */
export async function getRecaptchaTokenSafe(
  action: string,
  options: RecaptchaClientOptions = {}
): Promise<string | null> {
  try {
    return await getRecaptchaToken(action, options);
  } catch (error) {
    console.error('[reCAPTCHA] Failed to get token:', error);
    return null;
  }
}

/**
 * Hook-like function for React components
 * Preloads reCAPTCHA script on component mount
 */
export async function preloadRecaptcha(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (scriptLoaded || scriptLoading) return;
  
  const siteKey = getSiteKey();
  if (!siteKey) return;
  
  try {
    await loadRecaptchaScript(siteKey);
  } catch (error) {
    console.warn('[reCAPTCHA] Preload failed:', error);
  }
}

/**
 * Get current reCAPTCHA status
 */
export function getRecaptchaStatus(): {
  configured: boolean;
  scriptLoaded: boolean;
  scriptLoading: boolean;
  siteKey: string | null;
} {
  const siteKey = getSiteKey();
  
  return {
    configured: !!siteKey,
    scriptLoaded,
    scriptLoading,
    siteKey,
  };
}

/**
 * Reset reCAPTCHA state (for testing)
 */
export function resetRecaptcha(): void {
  scriptLoaded = false;
  scriptLoading = false;
  loadCallbacks = [];
  
  // Remove script from DOM if it exists
  if (typeof document !== 'undefined') {
    const script = document.querySelector('script[src*="recaptcha"]');
    if (script) {
      script.remove();
    }
  }
}

/**
 * Convenience function for form submissions
 */
export async function withRecaptcha<T>(
  action: string,
  callback: (token: string) => Promise<T> | T,
  options: RecaptchaClientOptions = {}
): Promise<T> {
  const token = await getRecaptchaToken(action, options);
  return callback(token);
}

/**
 * Batch multiple actions into a single token request
 * (If supported by your implementation)
 */
export async function getRecaptchaTokenForActions(
  actions: string[],
  options: RecaptchaClientOptions = {}
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  for (const action of actions) {
    try {
      results[action] = await getRecaptchaToken(action, options);
    } catch (error) {
      console.error(`[reCAPTCHA] Failed for action "${action}":`, error);
      results[action] = '';
    }
  }
  
  return results;
}

export default {
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