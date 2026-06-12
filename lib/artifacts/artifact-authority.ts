/**
 * lib/artifacts/artifact-authority.ts
 *
 * The single artifact authority layer for the entire estate.
 *
 * Every paid product output registers a ProductArtifact here before
 * delivery is marked complete. No paid product may bypass this.
 *
 * Rules:
 * - No delivery without artifact record
 * - No silent regeneration (amendment creates new version, links parent)
 * - Artifact hash is displayed where PDF/document exists
 * - User can download artifact where entitled
 * - Admin can inspect full lineage
 */

import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma.server";

// ── Types ────────────────────────────────────────────────────────────────────

export type ProductCode =
  | "boardroom_brief"
  | "decision_instruments"
  | "strategy_room"
  | "executive_reporting"
  | "boardroom_mode"
  | "return_brief"
  | "retainer_oversight"
  | "gmi_board_pack"
  | "enterprise_assessment"
  | "team_assessment"
  | "inner_circle";

export type ArtifactSourceEntityType =
  | "INSTRUMENT_RUN"
  | "BRIEF_ORDER"
  | "STRATEGY_SESSION"
  | "RETAINER_CYCLE"
  | "ER_RUN"
  | "ENTERPRISE_ASSESSMENT"
  | "TEAM_ASSESSMENT"
  | "RETURN_BRIEF"
  | "MANUAL";

export type ArtifactStatus =
  | "GENERATING"
  | "PENDING"
  | "DRAFT"
  | "AWAITING_REVIEW"
  | "READY"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "SUPERSEDED"
  | "REVOKED";

export type ArtifactDeliveryStatus =
  | "PENDING"
  | "AWAITING_REVIEW"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "DOWNLOADED"
  | "EXPIRED"
  | "FAILED";

export type EvidenceRef = {
  sourceId: string;
  sourceType: string;
  label: string;
};

export type ProductArtifactRecord = {
  id: string;
  artifactId: string;
  productCode: string;
  sourceEntityType: string;
  sourceEntityId: string;
  userId: string | null;
  userEmail: string | null;
  organisationId: string | null;
  version: number;
  status: ArtifactStatus;
  inputSnapshotHash: string | null;
  artifactHash: string | null;
  evidenceRefs: EvidenceRef[];
  falsificationRefs: string[];
  outcomeHypothesisId: string | null;
  deliveryStatus: ArtifactDeliveryStatus;
  deliveredAt: Date | null;
  publicSafeSummary: string | null;
  privateNotes: string | null;
  generatedBy: string | null;
  downloadUrl: string | null;
  adminPreviewUrl: string | null;
  customerAccessUrl: string | null;
  manifestId: string | null;
  parentArtifactId: string | null;
  createdAt: Date;
  updatedAt: Date;
  supersededAt: Date | null;
};

export type CreateArtifactInput = {
  productCode: ProductCode;
  sourceEntityType: ArtifactSourceEntityType;
  sourceEntityId: string;
  userId?: string | null;
  userEmail?: string | null;
  organisationId?: string | null;
  inputSnapshot?: object | null;
  evidenceRefs?: EvidenceRef[];
  outcomeHypothesisId?: string | null;
  publicSafeSummary?: string | null;
  privateNotes?: string | null;
  generatedBy?: string | null;
};

export type AmendArtifactInput = {
  parentArtifactId: string;
  reason: string;
  amendedBy?: string | null;
  inputSnapshot?: object | null;
  evidenceRefs?: EvidenceRef[];
  publicSafeSummary?: string | null;
  privateNotes?: string | null;
};

