/**
 * Institutional Case Resolver
 *
 * Institutional cases are persisted as AuditEvent rows with objectType
 * "INSTITUTIONAL_CASE". The domain snapshot lives inside metadata.
 */

import { prisma } from "@/lib/prisma";
import type {
  InstitutionalCase,
  InstitutionalFlags,
  InstitutionalQualificationState,
  InstitutionalEvidencePosture,
  CorridorContinuityResult,
  CorridorSurface,
} from "@/lib/product/institutional-case-contract";
import {
  EMPTY_FLAGS,
  deriveEvidencePosture,
  deriveQualificationState,
} from "@/lib/product/institutional-case-contract";

const OBJECT_TYPE = "INSTITUTIONAL_CASE";

type CaseSnapshot = {
  sourceRecordId: string;
  sourceSurface: string;
  subjectUserId: string | null;
  subjectEmail: string;
  organisationId: string | null;
  sponsorUserId: string | null;
  executiveRunId: string | null;
  strategyRoomSessionId: string | null;
  counselCaseId: string | null;
  boardroomDossierId: string | null;
  oversightScopeId: string | null;
  retainedCadenceId: string | null;
  portfolioScopeId: string | null;
  qualificationState: InstitutionalQualificationState;
  evidencePosture: InstitutionalEvidencePosture;
  sourceLabels: string[];
  lastReviewedAt: string | null;
  institutionalFlags: InstitutionalFlags;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type AuditCaseRow = {
  id: string;
  objectId: string;
  metadata: unknown;
  createdAt: Date;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapRowToCase(row: AuditCaseRow): InstitutionalCase {
  const snap = asRecord(row.metadata) as Partial<CaseSnapshot>;
  const flags: InstitutionalFlags = snap.institutionalFlags ?? { ...EMPTY_FLAGS };
  const createdAt = snap.createdAt ?? row.createdAt.toISOString();
  const updatedAt = snap.updatedAt ?? createdAt;
  const subjectEmail = asString(snap.subjectEmail) ?? "unknown";

  return {
    caseId: row.objectId,
    sourceRecordId: snap.sourceRecordId ?? row.objectId,
    sourceSurface: snap.sourceSurface ?? "EXECUTIVE_REPORTING",
    subjectUserId: snap.subjectUserId ?? null,
    subjectEmail,
    organisationId: snap.organisationId ?? null,
    sponsorUserId: snap.sponsorUserId ?? null,
    executiveRunId: snap.executiveRunId ?? null,
    strategyRoomSessionId: snap.strategyRoomSessionId ?? null,
    counselCaseId: snap.counselCaseId ?? null,
    boardroomDossierId: snap.boardroomDossierId ?? null,
    oversightScopeId: snap.oversightScopeId ?? null,
    retainedCadenceId: snap.retainedCadenceId ?? null,
    portfolioScopeId: snap.portfolioScopeId ?? null,
    qualificationState: snap.qualificationState ?? deriveQualificationState(flags, snap.organisationId ?? null),
    evidencePosture: snap.evidencePosture ?? deriveEvidencePosture(flags),
    sourceLabels: snap.sourceLabels ?? [],
    createdAt,
    updatedAt,
    lastReviewedAt: snap.lastReviewedAt ?? null,
    institutionalFlags: flags,
  };
}

async function loadInstitutionalCaseRows(limit = 500): Promise<AuditCaseRow[]> {
  const rows = await prisma.auditEvent.findMany({
    where: { objectType: OBJECT_TYPE },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      objectId: true,
      metadata: true,
      createdAt: true,
    },
  });
  return rows as AuditCaseRow[];
}

export async function resolveInstitutionalCase(email: string): Promise<InstitutionalCase | null> {
  const target = email.trim().toLowerCase();
  const rows = await loadInstitutionalCaseRows(500);
  const row = rows.find((item) => asString(asRecord(item.metadata).subjectEmail)?.toLowerCase() === target);
  return row ? mapRowToCase(row) : null;
}

export async function resolveByExecutiveRunId(executiveRunId: string): Promise<InstitutionalCase | null> {
  const rows = await loadInstitutionalCaseRows(500);
  const row = rows.find((item) => asString(asRecord(item.metadata).executiveRunId) === executiveRunId);
  return row ? mapRowToCase(row) : null;
}

export async function resolveByCaseId(caseId: string): Promise<InstitutionalCase | null> {
  const row = await prisma.auditEvent.findFirst({
    where: {
      objectType: OBJECT_TYPE,
      objectId: caseId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      objectId: true,
      metadata: true,
      createdAt: true,
    },
  });
  return row ? mapRowToCase(row as AuditCaseRow) : null;
}

export async function resolveByOrganisation(organisationId: string): Promise<InstitutionalCase[]> {
  const rows = await loadInstitutionalCaseRows(500);
  return rows
    .filter((item) => asString(asRecord(item.metadata).organisationId) === organisationId)
    .map(mapRowToCase);
}

export async function resolveForSponsorScope(sponsorEmail: string): Promise<InstitutionalCase[]> {
  const target = sponsorEmail.trim().toLowerCase();
  const rows = await loadInstitutionalCaseRows(500);
  return rows
    .filter((item) => {
      const meta = asRecord(item.metadata);
      return asString(meta.subjectEmail)?.toLowerCase() === target
        || asString(meta.sponsorUserId) != null;
    })
    .map(mapRowToCase);
}

export function checkCorridorContinuity(
  ic: InstitutionalCase,
  surface: CorridorSurface,
): CorridorContinuityResult {
  return {
    surface,
    caseId: ic.caseId,
    attached: true,
    evidencePosture: ic.evidencePosture,
    qualificationState: ic.qualificationState,
    flags: ic.institutionalFlags,
  };
}
