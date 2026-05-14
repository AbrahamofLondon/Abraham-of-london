import { createHash } from "crypto";

import { prisma } from "@/lib/prisma.server";
import type { ClientSafeOversightBrief } from "@/lib/product/client-safe-oversight-brief";
import type { OversightDeliveryIntent } from "@/lib/product/oversight-delivery-contract";
import type { OversightBriefEfficacyScore } from "@/lib/product/oversight-brief-efficacy-contract";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type { OversightCycleComparison } from "@/lib/product/oversight-cycle-comparison";
import type {
  OversightCycleArchiveRecord,
  OversightCycleAudience,
} from "@/lib/product/oversight-cycle-ledger-contract";
import type { OversightReviewDecisionRecord } from "@/lib/product/oversight-review-decision-contract";
import type { OversightReviewCycle } from "@/lib/product/oversight-review-cycle-contract";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function hashPayload(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}

function archiveMetadataToRecord(metadata: Record<string, unknown>): OversightCycleArchiveRecord | null {
  const cycleId = typeof metadata.cycleId === "string" ? metadata.cycleId : null;
  const accountId = typeof metadata.accountId === "string" ? metadata.accountId : null;
  const periodStart = typeof metadata.periodStart === "string" ? metadata.periodStart : null;
  const periodEnd = typeof metadata.periodEnd === "string" ? metadata.periodEnd : null;
  const internalPayloadHash = typeof metadata.internalPayloadHash === "string" ? metadata.internalPayloadHash : null;
  const efficacy = asRecord(metadata.efficacy);
  const delivery = asRecord(metadata.deliveryIntent);
  if (!cycleId || !accountId || !periodStart || !periodEnd || !internalPayloadHash) return null;

  return {
    cycleId,
    accountId,
    organisationId: typeof metadata.organisationId === "string" ? metadata.organisationId : null,
    subjectEmail: typeof metadata.subjectEmail === "string" ? metadata.subjectEmail : null,
    periodStart,
    periodEnd,
    internalPayloadHash,
    clientPayloadHash: typeof metadata.clientPayloadHash === "string" ? metadata.clientPayloadHash : null,
    audiencePayloadHashes: asRecord(metadata.audiencePayloadHashes) as Partial<Record<OversightCycleAudience, string>>,
    efficacyGrade: typeof efficacy.grade === "string" ? efficacy.grade : "WITHHOLD",
    efficacyScore: typeof efficacy.totalScore === "number" ? efficacy.totalScore : 0,
    suppressions: Array.isArray(metadata.suppressions)
      ? metadata.suppressions.filter((item): item is { section: string; reason: string; explanation: string } =>
          Boolean(item) && typeof item === "object"
          && typeof (item as { section?: unknown }).section === "string"
          && typeof (item as { reason?: unknown }).reason === "string"
          && typeof (item as { explanation?: unknown }).explanation === "string")
      : [],
    warnings: Array.isArray(metadata.warnings) ? metadata.warnings.filter((item): item is string => typeof item === "string") : [],
    reviewDecision: typeof metadata.reviewDecision === "string" ? metadata.reviewDecision : null,
    operatorId: typeof metadata.operatorId === "string" ? metadata.operatorId : null,
    deliveryStatus: typeof delivery.state === "string" ? delivery.state : "NOT_READY",
    deliveryUrl: typeof metadata.deliveryUrl === "string" ? metadata.deliveryUrl : null,
    nextCycleIntent: asRecord(metadata.nextCycleIntent) as OversightCycleArchiveRecord["nextCycleIntent"],
    createdAt: typeof metadata.createdAt === "string" ? metadata.createdAt : new Date().toISOString(),
    approvedAt: typeof metadata.approvedAt === "string" ? metadata.approvedAt : null,
    deliveredAt: typeof metadata.deliveredAt === "string" ? metadata.deliveredAt : null,
  };
}

