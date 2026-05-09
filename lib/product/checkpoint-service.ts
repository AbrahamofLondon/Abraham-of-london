// Server-only module — imported by API routes and server components

import type { DiagnosticRecord } from "@prisma/client";

import { prisma } from "@/lib/prisma.server";
import type { EfficacyCommand } from "@/lib/product/efficacy-contract";
import {
  classifyCheckpointOutcome,
  type CheckpointRecord,
  type CheckpointStatus,
  type RespondToCheckpointInput,
} from "@/lib/product/checkpoint-scheduler-contract";

type CheckpointResponseHistoryEntry = {
  status: string;
  evidenceNote?: string;
  blockerDescription?: string;
  whatChanged?: string;
  whatShouldSystemRemember?: string;
  respondedAt: string;
  classification: string;
};

type CheckpointPayload = {
  checkpointId?: string;
  commandId?: string | null;
  commandFingerprint?: string | null;
  sourceSurface?: string | null;
  sourceLabel?: string | null;
  evidencePosture?: string | null;
  actionType?: string | null;
  commandTitle?: string | null;
  verificationQuestion?: string | null;
  checkpointType?: string | null;
  requiredResponseType?: string | null;
  escalationIfIgnored?: {
    trigger?: string | null;
    consequence?: string | null;
  } | null;
  caseId?: string | null;
  journeyId?: string | null;
  strategyRoomSessionId?: string | null;
  executiveRunId?: string | null;
  userEmail?: string | null;
  userId?: string | null;
  dueAt?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  response?: CheckpointResponseHistoryEntry | null;
  responses?: CheckpointResponseHistoryEntry[];
};

type ResolveCheckpointInput = {
  checkpointId?: string | null;
  strategyRoomSessionId?: string | null;
  caseId?: string | null;
  executiveRunId?: string | null;
  journeyId?: string | null;
  email?: string | null;
  userId?: string | null;
};

type ParsedCheckpointRecord = {
  record: DiagnosticRecord;
  payload: CheckpointPayload;
};

function normalizeEmail(value?: string | null): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : null;
}

