/* ============================================================================
   FILE: lib/server/diagnostics/jobs.ts
   PURPOSE:
   - Process pending diagnostic report issuance jobs
   - Dead-letter failures instead of silently dropping them
============================================================================ */

import { prisma } from "@/lib/prisma";
import { issueDiagnosticReportFromRecord } from "@/lib/server/diagnostics/report-issuer";
import { recordDeadLetter } from "@/lib/server/jobs/dead-letter";

export async function processPendingDiagnosticReports() {
  const pending = await prisma.diagnosticResult.findMany({
    where: {
      reportStatus: "pending",
    },
    orderBy: { createdAt: "asc" },
    take: 25,
  });

  const out: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const row of pending) {
    try {
      await issueDiagnosticReportFromRecord({
        diagnosticId: row.id,
        requestedBy: "system-processor",
      });

      out.push({ id: row.id, ok: true });
    } catch (error: any) {
      await prisma.diagnosticResult.update({
        where: { id: row.id },
        data: {
          reportStatus: "failed",
          reportError: error?.message || "UNKNOWN_ERROR",
        },
      });

      await recordDeadLetter({
        queue: "diagnostics",
        jobType: "diagnostic.report.issue",
        reason: error?.message || "ISSUE_FAILED",
        payload: { diagnosticId: row.id },
        fingerprint: row.referenceCode,
        source: "processPendingDiagnosticReports",
        actor: "system",
        severity: "high",
        retryable: true,
      });

      out.push({ id: row.id, ok: false, error: error?.message || "UNKNOWN_ERROR" });
    }
  }

  return {
    processed: pending.length,
    results: out,
  };
}