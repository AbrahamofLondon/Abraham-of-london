export async function verifyRecaptcha(token: string): Promise<boolean> {
  // Early return if secret key is missing
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn("RECAPTCHA_SECRET_KEY not set, skipping verification");
    return process.env.NODE_ENV !== "production"; // Fail secure in production
  }

  // Validate token format before making API call
  if (!token || typeof token !== "string" || token.length < 10) {
    console.error("Invalid reCAPTCHA token format");
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
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

    const data = await response.json();

    // Validate response structure
    if (typeof data.success !== "boolean") {
      console.error("Invalid reCAPTCHA response format");
      return false;
    }

    const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");
    const passed = data.success && data.score >= minScore;

    // Security logging for suspicious scores
    if (data.success && data.score < 0.3) {
      console.warn(`Low reCAPTCHA score detected: ${data.score}`);
    }

    return passed;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("reCAPTCHA verification timeout");
    } else {
      console.error("reCAPTCHA verification failed:", error);
    }
    return false; // Fail secure on errors
  }
}
