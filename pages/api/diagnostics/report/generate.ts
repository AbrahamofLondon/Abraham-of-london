/* pages/api/diagnostics/report/generate.ts */
import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import {
  getDiagnosticRecordByRef,
  appendDiagnosticReportVersion,
} from "@/lib/server/diagnostics/store";
import {
  composeDiagnosticReport,
  nextReportVersion,
} from "@/lib/server/diagnostics/report-engine";
import { archiveDiagnosticPdf } from "@/lib/server/diagnostics/report-archive";

type ResponseData =
  | {
      ok: true;
      diagnosticRef: string;
      reportId: string;
      version: string;
      htmlPath: string;
      pdfPath: string;
      artifactId: string;
    }
  | {
      ok: false;
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const sessionId = readAccessCookie(req);
    if (!sessionId) {
      return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });
    }

    const ctx = await getSessionContext(sessionId);
    if (!ctx?.ok || !ctx?.valid) {
      return res.status(401).json({ ok: false, error: "SESSION_INVALID" });
    }

    if (!tierAtLeast(String(ctx.tier || "public"), "private")) {
      return res.status(403).json({ ok: false, error: "INSUFFICIENT_CLEARANCE" });
    }

    const diagnosticRef = String(req.body?.diagnosticRef || "").trim();
    if (!diagnosticRef) {
      return res.status(400).json({ ok: false, error: "REF_MISSING" });
    }

    const record = await getDiagnosticRecordByRef(diagnosticRef);
    if (!record) {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }

    const version = nextReportVersion(record.report?.version || null);
    const composed = composeDiagnosticReport({
      record,
      version,
      unlocked: true,
    });

    const htmlPath = `/inner-circle/reports/${encodeURIComponent(diagnosticRef)}`;
    const pdfPath = `/api/diagnostics/report/pdf?ref=${encodeURIComponent(diagnosticRef)}&version=${encodeURIComponent(
      composed.version,
    )}`;

    const nextRecord = {
      ...record,
      report: {
        reportId: composed.reportId,
        version: composed.version,
        generatedAt: composed.generatedAt,
        headline: composed.headline,
        executiveSummary: composed.executiveSummary,
        narrativeSummary: composed.narrativeSummary,
        keyFindings: composed.keyFindings,
        recommendations: composed.recommendations,
        htmlPath,
        pdfPath,
        archivedArtifactId: null,
        archivedAt: null,
      },
    };

    const artifact = await archiveDiagnosticPdf({
      item: nextRecord as any,
      createdBy: ctx.memberId || null,
    });

    await appendDiagnosticReportVersion(diagnosticRef, {
      reportId: composed.reportId,
      version: composed.version,
      generatedAt: composed.generatedAt,
      headline: composed.headline,
      executiveSummary: composed.executiveSummary,
      narrativeSummary: composed.narrativeSummary,
      keyFindings: composed.keyFindings,
      recommendations: composed.recommendations,
      htmlPath,
      pdfPath,
      archivedArtifactId: artifact.artifactId,
      archivedAt: artifact.createdAt,
    });

    return res.status(200).json({
      ok: true,
      diagnosticRef,
      reportId: composed.reportId,
      version: composed.version,
      htmlPath,
      pdfPath,
      artifactId: artifact.artifactId,
    });
  } catch (error) {
    console.error("[diagnostics/report/generate]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}