import "server-only";

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE VAULT — append-only forensic evidence store
//
// Immutable by default. Every entry is a permanent record.
// Used for: legal enforcement, IP theft prosecution, pattern analysis.
// ─────────────────────────────────────────────────────────────────────────────

export type EvidenceEntry = {
  identityKey: string;
  eventType: string;
  severity: number;
  snapshot: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  route?: string;
};

/**
 * Record evidence. Append-only — no updates, no deletes.
 */
export async function recordEvidence(entry: EvidenceEntry): Promise<void> {
  await prisma.evidenceVaultEntry.create({
    data: {
      identityKey: entry.identityKey,
      eventType: entry.eventType,
      severity: entry.severity,
      snapshot: entry.snapshot as unknown as Parameters<typeof prisma.evidenceVaultEntry.create>[0]["data"]["snapshot"],
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent?.slice(0, 500) ?? null,
      route: entry.route ?? null,
      immutable: true,
    },
  }).catch((err) => {
    console.error("[EVIDENCE_VAULT] Failed to record:", err);
  });
}

/**
 * Record a canary tripwire event with full context.
 */
export async function recordCanaryTrip(opts: {
  identityKey: string;
  tripwireType: string;
  severity: number;
  ipAddress: string;
  userAgent?: string;
  route: string;
  requestSnapshot: Record<string, unknown>;
}): Promise<void> {
  await recordEvidence({
    identityKey: opts.identityKey,
    eventType: `CANARY_${opts.tripwireType}`,
    severity: opts.severity,
    snapshot: {
      tripwireType: opts.tripwireType,
      route: opts.route,
      timestamp: new Date().toISOString(),
      // Store sanitized request data — no user PII, just structural patterns
      bodyFieldCount: Object.keys(opts.requestSnapshot).length,
      bodyFieldNames: Object.keys(opts.requestSnapshot).sort(),
      hasDecoyFields: true,
    },
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    route: opts.route,
  });
}

/**
 * Record a watchdog escalation with full context.
 */
export async function recordWatchdogEscalation(opts: {
  identityKey: string;
  level: number;
  action: string;
  internalReason: string;
  ipAddress: string;
  userAgent?: string;
  route: string;
}): Promise<void> {
  await recordEvidence({
    identityKey: opts.identityKey,
    eventType: `WATCHDOG_L${opts.level}`,
    severity: opts.level * 2,
    snapshot: {
      level: opts.level,
      action: opts.action,
      reason: opts.internalReason,
      route: opts.route,
      timestamp: new Date().toISOString(),
    },
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    route: opts.route,
  });
}

/**
 * Get evidence trail for an identity — for enforcement/legal.
 */
export async function getEvidenceTrail(identityKey: string): Promise<Array<{
  id: string;
  eventType: string;
  severity: number;
  ipAddress: string | null;
  route: string | null;
  createdAt: Date;
}>> {
  return prisma.evidenceVaultEntry.findMany({
    where: { identityKey },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      eventType: true,
      severity: true,
      ipAddress: true,
      route: true,
      createdAt: true,
    },
  });
}

/**
 * Get evidence summary for dashboard — counts by type and severity.
 */
export async function getEvidenceSummary(windowMs: number = 86400_000): Promise<{
  totalEvents: number;
  uniqueIdentities: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}> {
  const since = new Date(Date.now() - windowMs);

  const events = await prisma.evidenceVaultEntry.findMany({
    where: { createdAt: { gte: since } },
    select: { identityKey: true, eventType: true, severity: true },
  });

  const identities = new Set(events.map((e) => e.identityKey));
  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const e of events) {
    const sKey = `severity_${e.severity}`;
    bySeverity[sKey] = (bySeverity[sKey] ?? 0) + 1;
    byType[e.eventType] = (byType[e.eventType] ?? 0) + 1;
  }

  return {
    totalEvents: events.length,
    uniqueIdentities: identities.size,
    bySeverity,
    byType,
  };
}
