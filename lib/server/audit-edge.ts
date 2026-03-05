// lib/server/audit-edge.ts
// Edge-safe audit emitter:
// - never imports Node modules
// - never throws (fail-open)
// - signs requests with x-audit-secret so your API can accept system writes without NextAuth session

import type { NextRequest } from "next/server";

export type EdgeAuditEvent = {
  action: string;

  // Resource/context
  resourceId?: string;
  resourceType?: string;
  resourceName?: string;

  // Actor/context
  actorId?: string;
  actorEmail?: string;
  actorType?: "system" | "service" | "api" | "cron" | "webhook" | "edge";

  // Severity/status aligned to your Prisma enum/columns
  severity?: "info" | "warning" | "high" | "critical";
  status?: "success" | "failure" | "pending";

  // Network context
  ipAddress?: string;
  userAgent?: string;

  // Correlation
  requestId?: string;
  sessionId?: string;

  // Categorization
  category?: string;
  subCategory?: string;
  tags?: string[];

  // Payload
  metadata?: Record<string, unknown>;
  details?: Record<string, unknown>;
  errorMessage?: string;
  durationMs?: number;
};

/**
 * Extract IP in Edge-friendly way.
 */
export function getEdgeClientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  return "unknown";
}

/**
 * Edge-safe audit log sender.
 * - Uses req.nextUrl.origin (canonical for the current deployment)
 * - Authenticates via x-audit-secret (set AUDIT_EDGE_SECRET in env)
 */
export async function logAuditEventEdge(req: NextRequest, event: EdgeAuditEvent): Promise<void> {
  try {
    // You MUST set this secret in both Edge + Server environments.
    const secret = process.env.AUDIT_EDGE_SECRET || "";
    if (!secret) return; // no secret => no edge logging (safe default)

    const origin = req.nextUrl.origin;
    const url = `${origin}/api/audit/log`;

    const payload: Record<string, unknown> = {
      action: String(event.action || "unknown"),
      severity: event.severity || "info",
      status: event.status || "success",

      actorType: event.actorType || "edge",
      actorId: event.actorId,
      actorEmail: event.actorEmail,

      resourceId: event.resourceId,
      resourceType: event.resourceType,
      resourceName: event.resourceName,

      ipAddress: event.ipAddress || getEdgeClientIp(req),
      userAgent: event.userAgent || req.headers.get("user-agent") || undefined,

      requestId: event.requestId || req.headers.get("x-request-id") || undefined,
      sessionId: event.sessionId,

      category: event.category,
      subCategory: event.subCategory,
      tags: event.tags,

      durationMs: event.durationMs,
      errorMessage: event.errorMessage,

      // keep anything extra under metadata/details
      metadata: event.metadata,
      details: event.details,
    };

    // Fire-and-forget (do not await body read on failures)
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-audit-secret": secret,
      },
      body: JSON.stringify(payload),
      // Edge fetch: avoid caching
      cache: "no-store",
    });

    // Fail-open: never throw. Minimal telemetry only.
    if (!res.ok) {
      // Avoid calling res.text() (can add latency). Just record status.
      console.error("[AUDIT_EDGE_WRITE_FAILED]", { status: res.status });
    }
  } catch (e) {
    // Never break the request path
    console.error("[AUDIT_EDGE_EXCEPTION]", e);
  }
}

/**
 * Convenience: build a “default event” from request context.
 */
export function buildEdgeAuditEvent(req: NextRequest, partial: EdgeAuditEvent): EdgeAuditEvent {
  return {
    actorType: partial.actorType ?? "edge",
    ipAddress: partial.ipAddress ?? getEdgeClientIp(req),
    userAgent: partial.userAgent ?? req.headers.get("user-agent") ?? undefined,
    ...partial,
  };
}