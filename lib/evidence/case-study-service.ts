/**
 * lib/evidence/case-study-service.ts
 *
 * Governed case study service. All state lives in the database.
 * No in-memory store. No auto-publish. No fake claims.
 *
 * Trust model:
 *   - evidenceStatus and outcomeStatus stored in narrative JSON
 *   - CaseStudyEvidence.sourceType used to link artefacts
 *   - visibilityStatus derived from CaseStudy.status + anonymised
 *   - Consent required for named publication
 *   - Evidence required for any claim beyond METHOD_DEMONSTRATION
 */

import { prisma } from "@/lib/prisma.server";
import { checkPublicationAllowed as _checkPublicationAllowed } from "./case-study-service-contracts";

// Re-export public types and pure logic for consumers
// (PublicationGuardResult intentionally not re-exported here to avoid TS2484 — import it from case-study-service-contracts)
export type {
  EvidenceStatus,
  OutcomeStatus,
  VisibilityStatus,
  CaseStudyNarrative,
  CaseStudyRecord,
} from "./case-study-service-contracts";
export { checkPublicationAllowed } from "./case-study-service-contracts";

// Local imports for internal function signatures
import type { EvidenceStatus, OutcomeStatus, VisibilityStatus, CaseStudyNarrative, CaseStudyRecord } from "./case-study-service-contracts";

// Maps VisibilityStatus to schema fields
function toSchemaStatus(v: VisibilityStatus): { status: string; anonymised: boolean; publicationAllowed: boolean } {
  switch (v) {
    case "DRAFT":              return { status: "DRAFT",     anonymised: true,  publicationAllowed: false };
    case "INTERNAL_REVIEW":    return { status: "REVIEW",    anonymised: true,  publicationAllowed: false };
    case "PUBLIC_ANONYMISED":  return { status: "PUBLISHED", anonymised: true,  publicationAllowed: true  };
    case "PUBLIC_NAMED":       return { status: "PUBLISHED", anonymised: false, publicationAllowed: true  };
    case "PRIVATE_ARCHIVED":   return { status: "REJECTED",  anonymised: true,  publicationAllowed: false };
    case "WITHDRAWN":          return { status: "REVOKED",   anonymised: true,  publicationAllowed: false };
  }
}

function fromSchemaStatus(status: string, anonymised: boolean): VisibilityStatus {
  if (status === "REVOKED")  return "WITHDRAWN";
  if (status === "REJECTED") return "PRIVATE_ARCHIVED";
  if (status === "PUBLISHED" && anonymised) return "PUBLIC_ANONYMISED";
  if (status === "PUBLISHED" && !anonymised) return "PUBLIC_NAMED";
  if (status === "REVIEW")   return "INTERNAL_REVIEW";
  return "DRAFT";
}


export type CreateCaseStudyInput = {
  title: string;
  slug?: string;
  productCode?: string;
  caseType?: string;
  evidenceStatus?: EvidenceStatus;
  outcomeStatus?: OutcomeStatus;
  visibilityStatus?: VisibilityStatus;
  narrative?: Partial<CaseStudyNarrative>;
  evidenceLinks?: Array<{ sourceType: string; sourceId: string; notes?: string }>;
  adminRef?: string;
};

export type UpdateCaseStudyInput = Partial<{
  title: string;
  slug: string;
  visibilityStatus: VisibilityStatus;
  evidenceStatus: EvidenceStatus;
  outcomeStatus: OutcomeStatus;
  narrative: Partial<CaseStudyNarrative>;
  adminNotes: string;
}>;

// ─────────────────────────────────────────────────────────────────────────────
// GUARDS
// ─────────────────────────────────────────────────────────────────────────────

export type PublicationGuardResult =
  | { allowed: true }
  | { allowed: false; reason: string };

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

