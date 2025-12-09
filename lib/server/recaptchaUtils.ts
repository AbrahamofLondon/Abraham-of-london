// lib/server/recaptchaUtils.ts
import { verifyRecaptcha, type RecaptchaVerificationResult } from "@/lib/recaptchaServer";
export type RecaptchaProcessedResult = {
  success: boolean;
  score: number;
  action?: string;
  errorCodes?: string[];
};

export async function processRecaptchaToken(
  token: string,
  expectedAction?: string,
  ip?: string
): Promise<RecaptchaProcessedResult | null> {
  try {
    const result = await verifyRecaptcha(token, expectedAction, ip);

    if (typeof result === "boolean") {
      return {
        success: result,
        score: result ? 1.0 : 0.0,
      };
    } else if (result && typeof result === "object") {
      const typedResult = result as RecaptchaVerificationResult;
      return {
        success: typedResult.success || false,
        score: typeof typedResult.score === "number" ? typedResult.score : 0.0,
        action: typedResult.action,
        errorCodes: typedResult.errorCodes,
      };
    }
    
    return null;
  } catch (error) {
    console.error("[reCAPTCHA] Processing error:", error);
    return null;
  }
}