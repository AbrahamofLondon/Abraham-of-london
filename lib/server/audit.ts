/* lib/server/audit.ts — CANONICAL AUDIT FACADE (pages/ + node safe)
   - MUST be pages-safe (no `server-only`, no Node-only imports at top-level)
   - MUST be client-safe (pages router may bundle this)
   - Keeps legacy imports working:
       import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit"
   - Dynamically imports the Node-only logger at runtime (server execution only)
*/

import type { AuditSeverity } from "@prisma/client";
import type { AuditEvent as LoggerAuditEvent } from "@/lib/audit/audit-logger";

/* -----------------------------------------------------------------------------
 * PUBLIC CONSTANTS (legacy compatibility)
 * -------------------------------------------------------------------------- */

export const AUDIT_CATEGORIES = {
  AUTHENTICATION: "auth",
  AUTHORIZATION: "security",
  DATA_ACCESS: "content",
  DATA_MODIFICATION: "content",
  SYSTEM_OPERATION: "system",
  SECURITY: "security",
  COMPLIANCE: "security",
  PERFORMANCE: "system",
  USER_ACTION: "user",
  API_CALL: "api",
  ADMIN_ACTION: "admin",
} as const;

export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  SESSION_CREATED: "SESSION_CREATED",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Authorization
  ACCESS_GRANTED: "ACCESS_GRANTED",
  ACCESS_DENIED: "ACCESS_DENIED",
  PERMISSION_CHANGED: "PERMISSION_CHANGED",

  // Data Operations
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",

  // System Operations
  CONFIGURATION_CHANGE: "CONFIGURATION_CHANGE",
  MAINTENANCE_START: "MAINTENANCE_START",
  MAINTENANCE_END: "MAINTENANCE_END",
  BACKUP_CREATED: "BACKUP_CREATED",
  RESTORE_INITIATED: "RESTORE_INITIATED",

  // Security
  RATE_LIMIT_HIT: "RATE_LIMIT_HIT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  IP_BLOCKED: "IP_BLOCKED",
  USER_BLOCKED: "USER_BLOCKED",

  // User Actions
  PROFILE_UPDATED: "PROFILE_UPDATED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",

  // API Operations
  API_CALL: "API_CALL",
  API_ERROR: "API_ERROR",
  WEBHOOK_RECEIVED: "WEBHOOK_RECEIVED",
  WEBHOOK_PROCESSED: "WEBHOOK_PROCESSED",

  // Back-compat alias used by some handlers
  WRITE: "UPDATE",
} as const;

/* -----------------------------------------------------------------------------
 * TYPES (legacy call sites across pages/* + pages/api/*)
 * -------------------------------------------------------------------------- */

export type LegacyAuditStatus = "success" | "failed" | "warning" | "pending";
export type LegacyActorType = "system" | "api" | "member" | "admin" | "cron" | "webhook";

export interface AuditEvent {
  actorType: LegacyActorType;
  actorId?: string | null;
  actorEmail?: string | null;

  ipAddress?: string | null;
  userAgent?: string | null;

  action: string;

  // legacy callers use this like a "category-ish" label
  resourceType: string;

  resourceId?: string | null;
  resourceName?: string | null;
  tags?: string[] | null;
  subCategory?: string | null;

  status: LegacyAuditStatus;

  // legacy severities: low|medium|high|critical
  severity?: "low" | "medium" | "high" | "critical";

  requestId?: string | null;
  sessionId?: string | null;

  durationMs?: number;
  errorMessage?: string | null;

  metadata?: Record<string, any> | null;
  details?: Record<string, any> | null;
}

/* -----------------------------------------------------------------------------
 * NORMALIZERS (defensive)
 * -------------------------------------------------------------------------- */

function safeTrim(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function safeStr(v: unknown, fallback = ""): string {
  const s = safeTrim(v);
  return s || fallback;
}

function safeTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => safeStr(x)).filter(Boolean).slice(0, 50);
}

