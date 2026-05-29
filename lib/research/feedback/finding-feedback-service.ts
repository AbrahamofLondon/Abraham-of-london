/**
 * lib/research/feedback/finding-feedback-service.ts
 *
 * Durable per-finding disposition service.
 * FindingFeedback is institutional learning — not UI state.
 * Upserted per (runId, findingId) pair.
 *
 * Dispositions:
 *   ACTED     — reviewer changed the copy / code / configuration
 *   DISMISSED — reviewer disagrees with finding or won't change
 *   DEFERRED  — reviewer will address in a future cycle
 */

import "server-only";

import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedbackDisposition = "ACTED" | "DISMISSED" | "DEFERRED";

export type FindingFeedbackRecord = {
  id:          string;
  runId:       string;
  findingId:   string;
  engineId:    string | null;
  moduleId:    string | null;
  disposition: FeedbackDisposition;
  note:        string | null;
  updatedBy:   string | null;
  createdAt:   Date;
  updatedAt:   Date;
};

export type UpsertFeedbackInput = {
  runId:       string;
  findingId:   string;
  disposition: FeedbackDisposition;
  engineId?:   string;
  moduleId?:   string;
  note?:       string;
  updatedBy?:  string;
};

export type FeedbackSummary = {
  total:     number;
  acted:     number;
  dismissed: number;
  deferred:  number;
};

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_DISPOSITIONS: FeedbackDisposition[] = ["ACTED", "DISMISSED", "DEFERRED"];

export function isValidDisposition(v: unknown): v is FeedbackDisposition {
  return typeof v === "string" && (VALID_DISPOSITIONS as string[]).includes(v);
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Upsert a single finding disposition. Idempotent per (runId, findingId).
 */
export async function upsertFeedback(
  input: UpsertFeedbackInput,
): Promise<FindingFeedbackRecord> {
  return prisma.findingFeedback.upsert({
    where:  { runId_findingId: { runId: input.runId, findingId: input.findingId } },
    create: {
      runId:       input.runId,
      findingId:   input.findingId,
      disposition: input.disposition,
      engineId:    input.engineId  ?? null,
      moduleId:    input.moduleId  ?? null,
      note:        input.note      ?? null,
      updatedBy:   input.updatedBy ?? null,
    },
    update: {
      disposition: input.disposition,
      note:        input.note      ?? null,
      updatedBy:   input.updatedBy ?? null,
      updatedAt:   new Date(),
    },
  }) as unknown as FindingFeedbackRecord;
}

/**
 * Get all feedback records for a run.
 */
export async function getFeedbackForRun(
  runId: string,
): Promise<FindingFeedbackRecord[]> {
  return prisma.findingFeedback.findMany({
    where:   { runId },
    orderBy: { updatedAt: "desc" },
  }) as unknown as FindingFeedbackRecord[];
}

/**
 * Delete a single feedback record (clear a disposition).
 * Returns true if deleted, false if not found.
 */
export async function deleteFeedback(
  runId: string,
  findingId: string,
): Promise<boolean> {
  try {
    await prisma.findingFeedback.delete({
      where: { runId_findingId: { runId, findingId } },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Aggregate feedback summary for a run.
 */
export async function getFeedbackSummary(
  runId: string,
): Promise<FeedbackSummary> {
  const rows = await prisma.findingFeedback.groupBy({
    by:    ["disposition"],
    where: { runId },
    _count: { id: true },
  });

  const byDisposition = Object.fromEntries(
    rows.map((r) => [r.disposition, r._count.id]),
  );

  const acted     = byDisposition["ACTED"]     ?? 0;
  const dismissed = byDisposition["DISMISSED"] ?? 0;
  const deferred  = byDisposition["DEFERRED"]  ?? 0;

  return { total: acted + dismissed + deferred, acted, dismissed, deferred };
}

/**
 * Batch upsert — used when importing a snapshot from outputJson on run save.
 */
export async function batchUpsertFeedback(
  runId:    string,
  entries:  Array<Omit<UpsertFeedbackInput, "runId">>,
): Promise<number> {
  let count = 0;
  for (const entry of entries) {
    await upsertFeedback({ ...entry, runId });
    count++;
  }
  return count;
}
