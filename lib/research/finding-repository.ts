/**
 * lib/research/finding-repository.ts
 *
 * First-class repository for FoundryFinding records.
 * Replaces JSON blob storage for findings — every finding is a queryable row.
 * A finding without a source is rejected at write time (Law 3).
 */

import "server-only";

import { prisma } from "@/lib/prisma.server";
import { enforceHonestyOnFindingCreate } from "./honesty-enforcer";
import { FoundryHonestyError, FoundryValidationError } from "./errors";
import type { RunSeverity } from "./foundry-contract";

export type CreateFindingInput = {
  researchRunId: string;
  findingType: string;
  severity: RunSeverity;
  title: string;
  description: string;
  source: string; // required — Law 3
  recommendation?: string;
  evidence?: string;
  moduleId?: string;
  isDemo?: boolean;
};

export type FindingRecord = {
  id: string;
  researchRunId: string;
  findingType: string;
  severity: string;
  title: string;
  description: string;
  source: string;
  recommendation: string | null;
  evidence: string | null;
  moduleId: string | null;
  isActioned: boolean;
  actionedAt: Date | null;
  actionedBy: string | null;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function mapFinding(row: Record<string, unknown>): FindingRecord {
  return row as unknown as FindingRecord;
}

export const FindingRepository = {

  async createFinding(input: CreateFindingInput): Promise<FindingRecord> {
    if (!input.source || input.source.trim() === "") {
      throw new FoundryHonestyError(
        "Finding source is required (Law 3 of the Honesty Constitution). Every finding must expose the formula or rule that produced it.",
      );
    }

    // Law 3 via enforcer
    const honesty = enforceHonestyOnFindingCreate({
      id: "new",
      title: input.title,
      description: input.description,
      severity: input.severity,
      source: input.source,
    });
    if (!honesty.ok) {
      throw new FoundryHonestyError(honesty.violations.map((v) => v.message).join("; "));
    }

    const row = await prisma.foundryFinding.create({
      data: {
        researchRunId: input.researchRunId,
        findingType: input.findingType,
        severity: input.severity,
        title: input.title,
        description: input.description,
        source: input.source,
        recommendation: input.recommendation ?? null,
        evidence: input.evidence ?? null,
        moduleId: input.moduleId ?? null,
        isDemo: input.isDemo ?? false,
      },
    });

    return mapFinding(row as any);
  },

  async findByRunId(runId: string): Promise<FindingRecord[]> {
    const rows = await prisma.foundryFinding.findMany({
      where: { researchRunId: runId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => mapFinding(r as any));
  },

  async markActioned(id: string, actionedBy: string): Promise<FindingRecord> {
    if (!actionedBy || actionedBy.trim() === "") {
      throw new FoundryValidationError("actionedBy is required when marking a finding actioned");
    }
    const row = await prisma.foundryFinding.update({
      where: { id },
      data: { isActioned: true, actionedAt: new Date(), actionedBy },
    });
    return mapFinding(row as any);
  },

  async findUnactioned(filters: { moduleId?: string; severity?: RunSeverity } = {}): Promise<FindingRecord[]> {
    const where: Record<string, unknown> = { isActioned: false };
    if (filters.moduleId) where.moduleId = filters.moduleId;
    if (filters.severity) where.severity = filters.severity;

    const rows = await prisma.foundryFinding.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
    });
    return rows.map((r) => mapFinding(r as any));
  },

  async countBySeverity(): Promise<Record<string, number>> {
    const groups = await prisma.foundryFinding.groupBy({
      by: ["severity"],
      where: { isActioned: false },
      _count: { id: true },
    });
    return Object.fromEntries(groups.map((g) => [g.severity, g._count.id]));
  },
};
