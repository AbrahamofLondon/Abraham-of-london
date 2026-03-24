/* lib/audit/audit-logger.ts — STRICT NODE-ONLY AUDIT LOGGER */

import { Prisma, type AuditSeverity } from "@prisma/client";
import { prisma as globalPrisma } from "@/lib/prisma";

/* -------------------------------------------------------------------------- */
/* Runtime guard                                                              */
/* -------------------------------------------------------------------------- */

function assertNodeRuntime(moduleName: string): void {
  if (typeof window !== "undefined") {
    throw new Error(`[${moduleName}] must never run in the browser.`);
  }

  const isEdge =
    typeof (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime === "string" ||
    (typeof process !== "undefined" &&
      (process as { env?: Record<string, string | undefined> }).env?.NEXT_RUNTIME === "edge");

  if (isEdge) {
    throw new Error(`[${moduleName}] must never run in Edge runtime.`);
  }
}

assertNodeRuntime("lib/audit/audit-logger.ts");

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AuditCategory = "auth" | "admin" | "user" | "content" | "system" | "security" | "api";
export type AuditStatus = "success" | "failure" | "pending";
export type ActorType = "system" | "user" | "admin" | "service";

export interface AuditEvent {
  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  actorType?: ActorType | string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  resourceName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  sessionId?: string | null;
  severity?: AuditSeverity | string | null;
  status?: AuditStatus | string | null;
  category?: AuditCategory | string | null;
  subCategory?: string | null;
  tags?: string[] | null;
  errorMessage?: string | null;
  durationMs?: number | null;
  // FIXED: Added 'details' and 'metadata' as valid optional properties to satisfy callers
  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  service?: string | null;
  environment?: string | null;
  version?: string | null;
}

export interface AuditQueryFilters {
  startDate?: Date;
  endDate?: Date;
  action?: string;
  severity?: AuditSeverity;
  actorId?: string;
  actorEmail?: string;
  actorType?: string;
  resourceId?: string;
  resourceType?: string;
  status?: string;
  category?: string;
  requestId?: string;
  sessionId?: string;
  limit?: number;
}

type PrismaClientLike = {
  systemAuditLog: {
    create(args: Prisma.SystemAuditLogCreateArgs): Promise<unknown>;
    createMany(args: Prisma.SystemAuditLogCreateManyArgs): Promise<unknown>;
    findMany(args: Prisma.SystemAuditLogFindManyArgs): Promise<unknown>;
    deleteMany(args: Prisma.SystemAuditLogDeleteManyArgs): Promise<{ count: number }>;
  };
};

type TxLike = Prisma.TransactionClient | PrismaClientLike;
type JsonInput = Prisma.InputJsonValue | typeof Prisma.JsonNull;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function nowIso(): string { return new Date().toISOString(); }

function normalizeString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

function normalizeSeverity(v: unknown): AuditSeverity {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high" || s === "error") return "high";
  if (s === "warning" || s === "warn" || s === "medium") return "warning";
  return "info";
}

function normalizeStatus(v: unknown): AuditStatus {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "failure" || s === "failed" || s === "error") return "failure";
  if (s === "pending") return "pending";
  return "success";
}

function normalizeActorType(v: unknown): ActorType {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "user" || s === "member") return "user";
  if (s === "admin") return "admin";
  if (s === "service" || s === "api" || s === "cron" || s === "webhook") return "service";
  return "system";
}

function truncateString(value: string, max: number): string {
  return value.length > max ? value.substring(0, max) : value;
}

function clampInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  const x = Number.isFinite(n) ? Math.floor(n) : fallback;
  return Math.max(min, Math.min(max, x));
}

function normalizeTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const set = new Set<string>();
  for (const item of v) {
    const s = String(item ?? "").trim().toLowerCase();
    if (s) set.add(s);
  }
  return Array.from(set).slice(0, 50);
}

function deriveCategory(explicitCategory: unknown, resourceType: unknown): AuditCategory {
  const category = String(explicitCategory ?? "").trim().toLowerCase();
  const valid = ["auth", "admin", "user", "content", "system", "security", "api"];
  if (valid.includes(category)) return category as AuditCategory;

  const rt = String(resourceType ?? "").trim().toLowerCase();
  if (rt.includes("auth")) return "auth";
  if (rt.includes("admin")) return "admin";
  if (rt.includes("security")) return "security";
  if (rt.includes("content") || rt.includes("brief") || rt.includes("book") || rt.includes("canon")) return "content";
  if (rt.includes("user") || rt.includes("member")) return "user";
  if (rt.includes("api")) return "api";
  return "system";
}

function toJson(value: unknown): JsonInput {
  if (value === undefined || value === null) return Prisma.JsonNull;
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return Prisma.JsonNull;
  }
}

function isHighClearanceTag(tags: string[]): boolean {
  return tags.some((tag) => {
    const normalized = tag.replace(/[_\s]+/g, "-");
    return normalized === "top-secret" || normalized === "restricted";
  });
}

