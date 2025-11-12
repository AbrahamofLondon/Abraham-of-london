// lib/verifyRecaptcha.ts
// =========================================================================
// Google reCAPTCHA v3 verification (server-side)
// =========================================================================

/**
 * Verifies a Google reCAPTCHA token server-side.
 * Returns `true` for valid, high-confidence responses.
 */
export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    console.warn("⚠️ RECAPTCHA_SECRET_KEY not set — skipping verification (development mode).");
    return true;
  }

  if (!token) {
    console.error("❌ Missing reCAPTCHA token.");
    return false;
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error(`⚠️ reCAPTCHA API error: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = (await response.json()) as { success?: boolean; score?: number; [key: string]: unknown };
    const success = Boolean(data.success);
    const score = typeof data.score === "number" ? data.score : 0;

    if (!success) {
      console.warn("⚠️ reCAPTCHA verification failed:", data);
      return false;
    }

    const threshold = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
    const passed = score >= threshold;

    if (!passed) {
      console.warn(`⚠️ reCAPTCHA score below threshold (${score} < ${threshold})`);
    }

    return passed;
  } catch (error) {
    console.error("💥 reCAPTCHA verification failed:", error);
    return false;
  }
}
