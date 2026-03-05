/* lib/server/audit.ts — CANONICAL AUDIT FACADE (pages/ + node safe)
   - DO NOT import "server-only" here (pages router will explode)
   - This file exists to satisfy legacy imports:
       import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit"
*/

import type { AuditSeverity } from "@prisma/client";
import { getAuditLogger, type AuditEvent as LoggerAuditEvent } from "@/lib/audit/audit-logger";

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
} as const;

/* -----------------------------------------------------------------------------
 * TYPES (legacy input shape used across your pages/*)
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

  resourceType: string; // legacy uses "category-like" values; we map it
  resourceId?: string | null;

  status: LegacyAuditStatus;

  // legacy severities were: low|medium|high|critical (your DB enum is info|warning|high|critical)
  severity?: "low" | "medium" | "high" | "critical";

  requestId?: string | null;
  sessionId?: string | null;

  durationMs?: number;
  errorMessage?: string | null;

  metadata?: Record<string, any> | null;
  details?: Record<string, any> | null;
}

/* -----------------------------------------------------------------------------
 * NORMALIZERS
 * -------------------------------------------------------------------------- */

function normalizeSeverity(s?: AuditEvent["severity"]): AuditSeverity {
  const v = String(s || "").toLowerCase();
  if (v === "critical") return "critical";
  if (v === "high") return "high";
  // map legacy "medium" and "warning" and "warn" → warning
  if (v === "medium" || v === "warning" || v === "warn") return "warning";
  return "info";
}

function normalizeStatus(s: LegacyAuditStatus): "success" | "failure" | "pending" {
  const v = String(s || "").toLowerCase();
  if (v === "failed" || v === "failure" || v === "error") return "failure";
  if (v === "pending") return "pending";
  return "success";
}

function normalizeActorType(v: LegacyActorType): "system" | "user" | "admin" | "service" {
  const s = String(v || "").toLowerCase();
  if (s === "member" || s === "user") return "user";
  if (s === "admin") return "admin";
  // Treat api/cron/webhook as "service"
  if (s === "api" || s === "cron" || s === "webhook") return "service";
  return "system";
}

/**
 * Legacy callers pass `resourceType` as a category-ish label.
 * We map it into:
 * - category (one of your indexed columns)
 * - resourceType (the "domain object" when available)
 */
function deriveCategoryAndResourceType(resourceType: string): { category?: string; resourceType?: string } {
  const rt = String(resourceType || "").trim();

  // If they passed one of our canonical categories, accept it
  const lc = rt.toLowerCase();

  if (lc === "auth" || lc === "authentication") return { category: "auth", resourceType: rt };
  if (lc === "admin") return { category: "admin", resourceType: rt };
  if (lc === "api") return { category: "api", resourceType: rt };
  if (lc === "security" || lc === "authorization" || lc === "compliance") return { category: "security", resourceType: rt };
  if (lc === "content" || lc === "data_access" || lc === "data_modification") return { category: "content", resourceType: rt };
  if (lc === "system" || lc === "system_operation" || lc === "performance") return { category: "system", resourceType: rt };
  if (lc === "user" || lc === "user_action") return { category: "user", resourceType: rt };

  // fallback
  return { category: "system", resourceType: rt || "system" };
}

/* -----------------------------------------------------------------------------
 * MAIN EXPORT: logAuditEvent (expected by pages + api)
 * -------------------------------------------------------------------------- */

export async function logAuditEvent(event: AuditEvent) {
  const logger = getAuditLogger();

  const { category, resourceType } = deriveCategoryAndResourceType(event.resourceType);

  // Map legacy event into the new audit-logger contract
  const mapped: LoggerAuditEvent = {
    action: String(event.action || "UNKNOWN_ACTION"),

    actorType: normalizeActorType(event.actorType),
    actorId: event.actorId ?? undefined,
    actorEmail: event.actorEmail ?? undefined,

    severity: normalizeSeverity(event.severity),
    status: normalizeStatus(event.status),

    category,
    subCategory: undefined,

    resourceType: resourceType || undefined,
    resourceId: event.resourceId ?? undefined,

    ipAddress: event.ipAddress ?? undefined,
    userAgent: event.userAgent ?? undefined,
    requestId: event.requestId ?? undefined,
    sessionId: event.sessionId ?? undefined,

    durationMs: typeof event.durationMs === "number" ? event.durationMs : undefined,
    errorMessage: event.errorMessage ?? undefined,

    // Preserve payloads
    metadata: event.metadata ?? undefined,
    details: event.details ?? undefined,
  };

  return logger.log(mapped);
}