/* lib/server/diagnostics/report-resolver.ts */

import type { StoredDiagnosticRecord } from "@/lib/server/diagnostics/store";
import { composeDiagnosticReport } from "@/lib/server/diagnostics/report-engine";
import { z } from "zod";

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

const storedRecommendationSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  detail: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

const storedReportPayloadSchema = z.object({
  reportId: z.string(),
  version: z.string(),
  generatedAt: z.string(),
  htmlPath: z.string().nullable().optional(),
  pdfPath: z.string().nullable().optional(),
  archivedArtifactId: z.string().nullable().optional(),
  archivedAt: z.string().nullable().optional(),
  headline: z.string().optional(),
  executiveSummary: z.string().optional(),
  narrativeSummary: z.string().optional(),
  keyFindings: z.array(z.string()).optional(),
  recommendations: z.array(storedRecommendationSchema).optional(),
});

type StoredReportPayload = z.infer<typeof storedReportPayloadSchema>;

function parseStoredReportPayload(value: unknown): StoredReportPayload | null {
  const parsed = storedReportPayloadSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function resolveDiagnosticReport(args: {
  item: StoredDiagnosticRecord;
  unlocked: boolean;
}): ResolvedDiagnosticReport {
  const { item, unlocked } = args;
  const composed = composeDiagnosticReport({
    record: item,
    version: "2026.1-preview",
    unlocked,
  });
  const storedReport = parseStoredReportPayload(item.report);

  if (storedReport?.reportId && storedReport.version) {
    return {
      reportId: safeString(storedReport.reportId, `RPT-${item.diagnosticRef}`),
      version: safeString(storedReport.version, composed.version),
      generatedAt: safeString(storedReport.generatedAt, item.updatedAt || item.createdAt),
      headline: safeString(storedReport.headline, composed.headline),
      strapline: `${safeString(item.kind, "diagnostic").toUpperCase()} REPORT • ${safeString(
        item.summary?.band,
        "WATCH",
      ).toUpperCase()} CONDITION • REF ${item.diagnosticRef}`,
      executiveSummary: safeString(storedReport.executiveSummary, composed.executiveSummary),
      narrativeSummary: safeString(storedReport.narrativeSummary, composed.narrativeSummary),
      keyFindings: storedReport.keyFindings ?? composed.keyFindings,
      recommendations: storedReport.recommendations ?? composed.recommendations,
    };
  }

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
