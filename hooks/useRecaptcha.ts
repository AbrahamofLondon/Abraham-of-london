// hooks/useRecaptcha.ts
import * as React from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

type RecaptchaState = "idle" | "loading" | "ready" | "error";

interface RecaptchaConfig {
  enabled: boolean;
  siteKey?: string;
}

interface UseRecaptchaResult {
  state: RecaptchaState;
  error: string | null;
  execute: (action: string) => Promise<string | null>;
  isReady: boolean;
  isEnabled: boolean;
}

export function useRecaptcha(): UseRecaptchaResult {
  const [state, setState] = React.useState<RecaptchaState>(() =>
    SITE_KEY ? "idle" : "error"
  );
  const [error, setError] = React.useState<string | null>(null);

  const config = React.useMemo((): RecaptchaConfig => {
    return {
      enabled: !!SITE_KEY,
      siteKey: SITE_KEY,
    };
  }, []);

  React.useEffect(() => {
    if (!config.enabled) {
      setState("error");
      setError("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
      return;
    }

    if (typeof window === "undefined") return;

    // Use type assertion
    const win = window as Window & {
      grecaptcha?: {
        ready(cb: () => void): void;
        execute(siteKey: string, options: { action: string }): Promise<string>;
      };
    };

    // Check if grecaptcha is already available
    if (win.grecaptcha) {
      win.grecaptcha.ready(() => setState("ready"));
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-recaptcha="v3"]'
    );
    if (existing) {
      setState("loading");
      const onLoad = () => {
        const win = window as Window & {
          grecaptcha?: { ready(cb: () => void): void };
        };
        win.grecaptcha?.ready(() => setState("ready"));
      };
      existing.addEventListener("load", onLoad);
      return () => existing.removeEventListener("load", onLoad);
    }

    setState("loading");
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
      config.siteKey!
    )}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptcha = "v3";

    const onLoad = () => {
      const win = window as Window & {
        grecaptcha?: { ready(cb: () => void): void };
      };
      win.grecaptcha?.ready(() => setState("ready"));
    };

    const onError = () => {
      setState("error");
      setError("Failed to load reCAPTCHA script.");
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, [config.enabled, config.siteKey]);

  const execute = React.useCallback(
    async (action: string): Promise<string | null> => {
      if (!config.enabled || !config.siteKey) {
        console.warn("reCAPTCHA not enabled or missing site key");
        return null;
      }

      if (typeof window === "undefined") {
        console.warn("reCAPTCHA not available on server");
        return null;
      }

      const win = window as Window & {
        grecaptcha?: {
          execute(
            siteKey: string,
            options: { action: string }
          ): Promise<string>;
        };
      };

      if (!win.grecaptcha) {
        console.warn("reCAPTCHA not loaded");
        return null;
      }

      try {
        const token = await win.grecaptcha.execute(config.siteKey, { action });
        return token;
      } catch (err) {
        console.error("reCAPTCHA execution failed:", err);
        return null;
      }
    },
    [config.enabled, config.siteKey]
  );

  return React.useMemo(() => {
    return {
      state,
      error,
      execute,
      isReady: state === "ready",
      isEnabled: config.enabled,
    };
  }, [state, error, execute, config.enabled]);
}

export default useRecaptcha;
