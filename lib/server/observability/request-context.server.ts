import "server-only";

import { randomUUID } from "crypto";
import { writeEventLog, type EventCategory, type EventSeverity } from "./event-log.server";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RequestContext = {
  requestId: string;
  startTime: number;
  sessionId?: string | null;
  userId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  route: string;
  method: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ASYNC LOCAL STORAGE — per-request context
// ─────────────────────────────────────────────────────────────────────────────

import { AsyncLocalStorage } from "async_hooks";
const requestStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | null {
  return requestStorage.getStore() ?? null;
}

export function runWithRequestContext<T>(
  context: Omit<RequestContext, "requestId" | "startTime">,
  fn: () => Promise<T>,
): Promise<T> {
  const fullContext: RequestContext = {
    ...context,
    requestId: randomUUID(),
    startTime: Date.now(),
  };
  return requestStorage.run(fullContext, fn);
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING HELPERS — automatically attach request context
// ─────────────────────────────────────────────────────────────────────────────

export async function logEvent(
  category: EventCategory,
  opts: {
    severity?: EventSeverity;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  const ctx = getRequestContext();
  await writeEventLog({
    category,
    severity: opts.severity,
    sessionId: ctx?.sessionId ?? null,
    userId: ctx?.userId ?? null,
    email: ctx?.email ?? null,
    ipAddress: ctx?.ipAddress ?? null,
    route: ctx?.route ?? null,
    metadata: {
      ...opts.metadata,
      requestId: ctx?.requestId,
      durationMs: ctx ? Date.now() - ctx.startTime : undefined,
    },
  });
}

export async function logError(
  error: Error | string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const message = typeof error === "string" ? error : error.message;
  const stack = typeof error === "string" ? undefined : error.stack;
  await logEvent("error", {
    severity: "error",
    metadata: { ...metadata, message, stack },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE — shield-specific logging
// ─────────────────────────────────────────────────────────────────────────────

export async function logShieldBlock(
  reason: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await logEvent("shield_block", {
    severity: "warn",
    metadata: { reason, ...metadata },
  });
}

export async function logConversion(
  conversionType: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await logEvent("conversion", {
    severity: "info",
    metadata: { conversionType, ...metadata },
  });
}
