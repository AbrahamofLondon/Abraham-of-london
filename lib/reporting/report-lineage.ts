// lib/reporting/report-lineage.ts
// Append-only report chain-of-custody ledger.
// Uses SystemAuditLog as the persistent store — no migration required.
// Provides write helpers and a read helper shaped for DiagnosticLineagePanel.
import "server-only";

export type ReportEventType =
  | "CREATED"
  | "GENERATED"
  | "VIEWED"
  | "EXPORTED"
  | "UPDATED"
  | "ESCALATED"
  | "REVOKED"
  | "SHARED"
  | "ARCHIVED"
  | "SUPERSEDED";

export type ReportType =
  | "EXECUTIVE_REPORT"
  | "ENTERPRISE_REPORT"
  | "DIAGNOSTIC_REPORT"
  | "GMI_BRIEF";

export type WriteLineageInput = {
  reportType: ReportType;
  eventType: ReportEventType;
  /** campaignId, diagnosticId, or any stable report identifier */
  resourceId: string;
  resourceName?: string;
  actorId?: string | null;
  /** sanitised before client exposure — stored for admin views only */
  actorEmail?: string | null;
  version?: string;
  evidenceHash?: string;
  previousVersionId?: string;
  metadata?: Record<string, unknown>;
};

/** Shape compatible with DiagnosticLineagePanel's LineageEvent */
export type LineageEventView = {
  id: string;
  eventType: string;
  version?: string | null;
  actor?: string | null;
  createdAt: string;
};

// ─── private helpers ──────────────────────────────────────────────────────────

function sanitiseActor(actorEmail: string | null | undefined): string | null {
  if (!actorEmail) return null;
  const [local, domain] = actorEmail.split("@");
  if (!local || !domain) return null;
  // Show first char + domain only: j***@example.com
  return `${local.charAt(0)}***@${domain}`;
}

async function getPrisma(): Promise<any> {
  const { prisma } = await import("@/lib/prisma.server");
  return prisma;
}

// ─── write ────────────────────────────────────────────────────────────────────

export type LineageWriteResult = {
  lineageStatus: "RECORDED" | "FAILED";
};

/**
 * Append one lineage event for a report.
 * Fire-and-forget safe — errors are caught and logged, never thrown.
 * Returns lineageStatus so callers can surface failures to admin audit if needed.
 */
export async function writeReportLineageEvent(
  input: WriteLineageInput,
): Promise<LineageWriteResult> {
  try {
    const prisma = await getPrisma();

    const meta: Record<string, unknown> = {
      reportType: input.reportType,
      ...(input.version && { version: input.version }),
      ...(input.evidenceHash && { evidenceHash: input.evidenceHash }),
      ...(input.previousVersionId && { previousVersionId: input.previousVersionId }),
      ...(input.metadata ?? {}),
    };

    await prisma.systemAuditLog.create({
      data: {
        action: `REPORT_${input.eventType}`,
        category: "content",
        severity: input.eventType === "REVOKED" ? "warn" : "info",
        status: "success",
        resourceType: input.reportType,
        resourceId: input.resourceId,
        resourceName: input.resourceName ?? null,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorType: input.actorId ? "admin" : "system",
        metadata: JSON.stringify(meta),
      },
    });

    return { lineageStatus: "RECORDED" };
  } catch (error) {
    // Never propagate — lineage write must not break the report flow.
    console.error("[REPORT_LINEAGE_WRITE_ERROR]", JSON.stringify({
      lineageStatus: "FAILED",
      reportType: input.reportType,
      eventType: input.eventType,
      resourceId: input.resourceId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return { lineageStatus: "FAILED" };
  }
}

// ─── read ─────────────────────────────────────────────────────────────────────

/**
 * Return lineage events for a given resourceId (campaignId / reportId).
 * @param sanitized If true, actor email is obfuscated (client-safe view).
 *                  Defaults to true — admin callers should pass false.
 */
export async function getReportLineage(
  resourceId: string,
  options?: { limit?: number; sanitized?: boolean },
): Promise<LineageEventView[]> {
  const limit = Math.min(options?.limit ?? 50, 200);
  const sanitized = options?.sanitized ?? true;

  try {
    const prisma = await getPrisma();

    const rows = await prisma.systemAuditLog.findMany({
      where: {
        resourceId,
        action: { startsWith: "REPORT_" },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        action: true,
        actorEmail: true,
        metadata: true,
        createdAt: true,
      },
    });

    return rows.map((row: {
      id: string;
      action: string;
      actorEmail: string | null;
      metadata: string | null;
      createdAt: Date;
    }) => {
      let version: string | null = null;
      try {
        const meta = JSON.parse(row.metadata ?? "{}");
        version = meta.version ?? null;
      } catch { /* ignore */ }

      const eventType = row.action.replace(/^REPORT_/, "");
      const actor = sanitized
        ? sanitiseActor(row.actorEmail)
        : (row.actorEmail ?? null);

      return {
        id: row.id,
        eventType,
        version,
        actor,
        createdAt: row.createdAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("[REPORT_LINEAGE_READ_ERROR]", error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Convenience: get lineage for an admin surface (actorEmail visible).
 */
export async function getAdminReportLineage(
  resourceId: string,
  limit = 50,
): Promise<LineageEventView[]> {
  return getReportLineage(resourceId, { limit, sanitized: false });
}
