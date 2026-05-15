import { prisma } from "@/lib/prisma.server";

// Provenance action strings written to systemAuditLog.action
const PROVENANCE_ACTIONS = [
  "PROVENANCE_ANCHOR_CREATED",
  "PROVENANCE_CHAIN_VERIFIED",
  "PROVENANCE_HASH_VERIFIED",
  "PROVENANCE_HASH_MISMATCH",
  "CLIENT_SAFE_PROVENANCE_GENERATED",
  "FULL_PROVENANCE_VIEWED",
] as const;

type ProvenanceEventType = (typeof PROVENANCE_ACTIONS)[number];

export type ProvenanceOperationHistoryItem = {
  id: string;
  eventType: ProvenanceEventType | string;
  eventVersion?: number | null;
  requestId?: string | null;
  source?: string | null;
  status?: string | null;
  scope?: string | null;
  scopeId?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  provenanceHash?: string | null;
  merkleRoot?: string | null;
  chainHash?: string | null;
  occurredAt: string;
};

export type ProvenanceOperationHistorySummary = {
  latestAnchorCreatedAt?: string | null;
  latestChainVerifiedAt?: string | null;
  latestHashMismatchAt?: string | null;
  manualRunnerStatus: "ACTIVE" | "NOT_OBSERVED";
  scheduledRunnerStatus: "ACTIVE" | "NOT_OBSERVED" | "NOT_CONFIGURED";
  recent: ProvenanceOperationHistoryItem[];
  unavailable?: boolean;
  unavailableReason?: string;
};

function parseMeta(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function safeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isKnownProvenanceAction(action: string): action is ProvenanceEventType {
  return (PROVENANCE_ACTIONS as readonly string[]).includes(action);
}

type AuditRow = {
  id: string;
  action: string;
  status: string | null;
  requestId: string | null;
  metadata: string | null;
  createdAt: Date;
};

function extractItem(row: AuditRow): ProvenanceOperationHistoryItem | null {
  if (!isKnownProvenanceAction(row.action)) return null;

  const meta = parseMeta(row.metadata);
  // Strip internal logger extension block — not relevant to provenance history
  const { _ext: _, ...provFields } = meta as Record<string, unknown> & { _ext?: unknown };

  return {
    id: row.id,
    eventType: safeString(provFields.eventType) ?? row.action,
    eventVersion: safeNumber(provFields.eventVersion),
    requestId: row.requestId ?? safeString(provFields.requestId),
    source: safeString(provFields.source),
    status: row.status,
    scope: safeString(provFields.scope),
    scopeId: safeString(provFields.scopeId),
    subjectType: safeString(provFields.subjectType),
    subjectId: safeString(provFields.subjectId),
    provenanceHash: safeString(provFields.provenanceHash),
    merkleRoot: safeString(provFields.merkleRoot),
    chainHash: safeString(provFields.chainHash),
    occurredAt: row.createdAt.toISOString(),
  };
}

export async function getProvenanceOperationHistory(
  options: { limit?: number } = {},
): Promise<ProvenanceOperationHistorySummary> {
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 50);

  let rows: AuditRow[];

  try {
    rows = await (prisma.systemAuditLog.findMany as (args: object) => Promise<AuditRow[]>)({
      where: {
        action: { in: PROVENANCE_ACTIONS as unknown as string[] },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        status: true,
        requestId: true,
        metadata: true,
        createdAt: true,
      },
    });
  } catch {
    return {
      unavailable: true,
      unavailableReason: "Provenance audit log could not be queried.",
      manualRunnerStatus: "NOT_OBSERVED",
      scheduledRunnerStatus: "NOT_OBSERVED",
      recent: [],
    };
  }

  const items = rows
    .map(extractItem)
    .filter((item): item is ProvenanceOperationHistoryItem => item !== null);

  const hasScheduledRunnerEvent = items.some((item) =>
    typeof item.source === "string" && item.source.toLowerCase().includes("scheduled"),
  );
  const hasManualRunnerEvent = items.some((item) =>
    item.eventType === "PROVENANCE_ANCHOR_CREATED"
      && typeof item.source === "string"
      && !item.source.toLowerCase().includes("scheduled"),
  );

  return {
    latestAnchorCreatedAt:
      items.find((i) => i.eventType === "PROVENANCE_ANCHOR_CREATED")?.occurredAt ?? null,
    latestChainVerifiedAt:
      items.find((i) => i.eventType === "PROVENANCE_CHAIN_VERIFIED")?.occurredAt ?? null,
    latestHashMismatchAt:
      items.find((i) => i.eventType === "PROVENANCE_HASH_MISMATCH")?.occurredAt ?? null,
    manualRunnerStatus: hasManualRunnerEvent ? "ACTIVE" : "NOT_OBSERVED",
    scheduledRunnerStatus: hasScheduledRunnerEvent ? "ACTIVE" : "NOT_OBSERVED",
    recent: items,
  };
}
