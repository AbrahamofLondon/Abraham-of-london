/**
 * lib/admin/event-log.ts — Unified admin event log builder.
 *
 * Normalises events from multiple DB sources into a single AdminEvent shape.
 * Each source fails independently — a DB error in one source never suppresses
 * events from other sources.
 *
 * Sources covered:
 *   - SystemAuditLog   (system_audit_logs)   → richest, has severity/category/actor
 *   - GovernanceLog    (governance_logs)      → governance actions and exec reports
 *   - AccessAuditLog   (access_audit_logs)    → entitlement / access key events
 *   - DownloadAuditEvent (download_audit_events) → asset retrieval events
 *   - Webhook          → not yet wired; rendered as unavailable section
 */

import { prisma } from "@/lib/prisma.server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminEventSource =
  | "system_audit"
  | "governance"
  | "access_audit"
  | "download"
  | "webhook";

export type AdminEventSeverity = "debug" | "info" | "warn" | "error" | "critical";

export type AdminEvent = {
  id: string;
  source: AdminEventSource;
  eventType: string;
  category: string | null;
  severity: AdminEventSeverity;
  status: "success" | "failure" | "pending" | "unknown";
  actorEmail: string | null;
  actorType: string | null;
  resourceType: string | null;
  resourceName: string | null;
  message: string;
  createdAt: string;
  adminHref: string | null;
};

export type EventLogSummary = {
  events: AdminEvent[];
  totalCount: number;
  criticalCount: number;
  failureCount: number;
  sourceCounts: Record<AdminEventSource, number>;
  generatedAt: string;
  webhookStatus: "not_connected";
  sourceErrors: Partial<Record<AdminEventSource, string>>;
};

// ─── Pure helpers (exported for testing) ─────────────────────────────────────

const VALID_SEVERITIES = new Set<AdminEventSeverity>([
  "debug", "info", "warn", "error", "critical",
]);

export function normaliseSeverity(
  severity: string | null | undefined,
): AdminEventSeverity {
  if (!severity) return "info";
  const lower = severity.toLowerCase() as AdminEventSeverity;
  return VALID_SEVERITIES.has(lower) ? lower : "info";
}

export function normaliseStatus(
  value: boolean | string | null | undefined,
): "success" | "failure" | "pending" | "unknown" {
  if (value === true || value === "success") return "success";
  if (value === false || value === "failure" || value === "error") return "failure";
  if (value === "pending") return "pending";
  return "unknown";
}

export function buildEventMessage(
  eventType: string,
  resourceName: string | null | undefined,
  actorEmail: string | null | undefined,
): string {
  const parts: string[] = [eventType];
  if (resourceName) parts.push(`on ${resourceName}`);
  if (actorEmail) parts.push(`by ${actorEmail}`);
  return parts.join(" ");
}

export function countBySources(events: AdminEvent[]): Record<AdminEventSource, number> {
  const counts: Record<AdminEventSource, number> = {
    system_audit: 0,
    governance: 0,
    access_audit: 0,
    download: 0,
    webhook: 0,
  };
  for (const ev of events) {
    counts[ev.source] = (counts[ev.source] ?? 0) + 1;
  }
  return counts;
}

// ─── Source normalisers ───────────────────────────────────────────────────────

function fromSystemAuditLog(log: Record<string, any>): AdminEvent {
  return {
    id: `sys_${log.id}`,
    source: "system_audit",
    eventType: String(log.action ?? "UNKNOWN"),
    category: log.category ?? null,
    severity: normaliseSeverity(log.severity),
    status: normaliseStatus(log.status),
    actorEmail: log.actorEmail ?? null,
    actorType: log.actorType ?? null,
    resourceType: log.resourceType ?? null,
    resourceName: log.resourceName ?? null,
    message: log.errorMessage
      ?? buildEventMessage(log.action ?? "UNKNOWN", log.resourceName, log.actorEmail),
    createdAt: (log.createdAt as Date).toISOString(),
    adminHref: "/admin/audit",
  };
}

