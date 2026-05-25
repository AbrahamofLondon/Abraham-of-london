/**
 * lib/client-portal/client-action-log.ts
 *
 * Decision Action Log — tracks findings → actions → outcomes for clients.
 *
 * Lifecycle:
 *   OPEN → IN_PROGRESS → ACTIONED   (resolved)
 *   OPEN → DEFERRED                  (postponed with follow-up date)
 *   OPEN → WONT_ACT                  (conscious decision not to act)
 *
 * Actions are surfaced in the Client Portal so clients can track
 * what the ER / Boardroom Dossier / Diagnostic recommended and
 * whether they acted on it.
 */

import "server-only";

import { prisma } from "@/lib/prisma.server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionStatus = "OPEN" | "IN_PROGRESS" | "ACTIONED" | "DEFERRED" | "WONT_ACT";
export type ActionSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ClientDecisionAction = {
  id: string;
  clientEmail: string;
  dossierId: string | null;
  findingRef: string | null;
  findingTitle: string;
  recommendedAction: string;
  owner: string | null;
  status: ActionStatus;
  dueDate: Date | null;
  actionedAt: Date | null;
  outcomeNote: string | null;
  followUpDate: Date | null;
  severity: ActionSeverity;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateActionInput = {
  clientEmail: string;
  dossierId?: string | null;
  findingRef?: string | null;
  findingTitle: string;
  recommendedAction: string;
  owner?: string | null;
  dueDate?: Date | null;
  severity?: ActionSeverity;
};

export type UpdateActionInput = {
  status?: ActionStatus;
  owner?: string | null;
  dueDate?: Date | null;
  actionedAt?: Date | null;
  outcomeNote?: string | null;
  followUpDate?: Date | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapRow(r: any): ClientDecisionAction {
  return {
    id: r.id,
    clientEmail: r.clientEmail,
    dossierId: r.dossierId,
    findingRef: r.findingRef,
    findingTitle: r.findingTitle,
    recommendedAction: r.recommendedAction,
    owner: r.owner,
    status: r.status as ActionStatus,
    dueDate: r.dueDate,
    actionedAt: r.actionedAt,
    outcomeNote: r.outcomeNote,
    followUpDate: r.followUpDate,
    severity: r.severity as ActionSeverity,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const ClientActionLog = {
  /** Create a new action item for a client. */
  async create(input: CreateActionInput): Promise<ClientDecisionAction> {
    const row = await prisma.clientDecisionAction.create({
      data: {
        clientEmail: input.clientEmail.trim().toLowerCase(),
        dossierId: input.dossierId ?? null,
        findingRef: input.findingRef ?? null,
        findingTitle: input.findingTitle,
        recommendedAction: input.recommendedAction,
        owner: input.owner ?? null,
        dueDate: input.dueDate ?? null,
        severity: input.severity ?? "MEDIUM",
      },
    });
    return mapRow(row);
  },

  /** Update an action item status / outcome. */
  async update(id: string, clientEmail: string, input: UpdateActionInput): Promise<ClientDecisionAction> {
    // Confirm ownership before update
    const existing = await prisma.clientDecisionAction.findFirst({
      where: { id, clientEmail: clientEmail.trim().toLowerCase() },
    });
    if (!existing) throw new Error("Action not found or not owned by this client");

    const data: Record<string, any> = {};
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "ACTIONED" && !existing.actionedAt) {
        data.actionedAt = input.actionedAt ?? new Date();
      }
    }
    if (input.owner !== undefined) data.owner = input.owner;
    if (input.dueDate !== undefined) data.dueDate = input.dueDate;
    if (input.actionedAt !== undefined) data.actionedAt = input.actionedAt;
    if (input.outcomeNote !== undefined) data.outcomeNote = input.outcomeNote;
    if (input.followUpDate !== undefined) data.followUpDate = input.followUpDate;

    const row = await prisma.clientDecisionAction.update({
      where: { id },
      data,
    });
    return mapRow(row);
  },

  /** Get all actions for a client, ordered by severity then due date. */
  async forClient(clientEmail: string): Promise<ClientDecisionAction[]> {
    const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const rows = await prisma.clientDecisionAction.findMany({
      where: { clientEmail: clientEmail.trim().toLowerCase() },
      orderBy: [{ createdAt: "desc" }],
    });
    const sorted = rows.sort((a, b) => {
      const sa = SEVERITY_ORDER[a.severity as ActionSeverity] ?? 9;
      const sb = SEVERITY_ORDER[b.severity as ActionSeverity] ?? 9;
      if (sa !== sb) return sa - sb;
      // Then by due date (nulls last)
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
    return sorted.map(mapRow);
  },

  /** Get actions for a specific dossier. */
  async forDossier(dossierId: string, clientEmail: string): Promise<ClientDecisionAction[]> {
    const rows = await prisma.clientDecisionAction.findMany({
      where: {
        dossierId,
        clientEmail: clientEmail.trim().toLowerCase(),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapRow);
  },

  /** Summary counts: open, in-progress, actioned, deferred. */
  async summary(clientEmail: string): Promise<{
    open: number;
    inProgress: number;
    actioned: number;
    deferred: number;
    wontAct: number;
    total: number;
  }> {
    const groups = await prisma.clientDecisionAction.groupBy({
      by: ["status"],
      where: { clientEmail: clientEmail.trim().toLowerCase() },
      _count: { status: true },
    });

    const counts: Record<string, number> = {};
    for (const g of groups) counts[g.status] = g._count.status;

    const open = counts["OPEN"] ?? 0;
    const inProgress = counts["IN_PROGRESS"] ?? 0;
    const actioned = counts["ACTIONED"] ?? 0;
    const deferred = counts["DEFERRED"] ?? 0;
    const wontAct = counts["WONT_ACT"] ?? 0;

    return {
      open,
      inProgress,
      actioned,
      deferred,
      wontAct,
      total: open + inProgress + actioned + deferred + wontAct,
    };
  },
};
