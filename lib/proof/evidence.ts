import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";

export type ProofApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ProofDisplayStatus = "HIDDEN" | "PUBLIC";
export type ProofSourceKind = "SELF_REPORTED" | "ADMIN_OBSERVED";

export type ProofEvidenceInput = {
  sourceStage: string;
  proofType: string;
  routeResultType?: string | null;
  accuracyScore?: string | null;
  usefulnessScore?: string | null;
  nextStepChanged?: boolean | null;
  actionIntent?: string | null;
  outcomeCategory?: string | null;
  mostAccuratePart?: string | null;
  paidSpecificity?: string | null;
  consequenceClear?: boolean | null;
  justifiedAction?: boolean | null;
  decisionClarity?: string | null;
  nextMoveClear?: boolean | null;
  freeTextRaw?: string | null;
  anonymisedSummary?: string | null;
  displayLabel?: string | null;
  userType?: string | null;
  organisationType?: string | null;
  sourceOrigin?: string | null;
  isPaidStage?: boolean;
  followupAt?: string | Date | null;
  approvalStatus?: ProofApprovalStatus;
  displayStatus?: ProofDisplayStatus;
  sourceKind?: ProofSourceKind;
  adminNotes?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ProofEvidenceRecord = Required<
  Pick<
    ProofEvidenceInput,
    | "sourceStage"
    | "proofType"
    | "approvalStatus"
    | "displayStatus"
    | "sourceKind"
  >
> &
  Omit<ProofEvidenceInput, "metadata" | "approvalStatus" | "displayStatus" | "sourceKind"> & {
    id: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
  };

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "proof_evidence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceStage" TEXT NOT NULL,
  "proofType" TEXT NOT NULL,
  "routeResultType" TEXT,
  "accuracyScore" TEXT,
  "usefulnessScore" TEXT,
  "nextStepChanged" BOOLEAN,
  "actionIntent" TEXT,
  "outcomeCategory" TEXT,
  "mostAccuratePart" TEXT,
  "paidSpecificity" TEXT,
  "consequenceClear" BOOLEAN,
  "justifiedAction" BOOLEAN,
  "decisionClarity" TEXT,
  "nextMoveClear" BOOLEAN,
  "freeTextRaw" TEXT,
  "anonymisedSummary" TEXT,
  "displayLabel" TEXT,
  "userType" TEXT,
  "organisationType" TEXT,
  "sourceOrigin" TEXT,
  "isPaidStage" BOOLEAN NOT NULL DEFAULT false,
  "followupAt" DATETIME,
  "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "displayStatus" TEXT NOT NULL DEFAULT 'HIDDEN',
  "sourceKind" TEXT NOT NULL DEFAULT 'SELF_REPORTED',
  "adminNotes" TEXT,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

let ensured = false;

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function nullableString(value: unknown, max = 2000): string | null {
  const s = safeString(value);
  if (!s) return null;
  return s.slice(0, max);
}

function boolOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function toIsoDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function parseJson(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function rowDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return safeString(value, new Date().toISOString());
}

function rowBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Boolean(value);
  if (value === null || value === undefined) return null;
  return String(value) === "1" || String(value).toLowerCase() === "true";
}

function mapRow(row: any): ProofEvidenceRecord {
  return {
    id: safeString(row.id),
    sourceStage: safeString(row.sourceStage),
    proofType: safeString(row.proofType),
    routeResultType: row.routeResultType ?? null,
    accuracyScore: row.accuracyScore ?? null,
    usefulnessScore: row.usefulnessScore ?? null,
    nextStepChanged: rowBool(row.nextStepChanged),
    actionIntent: row.actionIntent ?? null,
    outcomeCategory: row.outcomeCategory ?? null,
    mostAccuratePart: row.mostAccuratePart ?? null,
    paidSpecificity: row.paidSpecificity ?? null,
    consequenceClear: rowBool(row.consequenceClear),
    justifiedAction: rowBool(row.justifiedAction),
    decisionClarity: row.decisionClarity ?? null,
    nextMoveClear: rowBool(row.nextMoveClear),
    freeTextRaw: row.freeTextRaw ?? null,
    anonymisedSummary: row.anonymisedSummary ?? null,
    displayLabel: row.displayLabel ?? null,
    userType: row.userType ?? null,
    organisationType: row.organisationType ?? null,
    sourceOrigin: row.sourceOrigin ?? null,
    isPaidStage: Boolean(rowBool(row.isPaidStage)),
    followupAt: row.followupAt ? rowDate(row.followupAt) : null,
    approvalStatus: (row.approvalStatus || "PENDING") as ProofApprovalStatus,
    displayStatus: (row.displayStatus || "HIDDEN") as ProofDisplayStatus,
    sourceKind: (row.sourceKind || "SELF_REPORTED") as ProofSourceKind,
    adminNotes: row.adminNotes ?? null,
    metadata: parseJson(row.metadataJson),
    createdAt: rowDate(row.createdAt),
    updatedAt: rowDate(row.updatedAt),
  };
}

