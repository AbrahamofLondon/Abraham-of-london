/**
 * lib/product/operator-outcome-review.ts
 *
 * Operator (human) review workflow for outcome verification records.
 *
 * An operator review is required when:
 *   - The verification is DISPUTED (user disagrees with diagnosis)
 *   - The verification is BLOCKED (action was blocked — requires context)
 *   - The signal severity was CRITICAL (high-stakes pattern requires human confirmation)
 *   - The evidence posture is INSUFFICIENT_EVIDENCE after action was reported as taken
 *
 * After operator review:
 *   - The verification state advances to OPERATOR_REVIEWED
 *   - The operator's note is recorded in the institutional ledger
 *   - If marked MEMORY_APPROVED, the signal updates comparison basis maturity
 *
 * SERVER_ONLY — never import from client components.
 */

import { prisma } from "@/lib/prisma.server";

// ─── Queue posture (P2) ───────────────────────────────────────────────────────

export type ReviewQueuePosture = {
  pendingCount: number;
  /** Age of the oldest pending review in whole days */
  oldestPendingAge: number;
  criticalPendingCount: number;
  /** Records past the 14-day review SLA */
  overdueReviewCount: number;
  reviewSlaBand: "GREEN" | "AMBER" | "RED" | "CRITICAL";
};

/**
 * Computes the current operator review queue posture.
 * GREEN  — queue healthy, nothing overdue
 * AMBER  — queue growing or at least one record aging
 * RED    — overdue records present or critical items queued
 * CRITICAL — multiple overdue or critical items require immediate attention
 */
export async function getOperatorReviewQueuePosture(): Promise<ReviewQueuePosture> {
  const REVIEW_SLA_DAYS = 14;
  const now = Date.now();

  const records = await prisma.diagnosticRecord.findMany({
    where: {
      diagnosticType: "outcome_verification",
      OR: [{ severity: "high" }, { status: "completed" }],
    },
    orderBy: { createdAt: "asc" },
    select: { severity: true, createdAt: true, responsesJson: true },
  });

  let pendingCount = 0;
  let criticalPendingCount = 0;
  let overdueReviewCount = 0;
  let oldestPendingAge = 0;

  for (const r of records) {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(r.responsesJson ?? "{}") as Record<string, unknown>;
    } catch {
      continue;
    }

    const status = String(payload.status ?? "");
    const classification = String(payload.outcomeClassification ?? "");
    const evidencePosture = String(payload.evidencePosture ?? "");
    const requiresReview =
      status === "DISPUTED" ||
      status === "BLOCKED" ||
      classification === "SYSTEM_FINDING_DISPUTED" ||
      (evidencePosture === "INSUFFICIENT_EVIDENCE" && payload.didAct === "YES");

    if (!requiresReview) continue;

    pendingCount++;
    const ageDays = (now - r.createdAt.getTime()) / 86400000;
    if (ageDays > oldestPendingAge) oldestPendingAge = ageDays;
    if (ageDays > REVIEW_SLA_DAYS) overdueReviewCount++;
    if (r.severity === "high" || r.severity === "critical") criticalPendingCount++;
  }

  const reviewSlaBand: ReviewQueuePosture["reviewSlaBand"] =
    overdueReviewCount > 5 || criticalPendingCount > 3 ? "CRITICAL" :
    overdueReviewCount > 2 || criticalPendingCount > 0 ? "RED" :
    pendingCount > 5 ? "AMBER" : "GREEN";

  return {
    pendingCount,
    oldestPendingAge: Math.round(oldestPendingAge),
    criticalPendingCount,
    overdueReviewCount,
    reviewSlaBand,
  };
}