export async function persistOversightCycleArchive(input: {
  cycle: OversightReviewCycle;
  accountId: string;
  organisationId?: string | null;
  subjectEmail?: string | null;
  internalBrief: OversightBrief;
  audienceBriefs: Partial<Record<OversightCycleAudience, ClientSafeOversightBrief>>;
  efficacy?: OversightBriefEfficacyScore;
  suppressions: Array<{ section: string; reason: string; explanation: string }>;
  warnings: string[];
  reviewDecision?: OversightReviewDecisionRecord | null;
  deliveryIntent: OversightDeliveryIntent;
  nextCycleIntent?: {
    cadence: string;
    nextCycleRecommendedDate: string;
    reason: string;
  } | null;
  cycleComparison?: OversightCycleComparison | null;
}): Promise<{ archiveId: string; record: OversightCycleArchiveRecord }> {
  const internalPayloadHash = hashPayload(input.internalBrief);
  const clientPayloadHash = input.audienceBriefs.CLIENT_SPONSOR?.brief
    ? hashPayload(input.audienceBriefs.CLIENT_SPONSOR.brief)
    : null;
  const audiencePayloadHashes = Object.fromEntries(
    Object.entries(input.audienceBriefs)
      .filter((entry): entry is [string, ClientSafeOversightBrief] => Boolean(entry[1]?.brief))
      .map(([audience, safe]) => [audience, hashPayload(safe.brief)])
  ) as Partial<Record<OversightCycleAudience, string>>;

  const metadata = {
    cycleId: input.cycle.cycleId,
    accountId: input.accountId,
    organisationId: input.organisationId ?? null,
    subjectEmail: input.subjectEmail ?? null,
    periodStart: input.cycle.periodStart,
    periodEnd: input.cycle.periodEnd,
    internalBrief: input.internalBrief,
    internalPayloadHash,
    clientSafeBrief: input.audienceBriefs.CLIENT_SPONSOR?.brief ?? null,
    clientPayloadHash,
    audienceBriefs: Object.fromEntries(
      Object.entries(input.audienceBriefs).map(([audience, safe]) => [audience, safe.brief])
    ),
    audiencePayloadHashes,
    efficacy: input.efficacy ?? null,
    suppressions: input.suppressions,
    warnings: input.warnings,
    reviewDecision: input.reviewDecision?.decision ?? null,
    operatorId: input.reviewDecision?.operatorId ?? null,
    deliveryIntent: input.deliveryIntent,
    nextCycleIntent: input.nextCycleIntent ?? null,
    cycleComparison: input.cycleComparison ?? null,
    createdAt: input.cycle.generatedAt,
    approvedAt: input.cycle.approvedAt ?? null,
    deliveredAt: input.cycle.deliveredAt ?? null,
    deliveryUrl: input.deliveryIntent.state === "CLIENT_VIEW_READY" || input.deliveryIntent.state === "DELIVERED"
      ? `/oversight/brief/${input.cycle.cycleId}`
      : null,
  };

  const existing = await prisma.auditEvent.findFirst({
    where: {
      objectType: "OVERSIGHT_CYCLE_ARCHIVE",
      objectId: input.cycle.cycleId,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const archive = existing
    ? await prisma.auditEvent.update({
        where: { id: existing.id },
        data: {
          actorType: input.reviewDecision?.operatorId ? "ADMIN" : "SYSTEM",
          actorId: input.reviewDecision?.operatorId ?? null,
          actionType: "UPDATED",
          summary: `Oversight cycle ${input.cycle.cycleId} archived.`,
          metadata: metadata as never,
        },
        select: { id: true, metadata: true },
      })
    : await prisma.auditEvent.create({
        data: {
          actorType: input.reviewDecision?.operatorId ? "ADMIN" : "SYSTEM",
          actorId: input.reviewDecision?.operatorId ?? null,
          objectType: "OVERSIGHT_CYCLE_ARCHIVE",
          objectId: input.cycle.cycleId,
          actionType: "CREATED",
          summary: `Oversight cycle ${input.cycle.cycleId} archived.`,
          metadata: metadata as never,
        },
        select: { id: true, metadata: true },
      });

  const record = archiveMetadataToRecord(asRecord(archive.metadata));
  if (!record) {
    throw new Error("Oversight cycle archive could not be reconstructed after persistence.");
  }

  return {
    archiveId: archive.id,
    record,
  };
}

export async function loadOversightCycleArchive(input: {
  cycleId: string;
}): Promise<{
  id: string;
  record: OversightCycleArchiveRecord;
  internalBrief: OversightBrief | null;
  clientSafeBrief: OversightBrief | null;
  audienceBriefs: Partial<Record<OversightCycleAudience, OversightBrief>>;
  cycleComparison?: OversightCycleComparison | null;
} | null> {
  const row = await prisma.auditEvent.findFirst({
    where: {
      objectType: "OVERSIGHT_CYCLE_ARCHIVE",
      objectId: input.cycleId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      metadata: true,
    },
  });

  if (!row) return null;
  const metadata = asRecord(row.metadata);
  const record = archiveMetadataToRecord(metadata);
  if (!record) return null;

  return {
    id: row.id,
    record,
    internalBrief: (asRecord(metadata.internalBrief) as unknown as OversightBrief) || null,
    clientSafeBrief: (asRecord(metadata.clientSafeBrief) as unknown as OversightBrief) || null,
    audienceBriefs: asRecord(metadata.audienceBriefs) as Partial<Record<OversightCycleAudience, OversightBrief>>,
    cycleComparison: asRecord(metadata.cycleComparison) as OversightCycleComparison,
  };
}

export async function loadPreviousArchivedOversightCycle(input: {
  accountId: string;
  beforePeriodStart: string;
}): Promise<{
  id: string;
  record: OversightCycleArchiveRecord;
  clientSafeBrief: OversightBrief | null;
  internalBrief: OversightBrief | null;
} | null> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_CYCLE_ARCHIVE",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      metadata: true,
    },
  });

  const candidates = rows
    .map((row) => {
      const metadata = asRecord(row.metadata);
      const record = archiveMetadataToRecord(metadata);
      if (!record) return null;
      if (record.accountId !== input.accountId) return null;
      if (record.periodStart >= input.beforePeriodStart) return null;
      if (!["APPROVED_FOR_DELIVERY", "CLIENT_VIEW_READY", "DELIVERED"].includes(record.deliveryStatus)) return null;
      return {
        id: row.id,
        record,
        clientSafeBrief: asRecord(metadata.clientSafeBrief) as unknown as OversightBrief,
        internalBrief: asRecord(metadata.internalBrief) as unknown as OversightBrief,
      };
    })
    .filter((item) => item !== null);

  return candidates[0] ?? null;
}

