/* lib/server/diagnostics/jobs.ts */

import { prisma } from "@/lib/prisma";
import { issueDiagnosticReportFromRecord } from "@/lib/server/diagnostics/report-issuer";
import { recordDeadLetter } from "@/lib/server/jobs/dead-letter";

type JobResult = {
  id: string;
  ok: boolean;
  error?: string;
};

function makeDiagnosticReference(type: string, id: string): string {
  const prefix =
    String(type || "diag")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase()
      .slice(0, 16) || "DIAG";

  return `${prefix}-${id}`;
}

export async function processPendingDiagnosticReports(): Promise<{
  processed: number;
  results: JobResult[];
}> {
  const pending = await prisma.diagnosticRecord.findMany({
    where: {
      reportStatus: "pending",
    },
    orderBy: { createdAt: "asc" },
    take: 25,
  });

  const out: JobResult[] = [];

  for (const row of pending) {
    try {
      await issueDiagnosticReportFromRecord({
        diagnosticId: row.id,
        requestedBy: "system-processor",
      });

      out.push({ id: row.id, ok: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "UNKNOWN_ERROR";

      await prisma.diagnosticRecord.update({
        where: { id: row.id },
        data: {
          reportStatus: "failed",
          notes: row.notes
            ? `${row.notes}\n[REPORT_ERROR] ${message}`
            : `[REPORT_ERROR] ${message}`,
        },
      });

      await recordDeadLetter({
        queue: "diagnostics",
        jobType: "diagnostic.report.issue",
        reason: message,
        payload: { diagnosticId: row.id },
        fingerprint: makeDiagnosticReference(row.diagnosticType, row.id),
        source: "processPendingDiagnosticReports",
        actor: "system",
        severity: "high",
        retryable: true,
      });

      out.push({ id: row.id, ok: false, error: message });
    }
  }

  return {
    processed: pending.length,
    results: out,
  };
}