export type OperatorReviewOutcome =
  | "ACCURACY_CONFIRMED"       // Operator confirms system diagnosis was accurate
  | "ACCURACY_DISPUTED"        // Operator confirms the diagnosis was inaccurate
  | "PATTERN_EXCEPTION"        // Valid exception — does not invalidate the signal
  | "MEMORY_APPROVED"          // Operator approves writing to institutional memory
  | "MEMORY_REJECTED"          // Operator rejects memory update for this record
  | "REQUIRES_FURTHER_REVIEW"; // Escalated — needs senior review

export type OperatorReviewRecord = {
  reviewId: string;
  verificationId: string;
  operatorEmail: string;
  outcome: OperatorReviewOutcome;
  operatorNote: string;
  /** Whether this review approves updating comparison basis maturity */
  memoryApproved: boolean;
  reviewedAt: string;
};

export type OperatorReviewRequest = {
  /** The verificationId from the DiagnosticRecord.responsesJson payload */
  verificationId: string;
  /** The diagnosticRecordId (DiagnosticRecord.id) */
  diagnosticRecordId: string;
  operatorEmail: string;
  outcome: OperatorReviewOutcome;
  operatorNote: string;
  memoryApproved: boolean;
};

export type PendingReviewItem = {
  diagnosticRecordId: string;
  verificationId: string;
  userEmail: string;
  sourceSurface: string | null;
  sourceLabel: string | null;
  outcomeClassification: string;
  status: string;
  evidencePosture: string;
  changedState: string;
  didAct: string;
  systemDiagnosisAccuracy: string;
  whatChanged: string;
  evidenceSummary: string | null;
  rememberNote: string | null;
  createdAt: string;
  /** Pre-computed reason this record requires operator review */
  reviewReason: string;
};

// ─── Queue ────────────────────────────────────────────────────────────────────

/**
 * Returns all verification records pending operator review.
 * A record is pending review when:
 *   - status is DISPUTED or BLOCKED, OR
 *   - outcomeClassification is SYSTEM_FINDING_DISPUTED, OR
 *   - severity is "high" and evidencePosture is INSUFFICIENT_EVIDENCE
 */