export async function loadPriorArchivedOversightCycles(input: {
  accountId: string;
  beforePeriodStart: string;
  limit?: number;
}): Promise<Array<{
  id: string;
  record: OversightCycleArchiveRecord;
  clientSafeBrief: OversightBrief | null;
  internalBrief: OversightBrief | null;
}>> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_CYCLE_ARCHIVE",
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      metadata: true,
    },
  });

  const candidates = rows
    .map((row): {
      id: string;
      record: OversightCycleArchiveRecord;
      clientSafeBrief: OversightBrief | null;
      internalBrief: OversightBrief | null;
    } | null => {
      const metadata = asRecord(row.metadata);
      const record = archiveMetadataToRecord(metadata);
      if (!record) return null;
      if (record.accountId !== input.accountId) return null;
      if (record.periodStart >= input.beforePeriodStart) return null;
      if (!["APPROVED_FOR_DELIVERY", "CLIENT_VIEW_READY", "DELIVERED"].includes(record.deliveryStatus)) return null;
      return {
        id: row.id,
        record,
        clientSafeBrief: asRecord(metadata.clientSafeBrief) as unknown as OversightBrief,
        internalBrief: asRecord(metadata.internalBrief) as unknown as OversightBrief,
      };
    })
    .filter((item): item is {
      id: string;
      record: OversightCycleArchiveRecord;
      clientSafeBrief: OversightBrief | null;
      internalBrief: OversightBrief | null;
    } => Boolean(item))
    .slice(0, input.limit ?? 6);

  return candidates;
}

export async function updateOversightCycleArchiveDeliveryState(input: {
  cycleId: string;
  deliveryIntent: OversightDeliveryIntent;
  approvedAt?: string | null;
  deliveredAt?: string | null;
}): Promise<void> {
  const archive = await loadOversightCycleArchive({ cycleId: input.cycleId });
  if (!archive) {
    throw new Error("Oversight cycle archive not found.");
  }

  const row = await prisma.auditEvent.findUnique({
    where: { id: archive.id },
    select: { metadata: true },
  });
  if (!row) {
    throw new Error("Oversight cycle archive row not found.");
  }

  const metadata = asRecord(row.metadata);
  metadata.deliveryIntent = input.deliveryIntent;
  metadata.approvedAt = input.approvedAt ?? metadata.approvedAt ?? null;
  metadata.deliveredAt = input.deliveredAt ?? metadata.deliveredAt ?? null;
  metadata.deliveryUrl = input.deliveryIntent.state === "CLIENT_VIEW_READY" || input.deliveryIntent.state === "DELIVERED"
    ? `/oversight/brief/${input.cycleId}`
    : null;

  await prisma.auditEvent.update({
    where: { id: archive.id },
    data: {
      actionType: "UPDATED",
      metadata: metadata as never,
    },
  });
}
