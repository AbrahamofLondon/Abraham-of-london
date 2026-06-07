/**
 * lib/outcomes/outcome-hypothesis.ts
 *
 * Outcome Hypothesis — created at run/order time for every paid product.
 *
 * Declares what success and failure look like BEFORE the decision is made.
 * Links back to the DecisionOutcomeRecord when the Return Brief is submitted.
 *
 * Rules:
 * - Every paid product run creates an OutcomeHypothesis unless explicitly exempted
 * - Hypothesis generates a Return Brief obligation on reviewDate
 * - Return Brief submission closes the hypothesis (sets outcomeRecordId)
 * - Future diagnostics query prior hypotheses/outcomes for pattern intelligence
 */

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma.server";

// ── Types ────────────────────────────────────────────────────────────────────

export type HypothesisStatus =
  | "OPEN"
  | "RETURN_BRIEF_REQUESTED"
  | "CLOSED"
  | "EXEMPTED";

export type OutcomeHypothesisRecord = {
  id: string;
  hypothesisId: string;
  productCode: string;
  sourceRunId: string | null;
  productArtifactId: string | null;
  userId: string | null;
  userEmail: string | null;
  predictedDecisionMove: string;
  expectedObservableChange: string;
  observationWindowDays: number;
  reviewDate: Date;
  successIndicators: string[];
  failureIndicators: string[];
  ownerRole: string | null;
  returnBriefDueAt: Date | null;
  status: HypothesisStatus;
  outcomeRecordId: string | null;
  exemptionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateHypothesisInput = {
  productCode: string;
  sourceRunId?: string | null;
  productArtifactId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  predictedDecisionMove: string;
  expectedObservableChange: string;
  observationWindowDays?: number;
  successIndicators?: string[];
  failureIndicators?: string[];
  ownerRole?: string | null;
};

export type HypothesisSummary = {
  total: number;
  open: number;
  returnBriefRequested: number;
  closed: number;
  exempted: number;
  overdue: number;
  overdueIds: string[];
};

// ── Generators ───────────────────────────────────────────────────────────────

function generateHypothesisId(): string {
  return `HYP-${randomBytes(6).toString("hex").toUpperCase()}`;
}

function generateReturnBriefRequestKey(): string {
  return `RBR-${randomBytes(6).toString("hex").toUpperCase()}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ── Write Operations ─────────────────────────────────────────────────────────

/**
 * Create an outcome hypothesis for a paid product run.
 * Called at run completion time, before artifact is finalised.
 */
export async function createOutcomeHypothesis(
  input: CreateHypothesisInput,
): Promise<OutcomeHypothesisRecord> {
  const observationWindowDays = input.observationWindowDays ?? 90;
  const reviewDate = addDays(new Date(), observationWindowDays);
  const returnBriefDueAt = addDays(reviewDate, 7); // grace period

  const record = await prisma.outcomeHypothesis.create({
    data: {
      hypothesisId: generateHypothesisId(),
      productCode: input.productCode,
      sourceRunId: input.sourceRunId ?? null,
      productArtifactId: input.productArtifactId ?? null,
      userId: input.userId ?? null,
      userEmail: input.userEmail ?? null,
      predictedDecisionMove: input.predictedDecisionMove,
      expectedObservableChange: input.expectedObservableChange,
      observationWindowDays,
      reviewDate,
      successIndicators: (input.successIndicators ?? []) as never,
      failureIndicators: (input.failureIndicators ?? []) as never,
      ownerRole: input.ownerRole ?? null,
      returnBriefDueAt,
      status: "OPEN",
    },
  });

  await prisma.returnBriefRequest.create({
    data: {
      requestKey: generateReturnBriefRequestKey(),
      outcomeHypothesisId: record.hypothesisId,
      productCode: input.productCode,
      sourceEntityType: "OUTCOME_HYPOTHESIS",
      sourceEntityId: record.sourceRunId ?? record.hypothesisId,
      userId: input.userId ?? null,
      userEmail: input.userEmail ?? null,
      dueAt: returnBriefDueAt,
      status: "PENDING",
    },
  });

  return parseHypothesisRecord(record);
}

/**
 * Exempt a product run from the hypothesis requirement.
 * Must state a reason. Recorded for audit.
 */
export async function exemptFromHypothesis(
  hypothesisId: string,
  reason: string,
): Promise<OutcomeHypothesisRecord> {
  const record = await prisma.outcomeHypothesis.update({
    where: { hypothesisId },
    data: { status: "EXEMPTED", exemptionReason: reason },
  });
  return parseHypothesisRecord(record);
}

/**
 * Mark a hypothesis as RETURN_BRIEF_REQUESTED.
 * Triggered automatically when reviewDate passes.
 */
export async function requestReturnBrief(
  hypothesisId: string,
): Promise<OutcomeHypothesisRecord> {
  const record = await prisma.outcomeHypothesis.update({
    where: { hypothesisId },
    data: { status: "RETURN_BRIEF_REQUESTED" },
  });
  return parseHypothesisRecord(record);
}

/**
 * Close a hypothesis when Return Brief is submitted.
 * Links to the DecisionOutcomeRecord.
 */
export async function closeHypothesis(
  hypothesisId: string,
  outcomeRecordId: string,
): Promise<OutcomeHypothesisRecord> {
  const record = await prisma.outcomeHypothesis.update({
    where: { hypothesisId },
    data: { status: "CLOSED", outcomeRecordId },
  });
  return parseHypothesisRecord(record);
}

// ── Read Operations ──────────────────────────────────────────────────────────

export async function getHypothesis(
  hypothesisId: string,
): Promise<OutcomeHypothesisRecord | null> {
  const record = await prisma.outcomeHypothesis.findUnique({
    where: { hypothesisId },
  });
  return record ? parseHypothesisRecord(record) : null;
}

export async function getHypothesesForUser(
  userEmail: string,
  productCode?: string,
): Promise<OutcomeHypothesisRecord[]> {
  const records = await prisma.outcomeHypothesis.findMany({
    where: {
      userEmail,
      ...(productCode ? { productCode } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return records.map(parseHypothesisRecord);
}

export async function getOpenHypothesesForRun(
  sourceRunId: string,
): Promise<OutcomeHypothesisRecord[]> {
  const records = await prisma.outcomeHypothesis.findMany({
    where: { sourceRunId, status: { in: ["OPEN", "RETURN_BRIEF_REQUESTED"] } },
    orderBy: { reviewDate: "asc" },
  });
  return records.map(parseHypothesisRecord);
}

/**
 * Return all hypotheses where reviewDate has passed and status is OPEN.
 * These are overdue for Return Brief submission.
 */
export async function getOverdueHypotheses(): Promise<OutcomeHypothesisRecord[]> {
  const records = await prisma.outcomeHypothesis.findMany({
    where: {
      status: "OPEN",
      reviewDate: { lte: new Date() },
    },
    orderBy: { reviewDate: "asc" },
  });
  return records.map(parseHypothesisRecord);
}

/**
 * Return hypotheses due within the next N days.
 * Used to surface upcoming Return Brief obligations to the user.
 */
export async function getUpcomingHypotheses(
  userEmail: string,
  withinDays = 14,
): Promise<OutcomeHypothesisRecord[]> {
  const cutoff = addDays(new Date(), withinDays);
  const records = await prisma.outcomeHypothesis.findMany({
    where: {
      userEmail,
      status: "OPEN",
      reviewDate: { lte: cutoff },
    },
    orderBy: { reviewDate: "asc" },
  });
  return records.map(parseHypothesisRecord);
}

/**
 * Summary stats for a user's hypothesis history.
 * Used by Decision Centre and Pattern Observer.
 */
export async function getHypothesisSummaryForUser(
  userEmail: string,
): Promise<HypothesisSummary> {
  const all = await prisma.outcomeHypothesis.findMany({
    where: { userEmail },
    select: { hypothesisId: true, status: true, reviewDate: true },
  });

  const now = new Date();
  const overdue = all.filter(
    (h) =>
      h.status === "OPEN" && h.reviewDate <= now,
  );

  return {
    total: all.length,
    open: all.filter((h) => h.status === "OPEN").length,
    returnBriefRequested: all.filter(
      (h) => h.status === "RETURN_BRIEF_REQUESTED",
    ).length,
    closed: all.filter((h) => h.status === "CLOSED").length,
    exempted: all.filter((h) => h.status === "EXEMPTED").length,
    overdue: overdue.length,
    overdueIds: overdue.map((h) => h.hypothesisId),
  };
}

/**
 * Build standard hypothesis templates for each product.
 * Operators use these as starting points and customise per run.
 */
export const HYPOTHESIS_TEMPLATES: Record<
  string,
  Omit<CreateHypothesisInput, "productCode" | "sourceRunId" | "userId" | "userEmail">
> = {
  boardroom_brief: {
    predictedDecisionMove:
      "Decision-maker takes a structured position on the primary exposure identified in the brief",
    expectedObservableChange:
      "A governance decision or policy position is documented and communicated within the review window",
    observationWindowDays: 60,
    successIndicators: [
      "Decision documented in board minutes or equivalent",
      "Owner assigned for primary exposure",
      "Evidence basis acknowledged by decision group",
    ],
    failureIndicators: [
      "No decision taken within review window",
      "Evidence contested without documented counterargument",
      "Decision delegated without ownership",
    ],
    ownerRole: "Board Chair or Executive Sponsor",
  },
  decision_instruments: {
    predictedDecisionMove:
      "Decision-maker addresses the governance gap or authority failure identified by the instrument",
    expectedObservableChange:
      "Observable change in decision process, ownership structure, or evidence base within the review window",
    observationWindowDays: 90,
    successIndicators: [
      "Identified gap closed or assigned to owner",
      "Decision moved forward from stalled state",
      "Evidence base strengthened for the specific gap identified",
    ],
    failureIndicators: [
      "Same gap reappears in next instrument run",
      "Decision remains in holding pattern",
      "Ownership not assigned within 30 days",
    ],
    ownerRole: "Decision Owner",
  },
  strategy_room: {
    predictedDecisionMove:
      "Commitments from the session are executed or documented as blocked within the checkpoint window",
    expectedObservableChange:
      "At least one concrete next step from the session is observable in practice",
    observationWindowDays: 45,
    successIndicators: [
      "Session commitments executed or formally escalated",
      "Checkpoint review conducted",
      "Blockers identified in session addressed or flagged",
    ],
    failureIndicators: [
      "No action taken post-session",
      "Session outputs not communicated to decision group",
      "Commitments not reviewed at checkpoint",
    ],
    ownerRole: "Strategy Room Participant",
  },
  executive_reporting: {
    predictedDecisionMove:
      "Report findings inform a governance decision or policy position within the board cycle",
    expectedObservableChange:
      "Report referenced in board materials or documented in governance log",
    observationWindowDays: 90,
    successIndicators: [
      "Report findings cited in board discussion",
      "Action items from report assigned",
      "Evidence base updated in next cycle",
    ],
    failureIndicators: [
      "Report produced but not referenced in governance cycle",
      "Same risks appear unaddressed in next report",
    ],
    ownerRole: "Executive Sponsor",
  },
  retainer_oversight: {
    predictedDecisionMove:
      "Monthly oversight cycle produces documented intervention or confirmation of governance health",
    expectedObservableChange:
      "OversightReviewCycle completed with drift assessment and client health status updated",
    observationWindowDays: 35,
    successIndicators: [
      "Monthly cycle completed on schedule",
      "Drift score assessed and documented",
      "Client health status updated",
      "Interventions documented if required",
    ],
    failureIndicators: [
      "Cycle overdue by more than 7 days",
      "Drift detected but not documented",
      "Client health status not updated",
    ],
    ownerRole: "Retainer Operator",
  },
};

// ── Parser ───────────────────────────────────────────────────────────────────

function parseHypothesisRecord(record: Record<string, unknown>): OutcomeHypothesisRecord {
  function safeStringArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
    if (typeof value === "string") {
      try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
  }

  return {
    id: record.id as string,
    hypothesisId: record.hypothesisId as string,
    productCode: record.productCode as string,
    sourceRunId: (record.sourceRunId as string | null) ?? null,
    productArtifactId: (record.productArtifactId as string | null) ?? null,
    userId: (record.userId as string | null) ?? null,
    userEmail: (record.userEmail as string | null) ?? null,
    predictedDecisionMove: record.predictedDecisionMove as string,
    expectedObservableChange: record.expectedObservableChange as string,
    observationWindowDays: record.observationWindowDays as number,
    reviewDate: record.reviewDate as Date,
    successIndicators: safeStringArray(record.successIndicators),
    failureIndicators: safeStringArray(record.failureIndicators),
    ownerRole: (record.ownerRole as string | null) ?? null,
    returnBriefDueAt: (record.returnBriefDueAt as Date | null) ?? null,
    status: record.status as HypothesisStatus,
    outcomeRecordId: (record.outcomeRecordId as string | null) ?? null,
    exemptionReason: (record.exemptionReason as string | null) ?? null,
    createdAt: record.createdAt as Date,
    updatedAt: record.updatedAt as Date,
  };
}
