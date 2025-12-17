// hooks/useRecaptcha.ts
import * as React from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

type RecaptchaState = "idle" | "loading" | "ready" | "error";

interface UseRecaptchaResult {
  state: RecaptchaState;
  error: string | null;
  execute: (action: string) => Promise<string | null>;
  isReady: boolean;
  isEnabled: boolean;
}

/**
 * World-Class reCAPTCHA v3 Hook
 * Optimized for Next.js Static Export and Resilient Execution.
 */
export function useRecaptcha(): UseRecaptchaResult {
  const [state, setState] = React.useState<RecaptchaState>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const isEnabled = !!SITE_KEY;

  React.useEffect(() => {
    if (!isEnabled) {
      setState("error");
      setError("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
      return;
    }

    if (typeof window === "undefined") return;

    const win = window as any;

    // 1. If already loaded, transition to ready
    if (win.grecaptcha?.execute) {
      setState("ready");
      return;
    }

    // 2. Prevent duplicate script injection
    const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
    if (existingScript) {
      setState("loading");
      existingScript.addEventListener("load", () => setState("ready"));
      return;
    }

    // 3. Inject Script with Production Guardrails
    setState("loading");
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY!)}`;
    script.async = true;
    script.defer = true;
    
    const handleLoad = () => {
      win.grecaptcha.ready(() => setState("ready"));
    };

    const handleError = () => {
      setState("error");
      setError("Security script failed to load.");
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [isEnabled]);

  const execute = React.useCallback(async (action: string): Promise<string | null> => {
    const win = window as any;
    if (!isEnabled || !win.grecaptcha?.execute) {
      console.error("[reCAPTCHA] System not ready for action:", action);
      return null;
    }

    try {
      // execute returns a promise with the token
      return await win.grecaptcha.execute(SITE_KEY, { action });
    } catch (err) {
      console.error("[reCAPTCHA] Execution failed:", err);
      return null;
    }
  }, [isEnabled]);

  return React.useMemo(() => ({
    state,
    error,
    execute,
    isReady: state === "ready",
    isEnabled,
  }), [state, error, execute, isEnabled]);
}

export default useRecaptcha;