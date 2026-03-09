/* lib/server/services/audit-service.ts — SYSTEMATIC INTEGRITY RECORDER */
import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

/**
 * Converts arbitrary values into Prisma-safe JSON input.
 * This strips undefined and normalizes unsupported values.
 */
function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

/**
 * AuditService
 * Writes structured events using only fields that exist in the current Prisma schema.
 */
export class AuditService {
  private static hash(value: string): string {
    return createHash("sha256").update(String(value)).digest("hex");
  }

  /**
   * Records a retrieval event in DownloadAuditEvent.
   */
  static async recordDownload(params: {
    briefId: string;
    memberId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    success: boolean;
    latencyMs?: number;
    fileSize?: bigint;
    printAssetId?: string;
    fileHash?: string;
    contentType?: string;
    eventType?: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      return await prisma.downloadAuditEvent.create({
        data: {
          slug: params.briefId,
          printAssetId: params.printAssetId,
          memberId: params.memberId,
          email: params.email,
          emailHash: params.email ? this.hash(params.email) : undefined,
          ipAddress: params.ip,
          ipHash: params.ip ? this.hash(params.ip) : undefined,
          userAgent: params.userAgent,
          success: params.success,
          latencyMs: params.latencyMs,
          fileSize: params.fileSize,
          fileHash: params.fileHash,
          contentType: params.contentType ?? "intelligence_brief",
          eventType: params.eventType ?? "secure_retrieval",
          processedAt: new Date(),
          metadata: toJsonValue(params.metadata),
        },
      });
    } catch (error) {
      console.error(
        "[CRITICAL_AUDIT_FAILURE] Could not record download event:",
        error
      );
      return null;
    }
  }

  /**
   * Records a security event in SecurityLog.
   */
  static async recordSecurityEvent(params: {
    event:
      | "login_success"
      | "login_failed"
      | "logout"
      | "session_revoked"
      | "session_expired"
      | "mfa_challenge_created"
      | "mfa_verified"
      | "mfa_failed"
      | "mfa_max_attempts"
      | "key_redeemed"
      | "key_revoked"
      | "key_expired"
      | "admin_action";
    action: string;
    memberId?: string;
    ip?: string;
    userAgent?: string;
    severity: "info" | "warning" | "high" | "critical";
    details?: Record<string, unknown>;
  }) {
    try {
      return await prisma.securityLog.create({
        data: {
          event: params.event,
          severity: params.severity,
          memberId: params.memberId,
          action: params.action,
          details: toJsonValue(params.details),
          ipAddress: params.ip,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      console.error("[CRITICAL_SECURITY_LOG_FAILURE]", error);
      return null;
    }
  }

  /**
   * Records a generic system event in SystemAuditLog.
   */
  static async recordSystemEvent(params: {
    action: string;
    severity?: "info" | "warning" | "high" | "critical";
    actorId?: string;
    actorEmail?: string;
    resourceId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    actorType?: string;
    status?: string;
    resourceType?: string;
    resourceName?: string;
    requestId?: string;
    sessionId?: string;
    durationMs?: number;
    errorMessage?: string;
    category?: string;
    subCategory?: string;
    tags?: unknown;
  }) {
    try {
      return await prisma.systemAuditLog.create({
        data: {
          action: params.action,
          severity: params.severity ?? "info",
          actorId: params.actorId,
          actorEmail: params.actorEmail,
          resourceId: params.resourceId,
          ipAddress: params.ip,
          userAgent: params.userAgent,
          metadata: toJsonValue(params.metadata),
          actorType: params.actorType ?? "system",
          status: params.status ?? "success",
          resourceType: params.resourceType,
          resourceName: params.resourceName,
          requestId: params.requestId,
          sessionId: params.sessionId,
          durationMs: params.durationMs,
          errorMessage: params.errorMessage,
          category: params.category,
          subCategory: params.subCategory,
          tags: toJsonValue(params.tags ?? []),
        },
      });
    } catch (error) {
      console.error("[SYSTEM_AUDIT_FAILURE]", error);
      return null;
    }
  }

  /**
   * Increment asset engagement metrics in ContentMetadata.
   *
   * Current schema supports:
   * - totalPrints
   * - engagementScore
   */
  static async incrementAssetMetrics(slug: string) {
    try {
      return await prisma.contentMetadata.upsert({
        where: { slug },
        update: {
          totalPrints: { increment: 1 },
          engagementScore: { increment: 1 },
        },
        create: {
          slug,
          title: "Auto-Generated Entry",
          contentType: "Briefing",
          totalPrints: 1,
          engagementScore: 1,
        },
      });
    } catch (error) {
      console.error("[METRIC_SYNC_FAILURE]", error);
      return null;
    }
  }
}

export default AuditService;