function buildRecord(cs: any): CaseStudyRecord {
  const narrative = (cs.narrative ?? {}) as CaseStudyNarrative;
  return {
    id: cs.id,
    slug: cs.slug,
    title: cs.title,
    summary: typeof narrative.pressureCondition === "string" ? narrative.pressureCondition : null,
    visibilityStatus: fromSchemaStatus(cs.status, cs.anonymised),
    evidenceStatus: narrative.evidenceStatus ?? "METHOD_DEMONSTRATION",
    outcomeStatus: narrative.outcomeStatus ?? "NOT_MEASURED",
    consentStatus: cs.consentStatus,
    verificationStatus: cs.verificationStatus,
    publicationAllowed: cs.publicationAllowed,
    anonymised: cs.anonymised,
    narrative,
    publishedAt: cs.publishedAt?.toISOString() ?? null,
    createdAt: cs.createdAt.toISOString(),
    updatedAt: cs.updatedAt.toISOString(),
    evidenceLinks: (cs.evidence ?? []).map((e: any) => ({
      id: e.id,
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      verificationStatus: e.verificationStatus,
      notes: e.notes ?? null,
    })),
  };
}

export async function listCaseStudies(opts?: {
  visibility?: VisibilityStatus[];
  productCode?: string;
  publicOnly?: boolean;
}): Promise<CaseStudyRecord[]> {
  const statusFilter = opts?.visibility?.flatMap(v => {
    const s = toSchemaStatus(v);
    return [s.status];
  });

  const rows = await prisma.caseStudy.findMany({
    where: {
      ...(statusFilter ? { status: { in: statusFilter } } : {}),
      ...(opts?.publicOnly ? { publicationAllowed: true, status: "PUBLISHED" } : {}),
    },
    include: { evidence: true },
    orderBy: { createdAt: "desc" },
  });

  const results = rows.map(buildRecord);

  if (opts?.productCode) {
    return results.filter(r => r.narrative.productCode === opts.productCode);
  }

  return results;
}

export async function getCaseStudyBySlug(slug: string): Promise<CaseStudyRecord | null> {
  const cs = await prisma.caseStudy.findUnique({
    where: { slug },
    include: { evidence: true },
  });
  if (!cs) return null;
  return buildRecord(cs);
}

