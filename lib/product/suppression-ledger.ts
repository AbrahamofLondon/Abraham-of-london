/**
 * Suppression Audit Ledger — Service
 *
 * Records, retrieves, reviews, and summarises suppression events.
 * Persists to the AccessAuditLog table with targetType "SUPPRESSION_EVENT"
 * and stores SuppressionEvent fields as JSON metadata.
 *
 * Never stores raw suppressed content — only field references, surface
 * names, rules, and evidence-source metadata.
 */

import { prisma } from "@/lib/prisma.server";
import type { Prisma } from "@prisma/client";
import type {
  SuppressionEvent,
  SuppressionOverrideStatus,
  SuppressionSummary,
} from "@/lib/product/suppression-ledger-contract";
import { createSuppressionInput, type SuppressionInput } from "@/lib/product/suppression-event-helpers";

function generateEventId(): string {
  return `sup_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Record a new suppression event to the audit ledger.
 * Returns the generated eventId.
 */
export async function recordSuppression(
  event: SuppressionInput,
): Promise<string> {
  const eventId = generateEventId();
  const normalized = createSuppressionInput(event);
  const full: SuppressionEvent = { ...normalized, eventId };

  try {
    await prisma.accessAuditLog.create({
      data: {
        actorType: event.suppressedBySystem ? "SYSTEM" : "USER",
        actorUserId: null,
        actorEmail: null,
        action: "SUPPRESSION_RECORDED",
        targetType: "SUPPRESSION_EVENT",
        targetKey: eventId,
        success: true,
        reason: event.suppressionReason,
        metadata: full as unknown as Prisma.InputJsonObject,
      },
    });
  } catch {
    // Audit writes must not break the calling surface
  }

  return eventId;
}

/**
 * Load suppression events from the audit ledger, optionally filtered.
 */
export async function loadSuppressionLedger(filters?: {
  scopeId?: string;
  surface?: string;
  reason?: string;
  limit?: number;
}): Promise<SuppressionEvent[]> {
  const rows = await prisma.accessAuditLog.findMany({
    where: {
      targetType: "SUPPRESSION_EVENT",
      action: { in: ["SUPPRESSION_RECORDED", "SUPPRESSION_REVIEWED"] },
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 200,
  });

  const events: SuppressionEvent[] = [];

  for (const row of rows) {
    const meta = row.metadata as Record<string, unknown> | null;
    if (!meta || typeof meta !== "object") continue;

    const ev = meta as unknown as SuppressionEvent;
    if (!ev.eventId) continue;
    if (!ev.fieldReference) ev.fieldReference = ev.fieldName;
    if (!ev.evidencePosture) ev.evidencePosture = ev.originalPosture;
    if (!ev.sourceLabel) ev.sourceLabel = ev.evidenceSource;
    if (!ev.scopeType) ev.scopeType = "UNKNOWN";
    if (!ev.suppressionRuleCategory) ev.suppressionRuleCategory = ev.suppressionRule;
    if (typeof ev.operatorReviewAvailable !== "boolean") ev.operatorReviewAvailable = true;

    // Apply filters
    if (filters?.scopeId && ev.scopeId !== filters.scopeId) continue;
    if (filters?.surface && ev.surface !== filters.surface) continue;
    if (filters?.reason && ev.suppressionReason !== filters.reason) continue;

    events.push(ev);
  }

  return events;
}

/**
 * Review / override a previously recorded suppression event.
 */
export async function reviewSuppression(
  eventId: string,
  operatorId: string,
  decision: SuppressionOverrideStatus,
  reason?: string,
): Promise<void> {
  // Find the original record
  const original = await prisma.accessAuditLog.findFirst({
    where: {
      targetType: "SUPPRESSION_EVENT",
      targetKey: eventId,
      action: "SUPPRESSION_RECORDED",
    },
  });

  if (!original) return;

  const meta = original.metadata as Record<string, unknown> | null;
  if (!meta) return;

  const updated: SuppressionEvent = {
    ...(meta as unknown as SuppressionEvent),
    reviewedByOperator: operatorId,
    reviewedAt: new Date().toISOString(),
    overrideStatus: decision,
    overrideReason: reason ?? null,
  };

  try {
    await prisma.accessAuditLog.create({
      data: {
        actorType: "ADMIN",
        actorUserId: operatorId,
        actorEmail: null,
        action: "SUPPRESSION_REVIEWED",
        targetType: "SUPPRESSION_EVENT",
        targetKey: eventId,
        success: true,
        reason: reason ?? `Override decision: ${decision}`,
        metadata: updated as unknown as Prisma.InputJsonObject,
      },
    });
  } catch {
    // Audit writes must not break the calling surface
  }
}

/**
 * Build a summary of all suppression events, optionally scoped.
 */
export async function buildSuppressionSummary(
  scopeId?: string,
): Promise<SuppressionSummary> {
  const events = await loadSuppressionLedger(
    scopeId ? { scopeId, limit: 500 } : { limit: 500 },
  );

  const bySurface: Record<string, number> = {};
  const byReason: Record<string, number> = {};
  let latestAt: string | null = null;

  for (const ev of events) {
    bySurface[ev.surface] = (bySurface[ev.surface] ?? 0) + 1;
    byReason[ev.suppressionReason] = (byReason[ev.suppressionReason] ?? 0) + 1;
    if (!latestAt || ev.suppressedAt > latestAt) {
      latestAt = ev.suppressedAt;
    }
  }

  const totalSuppressed = events.length;

  // Sponsor-safe notice: only show count if >= 3 events (avoid inference)
  const sponsorSafeNotice =
    totalSuppressed >= 3
      ? `${totalSuppressed} items were withheld for privacy or evidence-safety reasons.`
      : "Some material was withheld for privacy or evidence-safety reasons.";

  return {
    totalSuppressed,
    bySurface,
    byReason,
    latestAt,
    sponsorSafeNotice,
  };
}