export async function getPendingOperatorReviews(options?: {
  limit?: number;
  offset?: number;
}): Promise<PendingReviewItem[]> {
  const records = await prisma.diagnosticRecord.findMany({
    where: {
      diagnosticType: "outcome_verification",
      OR: [
        { severity: "high" },
        { status: "completed" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
    select: {
      id: true,
      userEmail: true,
      createdAt: true,
      responsesJson: true,
    },
  });

  const items: PendingReviewItem[] = [];

  for (const record of records) {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(record.responsesJson ?? "{}") as Record<string, unknown>;
    } catch {
      continue;
    }

    const status = String(payload.status ?? "");
    const classification = String(payload.outcomeClassification ?? "");
    const evidencePosture = String(payload.evidencePosture ?? "");

    const requiresReview =
      status === "DISPUTED" ||
      status === "BLOCKED" ||
      classification === "SYSTEM_FINDING_DISPUTED" ||
      (evidencePosture === "INSUFFICIENT_EVIDENCE" && payload.didAct === "YES");

    if (!requiresReview) continue;

    const reviewReason =
      status === "DISPUTED" || classification === "SYSTEM_FINDING_DISPUTED"
        ? "User disputed the system's diagnosis — operator must confirm or annotate."
        : status === "BLOCKED"
          ? "Action was blocked — operator must document context and determine next step."
          : "Insufficient evidence provided despite reported action — operator must assess.";

    items.push({
      diagnosticRecordId: record.id,
      verificationId: String(payload.verificationId ?? record.id),
      userEmail: record.userEmail ?? "",
      sourceSurface: (payload.sourceSurface as string | null | undefined) ?? null,
      sourceLabel: (payload.sourceLabel as string | null | undefined) ?? null,
      outcomeClassification: classification,
      status,
      evidencePosture,
      changedState: String(payload.changedState ?? ""),
      didAct: String(payload.didAct ?? ""),
      systemDiagnosisAccuracy: String(payload.systemDiagnosisAccuracy ?? ""),
      whatChanged: String(payload.whatChanged ?? ""),
      evidenceSummary: (payload.evidenceSummary as string | null | undefined) ?? null,
      rememberNote: (payload.rememberNote as string | null | undefined) ?? null,
      createdAt: record.createdAt.toISOString(),
      reviewReason,
    });
  }

  return items;
}

// ─── Record Review ────────────────────────────────────────────────────────────

/**
 * Records an operator's review decision for an outcome verification record.
 * Updates the original DiagnosticRecord with the review payload.
 * When memoryApproved, marks the record for comparison basis maturity update.
 */
export async function recordOperatorReview(
  request: OperatorReviewRequest,
): Promise<OperatorReviewRecord> {
  const reviewId = `or_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const reviewedAt = new Date().toISOString();

  const reviewRecord: OperatorReviewRecord = {
    reviewId,
    verificationId: request.verificationId,
    operatorEmail: request.operatorEmail,
    outcome: request.outcome,
    operatorNote: request.operatorNote,
    memoryApproved: request.memoryApproved,
    reviewedAt,
  };

  // Append review to the existing diagnostic record
  const existing = await prisma.diagnosticRecord.findUnique({
    where: { id: request.diagnosticRecordId },
    select: { responsesJson: true },
  });

  if (existing) {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(existing.responsesJson ?? "{}") as Record<string, unknown>;
    } catch {
      // continue with empty payload
    }

    payload.operatorReview = {
      reviewId,
      operatorEmail: request.operatorEmail,
      outcome: request.outcome,
      operatorNote: request.operatorNote,
      memoryApproved: request.memoryApproved,
      reviewedAt,
    };
    payload.status = request.memoryApproved ? "OPERATOR_REVIEWED" : payload.status;
    payload.evidencePosture = request.memoryApproved ? "OPERATOR_REVIEWED" : payload.evidencePosture;

    await prisma.diagnosticRecord.update({
      where: { id: request.diagnosticRecordId },
      data: {
        responsesJson: JSON.stringify(payload),
        severity: request.outcome === "ACCURACY_DISPUTED" ? "high"
          : request.outcome === "PATTERN_EXCEPTION" ? "moderate"
          : undefined,
      },
    });
  }

  // When memory approved + the outcome confirms accuracy, update comparison basis maturity
  if (request.memoryApproved && request.outcome === "ACCURACY_CONFIRMED") {
    await applyVerificationToMemory({
      verificationId: request.verificationId,
      operatorEmail: request.operatorEmail,
      reviewedAt,
    });
  }

  return reviewRecord;
}

// ─── Memory Application ───────────────────────────────────────────────────────

/**
 * Applies a verified outcome to institutional memory.
 * Called after operator review when memory is approved.
 *
 * Currently records to DiagnosticRecord audit trail.
 * Future: will increment ComparisonBasis.sampleSize and maturityLevel
 * when enough verified outcomes accumulate for a given surface.
 */
export async function applyVerificationToMemory(input: {
  verificationId: string;
  operatorEmail: string;
  reviewedAt: string;
}): Promise<void> {
  // Record the memory application event in the diagnostic audit trail
  await prisma.diagnosticRecord.create({
    data: {
      diagnosticType: "memory_application",
      userEmail: input.operatorEmail,
      userId: null,
      status: "completed",
      score: 0,
      severity: "low",
      verdict: `Memory application — verification ${input.verificationId} approved`,
      responsesJson: JSON.stringify({
        event: "MEMORY_UPDATED",
        verificationId: input.verificationId,
        operatorEmail: input.operatorEmail,
        appliedAt: input.reviewedAt,
        memoryTargets: [
          "COMPARISON_BASIS_MATURITY",
          "SIGNAL_RECURRENCE",
          "INSTITUTIONAL_RECORD",
        ],
      }),
    },
  });
}
