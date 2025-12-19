// lib/server/recaptchaUtils.ts
import { 
  verifyRecaptcha, 
  verifyRecaptchaDetailed, 
  type RecaptchaVerificationResult 
} from "@/lib/recaptchaServer";

export type RecaptchaProcessedResult = {
  success: boolean;
  score: number;
  action?: string;
  errorCodes?: string[];
};

export async function processRecaptchaToken(
  token: string,
  expectedAction?: string,
  ip?: string,
  useDetailed: boolean = true
): Promise<RecaptchaProcessedResult | null> {
  try {
    if (useDetailed) {
      // Use detailed version for full data
      const result = await verifyRecaptchaDetailed(token, expectedAction, ip);
      return {
        success: result.success,
        score: result.score,
        action: result.action,
        errorCodes: result.errorCodes,
      };
    } else {
      // Use simple boolean version
      const success = await verifyRecaptcha(token, expectedAction, ip);
      return {
        success,
        score: success ? 1.0 : 0.0,
      };
    }
  } catch (error) {
    console.error("[reCAPTCHA] Processing error:", error);
    return null;
  }
}