// server-only guard removed — Pages Router incompatible

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
    const rpt = item.report as Record<string, unknown>;
    return {
      reportId: safeString(item.report.reportId, `RPT-${item.diagnosticRef}`),
      version: safeString(item.report.version, "2026.1"),
      generatedAt: safeString(item.report.generatedAt, item.updatedAt || item.createdAt),
      headline: safeString(rpt["headline"] as string | undefined, `${item.title} report`),
      strapline: `${safeString(item.kind, "diagnostic").toUpperCase()} REPORT • ${safeString(
        item.summary?.band,
        "WATCH",
      ).toUpperCase()} CONDITION • REF ${item.diagnosticRef}`,
      executiveSummary: safeString(rpt["executiveSummary"] as string | undefined),
      narrativeSummary: safeString(rpt["narrativeSummary"] as string | undefined),
      keyFindings: Array.isArray(rpt["keyFindings"]) ? (rpt["keyFindings"] as string[]) : [],
      recommendations: Array.isArray(rpt["recommendations"])
        ? (rpt["recommendations"] as ResolvedDiagnosticReport["recommendations"])
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
