import "server-only";

import { prisma } from "@/lib/prisma.server";
import type { EfficacyCommand } from "@/lib/product/efficacy-contract";
import {
  classifyCheckpointOutcome,
  type CheckpointRecord,
  type CheckpointStatus,
  type RespondToCheckpointInput,
} from "@/lib/product/checkpoint-scheduler-contract";

/**
 * Persist a checkpoint when an efficacy command is generated.
 * Uses DiagnosticRecord with diagnosticType "efficacy_checkpoint".
 */
export async function createCheckpointForCommand(input: {
  command: EfficacyCommand;
  userId?: string;
  email?: string;
  caseId?: string;
  journeyId?: string;
}): Promise<{ checkpointId: string } | null> {
  if (!input.command.checkpoint) return null;
  if (!input.email && !input.userId) return null;

  try {
    const record = await prisma.diagnosticRecord.create({
      data: {
        diagnosticType: "efficacy_checkpoint",
        userEmail: input.email?.toLowerCase() ?? null,
        userId: input.userId ?? null,
        status: "draft",
        score: 0,
        severity: "moderate",
        verdict: input.command.title,
        responsesJson: JSON.stringify({
          commandId: input.command.id,
          surface: input.command.surface,
          actionType: input.command.actionType,
          commandTitle: input.command.title,
          verificationQuestion: input.command.checkpoint.verificationQuestion,
          checkpointType: input.command.checkpoint.type,
          requiredResponseType: input.command.checkpoint.requiredResponseType,
          dueAt: input.command.checkpoint.dueAt,
          caseId: input.caseId ?? null,
          journeyId: input.journeyId ?? null,
          escalationIfIgnored: input.command.escalationIfIgnored ?? null,
          createdAt: new Date().toISOString(),
        }),
      },
    });
    return { checkpointId: record.id };
  } catch (error) {
    console.error("[checkpoint-service] create failed:", error);
    return null;
  }
}

/**
 * Load checkpoints that are due or overdue for a user.
 */
export async function loadDueCheckpointsForUser(input: {
  email?: string;
  userId?: string;
}): Promise<CheckpointRecord[]> {
  if (!input.email && !input.userId) return [];

  try {
    const records = await prisma.diagnosticRecord.findMany({
      where: {
        diagnosticType: "efficacy_checkpoint",
        status: { in: ["draft", "completed"] },
        ...(input.email ? { userEmail: input.email.toLowerCase() } : {}),
        ...(input.userId ? { userId: input.userId } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    return records.map((r) => {
      const data = JSON.parse(r.responsesJson || "{}");
      const response = data.response;
      const dueAt = data.dueAt ?? r.createdAt.toISOString();
      const isOverdue = new Date(dueAt).getTime() < Date.now();

      return {
        id: r.id,
        userId: r.userId ?? undefined,
        email: r.userEmail ?? undefined,
        caseId: data.caseId ?? undefined,
        sessionId: data.journeyId ?? undefined,
        surface: data.surface ?? "FAST_DIAGNOSTIC",
        actionType: data.actionType ?? "VERIFY_COMMITMENT",
        checkpointType: data.checkpointType ?? "48_HOUR_ACTION",
        commandTitle: data.commandTitle ?? r.verdict ?? "Checkpoint",
        verificationQuestion: data.verificationQuestion ?? "What happened?",
        requiredResponseType: data.requiredResponseType ?? "STATUS_SELECT",
        dueAt,
        status: (r.status === "completed" ? "RESPONDED" : isOverdue ? "OVERDUE" : "DUE") as CheckpointStatus,
        responseStatus: response?.status ?? undefined,
        respondedAt: response?.respondedAt ?? undefined,
        evidenceNote: response?.evidenceNote ?? undefined,
        blockerDescription: response?.blockerDescription ?? undefined,
        whatChanged: response?.whatChanged ?? undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    }).filter((c) => {
      const due = new Date(c.dueAt).getTime();
      return due <= Date.now() + 3 * 24 * 60 * 60 * 1000; // due within 3 days
    });
  } catch (error) {
    console.error("[checkpoint-service] load failed:", error);
    return [];
  }
}

/**
 * Load checkpoints for a specific case.
 */
export async function loadCheckpointsForCase(caseId: string): Promise<CheckpointRecord[]> {
  try {
    const records = await prisma.diagnosticRecord.findMany({
      where: {
        diagnosticType: "efficacy_checkpoint",
        responsesJson: { contains: caseId },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return records.map((r) => {
      const data = JSON.parse(r.responsesJson || "{}");
      const response = data.response;
      return {
        id: r.id,
        userId: r.userId ?? undefined,
        email: r.userEmail ?? undefined,
        caseId: data.caseId ?? undefined,
        sessionId: data.journeyId ?? undefined,
        surface: data.surface ?? "FAST_DIAGNOSTIC",
        actionType: data.actionType ?? "VERIFY_COMMITMENT",
        checkpointType: data.checkpointType ?? "48_HOUR_ACTION",
        commandTitle: data.commandTitle ?? r.verdict ?? "Checkpoint",
        verificationQuestion: data.verificationQuestion ?? "What happened?",
        requiredResponseType: data.requiredResponseType ?? "STATUS_SELECT",
        dueAt: data.dueAt ?? r.createdAt.toISOString(),
        status: (r.status === "completed" ? "RESPONDED" : new Date(data.dueAt ?? 0).getTime() < Date.now() ? "OVERDUE" : "SCHEDULED") as CheckpointStatus,
        responseStatus: response?.status ?? undefined,
        respondedAt: response?.respondedAt ?? undefined,
        evidenceNote: response?.evidenceNote ?? undefined,
        blockerDescription: response?.blockerDescription ?? undefined,
        whatChanged: response?.whatChanged ?? undefined,
        whatShouldSystemRemember: response?.whatShouldSystemRemember ?? undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("[checkpoint-service] case load failed:", error);
    return [];
  }
}

/**
 * Record a checkpoint response. Returns the outcome classification.
 */
export async function recordCheckpointResponse(input: RespondToCheckpointInput & {
  email?: string;
}): Promise<{ classification: string } | null> {
  try {
    const record = await prisma.diagnosticRecord.findFirst({
      where: {
        id: input.checkpointId,
        diagnosticType: "efficacy_checkpoint",
        ...(input.email ? { userEmail: input.email.toLowerCase() } : {}),
      },
    });

    if (!record) return null;

    const existing = JSON.parse(record.responsesJson || "{}");
    const classification = classifyCheckpointOutcome(input.responseStatus);

    await prisma.diagnosticRecord.update({
      where: { id: record.id },
      data: {
        status: "completed",
        responsesJson: JSON.stringify({
          ...existing,
          response: {
            status: input.responseStatus,
            evidenceNote: input.evidenceNote?.trim().slice(0, 2000) || undefined,
            blockerDescription: input.blockerDescription?.trim().slice(0, 2000) || undefined,
            whatChanged: input.whatChanged?.trim().slice(0, 2000) || undefined,
            whatShouldSystemRemember: input.whatShouldSystemRemember?.trim().slice(0, 2000) || undefined,
            respondedAt: new Date().toISOString(),
            classification,
          },
        }),
      },
    });

    return { classification };
  } catch (error) {
    console.error("[checkpoint-service] respond failed:", error);
    return null;
  }
}
