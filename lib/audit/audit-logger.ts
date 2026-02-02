/* lib/audit/audit-logger.ts */
import { safeSlice } from "@/lib/utils/safe";
import { PrismaClient, Prisma, type SystemAuditLog } from "@prisma/client"; // Corrected path

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

      if (this.environment === "development" || this.environment === "test") {
        this.consoleLog(normalized);
      }

      if (normalized.severity === "critical" || normalized.severity === "error") {
        return await this.createLogEntry(normalized);
      }

      if (this.environment === "production") {
        const input = this.toCreateManyInput(normalized);
        this.batchQueue.push(input);

        if (this.batchQueue.length >= this.batchSize) {
          await this.flushBatch();
        }
        return null;
      }

      return await this.createLogEntry(normalized);
    } catch (error) {
      console.error("[AuditLogger] Critical Failure:", error);
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
    const emoji = this.getSeverityEmoji(event.severity);
    console.groupCollapsed(`${emoji} [AUDIT:${event.severity.toUpperCase()}] ${event.action}`);
    console.log("Actor:", event.actorEmail || event.actorId || "Anonymous");
    
    // FIX: Corrected userAgent reference and usage of safeSlice
    if (event.ipAddress || event.userAgent) {
      console.log("Context:", {
        ip: event.ipAddress,
        userAgent: event.userAgent ? safeSlice(event.userAgent, 0, 120) : undefined,
      });
    }
    console.groupEnd();
  }

  private getSeverityEmoji(severity: AuditSeverity): string {
    const emojis: Record<AuditSeverity, string> = {
      info: "ℹ️",
      warning: "⚠️",
      error: "❌",
      critical: "🚨"
    };
    return emojis[severity] || "📝";
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
      resourceName: event.resourceName,
      userAgent: event.userAgent,
      requestId: event.requestId,
      sessionId: event.sessionId,
      status: event.status || "success",
      severity: event.severity,
      errorMessage: event.errorMessage,
      durationMs: event.durationMs,
      metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
      category: event.category,
      subCategory: event.subCategory,
      tags: event.tags ? JSON.stringify(event.tags) : undefined,
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
      await this.prisma.systemAuditLog.createMany({ data: batch });
    } catch (error) {
      console.error("[AuditLogger] Batch flush failed:", error);
    }
  }

  async destroy(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    await this.flushBatch();
  }

  // Domain Helper: Auth
  async logAuthEvent(userId: string, action: string, details: any): Promise<void> {
    await this.log({
      actorId: userId,
      actorType: "user",
      action: `AUTH_${action.toUpperCase()}`,
      category: "auth",
      severity: details.success ? "info" : "warning",
      status: details.success ? "success" : "failure",
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
    });
  }
}

// Singleton Initialization
let auditLoggerInstance: AuditLogger | null = null;

export const auditLogger = {
  async ensureInitialized(): Promise<AuditLogger> {
    if (!auditLoggerInstance) {
      const { prisma } = await import("@/lib/db"); // Verified path
      auditLoggerInstance = new AuditLogger({
        prisma,
        service: "sovereign-core",
        environment: process.env.NODE_ENV || "development",
      });
    }
    return auditLoggerInstance;
  },

  async log(options: Omit<AuditEvent, "timestamp">) {
    const logger = await this.ensureInitialized();
    return await logger.log(options);
  },

  async logAuthEvent(userId: string, action: string, details: any) {
    const logger = await this.ensureInitialized();
    return await logger.logAuthEvent(userId, action, details);
  }
};

export function getAuditLogger() {
  return auditLogger;
}

export default auditLogger;