function fromGovernanceLog(log: Record<string, any>): AdminEvent {
  return {
    id: `gov_${log.id}`,
    source: "governance",
    eventType: String(log.action ?? "GOVERNANCE_ACTION"),
    category: "governance",
    severity: "info",
    status: "success",
    actorEmail: null,
    actorType: log.performedBy ?? null,
    resourceType: log.target ? "governance_target" : null,
    resourceName: log.target ?? null,
    message: log.details ?? buildEventMessage(log.action ?? "GOVERNANCE_ACTION", log.target, null),
    createdAt: (log.createdAt as Date).toISOString(),
    adminHref: null,
  };
}

function fromAccessAuditLog(log: Record<string, any>): AdminEvent {
  const succeeded = log.success === true;
  return {
    id: `acc_${log.id}`,
    source: "access_audit",
    eventType: String(log.action ?? "ACCESS_EVENT"),
    category: "access",
    severity: succeeded ? "info" : "warn",
    status: normaliseStatus(log.success),
    actorEmail: log.actorEmail ?? null,
    actorType: log.actorType ?? null,
    resourceType: log.targetType ?? null,
    resourceName: log.targetKey ?? null,
    message: buildEventMessage(log.action ?? "ACCESS_EVENT", log.targetKey, log.actorEmail),
    createdAt: (log.createdAt as Date).toISOString(),
    adminHref: "/admin/access-keys",
  };
}

function fromDownloadAuditEvent(log: Record<string, any>): AdminEvent {
  const succeeded = log.success === true;
  const name = log.fileName ?? log.title ?? null;
  return {
    id: `dl_${log.id}`,
    source: "download",
    eventType: String(log.eventType ?? "DOWNLOAD"),
    category: "delivery",
    severity: succeeded ? "info" : "warn",
    status: normaliseStatus(log.success),
    actorEmail: log.email ?? null,
    actorType: "member",
    resourceType: log.contentType ?? null,
    resourceName: name,
    message: buildEventMessage(log.eventType ?? "DOWNLOAD", name, log.email),
    createdAt: (log.createdAt as Date).toISOString(),
    adminHref: "/admin/delivery-queue",
  };
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export async function buildEventLogSummary(options?: {
  limit?: number;
}): Promise<EventLogSummary> {
  const limit = options?.limit ?? 100;
  const perSourceLimit = Math.ceil(limit / 4);
  const sourceErrors: Partial<Record<AdminEventSource, string>> = {};
  let allEvents: AdminEvent[] = [];

  // Query each source independently so one failure doesn't suppress others
  const [sysResult, govResult, accResult, dlResult] = await Promise.allSettled([
    prisma.systemAuditLog.findMany({
      take: perSourceLimit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.governanceLog.findMany({
      take: perSourceLimit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.accessAuditLog.findMany({
      take: perSourceLimit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.downloadAuditEvent.findMany({
      take: perSourceLimit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (sysResult.status === "fulfilled") {
    allEvents.push(...(sysResult.value as Record<string, any>[]).map(fromSystemAuditLog));
  } else {
    sourceErrors.system_audit = sysResult.reason instanceof Error
      ? sysResult.reason.message
      : "Query failed";
  }

  if (govResult.status === "fulfilled") {
    allEvents.push(...(govResult.value as Record<string, any>[]).map(fromGovernanceLog));
  } else {
    sourceErrors.governance = govResult.reason instanceof Error
      ? govResult.reason.message
      : "Query failed";
  }

  if (accResult.status === "fulfilled") {
    allEvents.push(...(accResult.value as Record<string, any>[]).map(fromAccessAuditLog));
  } else {
    sourceErrors.access_audit = accResult.reason instanceof Error
      ? accResult.reason.message
      : "Query failed";
  }

  if (dlResult.status === "fulfilled") {
    allEvents.push(...(dlResult.value as Record<string, any>[]).map(fromDownloadAuditEvent));
  } else {
    sourceErrors.download = dlResult.reason instanceof Error
      ? dlResult.reason.message
      : "Query failed";
  }

  // Sort merged events by createdAt descending, cap at limit
  allEvents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  allEvents = allEvents.slice(0, limit);

  return {
    events: allEvents,
    totalCount: allEvents.length,
    criticalCount: allEvents.filter((e) => e.severity === "critical" || e.severity === "error").length,
    failureCount: allEvents.filter((e) => e.status === "failure").length,
    sourceCounts: countBySources(allEvents),
    generatedAt: new Date().toISOString(),
    webhookStatus: "not_connected",
    sourceErrors,
  };
}
