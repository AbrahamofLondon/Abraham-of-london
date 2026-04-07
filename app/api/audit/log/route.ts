/* app/api/audit/log/route.ts — HARDENED TYPE ALIGNMENT */
import "server-only";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AuditSeverity } from "@prisma/client";

import { authOptions } from "@/lib/auth/auth-options";
import { getAuditLogger } from "@/lib/audit/audit-logger";

export const runtime = "nodejs";

type LogResultLike = {
  id?: string | null;
} | null;

/**
 * ✅ FIX: RESOLVE "Type 'high' is not assignable to type 'AuditSeverity'"
 * We map 'high' to 'critical' because the Prisma Enum likely only contains:
 * critical | warning | info
 */
function normalizeSeverity(input: unknown): AuditSeverity {
  const s = String(input ?? "").toLowerCase().trim();
  
  // High is mapped to critical to preserve importance while satisfying the type system
  if (s === "critical" || s === "high") return "critical";
  if (s === "warning" || s === "warn") return "warning";
  
  // Default fallback
  return "info";
}

function getClientIp(req: NextRequest): string {
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

function isAuditor(session: unknown): boolean {
  const s = session as { user?: { role?: unknown } } | null;
  const role = String(s?.user?.role ?? "").toLowerCase();
  return role === "admin" || role === "auditor";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getLogId(entry: unknown): string | null {
  if (!entry || typeof entry !== "object") return null;
  const maybeId = (entry as { id?: unknown }).id;
  return typeof maybeId === "string" && maybeId.trim() ? maybeId : null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);

    if (!isPlainObject(body)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_PAYLOAD", message: "JSON body required" },
        { status: 400 },
      );
    }

    if (!body.action || !body.severity || !body.resourceId) {
      return NextResponse.json(
        {
          ok: false,
          error: "INTEGRITY_FAILURE",
          message: "action, severity, resourceId are required",
        },
        { status: 400 },
      );
    }

    const traceId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const sessionUser = (session as {
      user?: {
        id?: unknown;
        email?: unknown;
        name?: unknown;
        role?: unknown;
      };
    }).user;

    const actorId = String(sessionUser?.id ?? "").trim() || "unknown";
    const actorEmail = String(sessionUser?.email ?? "").trim() || null;

    const event = {
      action: String(body.action),
      severity: normalizeSeverity(body.severity),

      actorType: String(sessionUser?.role ?? "user").toLowerCase() || "user",
      actorId,
      actorEmail,

      resourceType: body.resourceType ? String(body.resourceType) : null,
      resourceId: String(body.resourceId),
      resourceName: body.resourceName ? String(body.resourceName) : null,

      status: body.status ? String(body.status) : "success",
      category: body.category ? String(body.category) : "api",
      subCategory: body.subCategory ? String(body.subCategory) : "audit_route",
      tags: Array.isArray(body.tags) ? body.tags.map(String) : null,

      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? null,

      requestId: body.requestId ? String(body.requestId) : null,
      sessionId: body.sessionId ? String(body.sessionId) : null,
      durationMs: typeof body.durationMs === "number" ? body.durationMs : null,
      errorMessage: body.errorMessage ? String(body.errorMessage) : null,

      details: isPlainObject(body.details) ? body.details : null,

      metadata: {
        traceId,
        at: nowIso,
        environment: process.env.NODE_ENV,
        actorName: sessionUser?.name ?? null,
        raw: {
          receivedKeys: Object.keys(body).slice(0, 100),
        },
      },
    };

    const logger = getAuditLogger();
    const logEntry = (await logger.log(event)) as LogResultLike;
    const logId = getLogId(logEntry);

    return NextResponse.json(
      { ok: true, logId, traceId, verifiedAt: nowIso },
      { status: 201 },
    );
  } catch (error) {
    console.error("[AUDIT_LOG_POST_FAILED]", error);
    return NextResponse.json(
      { ok: false, error: "REGISTRY_FAILURE" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !isAuditor(session)) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);

  const limitRaw = Number(searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(1, Math.floor(limitRaw)), 1000)
    : 100;

  const startDateRaw = searchParams.get("startDate");
  const endDateRaw = searchParams.get("endDate");

  const startDate = startDateRaw ? new Date(startDateRaw) : undefined;
  const endDate = endDateRaw ? new Date(endDateRaw) : undefined;

  const filters = {
    actorId: searchParams.get("actorId") || undefined,
    actorEmail: searchParams.get("actorEmail") || undefined,
    actorType: searchParams.get("actorType") || undefined,
    resourceId: searchParams.get("resourceId") || undefined,
    resourceType: searchParams.get("resourceType") || undefined,
    action: searchParams.get("action") || undefined,
    status: searchParams.get("status") || undefined,
    category: searchParams.get("category") || undefined,
    requestId: searchParams.get("requestId") || undefined,
    sessionId: searchParams.get("sessionId") || undefined,
    severity: searchParams.get("severity")
      ? normalizeSeverity(searchParams.get("severity"))
      : undefined,
    startDate:
      startDate && !Number.isNaN(startDate.getTime()) ? startDate : undefined,
    endDate:
      endDate && !Number.isNaN(endDate.getTime()) ? endDate : undefined,
    limit,
  };

  try {
    const logger = getAuditLogger();
    const logs = await logger.query(filters);

    return NextResponse.json(
      {
        ok: true,
        count: Array.isArray(logs) ? logs.length : 0,
        logs,
        queriedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[AUDIT_LOG_GET_FAILED]", error);
    return NextResponse.json(
      { ok: false, error: "QUERY_FAILED" },
      { status: 500 },
    );
  }
}