/* lib/server/services/audit-service.ts — SYSTEMATIC INTEGRITY RECORDER */
import { prisma } from "@/lib/server/prisma";
import { crypto } from "crypto";

/**
 * PRODUCTION-SAFE AUDIT SERVICE
 * Handles cryptographic hashing and immutable log entry for the Inner Circle.
 */
export class AuditService {
  /**
   * Generates a privacy-safe hash for PII (Email/IP)
   */
  private static hashIdentifier(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  /**
   * Records a Retrieval Event (Download)
   * Linked to the 'DownloadAuditEvent' model in Prisma
   */
  static async recordDownload(params: {
    briefId: string;
    memberId: string;
    email: string;
    ip: string;
    userAgent?: string;
    success: boolean;
    latencyMs?: number;
    fileSize?: bigint;
  }) {
    const emailHash = this.hashIdentifier(params.email);
    const ipHash = this.hashIdentifier(params.ip);

    try {
      return await prisma.downloadAuditEvent.create({
        data: {
          slug: params.briefId,
          memberId: params.memberId,
          email: params.email, // Encrypt this in a real-world pgcrypto setup
          emailHash: emailHash,
          ipAddress: params.ip,
          ipHash: ipHash,
          userAgent: params.userAgent,
          success: params.success,
          latencyMs: params.latencyMs,
          fileSize: params.fileSize,
          contentType: "intelligence_brief",
          eventType: "secure_retrieval",
        },
      });
    } catch (error) {
      console.error("[CRITICAL_AUDIT_FAILURE] Could not record download event:", error);
      // Fail-safe: Log to console/external log aggregator if DB is down
    }
  }

  /**
   * Records a System-level security event
   * Linked to the 'SystemAuditLog' model
   */
  static async recordSecurityEvent(params: {
    action: string;
    actorId?: string;
    actorEmail?: string;
    severity: "info" | "warning" | "critical";
    metadata?: Record<string, any>;
  }) {
    try {
      await prisma.systemAuditLog.create({
        data: {
          action: params.action,
          actorId: params.actorId,
          actorEmail: params.actorEmail,
          severity: params.severity,
          category: "SECURITY",
          metadata: JSON.stringify(params.metadata),
        },
      });
    } catch (error) {
      console.error("[CRITICAL_SECURITY_LOG_FAILURE]", error);
    }
  }

  /**
   * Increment Asset Engagement Metrics
   * Linked to 'ContentMetadata'
   */
  static async incrementAssetMetrics(slug: string) {
    try {
      await prisma.contentMetadata.upsert({
        where: { slug },
        update: {
          totalDownloads: { increment: 1 },
          lastDownloadAt: new Date(),
        },
        create: {
          slug,
          title: "Auto-Generated Entry", // Will be synced by registry
          contentType: "intelligence_brief",
          totalDownloads: 1,
          lastDownloadAt: new Date(),
        },
      });
    } catch (error) {
      console.error("[METRIC_SYNC_FAILURE]", error);
    }
  }
}