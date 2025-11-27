// lib/recaptchaClient.ts
let scriptLoaded = false;
let loadingPromise: Promise<void> | null = null;

function getSiteKey(): string {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!key) {
    console.warn("[reCAPTCHA] NEXT_PUBLIC_RECAPTCHA_SITE_KEY not set");
  }
  return key || "";
}

function injectScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (scriptLoaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  const siteKey = getSiteKey();
  if (!siteKey) {
    // If no key configured, we resolve and let server-side guard fail safely.
    return Promise.resolve();
  }

  loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://www.google.com/recaptcha/api.js"]',
    );
    if (existing) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
      siteKey,
    )}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = (err) => {
      console.error("[reCAPTCHA] script load error:", err);
      reject(err);
    };
    document.head.appendChild(script);
  });

  return loadingPromise;
}

/**
 * Execute reCAPTCHA v3 and get a token for a specific action.
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const siteKey = getSiteKey();
  if (!siteKey) return null;

  await injectScript();

  // @ts-expect-error grecaptcha is injected by the script
  if (typeof window.grecaptcha === "undefined") {
    console.warn("[reCAPTCHA] grecaptcha not available on window");
    return null;
  }

  // @ts-expect-error
  const grecaptcha = window.grecaptcha as any;

  return new Promise<string | null>((resolve) => {
    try {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(siteKey, { action })
          .then((token: string) => resolve(token))
          .catch((err: unknown) => {
            console.error("[reCAPTCHA] execute error:", err);
            resolve(null);
          });
      });
    } catch (err) {
      console.error("[reCAPTCHA] unexpected execute error:", err);
      resolve(null);
    }
  });
}