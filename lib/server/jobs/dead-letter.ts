/* ============================================================================
   FILE: lib/server/jobs/dead-letter.ts
   PURPOSE:
   - Record failed jobs into a DB-backed dead-letter queue
   - Allow replay / resolve / discard workflows
   - Work cleanly in both interim and upgraded infrastructure modes
============================================================================ */

import { prisma } from "@/lib/prisma";

export type DeadLetterPayload = {
  queue: string;
  jobType: string;
  reason: string;
  payload?: Record<string, unknown> | null;
  fingerprint?: string | null;
  source?: string | null;
  actor?: string | null;
  severity?: "low" | "medium" | "high" | "critical";
  retryable?: boolean;
  metadata?: Record<string, unknown> | null;
};

function safeJson(value: unknown): any {
  try {
    return value == null ? null : JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

export async function recordDeadLetter(input: DeadLetterPayload) {
  const severity = input.severity ?? "medium";
  const retryable = input.retryable ?? true;

  return prisma.jobDeadLetter.create({
    data: {
      queue: input.queue,
      jobType: input.jobType,
      reason: input.reason,
      payloadJson: safeJson(input.payload),
      fingerprint: input.fingerprint ?? null,
      source: input.source ?? null,
      actor: input.actor ?? null,
      severity,
      retryable,
      metadataJson: safeJson(input.metadata),
      status: "open",
    },
  });
}

export async function listDeadLetters(options?: {
  status?: "open" | "replayed" | "discarded" | "resolved";
  queue?: string;
  take?: number;
}) {
  return prisma.jobDeadLetter.findMany({
    where: {
      status: options?.status,
      queue: options?.queue,
    },
    orderBy: { createdAt: "desc" },
    take: options?.take ?? 100,
  });
}

export async function markDeadLetterReplayed(id: string, note?: string) {
  return prisma.jobDeadLetter.update({
    where: { id },
    data: {
      status: "replayed",
      replayedAt: new Date(),
      replayNote: note ?? null,
    },
  });
}

export async function markDeadLetterResolved(id: string, note?: string) {
  return prisma.jobDeadLetter.update({
    where: { id },
    data: {
      status: "resolved",
      resolvedAt: new Date(),
      replayNote: note ?? null,
    },
  });
}

export async function markDeadLetterDiscarded(id: string, note?: string) {
  return prisma.jobDeadLetter.update({
    where: { id },
    data: {
      status: "discarded",
      resolvedAt: new Date(),
      replayNote: note ?? null,
    },
  });
}

export async function getDeadLetterById(id: string) {
  return prisma.jobDeadLetter.findUnique({ where: { id } });
}