// lib/audit/audit-logger.ts
import { PrismaClient, Prisma, type SystemAuditLog } from "@prisma/client";

export type AuditSeverity = "info" | "warning" | "error" | "critical";
export type AuditCategory =
  | "auth"
  | "admin"
  | "user"
  | "content"
  | "system"
  | "security"
  | "api";

export interface AuditEvent {
  action: string;
  actorId?: string;
  actorType?: string;
  actorEmail?: string;

  resourceType?: string;
  resourceId?: string;
  resourceName?: string;

  details?: Record<string, any>;
  severity: AuditSeverity;
  category?: AuditCategory;
  subCategory?: string;

  userAgent?: string;
  ipAddress?: string;
  requestId?: string;
  sessionId?: string;

  durationMs?: number;

  status?: "success" | "failure" | "pending";
  errorMessage?: string;

  tags?: string[];
  metadata?: Record<string, any>;

  service?: string;
  environment?: string;
  version?: string;
}

type LoggerConfig = {
  prisma: PrismaClient;
  service: string;
  environment: string;
  version?: string;
  enabled?: boolean;
};

export class AuditLogger {
  private prisma: PrismaClient;
  private service: string;
  private environment: string;
  private version: string;
  private enabled: boolean;

  // Batch queue is CREATE MANY INPUT, not returned model objects.
  private batchQueue: Prisma.SystemAuditLogCreateManyInput[] = [];
  private batchSize = 50;
  private batchTimer: NodeJS.Timeout | null = null;
  private batchIntervalMs = 5000;

  constructor(config: LoggerConfig) {
    this.prisma = config.prisma;
    this.service = config.service;
    this.environment = config.environment;
    this.version = config.version || "1.0.0";
    this.enabled = config.enabled ?? true;

    this.setupBatchProcessing();
  }

  private setupBatchProcessing(): void {
    // Batching only in production — deterministic elsewhere.
    if (this.environment === "production") {
      this.batchTimer = setInterval(() => {
        void this.flushBatch();
      }, this.batchIntervalMs);
    }
  }

  async log(event: Omit<AuditEvent, "timestamp">): Promise<SystemAuditLog | null> {
    if (!this.enabled) return null;

    try {
      const normalized = this.normalizeEvent(event);

      // Dev/test: always console log
      if (this.environment === "development" || this.environment === "test") {
        this.consoleLog(normalized);
      }

      // Error/Critical: insert immediately
      if (normalized.severity === "critical" || normalized.severity === "error") {
        return await this.createLogEntry(normalized);
      }

      // Production: batch low/medium events
      if (this.environment === "production") {
        const input = this.toCreateManyInput(normalized);
        this.batchQueue.push(input);

        if (this.batchQueue.length >= this.batchSize) {
          await this.flushBatch();
        }

        // We return null because a batched event is not yet persisted as a row.
        return null;
      }

      // Non-prod: immediate insert
      return await this.createLogEntry(normalized);
    } catch (error) {
      // Audit logging must never take down the app.
      console.error("[AuditLogger] Failed to log event:", error);
      return null;
    }
  }

  private normalizeEvent(event: Omit<AuditEvent, "timestamp">): AuditEvent {
    return {
      ...event,
      service: event.service || this.service,
      environment: event.environment || this.environment,
      version: event.version || this.version,
    };
  }