export async function getCaseStudyById(id: string): Promise<CaseStudyRecord | null> {
  const cs = await prisma.caseStudy.findUnique({
    where: { id },
    include: { evidence: true },
  });
  if (!cs) return null;
  return buildRecord(cs);
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export async function createCaseStudy(input: CreateCaseStudyInput): Promise<CaseStudyRecord> {
  const visibility = input.visibilityStatus ?? "DRAFT";
  const schemaFields = toSchemaStatus(visibility);
  const narrative: CaseStudyNarrative = {
    productCode: input.productCode,
    caseType: input.caseType,
    evidenceStatus: input.evidenceStatus ?? "METHOD_DEMONSTRATION",
    outcomeStatus: input.outcomeStatus ?? "NOT_MEASURED",
    adminNotes: input.narrative?.adminNotes,
    ...input.narrative,
  };

  const cs = await prisma.caseStudy.create({
    data: {
      title: input.title,
      slug: input.slug ?? null,
      status: schemaFields.status,
      anonymised: schemaFields.anonymised,
      publicationAllowed: schemaFields.publicationAllowed,
      verificationStatus: "UNVERIFIED",
      consentStatus: "PENDING",
      narrative: narrative as any,
      adminVerifiedRecordId: input.adminRef ?? null,
    },
    include: { evidence: true },
  });

  if (input.evidenceLinks?.length) {
    await prisma.caseStudyEvidence.createMany({
      data: input.evidenceLinks.map(l => ({
        caseStudyId: cs.id,
        sourceType: l.sourceType,
        sourceId: l.sourceId,
        notes: l.notes ?? null,
        verificationStatus: "PENDING",
      })),
    });
  }

  return buildRecord({ ...cs, evidence: [] });
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateCaseStudy(
  id: string,
  input: UpdateCaseStudyInput,
): Promise<CaseStudyRecord | null> {
  const existing = await prisma.caseStudy.findUnique({
    where: { id },
    include: { evidence: true },
  });
  if (!existing) return null;

  const existingNarrative = (existing.narrative ?? {}) as CaseStudyNarrative;
  const updatedNarrative: CaseStudyNarrative = {
    ...existingNarrative,
    ...(input.evidenceStatus ? { evidenceStatus: input.evidenceStatus } : {}),
    ...(input.outcomeStatus ? { outcomeStatus: input.outcomeStatus } : {}),
    ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
    ...(input.narrative ?? {}),
  };

  const schemaFields = input.visibilityStatus
    ? toSchemaStatus(input.visibilityStatus)
    : null;

  const updated = await prisma.caseStudy.update({
    where: { id },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.slug ? { slug: input.slug } : {}),
      ...(schemaFields ? {
        status: schemaFields.status,
        anonymised: schemaFields.anonymised,
        publicationAllowed: schemaFields.publicationAllowed,
      } : {}),
      narrative: updatedNarrative as any,
      updatedAt: new Date(),
    },
    include: { evidence: true },
  });

  return buildRecord(updated);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLISH / WITHDRAW
// ─────────────────────────────────────────────────────────────────────────────

export async function publishCaseStudy(
  id: string,
  targetVisibility: "PUBLIC_ANONYMISED" | "PUBLIC_NAMED",
  reviewedBy: string,
): Promise<{ ok: true; record: CaseStudyRecord } | { ok: false; reason: string }> {
  const existing = await prisma.caseStudy.findUnique({
    where: { id },
    include: { evidence: true },
  });
  if (!existing) return { ok: false, reason: "NOT_FOUND" };

  const narrative = (existing.narrative ?? {}) as CaseStudyNarrative;
  const evidenceStatus = narrative.evidenceStatus ?? "METHOD_DEMONSTRATION";
  const outcomeStatus = narrative.outcomeStatus ?? "NOT_MEASURED";

  const guard = _checkPublicationAllowed(
    evidenceStatus,
    outcomeStatus,
    existing.consentStatus,
    targetVisibility,
    targetVisibility === "PUBLIC_ANONYMISED",
  );
  if (!guard.allowed) return { ok: false, reason: guard.reason };

  const schemaFields = toSchemaStatus(targetVisibility);
  const updated = await prisma.caseStudy.update({
    where: { id },
    data: {
      status: schemaFields.status,
      anonymised: schemaFields.anonymised,
      publicationAllowed: true,
      publishedAt: existing.publishedAt ?? new Date(),
      reviewedBy,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    },
    include: { evidence: true },
  });

  return { ok: true, record: buildRecord(updated) };
}

export async function withdrawCaseStudy(
  id: string,
  adminEmail: string,
): Promise<{ ok: true; record: CaseStudyRecord } | { ok: false; reason: string }> {
  const existing = await prisma.caseStudy.findUnique({ where: { id }, include: { evidence: true } });
  if (!existing) return { ok: false, reason: "NOT_FOUND" };

  const updated = await prisma.caseStudy.update({
    where: { id },
    data: {
      status: "REVOKED",
      publicationAllowed: false,
      updatedAt: new Date(),
    },
    include: { evidence: true },
  });

  await prisma.accessAuditLog.create({
    data: {
      actorType: "ADMIN",
      actorEmail: adminEmail,
      action: "case_study.withdrawn",
      targetType: "case_study",
      targetKey: id,
      success: true,
      reason: "Admin withdrawal",
      metadata: { previousStatus: existing.status },
    },
  }).catch(() => undefined);

  return { ok: true, record: buildRecord(updated) };
}

// ─────────────────────────────────────────────────────────────────────────────
// LINK EVIDENCE
// ─────────────────────────────────────────────────────────────────────────────

export async function linkEvidence(
  caseStudyId: string,
  sourceType: string,
  sourceId: string,
  notes?: string,
): Promise<void> {
  const existing = await prisma.caseStudyEvidence.findFirst({
    where: { caseStudyId, sourceType, sourceId },
    select: { id: true },
  });
  if (existing) return;

  await prisma.caseStudyEvidence.create({
    data: {
      caseStudyId,
      sourceType,
      sourceId,
      notes: notes ?? null,
      verificationStatus: "PENDING",
    },
  });
}
