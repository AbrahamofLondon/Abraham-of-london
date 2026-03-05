/* lib/audit/audit-logger.ts — NODE-ONLY AUDIT LOGGER (pages/ compatible)
   - DO NOT import "server-only" here (pages router cannot handle it)
   - Enforce Node-only at runtime via guard
*/
import { Prisma, type AuditSeverity } from "@prisma/client"; // Prisma as VALUE + type
import { prisma as globalPrisma } from "@/lib/prisma";
import { safeSlice } from "@/lib/utils/safe";

/**
 * SystemAuditLog is compliance-grade in your DB (actorType/status/resourceType/etc).
 * We write to real columns FIRST, and keep overflow in metadata._ext.
 */

// -----------------------------------------------------------------------------
// Node-only runtime guard (prevents accidental client/edge usage)
// -----------------------------------------------------------------------------
function assertNodeRuntime(moduleName: string) {
  // If we ever run in browser, blow up immediately.
  if (typeof window !== "undefined") {
    throw new Error(`[${moduleName}] must never run in the browser.`);
  }

  // Edge runtime heuristic: EdgeRuntime global exists.
  // (Also blocks environments where process is missing.)
  const isEdge =
    typeof (globalThis as any).EdgeRuntime === "string" ||
    (typeof process !== "undefined" && (process as any).env?.NEXT_RUNTIME === "edge");

  if (isEdge) {
    throw new Error(`[${moduleName}] must never run in Edge runtime. Use audit-edge proxy instead.`);
  }
}

assertNodeRuntime("lib/audit/audit-logger.ts");

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type AuditCategory =
  | "auth"
  | "admin"
  | "user"
  | "content"
  | "system"
  | "security"
  | "api";

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

  severity: AuditSeverity | string;
  status?: AuditStatus | string | null;

  category?: AuditCategory | string | null;
  subCategory?: string | null;
  tags?: string[] | null;

  errorMessage?: string | null;
  durationMs?: number | null;

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
    create(args: Prisma.SystemAuditLogCreateArgs): Promise<any>;
    createMany(args: Prisma.SystemAuditLogCreateManyArgs): Promise<any>;
    findMany(args: Prisma.SystemAuditLogFindManyArgs): Promise<any>;
  };
};

type TxLike = Prisma.TransactionClient | PrismaClientLike;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function nowIso() {
  return new Date().toISOString();
}

function normalizeString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

function normalizeSeverity(v: unknown): AuditSeverity {
  const s = String(v || "").toLowerCase().trim();
  if (s === "critical") return "critical";
  if (s === "high" || s === "error") return "high";
  if (s === "warning" || s === "warn") return "warning";
  return "info";
}

function normalizeStatus(v: unknown): AuditStatus {
  const s = String(v || "").toLowerCase().trim();
  if (s === "failure" || s === "failed" || s === "error") return "failure";
  if (s === "pending") return "pending";
  return "success";
}

function normalizeActorType(v: unknown): ActorType {
  const s = String(v || "").toLowerCase().trim();
  if (s === "user") return "user";
  if (s === "admin") return "admin";
  if (s === "service") return "service";
  return "system";
}

// Prisma-safe json input helper
type JsonInput = Prisma.InputJsonValue | typeof Prisma.JsonNull;

function toJson(value: unknown): JsonInput {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

function toDbCreateInput(event: AuditEvent): Prisma.SystemAuditLogCreateInput {
  const environment = normalizeString(event.environment) || process.env.NODE_ENV || "development";
  const service = normalizeString(event.service) || "abrahamoflondon";
  const version = normalizeString(event.version) || "1.0.0";

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

  const category = normalizeString(event.category);
  const subCategory = normalizeString(event.subCategory);

  const tagsArr = Array.isArray(event.tags) ? event.tags.filter(Boolean).map(String) : [];

  const durationMs =
    typeof event.durationMs === "number" && Number.isFinite(event.durationMs)
      ? Math.trunc(event.durationMs)
      : null;

  const errorMessage = normalizeString(event.errorMessage);

  // Overflow-safe extension payload
  const ext = {
    details: event.details || undefined,
    service,
    environment,
    version,
    userAgentShort: userAgent ? safeSlice(userAgent, 0, 180) : undefined,
    at: nowIso(),
  };

  const mergedMetadata: Record<string, unknown> = {
    ...(event.metadata || {}),
    _ext: ext,
  };

  return {
    action: event.action,
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
    tags: toJson(tagsArr),

    metadata: toJson(mergedMetadata),
  };
}

// -----------------------------------------------------------------------------
// Core logger
// -----------------------------------------------------------------------------
export class AuditLogger {
  private prisma: TxLike;
  private enabled: boolean;

  private batchQueue: Prisma.SystemAuditLogCreateManyInput[] = [];
  private batchSize = 50;

  constructor(opts?: { prisma?: TxLike; enabled?: boolean }) {
    this.prisma = opts?.prisma || (globalPrisma as unknown as TxLike);
    this.enabled = opts?.enabled ?? true;
  }

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

    return this.prisma.systemAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async log(event: AuditEvent) {
    if (!this.enabled) return null;

    const input = toDbCreateInput(event);

    if ((process.env.NODE_ENV || "development") !== "production") {
      console.log(`🧾 [AUDIT:${String(input.severity).toUpperCase()}] ${input.action}`, {
        actorEmail: input.actorEmail ?? undefined,
        actorId: input.actorId ?? undefined,
        actorType: (input as any).actorType ?? undefined,
        resourceType: (input as any).resourceType ?? undefined,
        resourceId: input.resourceId ?? undefined,
        ip: input.ipAddress ?? undefined,
      });
    }

    // Immediate durability for high-signal
    if (input.severity === "critical" || input.severity === "high") {
      return this.prisma.systemAuditLog.create({ data: input });
    }

    // Batch low-signal
    this.batchQueue.push(input as Prisma.SystemAuditLogCreateManyInput);

    if (this.batchQueue.length >= this.batchSize) {
      await this.flushBatch();
    }

    return null;
  }

  async flushBatch() {
    if (!this.batchQueue.length) return;

    const batch = this.batchQueue.splice(0, this.batchQueue.length);
    try {
      await this.prisma.systemAuditLog.createMany({ data: batch });
    } catch (e) {
      console.error("[AuditLogger] batch flush failed; falling back to per-row inserts", e);
      for (const row of batch) {
        try {
          await this.prisma.systemAuditLog.create({ data: row as any });
        } catch {
          // fail-open
        }
      }
    }
  }
}

function clampInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  const x = Number.isFinite(n) ? Math.floor(n) : fallback;
  return Math.max(min, Math.min(max, x));
}

// -----------------------------------------------------------------------------
// Facade exports
// -----------------------------------------------------------------------------
let instance: AuditLogger | null = null;

export const auditLogger = {
  get(): AuditLogger {
    if (!instance) instance = new AuditLogger();
    return instance;
  },

  async log(event: AuditEvent) {
    return this.get().log(event);
  },

  async query(filters: AuditQueryFilters) {
    return this.get().query(filters);
  },

  async flush() {
    return this.get().flushBatch();
  },
};

// ✅ This matches your route import: `import { getAuditLogger } ...`
export function getAuditLogger() {
  return auditLogger.get();
}

export default auditLogger;

export async function logSystemAudit(tx: TxLike, event: AuditEvent) {
  const input = toDbCreateInput(event);
  return tx.systemAuditLog.create({ data: input });
}