function normalizeText(value?: string | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sanitizeCheckpointText(value?: string | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
  return cleaned || undefined;
}

function parsePayload(record: Pick<DiagnosticRecord, "id" | "responsesJson" | "userEmail" | "userId" | "createdAt" | "updatedAt">): CheckpointPayload {
  let parsed: CheckpointPayload = {};
  try {
    parsed = record.responsesJson ? JSON.parse(record.responsesJson) as CheckpointPayload : {};
  } catch {
    parsed = {};
  }
  return {
    ...parsed,
    checkpointId: parsed.checkpointId ?? record.id,
    userEmail: normalizeEmail(parsed.userEmail ?? record.userEmail),
    userId: parsed.userId ?? record.userId ?? null,
    createdAt: parsed.createdAt ?? record.createdAt.toISOString(),
    updatedAt: parsed.updatedAt ?? record.updatedAt.toISOString(),
    responses: Array.isArray(parsed.responses)
      ? parsed.responses
      : parsed.response
        ? [parsed.response]
        : [],
  };
}

function fingerprintDueBucket(dueAt?: string | null): string {
  if (!dueAt) return "no_due_at";
  const date = new Date(dueAt);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "invalid_due_at";
}

function buildCommandFingerprint(input: {
  command: EfficacyCommand;
  caseId?: string | null;
  journeyId?: string | null;
  strategyRoomSessionId?: string | null;
  executiveRunId?: string | null;
}): string {
  return [
    input.command.surface,
    input.command.actionType,
    normalizeText(input.caseId) ?? "-",
    normalizeText(input.strategyRoomSessionId) ?? "-",
    normalizeText(input.executiveRunId) ?? "-",
    normalizeText(input.journeyId) ?? "-",
    input.command.checkpoint?.type ?? "-",
    fingerprintDueBucket(input.command.checkpoint?.dueAt),
  ].join("|");
}

function materializePayload(input: {
  recordId: string;
  command: EfficacyCommand;
  userId?: string | null;
  email?: string | null;
  caseId?: string | null;
  journeyId?: string | null;
  strategyRoomSessionId?: string | null;
  executiveRunId?: string | null;
  existing?: CheckpointPayload | null;
}): CheckpointPayload {
  const existingResponses = input.existing?.responses ?? [];
  const sourceEvidence = input.command.sourceEvidence?.[0];
  return {
    checkpointId: input.recordId,
    commandId: input.command.id,
    commandFingerprint: buildCommandFingerprint({
      command: input.command,
      caseId: input.caseId,
      journeyId: input.journeyId,
      strategyRoomSessionId: input.strategyRoomSessionId,
      executiveRunId: input.executiveRunId,
    }),
    sourceSurface: input.command.surface,
    sourceLabel: sourceEvidence?.label ?? null,
    evidencePosture: sourceEvidence?.posture ?? null,
    actionType: input.command.actionType,
    commandTitle: input.command.title,
    verificationQuestion: input.command.checkpoint?.verificationQuestion ?? null,
    checkpointType: input.command.checkpoint?.type ?? null,
    requiredResponseType: input.command.checkpoint?.requiredResponseType ?? null,
    escalationIfIgnored: input.command.escalationIfIgnored ?? null,
    caseId: normalizeText(input.caseId),
    journeyId: normalizeText(input.journeyId),
    strategyRoomSessionId: normalizeText(input.strategyRoomSessionId),
    executiveRunId: normalizeText(input.executiveRunId),
    userEmail: normalizeEmail(input.email),
    userId: input.userId ?? null,
    dueAt: input.command.checkpoint?.dueAt ?? null,
    status: input.existing?.status ?? "SCHEDULED",
    createdAt: input.existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    response: existingResponses.at(-1) ?? input.existing?.response ?? null,
    responses: existingResponses,
  };
}

async function loadUserCheckpointCandidates(input: {
  email?: string | null;
  userId?: string | null;
}): Promise<ParsedCheckpointRecord[]> {
  const email = normalizeEmail(input.email);
  const userId = normalizeText(input.userId);
  if (!email && !userId) return [];

  const identityFilters = [
    ...(email ? [{ userEmail: email }] : []),
    ...(userId ? [{ userId }] : []),
  ];

  const records = await prisma.diagnosticRecord.findMany({
    where: {
      diagnosticType: "efficacy_checkpoint",
      ...(identityFilters.length > 0 ? { OR: identityFilters } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return records.map((record) => ({
    record,
    payload: parsePayload(record),
  }));
}

function checkpointStatusForRecord(record: ParsedCheckpointRecord): CheckpointStatus {
  const latestResponse = record.payload.responses?.at(-1) ?? record.payload.response;
  if (latestResponse) return "RESPONDED";
  const dueAt = record.payload.dueAt;
  if (!dueAt) return "SCHEDULED";
  return new Date(dueAt).getTime() < Date.now() ? "OVERDUE" : "DUE";
}

function toCheckpointRecord(record: ParsedCheckpointRecord): CheckpointRecord {
  const latestResponse = record.payload.responses?.at(-1) ?? record.payload.response ?? undefined;
  return {
    id: record.record.id,
    userId: record.record.userId ?? undefined,
    email: record.record.userEmail ?? undefined,
    caseId: record.payload.caseId ?? undefined,
    sessionId: record.payload.journeyId ?? undefined,
    journeyId: record.payload.journeyId ?? undefined,
    strategyRoomSessionId: record.payload.strategyRoomSessionId ?? undefined,
    executiveRunId: record.payload.executiveRunId ?? undefined,
    commandId: record.payload.commandId ?? undefined,
    sourceLabel: record.payload.sourceLabel ?? undefined,
    evidencePosture: record.payload.evidencePosture ?? undefined,
    surface: (record.payload.sourceSurface ?? "FAST_DIAGNOSTIC") as CheckpointRecord["surface"],
    actionType: (record.payload.actionType ?? "VERIFY_COMMITMENT") as CheckpointRecord["actionType"],
    checkpointType: (record.payload.checkpointType ?? "48_HOUR_ACTION") as CheckpointRecord["checkpointType"],
    commandTitle: record.payload.commandTitle ?? record.record.verdict ?? "Checkpoint",
    verificationQuestion: record.payload.verificationQuestion ?? "What happened?",
    requiredResponseType: (record.payload.requiredResponseType ?? "STATUS_SELECT") as CheckpointRecord["requiredResponseType"],
    dueAt: record.payload.dueAt ?? record.record.createdAt.toISOString(),
    status: checkpointStatusForRecord(record),
    responseStatus: latestResponse?.status as CheckpointRecord["responseStatus"],
    respondedAt: latestResponse?.respondedAt,
    evidenceNote: latestResponse?.evidenceNote,
    blockerDescription: latestResponse?.blockerDescription,
    whatChanged: latestResponse?.whatChanged,
    whatShouldSystemRemember: latestResponse?.whatShouldSystemRemember,
    createdAt: record.record.createdAt.toISOString(),
    updatedAt: record.record.updatedAt.toISOString(),
  };
}

async function findCheckpointByFingerprint(input: {
  email?: string | null;
  userId?: string | null;
  commandFingerprint: string;
}): Promise<ParsedCheckpointRecord | null> {
  const candidates = await loadUserCheckpointCandidates(input);
  return candidates.find((candidate) => candidate.payload.commandFingerprint === input.commandFingerprint) ?? null;
}

export async function createCheckpointForCommand(input: {
  command: EfficacyCommand;
  userId?: string;
  email?: string;
  caseId?: string;
  journeyId?: string;
  strategyRoomSessionId?: string;
  executiveRunId?: string;
}): Promise<{ checkpointId: string } | null> {
  if (!input.command.checkpoint) return null;
  if (!input.email && !input.userId) return null;

  try {
    const commandFingerprint = buildCommandFingerprint({
      command: input.command,
      caseId: input.caseId,
      journeyId: input.journeyId,
      strategyRoomSessionId: input.strategyRoomSessionId,
      executiveRunId: input.executiveRunId,
    });
    const existing = await findCheckpointByFingerprint({
      email: input.email,
      userId: input.userId,
      commandFingerprint,
    });

    if (existing) {
      const payload = materializePayload({
        recordId: existing.record.id,
        command: input.command,
        userId: input.userId,
        email: input.email,
        caseId: input.caseId,
        journeyId: input.journeyId,
        strategyRoomSessionId: input.strategyRoomSessionId,
        executiveRunId: input.executiveRunId,
        existing: existing.payload,
      });
      await prisma.diagnosticRecord.update({
        where: { id: existing.record.id },
        data: {
          verdict: input.command.title,
          responsesJson: JSON.stringify(payload),
        },
      });
      return { checkpointId: existing.record.id };
    }

    const record = await prisma.diagnosticRecord.create({
      data: {
        diagnosticType: "efficacy_checkpoint",
        userEmail: normalizeEmail(input.email),
        userId: input.userId ?? null,
        status: "draft",
        score: 0,
        severity: "moderate",
        verdict: input.command.title,
        responsesJson: JSON.stringify(
          materializePayload({
            recordId: "__pending__",
            command: input.command,
            userId: input.userId,
            email: input.email,
            caseId: input.caseId,
            journeyId: input.journeyId,
            strategyRoomSessionId: input.strategyRoomSessionId,
            executiveRunId: input.executiveRunId,
          }),
        ),
      },
    });

    const payload = materializePayload({
      recordId: record.id,
      command: input.command,
      userId: input.userId,
      email: input.email,
      caseId: input.caseId,
      journeyId: input.journeyId,
      strategyRoomSessionId: input.strategyRoomSessionId,
      executiveRunId: input.executiveRunId,
    });

    await prisma.diagnosticRecord.update({
      where: { id: record.id },
      data: { responsesJson: JSON.stringify(payload) },
    });

    return { checkpointId: record.id };
  } catch (error) {
    console.error("[checkpoint-service] create failed:", error);
    return null;
  }
}

export async function resolveCheckpointForResponse(input: ResolveCheckpointInput): Promise<ParsedCheckpointRecord | null> {
  const checkpointId = normalizeText(input.checkpointId);
  const email = normalizeEmail(input.email);
  const userId = normalizeText(input.userId);
  const strategyRoomSessionId = normalizeText(input.strategyRoomSessionId);
  const caseId = normalizeText(input.caseId);
  const executiveRunId = normalizeText(input.executiveRunId);
  const journeyId = normalizeText(input.journeyId);

  if (checkpointId) {
    const direct = await prisma.diagnosticRecord.findFirst({
      where: {
        id: checkpointId,
        diagnosticType: "efficacy_checkpoint",
        ...(email ? { userEmail: email } : {}),
        ...(userId ? { userId } : {}),
      },
    });
    if (direct) {
      return { record: direct, payload: parsePayload(direct) };
    }
  }

  const candidates = await loadUserCheckpointCandidates({ email, userId });
  if (candidates.length === 0) {
    if (!checkpointId) return null;
    const legacy = await prisma.diagnosticRecord.findFirst({
      where: {
        diagnosticType: "efficacy_checkpoint",
        ...(email ? { userEmail: email } : {}),
        ...(userId ? { userId } : {}),
        // Legacy compatibility only. This is not the canonical correlation path.
        responsesJson: { contains: checkpointId },
      },
      orderBy: { createdAt: "desc" },
    });
    return legacy ? { record: legacy, payload: parsePayload(legacy) } : null;
  }

  const byStrategyRoom = strategyRoomSessionId
    ? candidates.find((candidate) => candidate.payload.strategyRoomSessionId === strategyRoomSessionId)
    : null;
  if (byStrategyRoom) return byStrategyRoom;

  const byCaseId = caseId
    ? candidates.find((candidate) => candidate.payload.caseId === caseId)
    : null;
  if (byCaseId) return byCaseId;

  const byExecutiveRun = executiveRunId
    ? candidates.find((candidate) => candidate.payload.executiveRunId === executiveRunId)
    : null;
  if (byExecutiveRun) return byExecutiveRun;

  const byJourney = journeyId
    ? candidates.find((candidate) => candidate.payload.journeyId === journeyId)
    : null;
  if (byJourney) return byJourney;

  if (!checkpointId) return null;

  const legacy = await prisma.diagnosticRecord.findFirst({
    where: {
      diagnosticType: "efficacy_checkpoint",
      ...(email ? { userEmail: email } : {}),
      ...(userId ? { userId } : {}),
      // Legacy compatibility only. This remains a deprecated last resort.
      responsesJson: { contains: checkpointId },
    },
    orderBy: { createdAt: "desc" },
  });
  return legacy ? { record: legacy, payload: parsePayload(legacy) } : null;
}

export async function loadDueCheckpointsForUser(input: {
  email?: string;
  userId?: string;
}): Promise<CheckpointRecord[]> {
  if (!input.email && !input.userId) return [];

  try {
    const candidates = await loadUserCheckpointCandidates({
      email: input.email,
      userId: input.userId,
    });

    return candidates
      .map(toCheckpointRecord)
      .filter((checkpoint) => {
        if (checkpoint.status === "RESPONDED") {
          const respondedAt = checkpoint.respondedAt ? new Date(checkpoint.respondedAt).getTime() : 0;
          return respondedAt >= Date.now() - 30 * 24 * 60 * 60 * 1000;
        }
        const due = new Date(checkpoint.dueAt).getTime();
        return due <= Date.now() + 3 * 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => {
        const aTime = a.status === "RESPONDED"
          ? new Date(a.respondedAt ?? a.updatedAt).getTime()
          : new Date(a.dueAt).getTime();
        const bTime = b.status === "RESPONDED"
          ? new Date(b.respondedAt ?? b.updatedAt).getTime()
          : new Date(b.dueAt).getTime();
        return bTime - aTime;
      });
  } catch (error) {
    console.error("[checkpoint-service] load failed:", error);
    return [];
  }
}

export async function loadCheckpointsForCase(caseId: string): Promise<CheckpointRecord[]> {
  try {
    const records = await prisma.diagnosticRecord.findMany({
      where: { diagnosticType: "efficacy_checkpoint" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return records
      .map((record) => ({ record, payload: parsePayload(record) }))
      .filter((record) => record.payload.caseId === caseId)
      .map(toCheckpointRecord);
  } catch (error) {
    console.error("[checkpoint-service] case load failed:", error);
    return [];
  }
}

export async function recordCheckpointResponse(input: RespondToCheckpointInput & {
  email?: string;
  userId?: string;
}): Promise<{ checkpointId: string; classification: string } | null> {
  try {
    const resolved = await resolveCheckpointForResponse({
      checkpointId: input.checkpointId,
      strategyRoomSessionId: input.strategyRoomSessionId,
      caseId: input.caseId,
      executiveRunId: input.executiveRunId,
      journeyId: input.journeyId,
      email: input.email,
      userId: input.userId,
    });

    if (!resolved) return null;

    const classification = classifyCheckpointOutcome(input.responseStatus);
    const response: CheckpointResponseHistoryEntry = {
      status: input.responseStatus,
      evidenceNote: sanitizeCheckpointText(input.evidenceNote),
      blockerDescription: sanitizeCheckpointText(input.blockerDescription),
      whatChanged: sanitizeCheckpointText(input.whatChanged),
      whatShouldSystemRemember: sanitizeCheckpointText(input.whatShouldSystemRemember),
      respondedAt: new Date().toISOString(),
      classification,
    };
    const responses = [...(resolved.payload.responses ?? []), response];
    const payload: CheckpointPayload = {
      ...resolved.payload,
      checkpointId: resolved.record.id,
      response,
      responses,
      status: "RESPONDED",
      updatedAt: response.respondedAt,
    };

    await prisma.diagnosticRecord.update({
      where: { id: resolved.record.id },
      data: {
        status: "completed",
        responsesJson: JSON.stringify(payload),
      },
    });

    return {
      checkpointId: resolved.record.id,
      classification,
    };
  } catch (error) {
    console.error("[checkpoint-service] respond failed:", error);
    return null;
  }
}
