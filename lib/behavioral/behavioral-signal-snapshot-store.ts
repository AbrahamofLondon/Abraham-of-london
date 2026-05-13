import { prisma } from "@/lib/prisma";
import type { BehavioralDataSource } from "@/lib/alignment/enhanced-types";
import type { BehavioralSignalSnapshotRecord } from "./behavioral-signal-snapshot-contract";

const DEFAULT_MAX_AGE_MINUTES = 24 * 60;
const DEFAULT_LIMIT = 200;
const SOURCE_TYPES: BehavioralDataSource["type"][] = ["calendar", "email", "slack", "jira", "linear", "github", "notion"];
const SAFE_METADATA_KEYS = new Set([
  "freshness",
  "source",
  "sourceType",
  "provider",
  "integrationType",
  "generatedAt",
  "evidenceWindowStart",
  "evidenceWindowEnd",
  "integrationConnectedAt",
  "signalCount",
  "count",
  "rate",
  "percentage",
  "sampleSize",
  "windowDays",
  "version",
  "schemaVersion",
]);
const SAFE_RAW_COUNT_BASIS_KEYS = new Set([
  "totalEvents",
  "confirmedEvents",
  "cancelledEvents",
  "tentativeEvents",
  "recurringEvents",
  "attendedEvents",
  "missedEvents",
  "totalMessages",
  "responseCount",
  "responseWindowHours",
  "signalCount",
  "count",
  "rate",
  "percentage",
  "sampleSize",
  "windowDays",
  "eventCount",
  "completedCount",
  "channelCount",
  "messageCount",
  "responseRate",
]);
const SAFE_NESTED_OBJECT_KEYS = new Set([
  "freshness",
  "source",
  "sourceType",
  "provider",
  "integrationType",
  "generatedAt",
  "evidenceWindowStart",
  "evidenceWindowEnd",
  "integrationConnectedAt",
  "version",
  "schemaVersion",
]);

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeSignalValue(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number.isSafeInteger(Number(value)) ? Number(value) : String(value);
  }
  return undefined;
}