  private consoleLog(event: AuditEvent): void {
    const timestamp = new Date().toISOString();
    const emoji = this.getSeverityEmoji(event.severity);

    // No fancy colours needed on server logs — keep it deterministic.
    console.groupCollapsed(`${emoji} [AUDIT:${event.severity.toUpperCase()}] ${event.action}`);
    console.log("Timestamp:", timestamp);
    console.log("Actor:", event.actorEmail || event.actorId || "Anonymous");
    console.log("Category:", event.category || "general");

    if (event.resourceType) {
      console.log("Resource:", `${event.resourceType}${event.resourceId ? `#${event.resourceId}` : ""}`);
    }
    if (event.details && Object.keys(event.details).length > 0) {
      console.log("Details:", event.details);
    }
    if (event.ipAddress || event.userAgent) {
      console.log("Context:", {
        ip: event.ipAddress,
        userAgent: event.userAgent?.slice(0, 120),
      });
    }
    if (typeof event.durationMs === "number") {
      console.log("DurationMs:", event.durationMs);
    }

    console.groupEnd();
  }

  private getSeverityEmoji(severity: AuditSeverity): string {
    switch (severity) {
      case "info":
        return "ℹ️";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "critical":
        return "🚨";
      default:
        return "📝";
    }
  }

  private toCreateManyInput(event: AuditEvent): Prisma.SystemAuditLogCreateManyInput {
    return {
      actorType: event.actorType || "system",
      actorId: event.actorId,
      actorEmail: event.actorEmail,
      ipAddress: event.ipAddress,
      action: event.action,
      resourceType: event.resourceType || "system",
      resourceId: event.resourceId,
      userAgent: event.userAgent,
      requestId: event.requestId,
      sessionId: event.sessionId,
      status: event.status || "success",
      severity: event.severity || "info",
      errorMessage: event.errorMessage,
      durationMs: event.durationMs,
      metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
      category: event.category,
      subCategory: event.subCategory,
      tags: event.tags ? JSON.stringify(event.tags) : undefined,
      // createdAt/updatedAt omitted: Prisma will default them.
    };
  }

  private async createLogEntry(event: AuditEvent): Promise<SystemAuditLog> {
    return await this.prisma.systemAuditLog.create({
      data: this.toCreateManyInput(event),
    });
  }

  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.batchQueue.length);

    try {
      await this.prisma.systemAuditLog.createMany({
        data: batch,
        // For audit logs, duplicates should not happen; we do NOT rely on skipDuplicates.
      });

      if (this.environment === "development") {
        console.log(`[AuditLogger] Flushed ${batch.length} log entries`);
      }
    } catch (error) {
      console.error("[AuditLogger] Batch insert failed:", error);
      // Fail-soft: if batch insert fails, we drop the batch to protect uptime.
      // If you want a dead-letter queue, implement it explicitly.
    }
  }

  // ==================== QUERY METHODS ====================

  async query(filters: {
    actorId?: string;
    actorEmail?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    severity?: AuditSeverity;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<SystemAuditLog[]> {
    const where: Prisma.SystemAuditLogWhereInput = {};

    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.actorEmail) where.actorEmail = filters.actorEmail;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.severity) where.severity = filters.severity;
    if (filters.category) where.category = filters.category;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await this.prisma.systemAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit ?? 100,
      skip: filters.offset ?? 0,
    });
  }

  async getRecentEvents(limit: number = 50): Promise<SystemAuditLog[]> {
    return await this.prisma.systemAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getEventById(id: string): Promise<SystemAuditLog | null> {
    return await this.prisma.systemAuditLog.findUnique({ where: { id } });
  }

  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await this.prisma.systemAuditLog.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        severity: { not: "critical" },
      },
    });

    return result.count;
  }

  // ==================== DOMAIN HELPERS ====================

  async logAuthEvent(
    userId: string,
    action: string,
    details: {
      success: boolean;
      method?: string;
      provider?: string;
      mfaUsed?: boolean;
      ipAddress?: string;
      userAgent?: string;
      error?: string;
    }
  ): Promise<void> {
    await this.log({
      actorId: userId,
      actorType: "user",
      action: `AUTH_${action.toUpperCase()}`,
      category: "auth",
      severity: details.success ? "info" : "warning",
      status: details.success ? "success" : "failure",
      details: {
        method: details.method,
        provider: details.provider,
        mfaUsed: details.mfaUsed,
      },
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      errorMessage: details.error,
      metadata: { authEvent: true },
    });
  }

  async logAdminEvent(
    adminId: string,
    adminEmail: string,
    action: string,
    details: {
      resourceType?: string;
      resourceId?: string;
      changes?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.log({
      actorId: adminId,
      actorEmail: adminEmail,
      actorType: "admin",
      action: `ADMIN_${action.toUpperCase()}`,
      resourceType: details.resourceType,
      resourceId: details.resourceId,
      category: "admin",
      severity: "info",
      details: details.changes,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      metadata: { adminEvent: true },
    });
  }

  async logSecurityEvent(
    actorId: string,
    action: string,
    details: {
      severity: AuditSeverity;
      threatType?: string;
      sourceIp?: string;
      userAgent?: string;
      blocked?: boolean;
      reason?: string;
    }
  ): Promise<void> {
    await this.log({
      actorId,
      actorType: details.severity === "critical" ? "attacker" : "user",
      action: `SECURITY_${action.toUpperCase()}`,
      category: "security",
      severity: details.severity,
      details: {
        threatType: details.threatType,
        blocked: details.blocked,
        reason: details.reason,
      },
      ipAddress: details.sourceIp,
      userAgent: details.userAgent,
      metadata: { securityEvent: true },
    });
  }

  // ==================== CLEANUP ====================

  async destroy(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    await this.flushBatch();
  }
}

