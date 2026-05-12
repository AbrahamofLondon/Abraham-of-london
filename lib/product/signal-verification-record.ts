/**
 * lib/product/signal-verification-record.ts
 *
 * Creates a durable accountability record after every material signal output.
 *
 * This is separate from the efficacy checkpoint (which tracks the commanded
 * action) — this record tracks the signal finding itself and whether its
 * prediction proved accurate.
 *
 * Called server-side only after:
 *   - Fast Diagnostic result is built
 *   - Decision Instrument result is built
 *   - Executive Reporting result is built
 *   - Strategy Room session is committed
 *   - Oversight Brief is delivered
 *
 * SERVER_ONLY — imports prisma directly.
 */

import "server-only";

import { prisma } from "@/lib/prisma.server";

export type SignalVerificationStatus =
  | "PENDING_VERIFICATION"
  | "VERIFICATION_REQUESTED"
  | "COMPLETED"
  | "DISPUTED"
  | "BLOCKED"
  | "NO_CHANGE"
  | "INSUFFICIENT_EVIDENCE"
  | "OPERATOR_REVIEWED"
  | "MEMORY_UPDATED";

export type SignalVerificationRecord = {
  recordId: string;
  sourceSurface: string;
  sourceId: string;
  originalSignal: string | null;
  originalSeverity: string | null;
  originalScore: number | null;
  comparisonBasis: string | null;
  comparisonMaturityLevel: number | null;
  recommendedMove: string | null;
  verificationDueAt: string;
  verificationStatus: SignalVerificationStatus;
  operatorReviewRequired: boolean;
  userEmail: string | null;
  createdAt: string;
};

export type CreateSignalVerificationInput = {
  sourceSurface: string;
  sourceId: string;
  originalSignal?: string | null;
  originalSeverity?: string | null;
  originalScore?: number | null;
  comparisonBasis?: string | null;
  comparisonMaturityLevel?: number | null;
  recommendedMove?: string | null;
  /** Days until verification is due — defaults to 14 */
  dueDays?: number;
  /** Whether CRITICAL severity requires operator review */
  operatorReviewRequired?: boolean;
  userEmail?: string | null;
};

/**
 * Creates a durable signal verification record after a material output.
 *
 * Returns the recordId for inclusion in the response DTO.
 * Non-fatal — callers must wrap in try/catch.
 */
export async function createSignalVerificationRecord(
  input: CreateSignalVerificationInput,
): Promise<SignalVerificationRecord> {
  const recordId = `svr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const dueDays = input.dueDays ?? 14;
  const verificationDueAt = new Date(Date.now() + dueDays * 86400000).toISOString();

  const operatorReviewRequired = input.operatorReviewRequired ??
    (input.originalSeverity === "CRITICAL" || input.originalSeverity === "ALERT");

  const payload: SignalVerificationRecord = {
    recordId,
    sourceSurface: input.sourceSurface,
    sourceId: input.sourceId,
    originalSignal: input.originalSignal ?? null,
    originalSeverity: input.originalSeverity ?? null,
    originalScore: input.originalScore ?? null,
    comparisonBasis: input.comparisonBasis ?? null,
    comparisonMaturityLevel: input.comparisonMaturityLevel ?? null,
    recommendedMove: input.recommendedMove ?? null,
    verificationDueAt,
    verificationStatus: "PENDING_VERIFICATION",
    operatorReviewRequired,
    userEmail: input.userEmail ?? null,
    createdAt,
  };

  await prisma.diagnosticRecord.create({
    data: {
      diagnosticType: "signal_verification",
      userEmail: input.userEmail ?? "",
      userId: null,
      status: "draft",
      score: input.originalScore ?? 0,
      severity: operatorReviewRequired ? "high" : "moderate",
      verdict: `Signal verification pending — ${input.sourceSurface} / ${input.originalSignal ?? "unnamed signal"}`,
      responsesJson: JSON.stringify(payload),
    },
  });

  return payload;
}

/**
 * Returns pending verification records for a given email.
 * Used by Decision Centre and Oversight to show what needs follow-up.
 */
export async function getPendingSignalVerifications(
  userEmail: string,
  limit = 20,
): Promise<SignalVerificationRecord[]> {
  const records = await prisma.diagnosticRecord.findMany({
    where: {
      diagnosticType: "signal_verification",
      userEmail,
      status: "draft",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, responsesJson: true, createdAt: true },
  });

  const results: SignalVerificationRecord[] = [];
  for (const r of records) {
    try {
      const parsed = JSON.parse(r.responsesJson ?? "{}") as SignalVerificationRecord;
      results.push(parsed);
    } catch {
      // skip malformed
    }
  }
  return results;
}
