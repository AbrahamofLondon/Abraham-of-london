const ADMIN_LOGIN_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_PROVIDER_NOT_CONFIGURED:
    "Email sign-in is not configured in this environment. Use Google sign-in or configure RESEND_API_KEY.",
  RATE_LIMIT_EXCEEDED: "Too many sign-in attempts. Wait briefly and try again.",
  REQUEST_THROTTLED: "Authentication requests are temporarily throttled. Wait briefly and try again.",
  INVALID_EMAIL: "Enter a valid administrative email.",
  EMAIL_SEND_FAILED: "Email sign-in failed. Check RESEND_API_KEY and sender configuration.",
  TOKEN_STORAGE_FAILED: "Unable to prepare sign-in. Check local database connectivity.",
};

export function getAdminLoginErrorMessage(input: {
  error?: unknown;
  message?: unknown;
}): string {
  const code = typeof input.error === "string" ? input.error : "";
  if (code && ADMIN_LOGIN_ERROR_MESSAGES[code]) {
    return ADMIN_LOGIN_ERROR_MESSAGES[code];
  }
  if (typeof input.message === "string" && input.message.trim()) {
    return input.message.trim();
  }
  if (code) return code;
  return "Unable to send sign-in link.";
}
