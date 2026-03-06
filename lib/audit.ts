/* lib/audit.ts — RUNTIME-SAFE AUDIT BRIDGE (pages + edge compatible)
   - Avoids TS "export doesn't exist" errors from dynamic imports
   - Delegates to server audit ONLY in Node runtime (SSR/pages/api)
   - Uses safe fallback for Edge/client/build-time paths
*/

export interface AuditEvent {
  actorType: "system" | "api" | "member" | "admin" | "cron" | "webhook";
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;

  action: string;
  resourceType: string;
  resourceId?: string | null;

  status: "success" | "failed" | "warning" | "pending";
  severity?: "low" | "medium" | "high" | "critical";

  userAgent?: string | null;
  requestId?: string | null;
  sessionId?: string | null;

  oldValue?: string | null;
  newValue?: string | null;

  metadata?: Record<string, any> | null;
  details?: Record<string, any> | null;

  durationMs?: number;
  errorMessage?: string | null;
}

/* -----------------------------------------------------------------------------
 * Runtime detection
 * -------------------------------------------------------------------------- */

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isEdgeRuntime(): boolean {
  // Next exposes EdgeRuntime global in edge
  return typeof (globalThis as any).EdgeRuntime === "string";
}

function isNodeRuntime(): boolean {
  // Node has process. Edge often doesn't (or is shimmed inconsistently).
  // Also guard against Edge explicitly.
  return !isBrowser() && !isEdgeRuntime() && typeof process !== "undefined";
}

/* -----------------------------------------------------------------------------
 * Public: logAuditEvent
 * - Node (SSR/pages/api): delegates to lib/server/audit.ts
 * - Edge/Client: safe fallback (console / optional API post)
 * -------------------------------------------------------------------------- */

export async function logAuditEvent(event: AuditEvent): Promise<any> {
  // ✅ Node/server only: delegate to canonical server audit
  if (isNodeRuntime()) {
    try {
      // IMPORTANT: do NOT destructure; keep module as any to avoid TS graph weirdness
      const mod = (await import("./server/audit")) as any;

      const fn = mod?.logAuditEvent || mod?.default?.logAuditEvent;
      if (typeof fn !== "function") {
        throw new Error("server audit module missing logAuditEvent export");
      }

      return await fn(event);
    } catch (error) {
      // Hard fallback: never break runtime paths
      console.log("[AUDIT_FALLBACK_NODE]", {
        timestamp: new Date().toISOString(),
        ...event,
        severity: event.severity || "low",
        _fallback: true,
        _error:
          typeof process !== "undefined" && process.env?.NODE_ENV === "development"
            ? String((error as any)?.message || error)
            : undefined,
      });
      return { ok: false, fallback: true };
    }
  }

  // ✅ Edge + Browser fallback (never import server module here)
  if (
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development") ||
    // Edge may not expose process reliably
    (typeof process === "undefined")
  ) {
    // Keep logs shallow to avoid leaking large payloads
    console.log("[AUDIT_NON_NODE]", {
      action: event?.action,
      resourceId: event?.resourceId,
      status: event?.status,
      severity: event?.severity,
      _edge: isEdgeRuntime(),
      _browser: isBrowser(),
    });
  }

  // OPTIONAL: Edge/client can POST to your API route.
  // Off by default. Turn on explicitly:
  //   AUDIT_EDGE_POST_ENABLED="true"
  // And set a base URL for Edge/serverless if needed:
  //   NEXT_PUBLIC_SITE_URL="https://www.abrahamoflondon.org"
  const postEnabled =
    (typeof process !== "undefined" && process.env?.AUDIT_EDGE_POST_ENABLED === "true") || false;

  if (postEnabled) {
    try {
      const base =
        (typeof process !== "undefined" && (process.env?.NEXT_PUBLIC_SITE_URL || process.env?.NEXTAUTH_URL)) ||
        "";

      const url = base ? `${String(base).replace(/\/+$/, "")}/api/audit/log` : "/api/audit/log";

      // Minimal payload: keep schema stable
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: event.action,
          severity: event.severity || "low",
          resourceId: event.resourceId || "unknown",
          category: event.resourceType, // your app/api route supports category/subCategory/tags via metadata
          details: event.details || event.metadata || undefined,
          status: event.status,
        }),
      });

      // Do not throw; audit must be fail-open
      if (!res.ok) {
        console.log("[AUDIT_EDGE_POST_FAILED]", { status: res.status });
      }
    } catch {
      // swallow
    }
  }

  return { ok: true, nonNode: true, edge: isEdgeRuntime(), browser: isBrowser() };
}

/* -----------------------------------------------------------------------------
 * Helper: rate-limit events
 * -------------------------------------------------------------------------- */

export async function logRateLimitEvent(data: {
  ipAddress?: string;
  action: string;
  resourceId?: string;
  status: "success" | "failed" | "warning";
  details?: Record<string, any>;
  errorMessage?: string;
}): Promise<void> {
  await logAuditEvent({
    actorType: "api",
    ipAddress: data.ipAddress || null,
    action: data.action,
    resourceType: "rate_limit",
    resourceId: data.resourceId || "api_endpoint",
    status: data.status,
    severity: data.status === "failed" ? "high" : "medium",
    details: data.details || null,
    errorMessage: data.errorMessage || null,
  });
}

/* -----------------------------------------------------------------------------
 * Convenience facade
 * -------------------------------------------------------------------------- */

export const audit = {
  log: logAuditEvent,
  rateLimit: logRateLimitEvent,

  logSync(event: AuditEvent) {
    // never block critical path; best-effort
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
      console.log("[AUDIT_SYNC]", { action: event.action, resourceId: event.resourceId });
    }
    void logAuditEvent(event).catch(() => {});
  },
};

export default audit;