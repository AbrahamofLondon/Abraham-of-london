/**
 * lib/monitoring/error-capture.ts
 *
 * Controlled error capture utility.
 *
 * Wraps Sentry so that:
 * 1. No data is sent unless SENTRY_DSN is configured.
 * 2. PII is stripped before sending.
 * 3. Errors can be captured from both client and server contexts.
 * 4. Test captures can be triggered for deployment verification.
 *
 * Usage:
 *   import { captureError, captureMessage } from "@/lib/monitoring/error-capture";
 *
 *   captureError(new Error("Something failed"), { context: "checkout" });
 *   captureMessage("Payment processed", "info", { orderId: "ord_123" });
 */

const isSentryConfigured = (): boolean => {
  return !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
};

/**
 * Capture an error with optional context.
 * Safe no-op when Sentry is not configured.
 */
export async function captureError(
  error: Error,
  context?: Record<string, unknown>,
): Promise<void> {
  if (!isSentryConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[error-capture] Sentry not configured — error suppressed:", error.message);
    }
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      extra: context ? sanitizeContext(context) : undefined,
    });
  } catch {
    // Sentry SDK not available — silently ignore
  }
}

/**
 * Capture a message with severity level.
 * Safe no-op when Sentry is not configured.
 */
export async function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>,
): Promise<void> {
  if (!isSentryConfigured()) return;

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureMessage(message, {
      level: level === "error" ? "error" : level === "warning" ? "warning" : "info",
      extra: context ? sanitizeContext(context) : undefined,
    });
  } catch {
    // Sentry SDK not available — silently ignore
  }
}

/**
 * Trigger a controlled test capture to verify Sentry is working.
 * Call this from a deployment verification script.
 */
export async function triggerTestCapture(): Promise<{ ok: boolean; configured: boolean; message: string }> {
  if (!isSentryConfigured()) {
    return {
      ok: true,
      configured: false,
      message: "Sentry not configured — test capture skipped (safe no-op)",
    };
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureMessage("Sentry deployment verification — test capture", {
      level: "info",
      extra: {
        type: "deployment_verification",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
    });
    return {
      ok: true,
      configured: true,
      message: "Sentry test capture sent successfully",
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      message: `Sentry test capture failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }
}

/**
 * Strip PII from context objects before sending to Sentry.
 */
function sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
  const PII_KEYS = new Set([
    "email", "password", "token", "secret", "authorization",
    "cookie", "session", "ssn", "phone", "creditCard",
  ]);

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    if (PII_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "string" && value.length > 500) {
      sanitized[key] = value.substring(0, 500) + "...";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