// ==================== SINGLETON WRAPPER ====================

let auditLoggerInstance: AuditLogger | null = null;

export function initializeAuditLogger(config: {
  prisma: PrismaClient;
  service: string;
  environment?: string;
  version?: string;
}): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger({
      prisma: config.prisma,
      service: config.service,
      environment: config.environment || process.env.NODE_ENV || "development",
      version: config.version || process.env.APP_VERSION || "1.0.0",
      enabled: process.env.AUDIT_LOGGING_ENABLED !== "false",
    });

    if (typeof process !== "undefined") {
      process.on("SIGTERM", () => void auditLoggerInstance?.destroy());
      process.on("SIGINT", () => void auditLoggerInstance?.destroy());
    }
  }
  return auditLoggerInstance;
}

export function getAuditLogger(): AuditLogger {
  if (!auditLoggerInstance) {
    throw new Error("AuditLogger not initialized. Call initializeAuditLogger first.");
  }
  return auditLoggerInstance;
}

export const auditLogger = {
  async ensureInitialized(): Promise<AuditLogger> {
    if (!auditLoggerInstance) {
      const { prisma } = await import("@/lib/prisma");
      return initializeAuditLogger({
        prisma,
        service: "admin-system",
        environment: process.env.NODE_ENV || "development",
        version: process.env.APP_VERSION || "1.0.0",
      });
    }
    return auditLoggerInstance;
  },

  async log(options: Omit<AuditEvent, "timestamp">): Promise<SystemAuditLog | null> {
    try {
      const logger = await this.ensureInitialized();
      return await logger.log(options);
    } catch (error) {
      console.error("[AuditLogger] Failed to log event:", error);
      return null;
    }
  },

  async logAuthEvent(
    userId: string,
    action: string,
    details: {
      success: boolean;
      method?: string;
      provider?: string;
      mfaUsed?: boolean;
      ipAddress?: string;
      userAgent?: string;
      error?: string;
    }
  ): Promise<void> {
    try {
      const logger = await this.ensureInitialized();
      await logger.logAuthEvent(userId, action, details);
    } catch (error) {
      console.error("[AuditLogger] Failed to log auth event:", error);
    }
  },

  async logSecurityEvent(
    actorId: string,
    action: string,
    details: {
      severity: AuditSeverity;
      threatType?: string;
      sourceIp?: string;
      userAgent?: string;
      blocked?: boolean;
      reason?: string;
    }
  ): Promise<void> {
    try {
      const logger = await this.ensureInitialized();
      await logger.logSecurityEvent(actorId, action, details);
    } catch (error) {
      console.error("[AuditLogger] Failed to log security event:", error);
    }
  },

  async logAdminEvent(
    adminId: string,
    adminEmail: string,
    action: string,
    details: {
      resourceType?: string;
      resourceId?: string;
      changes?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      const logger = await this.ensureInitialized();
      await logger.logAdminEvent(adminId, adminEmail, action, details);
    } catch (error) {
      console.error("[AuditLogger] Failed to log admin event:", error);
    }
  },

  async query(filters: {
    actorId?: string;
    actorEmail?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    severity?: AuditSeverity;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<SystemAuditLog[]> {
    try {
      const logger = await this.ensureInitialized();
      return await logger.query(filters);
    } catch (error) {
      console.error("[AuditLogger] Failed to query logs:", error);
      return [];
    }
  },

  async getRecentEvents(limit: number = 50): Promise<SystemAuditLog[]> {
    try {
      const logger = await this.ensureInitialized();
      return await logger.getRecentEvents(limit);
    } catch (error) {
      console.error("[AuditLogger] Failed to get recent events:", error);
      return [];
    }
  },
};

export default auditLogger;