function toDbCreateInput(event: AuditEvent): Prisma.SystemAuditLogCreateInput {
  const environment = normalizeString(event.environment) || process.env.NODE_ENV || "development";
  const service = normalizeString(event.service) || "abrahamoflondon";
  const version = normalizeString(event.version) || "1.0.0";
  const action = normalizeString(event.action) || "UNKNOWN_ACTION";
  const actorId = normalizeString(event.actorId);
  const actorEmail = normalizeString(event.actorEmail);
  const actorType = normalizeActorType(event.actorType);
  const resourceId = normalizeString(event.resourceId);
  const resourceType = normalizeString(event.resourceType);
  const resourceName = normalizeString(event.resourceName);
  const ipAddress = normalizeString(event.ipAddress);
  const userAgent = normalizeString(event.userAgent);
  const requestId = normalizeString(event.requestId);
  const sessionId = normalizeString(event.sessionId);
  const severity = normalizeSeverity(event.severity);
  const status = normalizeStatus(event.status);
  const category = deriveCategory(event.category, resourceType);
  const subCategory = normalizeString(event.subCategory);
  const tags = normalizeTags(event.tags);
  const durationMs = typeof event.durationMs === "number" && Number.isFinite(event.durationMs) ? Math.trunc(event.durationMs) : null;
  const errorMessage = normalizeString(event.errorMessage);

  // FIXED: Ensure both 'details' and 'metadata' provided in the call are merged into the final database JSON
  const mergedMetadata: Record<string, unknown> = {
    ...(event.metadata || {}),
    ...(event.details || {}),
    _ext: {
      service,
      environment,
      version,
      userAgentShort: userAgent ? truncateString(userAgent, 180) : undefined,
      at: nowIso(),
      isHighClearance: isHighClearanceTag(tags),
    },
  };

  return {
    action,
    severity,
    actorId,
    actorEmail,
    resourceId,
    ipAddress,
    userAgent,
    actorType,
    status,
    resourceType,
    resourceName,
    requestId,
    sessionId,
    durationMs,
    errorMessage,
    category,
    subCategory,
    tags: toJson(tags),
    metadata: toJson(mergedMetadata),
  };
}

/* -------------------------------------------------------------------------- */
/* Logger Class                                                               */
/* -------------------------------------------------------------------------- */

export class AuditLogger {
  private prisma: TxLike;
  private enabled: boolean;
  private batchQueue: Prisma.SystemAuditLogCreateManyInput[] = [];
  private readonly batchSize = 50;

  constructor(opts?: { prisma?: TxLike; enabled?: boolean }) {
    this.prisma = opts?.prisma || (globalPrisma as unknown as TxLike);
    this.enabled = opts?.enabled ?? true;
  }

  async ensureInitialized(): Promise<AuditLogger> { return this; }

  async query(filters: AuditQueryFilters) {
    const limit = clampInt(filters.limit, 100, 1, 1000);
    const where: Prisma.SystemAuditLogWhereInput = {};
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    if (filters.action) where.action = filters.action;
    if (filters.severity) where.severity = filters.severity;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.actorEmail) where.actorEmail = filters.actorEmail;
    if (filters.actorType) where.actorType = filters.actorType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.requestId) where.requestId = filters.requestId;
    if (filters.sessionId) where.sessionId = filters.sessionId;

    return (this.prisma as any).systemAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async log(event: AuditEvent) {
    if (!this.enabled) return null;
    const input = toDbCreateInput(event);
    const highClearance = isHighClearanceTag(normalizeTags(event.tags));

    if (process.env.NODE_ENV !== "production") {
      console.log(`🧾 [AUDIT:${String(input.severity).toUpperCase()}] ${input.action}`);
    }

    if (input.severity === "critical" || input.severity === "high" || highClearance) {
      return (this.prisma as any).systemAuditLog.create({ data: input });
    }

    this.batchQueue.push(input as unknown as Prisma.SystemAuditLogCreateManyInput);
    if (this.batchQueue.length >= this.batchSize) await this.flushBatch();
    return null;
  }

  async flushBatch(): Promise<void> {
    if (!this.batchQueue.length) return;
    const batch = this.batchQueue.splice(0, this.batchQueue.length);
    try {
      await (this.prisma as any).systemAuditLog.createMany({ data: batch });
    } catch (error) {
      for (const row of batch) {
        try {
          await (this.prisma as any).systemAuditLog.create({ data: row });
        } catch { /* fail-open */ }
      }
    }
  }

  async cleanupOldLogs(retentionDays = 90): Promise<number> {
    const cutoff = new Date(Date.now() - clampInt(retentionDays, 90, 30, 3650) * 24 * 60 * 60 * 1000);
    await this.flushBatch();
    const result = await (this.prisma as any).systemAuditLog.deleteMany({
      where: { createdAt: { lt: cutoff }, severity: { in: ["info", "warning"] } },
    });
    return result.count;
  }
}

/* -------------------------------------------------------------------------- */
/* Facade                                                                     */
/* -------------------------------------------------------------------------- */

let instance: AuditLogger | null = null;

export const auditLogger = {
  get(): AuditLogger {
    if (!instance) instance = new AuditLogger();
    return instance;
  },
  async ensureInitialized() { return this.get().ensureInitialized(); },
  async log(event: AuditEvent) { return this.get().log(event); },
  async query(filters: AuditQueryFilters) { return this.get().query(filters); },
  async flush() { return this.get().flushBatch(); },
  async cleanupOldLogs(retentionDays?: number) { return this.get().cleanupOldLogs(retentionDays); },
};

export function getAuditLogger(): AuditLogger { return auditLogger.get(); }
export default auditLogger;

export async function logSystemAudit(tx: TxLike, event: AuditEvent) {
  const input = toDbCreateInput(event);
  return (tx as any).systemAuditLog.create({ data: input });
}