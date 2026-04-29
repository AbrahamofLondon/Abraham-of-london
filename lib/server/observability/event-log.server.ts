import "server-only";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type EventCategory =
  | "page_view"
  | "diagnostic_start"
  | "diagnostic_complete"
  | "diagnostic_drop"
  | "signal_shown"
  | "commitment_made"
  | "commitment_declined"
  | "checkout_initiated"
  | "checkout_completed"
  | "checkout_cancelled"
  | "entitlement_granted"
  | "entitlement_verified"
  | "download_attempt"
  | "download_success"
  | "auth_login"
  | "auth_logout"
  | "auth_failure"
  | "shield_block"
  | "shield_challenge"
  | "rate_limit_hit"
  | "error"
  | "conversion";

export type EventSeverity = "debug" | "info" | "warn" | "error" | "critical";

export type EventLogEntry = {
  id: string;
  timestamp: Date;
  category: EventCategory;
  severity: EventSeverity;
  sessionId?: string | null;
  userId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  route?: string | null;
  metadata: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────────────────
// WRITE — persists to Postgres via the existing SystemAuditLog table
// ─────────────────────────────────────────────────────────────────────────────

export async function writeEventLog(entry: {
  category: EventCategory;
  severity?: EventSeverity;
  sessionId?: string | null;
  userId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  route?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.systemAuditLog.create({
      data: {
        action: `event.${entry.category}`,
        severity: entry.severity ?? "info",
        status: "success",
        actorId: entry.userId ?? null,
        actorEmail: entry.email ?? null,
        ipAddress: entry.ipAddress ?? null,
        sessionId: entry.sessionId ?? null,
        resourceName: entry.route ?? null,
        category: "observability",
        subCategory: entry.category,
        metadata: JSON.stringify(entry.metadata ?? {}),
        requestId: randomUUID(),
      },
    });
  } catch (error) {
    // Non-blocking — observability must never break the calling code
    console.error("[OBSERVABILITY] Failed to write event log:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY — retrieve events for analysis
// ─────────────────────────────────────────────────────────────────────────────

export async function queryEventLog(opts: {
  category?: EventCategory;
  severity?: EventSeverity;
  userId?: string;
  email?: string;
  sessionId?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
}): Promise<EventLogEntry[]> {
  const where: Record<string, unknown> = { category: "observability" };

  if (opts.category) where.subCategory = opts.category;
  if (opts.severity) where.severity = opts.severity;
  if (opts.userId) where.actorId = opts.userId;
  if (opts.email) where.actorEmail = opts.email;
  if (opts.sessionId) where.sessionId = opts.sessionId;
  if (opts.since || opts.until) {
    where.createdAt = {};
    if (opts.since) (where.createdAt as Record<string, unknown>).gte = opts.since;
    if (opts.until) (where.createdAt as Record<string, unknown>).lte = opts.until;
  }

  const rows = await prisma.systemAuditLog.findMany({
    where: where as any,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
    skip: opts.offset ?? 0,
  });

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.createdAt,
    category: (row.subCategory as EventCategory) ?? "error",
    severity: (row.severity as EventSeverity) ?? "info",
    sessionId: row.sessionId ?? null,
    userId: row.actorId ?? null,
    email: row.actorEmail ?? null,
    ipAddress: row.ipAddress ?? null,
    route: row.resourceName ?? null,
    metadata: safeParseJson(row.metadata),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNNEL — count users at each stage of a conversion funnel
// ─────────────────────────────────────────────────────────────────────────────

export async function funnelCounts(opts: {
  since: Date;
  until?: Date;
}): Promise<Record<string, number>> {
  const until = opts.until ?? new Date();
  const baseWhere = {
    category: "observability" as const,
    createdAt: { gte: opts.since, lte: until },
  };

  const [pageViews, starts, signals, commitments, completions, checkouts, downloads] =
    await Promise.all([
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "page_view" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "diagnostic_start" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "signal_shown" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "commitment_made" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "diagnostic_complete" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "checkout_completed" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "download_success" },
      }),
    ]);

  return {
    page_views: pageViews,
    diagnostic_starts: starts,
    signal_shown: signals,
    commitments: commitments,
    diagnostic_completions: completions,
    checkouts: checkouts,
    downloads: downloads,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

function safeParseJson(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
