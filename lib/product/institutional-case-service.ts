/**
 * Institutional Case Service
 *
 * Persists institutional corridor state as AuditEvent rows with
 * objectType "INSTITUTIONAL_CASE".
 */

import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import type {
  InstitutionalCase,
  InstitutionalFlags,
  InstitutionalQualificationState,
  InstitutionalEvidencePosture,
  CorridorSurface,
} from "@/lib/product/institutional-case-contract";
import {
  EMPTY_FLAGS,
  deriveEvidencePosture,
  deriveQualificationState,
  QUALIFICATION_RANK,
} from "@/lib/product/institutional-case-contract";
import {
  resolveInstitutionalCase,
  resolveByCaseId,
} from "@/lib/product/institutional-case-resolver";

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
  createdAt: string;
  updatedAt: string;
};

export type CreateFromERInput = {
  email: string;
  userId?: string | null;
  executiveRunId: string;
  organisationId?: string | null;
  sponsorUserId?: string | null;
  sourceLabels?: string[];
  boardroomQualified?: boolean;
  counselWarranted?: boolean;
  oversightEligible?: boolean;
};

export type AttachSurfaceInput = {
  caseId: string;
  surface: CorridorSurface;
  referenceId: string;
};

function caseSummary(caseId: string, qualificationState: InstitutionalQualificationState) {
  return `Institutional case ${caseId} ${qualificationState.toLowerCase().replace(/_/g, " ")}.`;
}

async function findStoredCaseRow(caseId: string) {
  return prisma.auditEvent.findFirst({
    where: {
      objectType: OBJECT_TYPE,
      objectId: caseId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
    },
  });
}