function sanitizeAllowlistedObject(
  input: unknown,
  allowedKeys: Set<string>,
  mode: "metadata" | "rawCountBasis",
): Record<string, unknown> | null {
  if (!isPlainObject(input)) return null;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowedKeys.has(key)) continue;

    if (typeof value === "number") {
      if (Number.isFinite(value)) {
        sanitized[key] = value;
      }
      continue;
    }

    if (typeof value === "string" || typeof value === "boolean") {
      sanitized[key] = value;
      continue;
    }

    if (mode === "metadata" && isPlainObject(value) && SAFE_NESTED_OBJECT_KEYS.has(key)) {
      const nested = sanitizeAllowlistedObject(value, SAFE_METADATA_KEYS, "metadata");
      if (nested && Object.keys(nested).length > 0) {
        sanitized[key] = nested;
      }
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

// Allowlist-based by design: only explicitly approved provenance/context keys survive.
// Unknown keys are dropped so future provider payload changes cannot silently persist content.
function sanitizeSnapshotMetadata(input: unknown): Record<string, unknown> | null {
  return sanitizeAllowlistedObject(input, SAFE_METADATA_KEYS, "metadata");
}

// Stricter than metadata: rawCountBasis may contain only numeric count/rate/window fields
// and a small set of safe provenance counters already emitted by current integrations.
function sanitizeRawCountBasis(input: unknown): Record<string, unknown> | null {
  return sanitizeAllowlistedObject(input, SAFE_RAW_COUNT_BASIS_KEYS, "rawCountBasis");
}

function normalizeSnapshotRow(row: any): BehavioralSignalSnapshotRecord {
  return {
    id: row.id,
    userId: row.userId,
    organisationId: row.organisationId ?? null,
    accountId: row.accountId ?? null,
    source: row.source,
    sourceLabel: row.sourceLabel ?? null,
    evidencePosture: row.evidencePosture ?? null,
    signalKey: row.signalKey,
    signalValue: row.signalValueJson,
    confidence: row.confidence ?? null,
    evidenceWindowStart: row.evidenceWindowStart ? new Date(row.evidenceWindowStart).toISOString() : null,
    evidenceWindowEnd: row.evidenceWindowEnd ? new Date(row.evidenceWindowEnd).toISOString() : null,
    generatedAt: new Date(row.generatedAt).toISOString(),
    integrationConnectedAt: row.integrationConnectedAt ? new Date(row.integrationConnectedAt).toISOString() : null,
    rawCountBasis: sanitizeRawCountBasis(row.rawCountBasisJson),
    metadata: sanitizeSnapshotMetadata(row.metadataJson),
  };
}

export async function persistBehavioralSignalSnapshots(input: {
  userId: string;
  organisationId?: string | null;
  accountId?: string | null;
  sources: BehavioralDataSource[];
  evidenceWindowStart?: Date | string | null;
  evidenceWindowEnd?: Date | string | null;
}): Promise<BehavioralSignalSnapshotRecord[]> {
  const snapshotModel = (prisma as any).behavioralSignalSnapshot;
  if (!snapshotModel?.create) {
    console.warn("[behavioral-snapshot] persistence unavailable", {
      userIdPresent: Boolean(input.userId),
      sourceCount: input.sources.length,
    });
    return [];
  }

  const persisted: BehavioralSignalSnapshotRecord[] = [];
  for (const source of input.sources) {
    const sourceGeneratedAt = toDate(source.lastSyncAt) ?? new Date();
    const sourceWindowStart = toDate(input.evidenceWindowStart ?? source.evidenceWindowStart ?? null);
    const sourceWindowEnd = toDate(input.evidenceWindowEnd ?? source.evidenceWindowEnd ?? null);
    const rawCountBasis = sanitizeRawCountBasis(source.rawCountBasis);
    const metadata = sanitizeSnapshotMetadata(source.metadata);

    for (const [signalKey, signalValue] of Object.entries(source.signals ?? {})) {
      if (signalValue === undefined || signalValue === null) {
        continue;
      }

      const safeSignalValue = sanitizeSignalValue(signalValue);
      if (safeSignalValue === undefined) {
        console.warn("[behavioral-snapshot] skipped unserializable signal", {
          userIdPresent: Boolean(input.userId),
          source: source.type,
          signalKey,
        });
        continue;
      }

      try {
        const row = await snapshotModel.create({
          data: {
            userId: input.userId,
            organisationId: input.organisationId ?? null,
            accountId: input.accountId ?? null,
            source: source.type,
            sourceLabel: source.sourceLabel ?? null,
            evidencePosture: source.evidencePosture ?? "integrated",
            signalKey,
            signalValueJson: safeSignalValue,
            confidence: null,
            evidenceWindowStart: sourceWindowStart,
            evidenceWindowEnd: sourceWindowEnd,
            generatedAt: sourceGeneratedAt,
            integrationConnectedAt: toDate(source.integrationConnectedAt ?? source.connectedAt ?? null),
            rawCountBasisJson: rawCountBasis,
            metadataJson: metadata,
          },
        });
        persisted.push(normalizeSnapshotRow(row));
      } catch (error) {
        console.warn("[behavioral-snapshot] failed to persist signal", {
          userIdPresent: Boolean(input.userId),
          source: source.type,
          signalKey,
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }
    }
  }

  return persisted;
}

export async function loadLatestBehavioralSignalSnapshots(input: {
  userId: string;
  source?: string;
  signalKeys?: string[];
  maxAgeMinutes?: number;
  limit?: number;
}): Promise<BehavioralSignalSnapshotRecord[]> {
  const snapshotModel = (prisma as any).behavioralSignalSnapshot;
  if (!snapshotModel?.findMany) {
    return [];
  }

  const maxAgeMinutes = input.maxAgeMinutes ?? DEFAULT_MAX_AGE_MINUTES;
  const cutoff = new Date(Date.now() - (maxAgeMinutes * 60 * 1000));
  const rows = await snapshotModel.findMany({
    where: {
      userId: input.userId,
      ...(input.source ? { source: input.source } : {}),
      ...(input.signalKeys?.length ? { signalKey: { in: input.signalKeys } } : {}),
      generatedAt: { gte: cutoff },
    },
    orderBy: [{ generatedAt: "desc" }, { createdAt: "desc" }],
    take: input.limit ?? DEFAULT_LIMIT,
  });

  return rows.map(normalizeSnapshotRow);
}

export function hydrateBehavioralSourcesFromSnapshots(
  userId: string,
  snapshots: BehavioralSignalSnapshotRecord[],
): BehavioralDataSource[] {
  const bySource = new Map<string, BehavioralSignalSnapshotRecord[]>();
  for (const snapshot of snapshots) {
    if (!bySource.has(snapshot.source)) {
      bySource.set(snapshot.source, []);
    }
    bySource.get(snapshot.source)!.push(snapshot);
  }

  const hydrated: BehavioralDataSource[] = [];
  for (const [source, records] of bySource.entries()) {
    if (!SOURCE_TYPES.includes(source as BehavioralDataSource["type"])) {
      continue;
    }

    const latestGeneratedAt = records
      .map((record) => record.generatedAt)
      .sort((a, b) => b.localeCompare(a))[0];
    if (!latestGeneratedAt) continue;

    const latestRecords = records.filter((record) => record.generatedAt === latestGeneratedAt);
    const latest = latestRecords[0];
    if (!latest) continue;

    const signals: Record<string, unknown> = {};
    for (const record of latestRecords) {
      signals[record.signalKey] = record.signalValue;
    }

    hydrated.push({
      type: source as BehavioralDataSource["type"],
      connectionId: `${source}_snapshot_${userId}`,
      connectedAt: latest.integrationConnectedAt ?? latest.generatedAt,
      integrationConnectedAt: latest.integrationConnectedAt ?? latest.generatedAt,
      lastSyncAt: latest.generatedAt,
      status: "active",
      sourceLabel: latest.sourceLabel ?? `${source} snapshot`,
      evidencePosture: "persisted",
      evidenceWindowStart: latest.evidenceWindowStart ?? undefined,
      evidenceWindowEnd: latest.evidenceWindowEnd ?? undefined,
      rawCountBasis: latest.rawCountBasis ?? null,
      metadata: {
        ...(latest.metadata ?? {}),
        freshness: "snapshot",
        snapshotGeneratedAt: latest.generatedAt,
        originalEvidencePosture: latest.evidencePosture ?? null,
      },
      signals: signals as BehavioralDataSource["signals"],
    });
  }

  return hydrated;
}
