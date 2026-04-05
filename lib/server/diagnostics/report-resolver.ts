/* lib/server/diagnostics/report-resolver.ts */

import type { StoredDiagnosticRecord } from "@/lib/server/diagnostics/store";
import { composeDiagnosticReport } from "@/lib/server/diagnostics/report-engine";

export type ResolvedDiagnosticReport = {
  reportId: string;
  version: string;
  generatedAt: string;
  headline: string;
  strapline: string;
  executiveSummary: string;
  narrativeSummary: string;
  keyFindings: string[];
  recommendations: Array<{
    id?: string;
    title: string;
    detail: string;
    priority: "low" | "medium" | "high" | "critical";
  }>;
};

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

export function resolveDiagnosticReport(args: {
  item: StoredDiagnosticRecord;
  unlocked: boolean;
}): ResolvedDiagnosticReport {
  const { item, unlocked } = args;

  if (item.report?.reportId && item.report?.version) {
    return {
      reportId: safeString(item.report.reportId, `RPT-${item.diagnosticRef}`),
      version: safeString(item.report.version, "2026.1"),
      generatedAt: safeString(item.report.generatedAt, item.updatedAt || item.submittedAt),
      headline: safeString(item.report.headline, `${item.title} report`),
      strapline: `${safeString(item.kind, "diagnostic").toUpperCase()} REPORT • ${safeString(
        item.summary?.band,
        "WATCH",
      ).toUpperCase()} CONDITION • REF ${item.diagnosticRef}`,
      executiveSummary: safeString(item.report.executiveSummary),
      narrativeSummary: safeString(item.report.narrativeSummary),
      keyFindings: Array.isArray(item.report.keyFindings) ? item.report.keyFindings : [],
      recommendations: Array.isArray(item.report.recommendations)
        ? item.report.recommendations
        : [],
    };
  }

  const composed = composeDiagnosticReport({
    record: item,
    version: "2026.1-preview",
    unlocked,
  });

  return {
    reportId: composed.reportId,
    version: composed.version,
    generatedAt: composed.generatedAt,
    headline: composed.headline,
    strapline: composed.strapline,
    executiveSummary: composed.executiveSummary,
    narrativeSummary: composed.narrativeSummary,
    keyFindings: composed.keyFindings,
    recommendations: composed.recommendations,
  };
}