export function anonymiseFreeText(input: string): string {
  return input
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:Ltd|Limited|LLC|Inc|PLC)\b/g, "organisation")
    .replace(/£\s?\d[\d,]*(?:\.\d+)?/g, "material exposure")
    .replace(/\b\d{4,}\b/g, "material number")
    .trim();
}

export function buildDefaultAnonymisedSummary(input: ProofEvidenceInput): string | null {
  if (input.anonymisedSummary) return anonymiseFreeText(input.anonymisedSummary);
  if (input.freeTextRaw) return anonymiseFreeText(input.freeTextRaw).slice(0, 280);

  if (input.outcomeCategory) {
    return `${input.outcomeCategory.replace(/_/g, " ")} observed after ${input.sourceStage}.`;
  }

  if (input.accuracyScore === "precise") {
    return `${input.sourceStage} result reflected the situation precisely.`;
  }

  if (input.usefulnessScore === "yes") {
    return `${input.sourceStage} clarified what was actually wrong.`;
  }

  return null;
}

export async function ensureProofEvidenceTable(): Promise<void> {
  if (ensured) return;
  await prisma.$executeRawUnsafe(TABLE_SQL);
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "proof_evidence_sourceStage_createdAt_idx" ON "proof_evidence"("sourceStage", "createdAt")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "proof_evidence_proofType_createdAt_idx" ON "proof_evidence"("proofType", "createdAt")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "proof_evidence_approvalStatus_displayStatus_idx" ON "proof_evidence"("approvalStatus", "displayStatus")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "proof_evidence_followupAt_idx" ON "proof_evidence"("followupAt")',
  );
  ensured = true;
}

export async function createProofEvidence(input: ProofEvidenceInput): Promise<ProofEvidenceRecord> {
  await ensureProofEvidenceTable();

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const followupAt =
    input.followupAt !== undefined
      ? toIsoDate(input.followupAt)
      : input.proofType === "immediate_accuracy"
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;
  const anonymisedSummary = buildDefaultAnonymisedSummary(input);
  const metadataJson = input.metadata ? JSON.stringify(input.metadata).slice(0, 4000) : null;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "proof_evidence" (
      "id", "sourceStage", "proofType", "routeResultType", "accuracyScore", "usefulnessScore",
      "nextStepChanged", "actionIntent", "outcomeCategory", "mostAccuratePart", "paidSpecificity",
      "consequenceClear", "justifiedAction", "decisionClarity", "nextMoveClear", "freeTextRaw",
      "anonymisedSummary", "displayLabel", "userType", "organisationType", "sourceOrigin",
      "isPaidStage", "followupAt", "approvalStatus", "displayStatus", "sourceKind", "adminNotes",
      "metadataJson", "createdAt", "updatedAt"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    safeString(input.sourceStage, "unknown"),
    safeString(input.proofType, "immediate_accuracy"),
    nullableString(input.routeResultType, 120),
    nullableString(input.accuracyScore, 40),
    nullableString(input.usefulnessScore, 40),
    boolOrNull(input.nextStepChanged),
    nullableString(input.actionIntent, 80),
    nullableString(input.outcomeCategory, 80),
    nullableString(input.mostAccuratePart, 80),
    nullableString(input.paidSpecificity, 40),
    boolOrNull(input.consequenceClear),
    boolOrNull(input.justifiedAction),
    nullableString(input.decisionClarity, 40),
    boolOrNull(input.nextMoveClear),
    nullableString(input.freeTextRaw, 2000),
    anonymisedSummary,
    nullableString(input.displayLabel, 120),
    nullableString(input.userType, 80),
    nullableString(input.organisationType, 120),
    nullableString(input.sourceOrigin, 120),
    Boolean(input.isPaidStage),
    followupAt,
    input.approvalStatus || "PENDING",
    input.displayStatus || "HIDDEN",
    input.sourceKind || "SELF_REPORTED",
    nullableString(input.adminNotes, 2000),
    metadataJson,
    createdAt,
    createdAt,
  );

  const records = await listProofEvidence({ id, limit: 1 });
  const record = records[0];
  if (!record) throw new Error("PROOF_EVIDENCE_INSERT_FAILED");
  return record;
}

