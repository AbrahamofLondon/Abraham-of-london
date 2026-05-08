/**
 * error-monitor.ts — Durable error persistence for critical routes.
 *
 * Until Sentry or an equivalent is configured, this provides a minimal
 * audit trail for server errors on critical paths (checkout, webhooks,
 * auth, downloads). Errors are written to the SystemAuditLog table so
 * they survive beyond the process lifetime.
 *
 * Usage:
 *   import { logCriticalError } from "@/lib/server/security/error-monitor";
 *   catch (err) { await logCriticalError("checkout", err, { email }); }
 */

import { writeSecurityAudit } from "@/lib/security/audit-log";

export async function logCriticalError(
  route: string,
  error: unknown,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const message =
    error instanceof Error ? error.message : String(error);
  const stack =
    error instanceof Error ? error.stack?.slice(0, 500) : undefined;

  try {
    await writeSecurityAudit({
      action: "critical_error",
      severity: "error",
      status: "FAILED",
      category: "error_monitor",
      resourceId: route,
      errorMessage: message,
      metadata: {
        ...metadata,
        stack,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch {
    // Last resort — at minimum ensure it hits stderr
    console.error(`[ERROR_MONITOR] ${route}:`, message);
  }
}
