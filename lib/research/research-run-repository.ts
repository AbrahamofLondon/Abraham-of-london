/**
 * lib/research/research-run-repository.ts
 *
 * Single access layer for all ResearchRun persistence.
 * No module touches Prisma directly for ResearchRun — all writes go here.
 *
 * Audit events are written atomically with state changes via $transaction.
 * If the audit write fails, the state change rolls back.
 */

import "server-only";

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma.server";
import {
  enforceHonestyOnCreate,
  enforceHonestyOnArchive,
  enforceHonestyOnDefer,
} from "./honesty-enforcer";
import { assertTransitionAllowed } from "./status-state-machine";
import { FoundryHonestyError, FoundryNotFoundError } from "./errors";
import { MODULE_REGISTRY } from "./module-registry";
import type {
  ResearchRun,
  ActionBrief,
  Finding,
  RunStatus,
  UpdateMetadataInput,
} from "./foundry-contract";
import type {
  CreateResearchRunInput,
  ResearchRunFilters,
} from "./research-run-validation";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): ResearchRun {
  return row as unknown as ResearchRun;
}

function parseSafe<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

async function writeAuditEventTx(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  params: {
    runId: string;
    event: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    actorId?: string | null;
    actorEmail?: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await tx.foundryAuditEvent.create({
    data: {
      runId: params.runId,
      event: params.event,
      fromStatus: params.fromStatus ?? null,
      toStatus: params.toStatus ?? null,
      actorId: params.actorId ?? null,
      actorEmail: params.actorEmail ?? null,
      reason: params.reason ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

function honestyThrow(result: { ok: false; violations: { message: string }[] }): never {
  throw new FoundryHonestyError(result.violations.map((v) => v.message).join("; "));
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const ResearchRunRepository = {

  async create(input: CreateResearchRunInput): Promise<ResearchRun> {
    const moduleEntry = MODULE_REGISTRY.find((m) => m.id === input.module);
    const moduleStatus = moduleEntry?.status ?? "DEMO";
    const findings = parseSafe<Finding[]>(input.findingsJson ?? null, []);

    const honesty = enforceHonestyOnCreate({
      run: { ...input, resurrectionCount: 0 } as any,
      moduleStatus,
      findings,
    });
    if (!honesty.ok) honestyThrow(honesty);

    const [row] = await prisma.$transaction(async (tx) => {
      const created = await tx.researchRun.create({ data: input as any });
      await writeAuditEventTx(tx, {
        runId: created.id,
        event: "FOUNDRY_RUN_CREATED",
        toStatus: created.status,
        actorId: input.actorId,
        actorEmail: input.actorEmail,
      });
      return [created];
    });

    return mapRow(row as any);
  },

  async findById(id: string): Promise<ResearchRun | null> {
    const row = await prisma.researchRun.findUnique({ where: { id } });
    return row ? mapRow(row as any) : null;
  },

  async findBySlug(slug: string): Promise<ResearchRun | null> {
    const row = await prisma.researchRun.findUnique({ where: { slug } });
    return row ? mapRow(row as any) : null;
  },

  async findMany(filters: Partial<ResearchRunFilters> = {}): Promise<ResearchRun[]> {
    const where: Record<string, unknown> = {};

    if (filters.module) where.module = filters.module;
    if (filters.actorId) where.actorId = filters.actorId;
    if (typeof filters.isDemo === "boolean") where.isDemo = filters.isDemo;

    if (!filters.includeArchived) {
      where.archivedAt = null;
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    if (filters.severity) {
      where.severity = Array.isArray(filters.severity)
        ? { in: filters.severity }
        : filters.severity;
    }

    if (filters.fromDate) {
      where.createdAt = { ...(where.createdAt as object), gte: new Date(filters.fromDate) };
    }

    if (filters.toDate) {
      where.createdAt = { ...(where.createdAt as object), lte: new Date(filters.toDate) };
    }

    const rows = await prisma.researchRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    });

    return rows.map((r) => mapRow(r as any));
  },

  /**
   * Update only non-lifecycle fields. Status, severity, archivedAt, and
   * implementedAt are not accepted here — use the dedicated transition methods.
   */
  async updateMetadata(
    id: string,
    patch: UpdateMetadataInput,
    actor: { id?: string; email?: string },
  ): Promise<ResearchRun> {
    const allowed: (keyof UpdateMetadataInput)[] = [
      "recommendation",
      "blockingIssuesJson",
      "dependenciesUnmetJson",
      "deferredReason",
    ];

    const safe: Partial<UpdateMetadataInput> = {};
    for (const key of allowed) {
      if (key in patch) safe[key] = patch[key] as any;
    }

    const [row] = await prisma.$transaction(async (tx) => {
      const updated = await tx.researchRun.update({ where: { id }, data: safe as any });
      await writeAuditEventTx(tx, {
        runId: id,
        event: "FOUNDRY_RUN_METADATA_UPDATED",
        actorId: actor.id,
        actorEmail: actor.email,
        metadata: { fields: Object.keys(safe) },
      });
      return [updated];
    });

    return mapRow(row as any);
  },

  async archive(
    id: string,
    actor: { id: string; email: string },
    opts: { deferredReason?: string; decisionOutcome?: string } = {},
  ): Promise<ResearchRun> {
    const existing = await prisma.researchRun.findUnique({ where: { id } });
    if (!existing) throw new FoundryNotFoundError(id);

    assertTransitionAllowed(existing.status as RunStatus, "ARCHIVED");

    const honesty = enforceHonestyOnArchive({
      severity: existing.severity as any,
      implementedAt: existing.implementedAt,
      deferredReason: opts.deferredReason ?? existing.deferredReason,
      decisionOutcome: opts.decisionOutcome ?? existing.decisionOutcome,
    });
    if (!honesty.ok) honestyThrow(honesty);

    const [row] = await prisma.$transaction(async (tx) => {
      const updated = await tx.researchRun.update({
        where: { id },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date(),
          ...(opts.deferredReason && { deferredReason: opts.deferredReason }),
          ...(opts.decisionOutcome && { decisionOutcome: opts.decisionOutcome }),
        },
      });
      await writeAuditEventTx(tx, {
        runId: id,
        event: "FOUNDRY_RUN_ARCHIVED",
        fromStatus: existing.status,
        toStatus: "ARCHIVED",
        actorId: actor.id,
        actorEmail: actor.email,
      });
      return [updated];
    });

    return mapRow(row as any);
  },

  async implement(
    id: string,
    actor: { id: string; email: string },
    opts: { decisionOutcome?: string } = {},
  ): Promise<ResearchRun> {
    const existing = await prisma.researchRun.findUnique({ where: { id } });
    if (!existing) throw new FoundryNotFoundError(id);

    assertTransitionAllowed(existing.status as RunStatus, "IMPLEMENTED");

    const [row] = await prisma.$transaction(async (tx) => {
      const updated = await tx.researchRun.update({
        where: { id },
        data: {
          status: "IMPLEMENTED",
          implementedAt: new Date(),
          ...(opts.decisionOutcome && { decisionOutcome: opts.decisionOutcome }),
        },
      });
      await writeAuditEventTx(tx, {
        runId: id,
        event: "FOUNDRY_RUN_IMPLEMENTED",
        fromStatus: existing.status,
        toStatus: "IMPLEMENTED",
        actorId: actor.id,
        actorEmail: actor.email,
      });
      return [updated];
    });

    return mapRow(row as any);
  },

  async defer(
    id: string,
    actor: { id: string; email: string },
    reason: string,
  ): Promise<ResearchRun> {
    const honestyDefer = enforceHonestyOnDefer({ deferredReason: reason });
    if (!honestyDefer.ok) honestyThrow(honestyDefer);

    const existing = await prisma.researchRun.findUnique({ where: { id } });
    if (!existing) throw new FoundryNotFoundError(id);

    assertTransitionAllowed(existing.status as RunStatus, "DEFERRED");

    const [row] = await prisma.$transaction(async (tx) => {
      const updated = await tx.researchRun.update({
        where: { id },
        data: { status: "DEFERRED", deferredReason: reason },
      });
      await writeAuditEventTx(tx, {
        runId: id,
        event: "FOUNDRY_RUN_DEFERRED",
        fromStatus: existing.status,
        toStatus: "DEFERRED",
        actorId: actor.id,
        actorEmail: actor.email,
        reason,
      });
      return [updated];
    });

    return mapRow(row as any);
  },

  async markActionRequired(
    id: string,
    actor: { id: string; email: string },
  ): Promise<ResearchRun> {
    const existing = await prisma.researchRun.findUnique({ where: { id } });
    if (!existing) throw new FoundryNotFoundError(id);

    assertTransitionAllowed(existing.status as RunStatus, "ACTION_REQUIRED");

    const [row] = await prisma.$transaction(async (tx) => {
      const updated = await tx.researchRun.update({
        where: { id },
        data: { status: "ACTION_REQUIRED" },
      });
      await writeAuditEventTx(tx, {
        runId: id,
        event: "FOUNDRY_RUN_ACTION_REQUIRED",
        fromStatus: existing.status,
        toStatus: "ACTION_REQUIRED",
        actorId: actor.id,
        actorEmail: actor.email,
      });
      return [updated];
    });

    return mapRow(row as any);
  },

  async resurrect(
    id: string,
    actor: { id: string; email: string },
  ): Promise<ResearchRun> {
    const existing = await prisma.researchRun.findUnique({ where: { id } });
    if (!existing) throw new FoundryNotFoundError(id);
    if (!existing.archivedAt) throw new Error(`Run ${id} is not archived`);

    const [revived] = await prisma.$transaction(async (tx) => {
      const created = await tx.researchRun.create({
        data: {
          title: `[Revived] ${existing.title}`,
          slug: `${existing.slug}-revived-${Date.now()}`,
          runType: existing.runType,
          module: existing.module,
          moduleVersion: existing.moduleVersion,
          actorId: actor.id,
          actorEmail: actor.email,
          inputJson: existing.inputJson,
          outputJson: existing.outputJson,
          findingsJson: existing.findingsJson,
          recommendation: existing.recommendation,
          severity: existing.severity,
          status: "PENDING",
          isDemo: existing.isDemo,
          resurrectedFromId: existing.id,
          resurrectionCount: existing.resurrectionCount + 1,
          schemaVersion: existing.schemaVersion,
          engineVersionJson: existing.engineVersionJson,
        },
      });
      await writeAuditEventTx(tx, {
        runId: created.id,
        event: "FOUNDRY_RUN_RESURRECTED",
        toStatus: "PENDING",
        actorId: actor.id,
        actorEmail: actor.email,
        metadata: { originalId: id },
      });
      return [created];
    });

    return mapRow(revived as any);
  },

  async replay(id: string, actor: { id: string; email: string }): Promise<ResearchRun> {
    const existing = await prisma.researchRun.findUnique({ where: { id } });
    if (!existing) throw new FoundryNotFoundError(id);

    const [replayed] = await prisma.$transaction(async (tx) => {
      const created = await tx.researchRun.create({
        data: {
          title: `[Replay] ${existing.title}`,
          slug: `${existing.slug}-replay-${Date.now()}`,
          runType: existing.runType,
          module: existing.module,
          moduleVersion: existing.moduleVersion,
          actorId: actor.id,
          actorEmail: actor.email,
          inputJson: existing.inputJson,
          baselineJson: existing.outputJson,
          recommendation: existing.recommendation,
          severity: "INFO",
          status: "PENDING",
          isDemo: existing.isDemo,
          schemaVersion: existing.schemaVersion,
        },
      });
      await writeAuditEventTx(tx, {
        runId: created.id,
        event: "FOUNDRY_RUN_REPLAYED",
        toStatus: "PENDING",
        actorId: actor.id,
        actorEmail: actor.email,
        metadata: { originalId: id },
      });
      return [created];
    });

    return mapRow(replayed as any);
  },

  async exportBrief(id: string): Promise<ActionBrief> {
    const run = await prisma.researchRun.findUnique({ where: { id } });
    if (!run) throw new FoundryNotFoundError(id);

    const findings = parseSafe<Finding[]>(run.findingsJson, []);
    const blockingIssues = parseSafe<string[]>(run.blockingIssuesJson, []);

    return {
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
  },

  async checkLinkedRoute(route: string): Promise<{ exists: boolean }> {
    const appDir = path.join(process.cwd(), "app");
    const candidates = [
      path.join(appDir, route, "page.tsx"),
      path.join(appDir, route, "page.ts"),
      path.join(appDir, route, "route.ts"),
      path.join(appDir, route.replace(/^\//, ""), "page.tsx"),
    ];
    const exists = candidates.some((p) => fs.existsSync(p));
    return { exists };
  },

  async checkEngineVersion(engineId: string): Promise<{ version: string | null }> {
    const latest = await prisma.researchRun.findFirst({
      where: { module: engineId },
      orderBy: { createdAt: "desc" },
      select: { engineVersionJson: true },
    });
    if (!latest?.engineVersionJson) return { version: null };
    const parsed = parseSafe<{ version?: string }>(latest.engineVersionJson, {});
    return { version: parsed.version ?? null };
  },

  async getHealthMetrics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    criticalUnresolved: number;
  }> {
    const [total, byStatus, bySeverity, criticalUnresolved] = await Promise.all([
      prisma.researchRun.count({ where: { archivedAt: null } }),
      prisma.researchRun.groupBy({
        by: ["status"],
        where: { archivedAt: null },
        _count: { id: true },
      }),
      prisma.researchRun.groupBy({
        by: ["severity"],
        where: { archivedAt: null },
        _count: { id: true },
      }),
      prisma.researchRun.count({
        where: {
          archivedAt: null,
          severity: { in: ["CRITICAL", "HIGH"] },
          status: { notIn: ["IMPLEMENTED", "ARCHIVED"] },
        },
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count.id])),
      bySeverity: Object.fromEntries(bySeverity.map((r) => [r.severity, r._count.id])),
      criticalUnresolved,
    };
  },

  async getDetailedHealth(): Promise<{
    runsThisWeek: number;
    runsThisMonth: number;
    distinctActors: number;
    actionConversionRate: number;
    avgTimeToImplementDays: number;
    criticalUnresolved: number;
    dormantModuleIds: string[];
    redTeamConversionRate: number;
    outboundBlockedCount: number;
    overallStatus: "ok" | "warning" | "critical";
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [runsThisWeek, runsThisMonth, allRuns, implementedRuns, criticalUnresolved] = await Promise.all([
      prisma.researchRun.count({ where: { createdAt: { gte: weekAgo }, archivedAt: null } }),
      prisma.researchRun.count({ where: { createdAt: { gte: monthAgo }, archivedAt: null } }),
      prisma.researchRun.findMany({
        where: { archivedAt: null },
        select: { module: true, status: true, actorEmail: true, createdAt: true, runType: true },
      }),
      prisma.researchRun.findMany({
        where: { status: "IMPLEMENTED", implementedAt: { not: null } },
        select: { createdAt: true, implementedAt: true },
      }),
      prisma.researchRun.count({
        where: {
          archivedAt: null,
          severity: { in: ["CRITICAL", "HIGH"] },
          status: { notIn: ["IMPLEMENTED", "ARCHIVED"] },
        },
      }),
    ]);

    const distinctActors = new Set(allRuns.map((r) => r.actorEmail).filter(Boolean)).size;
    const actionRequired = allRuns.filter((r) => r.status === "ACTION_REQUIRED");
    const actionConversionRate = actionRequired.length > 0
      ? implementedRuns.length / (actionRequired.length + implementedRuns.length)
      : 1;
    const avgTimeToImplementDays = implementedRuns.length > 0
      ? implementedRuns.reduce((sum, r) => {
          const days = (r.implementedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / implementedRuns.length
      : 0;

    const recentModules = new Set(allRuns.filter((r) => r.createdAt >= fourteenDaysAgo).map((r) => r.module));
    const { MODULE_REGISTRY } = await import("./module-registry");
    const dormantModuleIds = MODULE_REGISTRY
      .filter((m) => m.status === "WIRED" || m.status === "PARTIAL")
      .map((m) => m.id)
      .filter((id) => !recentModules.has(id));

    const redTeamRuns = allRuns.filter((r) => r.runType === "RED_TEAM");
    const redTeamImplemented = redTeamRuns.filter((r) => r.status === "IMPLEMENTED");
    const redTeamConversionRate = redTeamRuns.length > 0 ? redTeamImplemented.length / redTeamRuns.length : 0;
    const outboundBlockedCount = allRuns.filter((r) => r.runType === "OUTBOUND" && r.status === "ACTION_REQUIRED").length;

    const overallStatus: "ok" | "warning" | "critical" =
      dormantModuleIds.length > 3 || actionConversionRate < 0.1 || criticalUnresolved > 0
        ? "critical"
        : dormantModuleIds.length > 0 || actionConversionRate < 0.15
        ? "warning"
        : "ok";

    return {
      runsThisWeek, runsThisMonth, distinctActors, actionConversionRate,
      avgTimeToImplementDays, criticalUnresolved, dormantModuleIds,
      redTeamConversionRate, outboundBlockedCount, overallStatus,
    };
  },

  async getTrashDayQueue(): Promise<Array<ResearchRun & { ageInDays: number; trashReason: string }>> {
    const now = Date.now();
    const ago = (days: number) => new Date(now - days * 86_400_000);

    const [staleAction, weakDeferrals, ownerDecisions, highCriticalOld] = await Promise.all([
      prisma.researchRun.findMany({
        where: { status: "ACTION_REQUIRED", createdAt: { lte: ago(30) }, archivedAt: null },
      }),
      prisma.researchRun.findMany({
        where: { status: "DEFERRED", archivedAt: null, OR: [{ deferredReason: null }, { deferredReason: "" }] },
      }),
      prisma.researchRun.findMany({
        where: { status: "OWNER_DECISION_REQUIRED", createdAt: { lte: ago(14) }, archivedAt: null },
      }),
      prisma.researchRun.findMany({
        where: {
          severity: { in: ["HIGH", "CRITICAL"] },
          status: { notIn: ["IMPLEMENTED", "ARCHIVED"] },
          createdAt: { lte: ago(60) },
          archivedAt: null,
        },
      }),
    ]);

    const seenIds = new Set<string>();
    const items: Array<ResearchRun & { ageInDays: number; trashReason: string }> = [];

    const add = (rows: typeof staleAction, reason: (r: (typeof staleAction)[0]) => string) => {
      for (const r of rows) {
        if (seenIds.has(r.id)) continue;
        seenIds.add(r.id);
        const ageInDays = Math.floor((now - r.createdAt.getTime()) / 86_400_000);
        items.push({ ...mapRow(r as any), ageInDays, trashReason: reason(r) });
      }
    };

    add(staleAction, () => "ACTION_REQUIRED for over 30 days — needs a decision");
    add(weakDeferrals, () => "DEFERRED without a meaningful reason — deferral reason required");
    add(ownerDecisions, () => "OWNER_DECISION_REQUIRED for over 14 days — owner must decide");
    add(highCriticalOld, (r) => `${r.severity} finding unactioned for over 60 days — requires immediate decision`);

    items.sort((a, b) => {
      if (a.severity === "CRITICAL" && b.severity !== "CRITICAL") return -1;
      if (b.severity === "CRITICAL" && a.severity !== "CRITICAL") return 1;
      return b.ageInDays - a.ageInDays;
    });

    return items;
  },
};
