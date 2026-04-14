/* lib/server/services/audit-service.ts — SYSTEMATIC INTEGRITY RECORDER */
import { createHash } from "crypto";
import {
  Prisma,
  DownloadContentType,
  DownloadDeliveryMode,
  DownloadEventType,
  ContentType,
  type AuditSeverity,
  type SecurityEvent,
} from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function toJsonString(value: unknown): string {
  try { return JSON.stringify(value ?? {}); } catch { return "{}"; }
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalString(value: unknown): string | undefined {
  const s = cleanString(value);
  return s || undefined;
}

function safeLatency(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function safeBigInt(value: unknown): bigint | undefined {
  return typeof value === "bigint" ? value : undefined;
}

export class AuditService {
  private static hash(value: string): string {
    return createHash("sha256").update(String(value)).digest("hex");
  }

  static async recordDownload(params: {
    slug: string;
    title?: string;

    contentType: DownloadContentType;
    eventType?: DownloadEventType;
    deliveryMode?: DownloadDeliveryMode;

    contentId?: string;
    frameworkId?: string;
    printAssetId?: string;

    memberId?: string;
    email?: string;

    ip?: string;
    userAgent?: string;
    referrer?: string;
    requestId?: string;
    sessionId?: string;

    success: boolean;
    statusCode?: number;
    latencyMs?: number;

    fileName?: string;
    fileSize?: bigint;
    fileHash?: string;
    sourceChecksum?: string;
    deliveredChecksum?: string;
    watermarkId?: string;

    errorCode?: string;
    errorDetail?: string;

    metadata?: Record<string, unknown>;
  }) {
    try {
      const slug = cleanString(params.slug);
      if (!slug) {
        throw new Error("recordDownload requires a non-empty slug");
      }

      const email = cleanOptionalString(params.email);
      const ip = cleanOptionalString(params.ip);

      return await prisma.downloadAuditEvent.create({
        data: {
          slug,
          title: cleanOptionalString(params.title),

          contentType: params.contentType,
          eventType: params.eventType ?? DownloadEventType.PREVIEW,
          deliveryMode: params.deliveryMode ?? DownloadDeliveryMode.DIRECT,

          contentId: cleanOptionalString(params.contentId),
          frameworkId: cleanOptionalString(params.frameworkId),
          printAssetId: cleanOptionalString(params.printAssetId),

          memberId: cleanOptionalString(params.memberId),
          email,
          emailHash: email ? this.hash(email) : undefined,

          userAgent: cleanOptionalString(params.userAgent),
          ipAddress: ip,
          ipHash: ip ? this.hash(ip) : undefined,
          referrer: cleanOptionalString(params.referrer),
          requestId: cleanOptionalString(params.requestId),
          sessionId: cleanOptionalString(params.sessionId),

          success: Boolean(params.success),
          statusCode:
            typeof params.statusCode === "number" && Number.isFinite(params.statusCode)
              ? Math.floor(params.statusCode)
              : undefined,
          latencyMs: safeLatency(params.latencyMs),
          processedAt: new Date(),

          fileName: cleanOptionalString(params.fileName),
          fileSize: safeBigInt(params.fileSize),
          fileHash: cleanOptionalString(params.fileHash),
          sourceChecksum: cleanOptionalString(params.sourceChecksum),
          deliveredChecksum: cleanOptionalString(params.deliveredChecksum),
          watermarkId: cleanOptionalString(params.watermarkId),

          errorCode: cleanOptionalString(params.errorCode),
          errorDetail: cleanOptionalString(params.errorDetail),

          metadata: toJsonString(params.metadata),
        },
      });
    } catch (error) {
      console.error(
        "[CRITICAL_AUDIT_FAILURE] Could not record download event:",
        error,
      );
      return null;
    }
  }

  static async recordSecurityEvent(params: {
    event: SecurityEvent;
    action: string;
    memberId?: string;
    ip?: string;
    userAgent?: string;
    severity: AuditSeverity;
    details?: Record<string, unknown>;
  }) {
    try {
      return await prisma.securityLog.create({
        data: {
          event: params.event,
          severity: params.severity,
          memberId: cleanOptionalString(params.memberId),
          action: cleanString(params.action),
          details: toJsonString(params.details),
          ipAddress: cleanOptionalString(params.ip),
          userAgent: cleanOptionalString(params.userAgent),
        },
      });
    } catch (error) {
      console.error("[CRITICAL_SECURITY_LOG_FAILURE]", error);
      return null;
    }
  }

  static async recordSystemEvent(params: {
    action: string;
    severity?: AuditSeverity;
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
          action: cleanString(params.action),
          severity: params.severity ?? "info",
          actorId: cleanOptionalString(params.actorId),
          actorEmail: cleanOptionalString(params.actorEmail),
          resourceId: cleanOptionalString(params.resourceId),
          ipAddress: cleanOptionalString(params.ip),
          userAgent: cleanOptionalString(params.userAgent),
          metadata: toJsonString(params.metadata),
          actorType: cleanOptionalString(params.actorType) ?? "system",
          status: cleanOptionalString(params.status) ?? "success",
          resourceType: cleanOptionalString(params.resourceType),
          resourceName: cleanOptionalString(params.resourceName),
          requestId: cleanOptionalString(params.requestId),
          sessionId: cleanOptionalString(params.sessionId),
          durationMs:
            typeof params.durationMs === "number" && Number.isFinite(params.durationMs)
              ? Math.floor(params.durationMs)
              : undefined,
          errorMessage: cleanOptionalString(params.errorMessage),
          category: cleanOptionalString(params.category),
          subCategory: cleanOptionalString(params.subCategory),
          tags: toJsonString(params.tags ?? []),
        },
      });
    } catch (error) {
      console.error("[SYSTEM_AUDIT_FAILURE]", error);
      return null;
    }
  }

  static async incrementAssetMetrics(slug: string) {
    try {
      const cleanSlug = cleanString(slug);
      if (!cleanSlug) {
        throw new Error("incrementAssetMetrics requires a non-empty slug");
      }

      return await prisma.contentMetadata.upsert({
        where: { slug: cleanSlug },
        update: {
          totalPrints: { increment: 1 },
          engagementScore: { increment: 1 },
          lastDownloadedAt: new Date(),
          downloadCount: { increment: 1 },
        },
        create: {
          slug: cleanSlug,
          title: "Auto-Generated Entry",
          contentType: ContentType.Briefs,
          totalPrints: 1,
          engagementScore: 1,
          downloadCount: 1,
          lastDownloadedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("[METRIC_SYNC_FAILURE]", error);
      return null;
    }
  }
}

export default AuditService;