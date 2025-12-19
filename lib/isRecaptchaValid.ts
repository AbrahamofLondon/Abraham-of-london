// lib/isRecaptchaValid.ts
// Convenience wrapper for boolean validation

import { verifyRecaptcha } from "@/lib/recaptchaServer";

export async function isRecaptchaValid(
  token: string,
  expectedAction?: string,
  clientIp?: string
): Promise<boolean> {
  return verifyRecaptcha(token, expectedAction, clientIp);
}