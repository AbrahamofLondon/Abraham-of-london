// lib/recaptchaServer.ts (or wherever you keep this)
export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // 1. Secret key checks
  if (!secret) {
    console.error("RECAPTCHA_SECRET_KEY not set");

    const isDev = process.env.NODE_ENV === "development";
    const allowBypass = process.env.ALLOW_RECAPTCHA_BYPASS === "true";

    // Only allow bypass if you **explicitly** opt-in during dev
    if (isDev && allowBypass) {
      console.warn(
        "[reCAPTCHA] Bypass enabled via ALLOW_RECAPTCHA_BYPASS in development."
      );
      return true;
    }

    // In all other cases: fail closed
    return false;
  }

  // 2. Token sanity validation
  if (!token || typeof token !== "string" || token.length < 50) {
    console.error("Invalid reCAPTCHA token format");
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
        }).toString(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`reCAPTCHA API error: ${response.status}`);
      return false;
    }

    const data: {
      success?: boolean;
      score?: number;
      action?: string;
      [key: string]: unknown;
    } = await response.json();

    if (typeof data.success !== "boolean") {
      console.error("Invalid reCAPTCHA response format", data);
      return false;
    }

    if (!data.success || typeof data.score !== "number") {
      console.warn("reCAPTCHA check failed or missing score", data);
      return false;
    }

    const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");
    const passed = data.score >= minScore;

    if (!passed) {
      console.warn(
        `reCAPTCHA score below threshold: ${data.score} (min: ${minScore})`
      );
    } else if (data.score < 0.3) {
      console.warn(`Low but passing reCAPTCHA score detected: ${data.score}`);
    }

    return passed;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { name?: string }).name === "AbortError"
    ) {
      console.error("reCAPTCHA verification timeout");
    } else {
      console.error("reCAPTCHA verification failed:", error);
    }
    return false; // fail secure on errors
  }
}