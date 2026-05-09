import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma.server";
import {
  type BuyerVisibleCadencePosture,
  type RetainedCadenceSource,
  type RetainedCadenceState,
  type RetainedReviewCycle,
  RETAINED_CADENCE_PUBLIC_COPY,
} from "@/lib/product/retained-cadence-contract";

type CycleRecord = {
  id: string;
  userId: string | null;
  userEmail: string | null;
  status: string;
  responsesJson: string;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeEmail(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

function parseCycle(row: CycleRecord): RetainedReviewCycle | null {
  try {
    const payload = JSON.parse(row.responsesJson || "{}") as Partial<RetainedReviewCycle>;
    if (typeof payload.cycleId !== "string") return null;
    return {
      cycleId: payload.cycleId,
      accountId: payload.accountId ?? null,
      organisationId: payload.organisationId ?? null,
      sponsorUserId: payload.sponsorUserId ?? row.userId ?? null,
      sponsorEmail: normalizeEmail(payload.sponsorEmail ?? row.userEmail),
      cadenceState: payload.cadenceState ?? "NOT_CONFIGURED",
      cadenceSource: payload.cadenceSource ?? "manual",
      cadenceType: payload.cadenceType ?? "manual",
      scheduledFor: payload.scheduledFor ?? null,
      completedAt: payload.completedAt ?? null,
      skippedAt: payload.skippedAt ?? null,
      skippedReason: payload.skippedReason ?? null,
      escalationReason: payload.escalationReason ?? null,
      operatorId: payload.operatorId ?? null,
      evidencePosture: payload.evidencePosture ?? "OPERATOR_RECORDED",
      createdAt: payload.createdAt ?? row.createdAt.toISOString(),
      updatedAt: payload.updatedAt ?? row.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

function statusForCycle(cycle: RetainedReviewCycle) {
  if (cycle.cadenceState === "COMPLETED") return "completed";
  return "draft";
}

function toIso(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function deriveStateFromDates(cycle: RetainedReviewCycle, now: Date): RetainedCadenceState {
  if (cycle.escalationReason) return "ESCALATED";
  if (cycle.skippedAt) return "SKIPPED_WITH_REASON";
  if (cycle.completedAt) return "COMPLETED";
  if (!cycle.scheduledFor) return "MANUAL_OPERATOR_REVIEW";

  const scheduled = new Date(cycle.scheduledFor);
  if (!Number.isFinite(scheduled.getTime())) return "MANUAL_OPERATOR_REVIEW";
  const diffDays = Math.ceil((scheduled.getTime() - now.getTime()) / 86_400_000);
  if (diffDays < 0) return "OVERDUE";
  if (diffDays <= 3) return "DUE_SOON";
  return "SCHEDULED";
}

async function loadCycleRows(): Promise<CycleRecord[]> {
  return prisma.diagnosticRecord.findMany({
    where: { diagnosticType: "retained_review_cycle" },
    select: {
      id: true,
      userId: true,
      userEmail: true,
      status: true,
      responsesJson: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
}

function matchesScope(cycle: RetainedReviewCycle, input: {
  accountId?: string | null;
  organisationId?: string | null;
  sponsorUserId?: string | null;
  sponsorEmail?: string | null;
}) {
  const email = normalizeEmail(input.sponsorEmail);
  return (
    (!input.accountId || cycle.accountId === input.accountId)
    && (!input.organisationId || cycle.organisationId === input.organisationId)
    && (!input.sponsorUserId || cycle.sponsorUserId === input.sponsorUserId)
    && (!email || normalizeEmail(cycle.sponsorEmail) === email)
  );
}

function scopeKey(cycle: RetainedReviewCycle) {
  return [
    cycle.accountId ?? "",
    cycle.organisationId ?? "",
    cycle.sponsorUserId ?? "",
    normalizeEmail(cycle.sponsorEmail) ?? "",
  ].join("::");
}

function latestScopedCycles(rows: CycleRecord[]) {
  const map = new Map<string, RetainedReviewCycle>();
  for (const row of rows) {
    const cycle = parseCycle(row);
    if (!cycle) continue;
    const key = scopeKey(cycle);
    if (!map.has(key)) {
      map.set(key, cycle);
    }
  }
  return [...map.values()];
}

export function deriveRetainedCadenceState(cycle: RetainedReviewCycle | null | undefined, nowInput?: Date | string): RetainedCadenceState {
  if (!cycle) return "NOT_CONFIGURED";
  const now = nowInput instanceof Date ? nowInput : nowInput ? new Date(nowInput) : new Date();
  return deriveStateFromDates(cycle, now);
}

export function buildBuyerVisibleCadencePosture(cycle: RetainedReviewCycle | null | undefined): BuyerVisibleCadencePosture {
  const state = deriveRetainedCadenceState(cycle);
  const copy = RETAINED_CADENCE_PUBLIC_COPY[state];
  return {
    state,
    label: copy.label,
    explanation: copy.explanation,
    scheduledFor: cycle?.scheduledFor ?? null,
    lastCompletedAt: cycle?.completedAt ?? null,
    skippedAt: cycle?.skippedAt ?? null,
    cadenceSource: cycle?.cadenceSource ?? "manual",
    cadenceType: cycle?.cadenceType ?? "manual",
    evidencePosture: cycle?.evidencePosture ?? "SYSTEM_INFERRED",
    sourceLabel: "Retained Oversight Cadence",
  };
}

export async function createRetainedReviewCycle(input: Partial<RetainedReviewCycle> & {
  accountId?: string | null;
  organisationId?: string | null;
  sponsorUserId?: string | null;
  sponsorEmail?: string | null;
  cadenceType?: RetainedReviewCycle["cadenceType"];
  cadenceSource?: RetainedCadenceSource;
}) {
  const now = new Date().toISOString();
  const cycle: RetainedReviewCycle = {
    cycleId: input.cycleId ?? `rrc_${randomUUID()}`,
    accountId: input.accountId ?? null,
    organisationId: input.organisationId ?? null,
    sponsorUserId: input.sponsorUserId ?? null,
    sponsorEmail: normalizeEmail(input.sponsorEmail),
    cadenceState: input.cadenceState ?? (input.scheduledFor ? "SCHEDULED" : "MANUAL_OPERATOR_REVIEW"),
    cadenceSource: input.cadenceSource ?? "manual",
    cadenceType: input.cadenceType ?? (input.scheduledFor ? "monthly" : "manual"),
    scheduledFor: toIso(input.scheduledFor) ?? null,
    completedAt: toIso(input.completedAt) ?? null,
    skippedAt: toIso(input.skippedAt) ?? null,
    skippedReason: input.skippedReason ?? null,
    escalationReason: input.escalationReason ?? null,
    operatorId: input.operatorId ?? null,
    evidencePosture: input.evidencePosture ?? "OPERATOR_RECORDED",
    createdAt: now,
    updatedAt: now,
  };

  const row = await prisma.diagnosticRecord.create({
    data: {
      diagnosticType: "retained_review_cycle",
      userId: cycle.sponsorUserId ?? null,
      userEmail: cycle.sponsorEmail ?? null,
      status: statusForCycle(cycle),
      score: 0,
      severity: cycle.cadenceState === "OVERDUE" || cycle.cadenceState === "ESCALATED" ? "high" : "moderate",
      verdict: `Retained cadence ${cycle.cadenceState}`,
      responsesJson: JSON.stringify(cycle),
    },
    select: {
      id: true,
      userId: true,
      userEmail: true,
      status: true,
      responsesJson: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return parseCycle(row);
}

export async function loadLatestRetainedReviewCycleForAccount(input: {
  accountId?: string | null;
  organisationId?: string | null;
  sponsorUserId?: string | null;
  sponsorEmail?: string | null;
}) {
  const rows = await loadCycleRows();
  const match = latestScopedCycles(rows)
    .find((cycle) => matchesScope(cycle, input));
  return match ?? null;
}

async function loadCycleById(cycleId: string) {
  const rows = await loadCycleRows();
  const row = rows.find((item) => {
    const parsed = parseCycle(item);
    return parsed?.cycleId === cycleId;
  });
  return row ?? null;
}

async function updateCycle(cycleId: string, updater: (cycle: RetainedReviewCycle) => RetainedReviewCycle) {
  const row = await loadCycleById(cycleId);
  if (!row) return null;
  const parsed = parseCycle(row);
  if (!parsed) return null;
  const next = updater(parsed);
  next.updatedAt = new Date().toISOString();
  const updated = await prisma.diagnosticRecord.update({
    where: { id: row.id },
    data: {
      status: statusForCycle(next),
      severity: next.cadenceState === "OVERDUE" || next.cadenceState === "ESCALATED" ? "high" : "moderate",
      verdict: `Retained cadence ${next.cadenceState}`,
      responsesJson: JSON.stringify(next),
    },
    select: {
      id: true,
      userId: true,
      userEmail: true,
      status: true,
      responsesJson: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return parseCycle(updated);
}

export async function markRetainedReviewCompleted(input: {
  cycleId: string;
  operatorId?: string | null;
}) {
  return updateCycle(input.cycleId, (cycle) => ({
    ...cycle,
    operatorId: input.operatorId ?? cycle.operatorId ?? null,
    completedAt: new Date().toISOString(),
    cadenceState: "COMPLETED",
    escalationReason: null,
  }));
}

export async function markRetainedReviewSkipped(input: {
  cycleId: string;
  operatorId?: string | null;
  skippedReason: string;
}) {
  return updateCycle(input.cycleId, (cycle) => ({
    ...cycle,
    operatorId: input.operatorId ?? cycle.operatorId ?? null,
    skippedAt: new Date().toISOString(),
    skippedReason: input.skippedReason,
    cadenceState: "SKIPPED_WITH_REASON",
  }));
}

export async function escalateRetainedReviewCycle(input: {
  cycleId: string;
  operatorId?: string | null;
  escalationReason: string;
}) {
  return updateCycle(input.cycleId, (cycle) => ({
    ...cycle,
    operatorId: input.operatorId ?? cycle.operatorId ?? null,
    escalationReason: input.escalationReason,
    cadenceState: "ESCALATED",
  }));
}

export async function loadDueRetainedReviewCycles(input?: {
  now?: Date | string;
}) {
  const now = input?.now instanceof Date ? input.now : input?.now ? new Date(input.now) : new Date();
  const rows = await loadCycleRows();
  return latestScopedCycles(rows)
    .map((cycle) => ({ cycle, derivedState: deriveStateFromDates(cycle, now) }))
    .filter((item) => item.derivedState === "DUE_SOON" || item.derivedState === "OVERDUE");
}

export async function loadOverdueRetainedReviewCycles(input?: {
  now?: Date | string;
}) {
  const all = await loadDueRetainedReviewCycles(input);
  return all.filter((item) => item.derivedState === "OVERDUE");
}

export async function buildOperatorCadenceQueue(input?: {
  now?: Date | string;
}) {
  const now = input?.now instanceof Date ? input.now : input?.now ? new Date(input.now) : new Date();
  const rows = await loadCycleRows();
  const parsed = latestScopedCycles(rows)
    .map((cycle) => ({ cycle, derivedState: deriveStateFromDates(cycle, now) }));

  const contracts = await prisma.retainerContract.findMany({
    where: {
      status: { in: ["ACTIVE", "PROSPECT"] },
    },
    select: {
      id: true,
      organisationId: true,
      tier: true,
      status: true,
      organisation: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  }).catch(() => []);

  const queue = parsed.map((item) => {
    const contract = contracts.find((entry) => entry.id === item.cycle.accountId || entry.organisationId === item.cycle.organisationId);
    return {
      cycleId: item.cycle.cycleId,
      accountId: item.cycle.accountId ?? null,
      organisationId: item.cycle.organisationId ?? null,
      organisationLabel: contract?.organisation?.name ?? contract?.organisation?.slug ?? item.cycle.organisationId ?? "Individual scope",
      scheduledFor: item.cycle.scheduledFor ?? null,
      completedAt: item.cycle.completedAt ?? null,
      cadenceState: item.derivedState,
      cadenceSource: item.cycle.cadenceSource,
      skippedReason: item.cycle.skippedReason ?? null,
      escalationReason: item.cycle.escalationReason ?? null,
      evidencePosture: item.cycle.evidencePosture,
      sourceLabel: "Retained Oversight Cadence" as const,
    };
  });

  const notConfigured = contracts
    .filter((contract) => !queue.some((item) => item.accountId === contract.id || item.organisationId === contract.organisationId))
    .map((contract) => ({
      cycleId: null,
      accountId: contract.id,
      organisationId: contract.organisationId ?? null,
      organisationLabel: contract.organisation?.name ?? contract.organisation?.slug ?? contract.organisationId ?? "Retainer account",
      scheduledFor: null,
      completedAt: null,
      cadenceState: "NOT_CONFIGURED" as RetainedCadenceState,
      cadenceSource: "manual" as RetainedCadenceSource,
      skippedReason: null,
      escalationReason: null,
      evidencePosture: "SYSTEM_INFERRED" as const,
      sourceLabel: "Retained Oversight Cadence" as const,
    }));

  const all = [...queue, ...notConfigured];
  return {
    due: all.filter((item) => item.cadenceState === "DUE_SOON"),
    overdue: all.filter((item) => item.cadenceState === "OVERDUE"),
    skipped: all.filter((item) => item.cadenceState === "SKIPPED_WITH_REASON"),
    escalated: all.filter((item) => item.cadenceState === "ESCALATED"),
    notConfigured: all.filter((item) => item.cadenceState === "NOT_CONFIGURED"),
    all,
  };
}