function mergeSnapshot(input: {
  existing: InstitutionalCase | null;
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
  institutionalFlags: InstitutionalFlags;
}): CaseSnapshot {
  const now = new Date().toISOString();
  return {
    sourceRecordId: input.sourceRecordId,
    sourceSurface: input.sourceSurface,
    subjectUserId: input.subjectUserId,
    subjectEmail: input.subjectEmail,
    organisationId: input.organisationId,
    sponsorUserId: input.sponsorUserId,
    executiveRunId: input.executiveRunId,
    strategyRoomSessionId: input.strategyRoomSessionId,
    counselCaseId: input.counselCaseId,
    boardroomDossierId: input.boardroomDossierId,
    oversightScopeId: input.oversightScopeId,
    retainedCadenceId: input.retainedCadenceId,
    portfolioScopeId: input.portfolioScopeId,
    qualificationState: input.qualificationState,
    evidencePosture: input.evidencePosture,
    sourceLabels: input.sourceLabels,
    lastReviewedAt: now,
    institutionalFlags: input.institutionalFlags,
    createdAt: input.existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function createOrUpdateFromER(input: CreateFromERInput): Promise<InstitutionalCase> {
  const existing = await resolveInstitutionalCase(input.email);
  const flags: InstitutionalFlags = existing
    ? { ...existing.institutionalFlags }
    : { ...EMPTY_FLAGS };
  flags.hasExecutiveReport = true;

  const organisationId = input.organisationId ?? existing?.organisationId ?? null;
  const qualificationState = classifyFromER(flags, organisationId, input);
  const evidencePosture = deriveEvidencePosture(flags);
  const caseId = existing?.caseId ?? randomUUID();

  const snapshot = mergeSnapshot({
    existing,
    sourceRecordId: input.executiveRunId,
    sourceSurface: "EXECUTIVE_REPORTING",
    subjectUserId: input.userId ?? existing?.subjectUserId ?? null,
    subjectEmail: input.email,
    organisationId,
    sponsorUserId: input.sponsorUserId ?? existing?.sponsorUserId ?? null,
    executiveRunId: input.executiveRunId,
    strategyRoomSessionId: existing?.strategyRoomSessionId ?? null,
    counselCaseId: existing?.counselCaseId ?? null,
    boardroomDossierId: existing?.boardroomDossierId ?? null,
    oversightScopeId: existing?.oversightScopeId ?? null,
    retainedCadenceId: existing?.retainedCadenceId ?? null,
    portfolioScopeId: existing?.portfolioScopeId ?? null,
    qualificationState,
    evidencePosture,
    sourceLabels: input.sourceLabels ?? existing?.sourceLabels ?? [],
    institutionalFlags: flags,
  });

  const stored = existing ? await findStoredCaseRow(existing.caseId) : null;
  if (stored) {
    await prisma.auditEvent.update({
      where: { id: stored.id },
      data: {
        actionType: "UPDATED",
        summary: caseSummary(caseId, qualificationState),
        metadata: snapshot,
      },
    });
  } else {
    await prisma.auditEvent.create({
      data: {
        actorType: "SYSTEM",
        actorId: input.userId ?? null,
        objectType: OBJECT_TYPE,
        objectId: caseId,
        actionType: "CREATED",
        summary: caseSummary(caseId, qualificationState),
        metadata: snapshot,
      },
    });
  }

  return {
    caseId,
    sourceRecordId: snapshot.sourceRecordId,
    sourceSurface: snapshot.sourceSurface,
    subjectUserId: snapshot.subjectUserId,
    subjectEmail: snapshot.subjectEmail,
    organisationId: snapshot.organisationId,
    sponsorUserId: snapshot.sponsorUserId,
    executiveRunId: snapshot.executiveRunId,
    strategyRoomSessionId: snapshot.strategyRoomSessionId,
    counselCaseId: snapshot.counselCaseId,
    boardroomDossierId: snapshot.boardroomDossierId,
    oversightScopeId: snapshot.oversightScopeId,
    retainedCadenceId: snapshot.retainedCadenceId,
    portfolioScopeId: snapshot.portfolioScopeId,
    qualificationState: snapshot.qualificationState,
    evidencePosture: snapshot.evidencePosture,
    sourceLabels: snapshot.sourceLabels,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
    lastReviewedAt: snapshot.lastReviewedAt,
    institutionalFlags: snapshot.institutionalFlags,
  };
}

export async function attachCorridorSurface(input: AttachSurfaceInput): Promise<InstitutionalCase | null> {
  const ic = await resolveByCaseId(input.caseId);
  if (!ic) return null;

  const flags = { ...ic.institutionalFlags };
  const updates: Partial<Record<string, string>> = {};

  switch (input.surface) {
    case "STRATEGY_ROOM":
      flags.hasStrategyRoomSession = true;
      updates.strategyRoomSessionId = input.referenceId;
      break;
    case "COUNSEL_REVIEW":
      flags.hasCounselCase = true;
      updates.counselCaseId = input.referenceId;
      break;
    case "BOARDROOM":
      flags.hasBoardroomDossier = true;
      updates.boardroomDossierId = input.referenceId;
      break;
    case "OVERSIGHT_COMMAND":
    case "OVERSIGHT_BRIEF":
      flags.hasOversightBrief = true;
      updates.oversightScopeId = input.referenceId;
      break;
    case "PORTFOLIO_MEMORY":
      flags.hasPortfolioMemory = true;
      updates.portfolioScopeId = input.referenceId;
      break;
    case "PROOF_PACK":
    case "DELIVERY":
      flags.hasDeliveryHistory = true;
      break;
    case "SUPPRESSION_LEDGER":
      flags.hasSuppressionLedger = true;
      break;
    case "EXECUTIVE_REPORTING":
      flags.hasExecutiveReport = true;
      updates.executiveRunId = input.referenceId;
      break;
  }

  const qualificationState = deriveQualificationState(flags, ic.organisationId);
  const evidencePosture = deriveEvidencePosture(flags);
  const snapshot = mergeSnapshot({
    existing: ic,
    sourceRecordId: ic.sourceRecordId,
    sourceSurface: ic.sourceSurface,
    subjectUserId: ic.subjectUserId,
    subjectEmail: ic.subjectEmail,
    organisationId: ic.organisationId,
    sponsorUserId: ic.sponsorUserId,
    executiveRunId: updates.executiveRunId ?? ic.executiveRunId,
    strategyRoomSessionId: updates.strategyRoomSessionId ?? ic.strategyRoomSessionId,
    counselCaseId: updates.counselCaseId ?? ic.counselCaseId,
    boardroomDossierId: updates.boardroomDossierId ?? ic.boardroomDossierId,
    oversightScopeId: updates.oversightScopeId ?? ic.oversightScopeId,
    retainedCadenceId: ic.retainedCadenceId,
    portfolioScopeId: updates.portfolioScopeId ?? ic.portfolioScopeId,
    qualificationState,
    evidencePosture,
    sourceLabels: ic.sourceLabels,
    institutionalFlags: flags,
  });

  const stored = await findStoredCaseRow(ic.caseId);
  if (!stored) return null;

  await prisma.auditEvent.update({
    where: { id: stored.id },
    data: {
      actionType: "UPDATED",
      summary: caseSummary(ic.caseId, qualificationState),
      metadata: snapshot,
    },
  });

  return {
    ...ic,
    ...snapshot,
    updatedAt: snapshot.updatedAt,
    lastReviewedAt: snapshot.lastReviewedAt,
    institutionalFlags: flags,
  };
}

export async function markCadenceAttached(caseId: string, cadenceId: string): Promise<void> {
  await attachCorridorSurface({
    caseId,
    surface: "OVERSIGHT_COMMAND",
    referenceId: cadenceId,
  });

  const ic = await resolveByCaseId(caseId);
  if (!ic) return;

  const flags = { ...ic.institutionalFlags, hasCadence: true };
  const qualificationState = deriveQualificationState(flags, ic.organisationId);
  const evidencePosture = deriveEvidencePosture(flags);
  const snapshot = mergeSnapshot({
    existing: ic,
    sourceRecordId: ic.sourceRecordId,
    sourceSurface: ic.sourceSurface,
    subjectUserId: ic.subjectUserId,
    subjectEmail: ic.subjectEmail,
    organisationId: ic.organisationId,
    sponsorUserId: ic.sponsorUserId,
    executiveRunId: ic.executiveRunId,
    strategyRoomSessionId: ic.strategyRoomSessionId,
    counselCaseId: ic.counselCaseId,
    boardroomDossierId: ic.boardroomDossierId,
    oversightScopeId: ic.oversightScopeId,
    retainedCadenceId: cadenceId,
    portfolioScopeId: ic.portfolioScopeId,
    qualificationState,
    evidencePosture,
    sourceLabels: ic.sourceLabels,
    institutionalFlags: flags,
  });

  const stored = await findStoredCaseRow(caseId);
  if (!stored) return;

  await prisma.auditEvent.update({
    where: { id: stored.id },
    data: {
      actionType: "UPDATED",
      summary: caseSummary(caseId, qualificationState),
      metadata: snapshot,
    },
  });
}

export async function markOutcomeHistoryPresent(caseId: string): Promise<void> {
  const ic = await resolveByCaseId(caseId);
  if (!ic) return;

  const flags = { ...ic.institutionalFlags, hasOutcomeHistory: true };
  const qualificationState = deriveQualificationState(flags, ic.organisationId);
  const evidencePosture = deriveEvidencePosture(flags);
  const snapshot = mergeSnapshot({
    existing: ic,
    sourceRecordId: ic.sourceRecordId,
    sourceSurface: ic.sourceSurface,
    subjectUserId: ic.subjectUserId,
    subjectEmail: ic.subjectEmail,
    organisationId: ic.organisationId,
    sponsorUserId: ic.sponsorUserId,
    executiveRunId: ic.executiveRunId,
    strategyRoomSessionId: ic.strategyRoomSessionId,
    counselCaseId: ic.counselCaseId,
    boardroomDossierId: ic.boardroomDossierId,
    oversightScopeId: ic.oversightScopeId,
    retainedCadenceId: ic.retainedCadenceId,
    portfolioScopeId: ic.portfolioScopeId,
    qualificationState,
    evidencePosture,
    sourceLabels: ic.sourceLabels,
    institutionalFlags: flags,
  });

  const stored = await findStoredCaseRow(caseId);
  if (!stored) return;

  await prisma.auditEvent.update({
    where: { id: stored.id },
    data: {
      actionType: "UPDATED",
      summary: caseSummary(caseId, qualificationState),
      metadata: snapshot,
    },
  });
}

export async function listInstitutionalCases(opts?: {
  organisationId?: string;
  email?: string;
  limit?: number;
}): Promise<InstitutionalCase[]> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      objectType: OBJECT_TYPE,
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 200,
    select: {
      objectId: true,
      metadata: true,
    },
  });

  const cases = await Promise.all(rows.map((row) => resolveByCaseId(row.objectId)));
  return cases.filter((item): item is InstitutionalCase => {
    if (!item) return false;
    if (opts?.email && item.subjectEmail !== opts.email) return false;
    if (opts?.organisationId && item.organisationId !== opts.organisationId) return false;
    return true;
  });
}

function classifyFromER(
  flags: InstitutionalFlags,
  organisationId: string | null,
  input: CreateFromERInput,
): InstitutionalQualificationState {
  const baseState = deriveQualificationState(flags, organisationId);

  if (input.oversightEligible && QUALIFICATION_RANK[baseState] < QUALIFICATION_RANK.OVERSIGHT_ELIGIBLE) {
    return "OVERSIGHT_ELIGIBLE";
  }
  if (input.boardroomQualified && QUALIFICATION_RANK[baseState] < QUALIFICATION_RANK.BOARDROOM_ELIGIBLE) {
    return "BOARDROOM_ELIGIBLE";
  }
  return baseState;
}
