import { db } from "@/lib/db";
import type { ExecutiveReport } from "./executive-report-builder";

export type ExecutiveReportAuditInput = {
  campaignId: string;
  actorId?: string | null;
  organisationName?: string | null;
  report: ExecutiveReport;
};

export type ExecutiveReportAuditResult =
  | { ok: true; auditId: string }
  | {
      ok: false;
      error: "DATABASE_CONNECTION_FAILURE" | "AUDIT_WRITE_FAILURE";
    };

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildAuditMetadata(input: ExecutiveReportAuditInput) {
  return {
    actorId: input.actorId ?? null,
    organisationName: safeString(input.organisationName, "Sovereign Client"),

    state: input.report.state,
    headline: input.report.narrative.headline,
    summary: input.report.narrative.summary,
    mandate: input.report.narrative.mandate,

    authorized: input.report.ogr.isAuthorizedToExecute,
    sovereignCertainty: input.report.ogr.sovereignCertainty,
    averageDissonance: input.report.resonance.telemetry.averageDissonance,
    burnoutIndex: input.report.hcdAggregate.overallBurnoutIndex,
    riskScore: input.report.hcdAggregate.riskScore,
    totalExposure: input.report.financialExposure.totalExposure,

    priorityStack: input.report.priorityStack,
    failureModes: input.report.failureModes,
    criticalDomains: input.report.hcdAggregate.criticalDomains,
    elevatedDomains: input.report.hcdAggregate.elevatedDomains,

    generatedAt: new Date().toISOString(),
  };
}

export async function logExecutiveReportAudit(
  input: ExecutiveReportAuditInput
): Promise<ExecutiveReportAuditResult> {
  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) {
      return { ok: false, error: "DATABASE_CONNECTION_FAILURE" };
    }

    const record = await prisma.governanceLog.create({
      data: {
        action: "EXECUTIVE_REPORT_GENERATED",
        entityId: input.campaignId,
        metadata: buildAuditMetadata(input),
      },
    });

    return {
      ok: true,
      auditId: safeString(record?.id, "UNKNOWN_AUDIT_ID"),
    };
  } catch {
    return {
      ok: false,
      error: "AUDIT_WRITE_FAILURE",
    };
  }
}