export async function listProofEvidence(options: {
  id?: string;
  approvalStatus?: string;
  displayStatus?: string;
  limit?: number;
} = {}): Promise<ProofEvidenceRecord[]> {
  await ensureProofEvidenceTable();
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (options.id) {
    clauses.push('"id" = ?');
    values.push(options.id);
  }
  if (options.approvalStatus) {
    clauses.push('"approvalStatus" = ?');
    values.push(options.approvalStatus);
  }
  if (options.displayStatus) {
    clauses.push('"displayStatus" = ?');
    values.push(options.displayStatus);
  }

  const limit = Math.max(1, Math.min(250, Number(options.limit || 100)));
  values.push(limit);

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "proof_evidence"${clauses.length ? ` WHERE ${clauses.join(" AND ")}` : ""} ORDER BY "createdAt" DESC LIMIT ?`,
    ...values,
  );
  return rows.map(mapRow);
}

export async function updateProofEvidence(
  id: string,
  input: Partial<ProofEvidenceInput>,
): Promise<ProofEvidenceRecord | null> {
  await ensureProofEvidenceTable();

  const allowed: Array<keyof ProofEvidenceInput> = [
    "proofType",
    "outcomeCategory",
    "anonymisedSummary",
    "displayLabel",
    "userType",
    "organisationType",
    "approvalStatus",
    "displayStatus",
    "sourceKind",
    "adminNotes",
  ];

  const sets: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (!(key in input)) continue;
    sets.push(`"${key}" = ?`);
    values.push(key === "anonymisedSummary" ? nullableString(input[key], 280) : input[key] ?? null);
  }

  if (!sets.length) return (await listProofEvidence({ id, limit: 1 }))[0] || null;

  sets.push('"updatedAt" = ?');
  values.push(new Date().toISOString(), id);

  await prisma.$executeRawUnsafe(
    `UPDATE "proof_evidence" SET ${sets.join(", ")} WHERE "id" = ?`,
    ...values,
  );

  return (await listProofEvidence({ id, limit: 1 }))[0] || null;
}

export async function getPublicProofEvidence(): Promise<{
  items: ProofEvidenceRecord[];
  metrics: {
    sampleSize: number;
    precisePct: number | null;
    clarifiedPct: number | null;
    nextStepChangedPct: number | null;
  };
}> {
  const items = await listProofEvidence({
    approvalStatus: "APPROVED",
    displayStatus: "PUBLIC",
    limit: 50,
  });

  const sampleSize = items.length;
  const precise = items.filter((item) => item.accuracyScore === "precise").length;
  const usefulness = items.filter((item) => item.usefulnessScore === "yes").length;
  const nextStep = items.filter((item) => item.nextStepChanged === true).length;

  return {
    items,
    metrics: {
      sampleSize,
      precisePct: sampleSize >= 5 ? Math.round((precise / sampleSize) * 100) : null,
      clarifiedPct: sampleSize >= 5 ? Math.round((usefulness / sampleSize) * 100) : null,
      nextStepChangedPct: sampleSize >= 5 ? Math.round((nextStep / sampleSize) * 100) : null,
    },
  };
}
