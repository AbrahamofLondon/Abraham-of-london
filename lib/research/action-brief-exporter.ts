/**
 * lib/research/action-brief-exporter.ts
 *
 * Produces immutable ActionBrief records with SHA-256 content hash.
 * Once exported, the briefJson is stored and the hash allows integrity verification.
 * A brief's hash can be compared at action time to detect tampering.
 */

import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";
import { FoundryNotFoundError } from "./errors";
import type { ActionBrief, Finding } from "./foundry-contract";

function parseSafe<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

export type StoredActionBrief = {
  id: string;
  researchRunId: string;
  version: number;
  contentHash: string;
  briefJson: string;
  exportedById: string | null;
  exportedByEmail: string | null;
  exportedAt: Date;
};

export type ActionBriefExportResult = {
  stored: StoredActionBrief;
  brief: ActionBrief;
  contentHash: string;
};

export const ActionBriefExporter = {

  async export(
    runId: string,
    actor: { id?: string; email?: string } = {},
  ): Promise<ActionBriefExportResult> {
    const run = await prisma.researchRun.findUnique({ where: { id: runId } });
    if (!run) throw new FoundryNotFoundError(runId);

    const findings = parseSafe<Finding[]>(run.findingsJson, []);
    const blockingIssues = parseSafe<string[]>(run.blockingIssuesJson, []);

    const brief: ActionBrief = {
      runId: run.id,
      title: run.title,
      module: run.module,
      severity: run.severity as any,
      status: run.status as any,
      recommendation: run.recommendation ?? null,
      findings,
      blockingIssues,
      estimatedEffort: run.estimatedEffort ?? null,
      deferredReason: run.deferredReason ?? null,
      decisionOutcome: run.decisionOutcome ?? null,
      exportedAt: new Date().toISOString(),
    };

    const briefJson = JSON.stringify(brief, null, 2);
    const contentHash = sha256(briefJson);

    // Determine next version number
    const latestBrief = await prisma.actionBrief.findFirst({
      where: { researchRunId: runId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const version = (latestBrief?.version ?? 0) + 1;

    const stored = await prisma.actionBrief.create({
      data: {
        researchRunId: runId,
        version,
        contentHash,
        briefJson,
        exportedById: actor.id ?? null,
        exportedByEmail: actor.email ?? null,
      },
    });

    return {
      stored: stored as unknown as StoredActionBrief,
      brief,
      contentHash,
    };
  },

  async verify(briefId: string): Promise<{ valid: boolean; expected: string; actual: string }> {
    const stored = await prisma.actionBrief.findUnique({ where: { id: briefId } });
    if (!stored) throw new Error(`ActionBrief not found: ${briefId}`);

    const actual = sha256(stored.briefJson);
    return {
      valid: actual === stored.contentHash,
      expected: stored.contentHash,
      actual,
    };
  },

  async listByRunId(runId: string): Promise<StoredActionBrief[]> {
    const rows = await prisma.actionBrief.findMany({
      where: { researchRunId: runId },
      orderBy: { version: "desc" },
    });
    return rows as unknown as StoredActionBrief[];
  },
};