function normalizeSeverity(s?: AuditEvent["severity"]): AuditSeverity {
  const v = safeStr(s).toLowerCase();
  if (v === "critical") return "critical";
  if (v === "high") return "high";
  if (v === "medium" || v === "warning" || v === "warn") return "warning";
  return "info";
}

function normalizeStatus(s: LegacyAuditStatus): "success" | "failure" | "pending" {
  const v = safeStr(s).toLowerCase();
  if (v === "failed" || v === "failure" || v === "error") return "failure";
  if (v === "pending") return "pending";
  return "success";
}

function normalizeActorType(v: LegacyActorType): "system" | "user" | "admin" | "service" {
  const s = safeStr(v).toLowerCase();
  if (s === "member" || s === "user") return "user";
  if (s === "admin") return "admin";
  if (s === "api" || s === "cron" || s === "webhook") return "service";
  return "system";
}

function deriveCategoryAndResourceType(resourceTypeRaw: unknown): { category: string; resourceType: string } {
  const rt = safeStr(resourceTypeRaw, "system");
  const lc = rt.toLowerCase();

  if (lc === "auth" || lc === "authentication") return { category: "auth", resourceType: rt };
  if (lc === "admin" || lc === "admin_action") return { category: "admin", resourceType: rt };
  if (lc === "api" || lc === "api_call") return { category: "api", resourceType: rt };

  if (lc === "security" || lc === "authorization" || lc === "compliance") {
    return { category: "security", resourceType: rt };
  }

  if (lc === "content" || lc === "data_access" || lc === "data_modification") {
    return { category: "content", resourceType: rt };
  }

  if (lc === "system" || lc === "system_operation" || lc === "performance") {
    return { category: "system", resourceType: rt };
  }

  if (lc === "user" || lc === "user_action") {
    return { category: "user", resourceType: rt };
  }

  return { category: "system", resourceType: rt || "system" };
}

/* -----------------------------------------------------------------------------
 * MAIN EXPORT: logAuditEvent (expected by pages + pages/api)
 * -------------------------------------------------------------------------- */

export async function logAuditEvent(event: AuditEvent) {
  // 🚫 Client/Browser guard: never attempt DB writes from browser bundle
  if (typeof window !== "undefined") {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AUDIT_CLIENT_NOOP]", {
        at: new Date().toISOString(),
        action: event?.action,
        resourceId: event?.resourceId,
      });
    }
    return null;
  }

  // ✅ Lazy import (prevents pages-router client bundle from touching node-only code)
  const mod = await import("@/lib/audit/audit-logger");
  const logger = mod.getAuditLogger();

  const action = safeStr(event?.action, "UNKNOWN_ACTION");
  const actorId = safeTrim(event?.actorId) || undefined;
  const actorEmail = safeTrim(event?.actorEmail) || undefined;

  const ipAddress = safeTrim(event?.ipAddress) || undefined;
  const userAgent = safeTrim(event?.userAgent) || undefined;

  const { category, resourceType } = deriveCategoryAndResourceType(event?.resourceType);

  const resourceId = safeTrim(event?.resourceId) || undefined;
  const resourceName = safeTrim(event?.resourceName) || undefined;

  const mapped: LoggerAuditEvent = {
    action,

    actorType: normalizeActorType(event.actorType),
    actorId,
    actorEmail,

    severity: normalizeSeverity(event.severity),
    status: normalizeStatus(event.status),

    category,
    subCategory: safeTrim(event?.subCategory) || undefined,
    tags: safeTags(event?.tags),

    resourceType: resourceType || undefined,
    resourceId,
    resourceName,

    requestId: safeTrim(event?.requestId) || undefined,
    sessionId: safeTrim(event?.sessionId) || undefined,

    ipAddress,
    userAgent,

    durationMs: typeof event?.durationMs === "number" && Number.isFinite(event.durationMs) ? event.durationMs : undefined,
    errorMessage: safeTrim(event?.errorMessage) || undefined,

    metadata: event?.metadata && typeof event.metadata === "object" ? event.metadata : undefined,
    details: event?.details && typeof event.details === "object" ? event.details : undefined,
  };

  return logger.log(mapped);
}