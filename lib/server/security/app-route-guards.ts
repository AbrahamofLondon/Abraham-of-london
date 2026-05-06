import "server-only";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";

import { writeSecurityAudit } from "@/lib/security/audit-log";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";

export type GuardFailure =
  | { ok: false; response: NextResponse }
  | { ok: true };

export function getClientIp(request: NextRequest | Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "0.0.0.0";
}

export function getSessionIdentifier(request: NextRequest | Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match =
    cookieHeader.match(/(?:^|;\s*)aol_access=([^;]+)/) ||
    cookieHeader.match(/(?:^|;\s*)next-auth\.session-token=([^;]+)/) ||
    cookieHeader.match(/(?:^|;\s*)__Secure-next-auth\.session-token=([^;]+)/);

  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export function isEnvFlagEnabled(name: string): boolean {
  return String(process.env[name] || "").trim().toLowerCase() === "true";
}

export function noStoreJson(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, private, max-age=0");
  return response;
}

export function requireMethod(
  request: NextRequest | Request,
  methods: readonly string[],
): GuardFailure {
  const current = request.method.toUpperCase();
  if (methods.includes(current)) {
    return { ok: true };
  }

  return {
    ok: false,
    response: noStoreJson(
      { ok: false, error: "METHOD_NOT_ALLOWED" },
      { status: 405, headers: { Allow: methods.join(", ") } },
    ),
  };
}

export function requireJsonContent(request: NextRequest | Request): GuardFailure {
  const contentType = request.headers.get("content-type") || "";
  if (/application\/json/i.test(contentType)) {
    return { ok: true };
  }

  return {
    ok: false,
    response: noStoreJson(
      { ok: false, error: "UNSUPPORTED_MEDIA_TYPE" },
      { status: 415 },
    ),
  };
}

export function requireSameOrigin(
  request: NextRequest | Request,
  route: string,
): GuardFailure {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const requestUrl = new URL(request.url);

  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.origin === requestUrl.origin) {
        return { ok: true };
      }
    } catch {
      // fall through
    }
  }

  if (referer) {
    try {
      const parsed = new URL(referer);
      if (parsed.origin === requestUrl.origin) {
        return { ok: true };
      }
    } catch {
      // fall through
    }
  }

  void writeSecurityAudit({
    action: "csrf_failure",
    severity: "warn",
    status: "BLOCKED",
    ip: getClientIp(request),
    resourceId: route,
    metadata: {
      origin: origin || null,
      referer: referer || null,
    },
  });

  return {
    ok: false,
    response: noStoreJson({ ok: false, error: "FORBIDDEN_ORIGIN" }, { status: 403 }),
  };
}

export async function parseJsonBody<T>(
  request: NextRequest | Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      ok: false,
      response: noStoreJson({ ok: false, error: "INVALID_JSON" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: noStoreJson({ ok: false, error: "INVALID_REQUEST" }, { status: 400 }),
    };
  }

  return { ok: true, data: parsed.data };
}

export async function enforceAppRouteRateLimit(args: {
  request: NextRequest | Request;
  routeKey: string;
  limit: number;
  windowMs: number;
  sessionId?: string | null;
  email?: string | null;
  failClosed?: boolean;
}): Promise<GuardFailure> {
  const ip = getClientIp(args.request);
  const parts = [args.routeKey, `ip:${ip}`];

  if (args.sessionId) {
    parts.push(`sid:${sha256Hex(args.sessionId).slice(0, 24)}`);
  }

  if (args.email) {
    parts.push(`email:${sha256Hex(args.email.trim().toLowerCase()).slice(0, 24)}`);
  }

  const result = await consumePersistentRateLimit({
    key: parts.join(":"),
    limit: args.limit,
    windowMs: args.windowMs,
    failClosed: args.failClosed !== false,
  });

  if (result.allowed) {
    return { ok: true };
  }

  void writeSecurityAudit({
    action: "rate_limit_block",
    severity: "warn",
    status: "BLOCKED",
    ip,
    resourceId: args.routeKey,
    metadata: {
      retryAfterMs: result.retryAfterMs,
      source: result.source,
    },
  });

  return {
    ok: false,
    response: noStoreJson(
      { ok: false, error: "RATE_LIMIT_EXCEEDED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))),
        },
      },
    ),
  };
}

export function failClosedForFlag(args: {
  flag: string;
  action: string;
  route: string;
  publicMessage: string;
}): GuardFailure {
  if (!isEnvFlagEnabled("SECURITY_LOCKDOWN_MODE") && !isEnvFlagEnabled(args.flag)) {
    return { ok: true };
  }

  void writeSecurityAudit({
    action: args.action,
    severity: "warn",
    status: "BLOCKED",
    resourceId: args.route,
    metadata: {
      flag: isEnvFlagEnabled("SECURITY_LOCKDOWN_MODE")
        ? "SECURITY_LOCKDOWN_MODE"
        : args.flag,
    },
  });

  return {
    ok: false,
    response: noStoreJson({ ok: false, error: args.publicMessage }, { status: 503 }),
  };
}
