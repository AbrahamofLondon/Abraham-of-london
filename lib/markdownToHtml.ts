// lib/isRecaptchaValid.ts
import { verifyRecaptcha } from "@/lib/recaptchaServer";

/**
 * Minimal compatibility function used by older paths.
 * Keep it tiny and deterministic.
 */
export function isRecaptchaValid(
  token: string,
  expectedAction?: string,
  clientIp?: string
): Promise<boolean> {
  return verifyRecaptcha(token, expectedAction, clientIp);
}