export type FinaliseArtifactInput = {
  artifactId: string;
  artifactContent: string | Buffer;
  downloadUrl?: string | null;
  manifestId?: string | null;
  falsificationRefs?: string[];
  outcomeHypothesisId?: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function generateArtifactId(): string {
  return `ART-${randomBytes(8).toString("hex").toUpperCase()}`;
}

export function hashContent(content: string | Buffer): string {
  return createHash("sha256")
    .update(typeof content === "string" ? content : content)
    .digest("hex");
}

export function hashInputSnapshot(snapshot: object): string {
  return createHash("sha256")
    .update(JSON.stringify(snapshot, Object.keys(snapshot).sort()))
    .digest("hex");
}

// ── Core Operations ──────────────────────────────────────────────────────────

/**
 * Register a new artifact in GENERATING state.
 * Call this at the start of every paid product run, before content is generated.
 */
export async function registerArtifact(
  input: CreateArtifactInput,
): Promise<ProductArtifactRecord> {
  const artifactId = generateArtifactId();
  const inputSnapshotHash = input.inputSnapshot
    ? hashInputSnapshot(input.inputSnapshot)
    : null;

  const record = await prisma.productArtifact.create({
    data: {
      artifactId,
      productCode: input.productCode,
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      userId: input.userId ?? null,
      userEmail: input.userEmail ?? null,
      organisationId: input.organisationId ?? null,
      version: 1,
      status: "GENERATING",
      inputSnapshotHash,
      evidenceRefs: (input.evidenceRefs ?? []) as never,
      outcomeHypothesisId: input.outcomeHypothesisId ?? null,
      publicSafeSummary: input.publicSafeSummary ?? null,
      privateNotes: input.privateNotes ?? null,
      generatedBy: input.generatedBy ?? "system",
      deliveryStatus: "PENDING",
    },
  });

  return parseArtifactRecord(record);
}

/**
 * Finalise an artifact — compute content hash, set READY status.
 * Must be called after content generation completes successfully.
 */
export async function finaliseArtifact(
  input: FinaliseArtifactInput,
): Promise<ProductArtifactRecord> {
  const existing = await prisma.productArtifact.findUnique({
    where: { artifactId: input.artifactId },
  });
  if (!existing) {
    throw new Error(`Artifact not found: ${input.artifactId}`);
  }
  if (existing.status !== "GENERATING") {
    throw new Error(
      `Cannot finalise artifact in state ${existing.status}. Only GENERATING artifacts may be finalised.`,
    );
  }

  const artifactHash = hashContent(input.artifactContent);

  const record = await prisma.productArtifact.update({
    where: { artifactId: input.artifactId },
    data: {
      status: "READY",
      artifactHash,
      downloadUrl: input.downloadUrl ?? null,
      manifestId: input.manifestId ?? null,
      falsificationRefs: (input.falsificationRefs ?? []) as never,
      outcomeHypothesisId:
        input.outcomeHypothesisId ?? existing.outcomeHypothesisId ?? null,
    },
  });

  return parseArtifactRecord(record);
}

/**
 * Mark an artifact as FAILED. Preserves the record for audit.
 */
export async function failArtifact(
  artifactId: string,
  reason: string,
): Promise<ProductArtifactRecord> {
  const record = await prisma.productArtifact.update({
    where: { artifactId },
    data: {
      status: "FAILED",
      privateNotes: reason,
    },
  });
  return parseArtifactRecord(record);
}

/**
 * Mark an artifact as delivered to the customer.
 */
export async function markArtifactDelivered(
  artifactId: string,
): Promise<ProductArtifactRecord> {
  const record = await prisma.productArtifact.update({
    where: { artifactId },
    data: {
      deliveryStatus: "DELIVERED",
      deliveredAt: new Date(),
    },
  });
  return parseArtifactRecord(record);
}

/**
 * Mark an artifact as downloaded by the customer.
 */
export async function markArtifactDownloaded(
  artifactId: string,
): Promise<ProductArtifactRecord> {
  const record = await prisma.productArtifact.update({
    where: { artifactId },
    data: { deliveryStatus: "DOWNLOADED" },
  });
  return parseArtifactRecord(record);
}

/**
 * Amend an artifact. Creates a new version, supersedes the parent.
 * The original is never silently overwritten — lineage is preserved.
 */
export async function amendArtifact(
  input: AmendArtifactInput,
): Promise<ProductArtifactRecord> {
  const parent = await prisma.productArtifact.findUnique({
    where: { artifactId: input.parentArtifactId },
  });
  if (!parent) {
    throw new Error(`Parent artifact not found: ${input.parentArtifactId}`);
  }
  if (parent.status === "REVOKED") {
    throw new Error("Cannot amend a revoked artifact.");
  }

  const inputSnapshotHash = input.inputSnapshot
    ? hashInputSnapshot(input.inputSnapshot)
    : parent.inputSnapshotHash;

  const newArtifactId = generateArtifactId();

  const [newRecord] = await prisma.$transaction([
    prisma.productArtifact.create({
      data: {
        artifactId: newArtifactId,
        productCode: parent.productCode,
        sourceEntityType: parent.sourceEntityType,
        sourceEntityId: parent.sourceEntityId,
        userId: parent.userId,
        userEmail: parent.userEmail,
        organisationId: parent.organisationId,
        version: parent.version + 1,
        status: "GENERATING",
        inputSnapshotHash,
        evidenceRefs: (input.evidenceRefs ?? (Array.isArray(parent.evidenceRefs) ? parent.evidenceRefs : JSON.parse((parent.evidenceRefs as string) || "[]"))) as never,
        publicSafeSummary: input.publicSafeSummary ?? parent.publicSafeSummary,
        privateNotes: input.privateNotes ?? parent.privateNotes,
        generatedBy: parent.generatedBy,
        deliveryStatus: "PENDING",
        parentArtifactId: parent.artifactId,
      },
    }),
    prisma.productArtifact.update({
      where: { artifactId: parent.artifactId },
      data: { status: "SUPERSEDED", supersededAt: new Date() },
    }),
    prisma.productArtifactAmendment.create({
      data: {
        artifactId: parent.id,
        amendedById: newArtifactId,
        reason: input.reason,
        amendedBy: input.amendedBy ?? null,
      },
    }),
  ]);

  return parseArtifactRecord(newRecord);
}

/**
 * Revoke an artifact permanently. Used for compliance/data corrections.
 */
export async function revokeArtifact(
  artifactId: string,
  reason: string,
  revokedBy?: string,
): Promise<ProductArtifactRecord> {
  const record = await prisma.productArtifact.update({
    where: { artifactId },
    data: {
      status: "REVOKED",
      supersededAt: new Date(),
      privateNotes: `REVOKED by ${revokedBy ?? "admin"}: ${reason}`,
    },
  });
  return parseArtifactRecord(record);
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getArtifact(
  artifactId: string,
): Promise<ProductArtifactRecord | null> {
  const record = await prisma.productArtifact.findUnique({
    where: { artifactId },
  });
  return record ? parseArtifactRecord(record) : null;
}

export async function getArtifactsForRun(
  sourceEntityType: ArtifactSourceEntityType,
  sourceEntityId: string,
): Promise<ProductArtifactRecord[]> {
  const records = await prisma.productArtifact.findMany({
    where: { sourceEntityType, sourceEntityId },
    orderBy: { createdAt: "desc" },
  });
  return records.map(parseArtifactRecord);
}

export async function getArtifactsForUser(
  userEmail: string,
  productCode?: ProductCode,
): Promise<ProductArtifactRecord[]> {
  const records = await prisma.productArtifact.findMany({
    where: {
      userEmail,
      ...(productCode ? { productCode } : {}),
      status: { not: "REVOKED" },
    },
    orderBy: { createdAt: "desc" },
  });
  return records.map(parseArtifactRecord);
}

export async function getActiveArtifactForRun(
  sourceEntityType: ArtifactSourceEntityType,
  sourceEntityId: string,
): Promise<ProductArtifactRecord | null> {
  const record = await prisma.productArtifact.findFirst({
    where: {
      sourceEntityType,
      sourceEntityId,
      status: { in: ["GENERATING", "DRAFT", "AWAITING_REVIEW", "READY", "READY_FOR_DELIVERY"] },
    },
    orderBy: { version: "desc" },
  });
  return record ? parseArtifactRecord(record) : null;
}

/**
 * Authority gate: asserts a READY artifact exists for a run before delivery
 * is permitted. Throws if not satisfied.
 */
export async function assertDeliveryAuthorised(
  sourceEntityType: ArtifactSourceEntityType,
  sourceEntityId: string,
): Promise<ProductArtifactRecord> {
  const artifact = await getActiveArtifactForRun(sourceEntityType, sourceEntityId);
  if (!artifact) {
    throw new Error(
      `DELIVERY_BLOCKED: No artifact registered for ${sourceEntityType}/${sourceEntityId}. ` +
        "Register and finalise an artifact before marking delivery complete.",
    );
  }
  if (artifact.status !== "READY" && artifact.status !== "READY_FOR_DELIVERY") {
    throw new Error(
      `DELIVERY_BLOCKED: Artifact ${artifact.artifactId} is in state ${artifact.status}. ` +
        "Only READY or READY_FOR_DELIVERY artifacts may be delivered.",
    );
  }
  return artifact;
}

// ── Admin Queries ────────────────────────────────────────────────────────────

export async function getArtifactLineage(
  artifactId: string,
): Promise<{ current: ProductArtifactRecord; amendments: Array<{ reason: string; amendedBy: string | null; createdAt: Date; amendedById: string }> }> {
  const record = await prisma.productArtifact.findUnique({
    where: { artifactId },
    include: { amendments: true },
  });
  if (!record) throw new Error(`Artifact not found: ${artifactId}`);
  return {
    current: parseArtifactRecord(record),
    amendments: record.amendments.map((a) => ({
      reason: a.reason,
      amendedBy: a.amendedBy,
      createdAt: a.createdAt,
      amendedById: a.amendedById,
    })),
  };
}

export async function getArtifactsPendingDelivery(
  productCode?: ProductCode,
): Promise<ProductArtifactRecord[]> {
  const records = await prisma.productArtifact.findMany({
    where: {
      status: { in: ["READY", "READY_FOR_DELIVERY"] },
      deliveryStatus: { in: ["PENDING", "AWAITING_REVIEW", "READY_FOR_DELIVERY"] },
      ...(productCode ? { productCode } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  return records.map(parseArtifactRecord);
}

// ── Parser ───────────────────────────────────────────────────────────────────

function parseArtifactRecord(record: Record<string, unknown>): ProductArtifactRecord {
  function safeJson<T>(value: unknown, fallback: T): T {
    if (Array.isArray(value)) return value as T;
    if (typeof value === "string") {
      try { return JSON.parse(value) as T; } catch { return fallback; }
    }
    return fallback;
  }

  return {
    id: record.id as string,
    artifactId: record.artifactId as string,
    productCode: record.productCode as string,
    sourceEntityType: record.sourceEntityType as string,
    sourceEntityId: record.sourceEntityId as string,
    userId: (record.userId as string | null) ?? null,
    userEmail: (record.userEmail as string | null) ?? null,
    organisationId: (record.organisationId as string | null) ?? null,
    version: record.version as number,
    status: record.status as ArtifactStatus,
    inputSnapshotHash: (record.inputSnapshotHash as string | null) ?? null,
    artifactHash: (record.artifactHash as string | null) ?? null,
    evidenceRefs: safeJson<EvidenceRef[]>(record.evidenceRefs, []),
    falsificationRefs: safeJson<string[]>(record.falsificationRefs, []),
    outcomeHypothesisId: (record.outcomeHypothesisId as string | null) ?? null,
    deliveryStatus: record.deliveryStatus as ArtifactDeliveryStatus,
    deliveredAt: (record.deliveredAt as Date | null) ?? null,
    publicSafeSummary: (record.publicSafeSummary as string | null) ?? null,
    privateNotes: (record.privateNotes as string | null) ?? null,
    generatedBy: (record.generatedBy as string | null) ?? null,
    downloadUrl: (record.downloadUrl as string | null) ?? null,
    adminPreviewUrl: (record.adminPreviewUrl as string | null) ?? null,
    customerAccessUrl: (record.customerAccessUrl as string | null) ?? null,
    manifestId: (record.manifestId as string | null) ?? null,
    parentArtifactId: (record.parentArtifactId as string | null) ?? null,
    createdAt: record.createdAt as Date,
    updatedAt: record.updatedAt as Date,
    supersededAt: (record.supersededAt as Date | null) ?? null,
  };
}
