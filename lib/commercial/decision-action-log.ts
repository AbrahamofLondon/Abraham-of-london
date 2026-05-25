/**
 * lib/commercial/decision-action-log.ts
 *
 * Decision Action Log — converts ER/Boardroom findings into trackable action items.
 * This is the retention hook. Without it, the product is still mostly a report shop.
 *
 * Every finding becomes an action item with:
 * - severity
 * - recommended action
 * - status: open / in_progress / actioned / deferred
 * - owner
 * - due date
 * - outcome note
 */

import "server-only";

import { prisma } from "@/lib/prisma.server";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";

export type ActionItemStatus = "open" | "in_progress" | "actioned" | "deferred";

export type ActionItemInput = {
  reportId: string;
  clientEmail: string;
  finding: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedAction: string;
  owner?: string;
  dueDate?: string;
};

export type ActionItemRecord = {
  id: string;
  reportId: string;
  clientEmail: string;
  finding: string;
  severity: string;
  recommendedAction: string;
  status: ActionItemStatus;
  owner: string | null;
  dueDate: string | null;
  outcomeNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export const DecisionActionLog = {

  /**
   * Create action items from an Executive Report's failure modes and priority stack.
   */
  async createFromReport(reportId: string, clientEmail: string, report: {
    failureModes: string[];
    priorityStack: string[];
    state: string;
  }): Promise<ActionItemRecord[]> {
    const items: ActionItemRecord[] = [];

    // Create action items from failure modes
    for (const mode of report.failureModes) {
      const item = await this.createItem({
        reportId,
        clientEmail,
        finding: mode,
        severity: report.state === "DISORDERED" ? "CRITICAL" : "HIGH",
        recommendedAction: `Resolve failure mode: ${mode}`,
      });
      items.push(item);
    }

    // Create action items from priority stack
    for (const priority of report.priorityStack) {
      const item = await this.createItem({
        reportId,
        clientEmail,
        finding: priority,
        severity: "MEDIUM",
        recommendedAction: priority,
      });
      items.push(item);
    }

    return items;
  },

  /**
   * Create a single action item.
   */
  async createItem(input: ActionItemInput): Promise<ActionItemRecord> {
    const record = await prisma.decisionActionLog.create({
      data: {
        reportId: input.reportId,
        clientEmail: input.clientEmail,
        finding: input.finding,
        severity: input.severity,
        recommendedAction: input.recommendedAction,
        status: "open",
        owner: input.owner ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
    });

    await routeGovernanceEvent({
      eventType: "FINDING_CREATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "FoundryFinding",
      canonicalRecordId: record.id,
      actorEmail: input.clientEmail,
      severity: input.severity === "CRITICAL" ? "CRITICAL" : input.severity === "HIGH" ? "HIGH" : "MEDIUM",
      payload: { finding: input.finding, recommendedAction: input.recommendedAction },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return this.mapRecord(record);
  },

  /**
   * Update action item status.
   */
  async updateStatus(
    itemId: string,
    status: ActionItemStatus,
    outcomeNote?: string,
    actorEmail?: string,
  ): Promise<ActionItemRecord> {
    const record = await prisma.decisionActionLog.update({
      where: { id: itemId },
      data: {
        status,
        outcomeNote: outcomeNote ?? null,
        updatedAt: new Date(),
      },
    });

    return this.mapRecord(record);
  },

  /**
   * List action items for a client.
   */
  async listByClient(clientEmail: string): Promise<ActionItemRecord[]> {
    const records = await prisma.decisionActionLog.findMany({
      where: { clientEmail },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 50,
    });
    return records.map((r) => this.mapRecord(r));
  },

  /**
   * List action items for a report.
   */
  async listByReport(reportId: string): Promise<ActionItemRecord[]> {
    const records = await prisma.decisionActionLog.findMany({
      where: { reportId },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });
    return records.map((r) => this.mapRecord(r));
  },

  mapRecord(record: any): ActionItemRecord {
    return {
      id: record.id,
      reportId: record.reportId,
      clientEmail: record.clientEmail,
      finding: record.finding,
      severity: record.severity,
      recommendedAction: record.recommendedAction,
      status: record.status,
      owner: record.owner ?? null,
      dueDate: record.dueDate?.toISOString() ?? null,
      outcomeNote: record.outcomeNote ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },
};
