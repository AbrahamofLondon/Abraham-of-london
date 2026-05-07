/* pages/api/diagnostics/report/history.ts */
import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";
import { getDiagnosticRecordByRef } from "@/lib/server/diagnostics/store";
import { listDiagnosticPdfArtifacts } from "@/lib/server/diagnostics/report-archive";
import { assertDiagnosticReportAccess } from "@/lib/server/diagnostics/report-engine";

type ResponseData =
  | {
      ok: true;
      diagnosticRef: string;
      reports: Array<{
        reportId: string;
        version: string;
        generatedAt: string;
        htmlPath: string | null;
        pdfPath: string | null;
        archivedArtifactId: string | null;
        archivedAt: string | null;
      }>;
      artifacts: Array<{
        artifactId: string;
        version: string;
        fileName: string;
        byteLength: number;
        createdAt: string;
      }>;
    }
  | {
      ok: false;
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const diagnosticRef = String(req.query.ref || "").trim();
    if (!diagnosticRef) {
      return res.status(400).json({ ok: false, error: "REF_MISSING" });
    }

    const item = await getDiagnosticRecordByRef(diagnosticRef);
    if (!item) {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }

    const token =
      typeof req.query.token === "string"
        ? req.query.token.trim()
        : "";
    const sessionId = readAccessCookie(req);
    const ctx = sessionId ? await getSessionContext(sessionId) : null;
    const access = assertDiagnosticReportAccess({
      record: item,
      userId: ctx?.ok && ctx?.valid ? ctx.memberId : null,
      token,
      purpose: "diagnostic_report_access",
    });

    if (!access.allowed) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    const reportHistory = Array.isArray(item.reportHistory) ? item.reportHistory : [];
    const current = item.report ? [item.report] : [];
    const merged = [...current, ...reportHistory]
      .filter(Boolean)
      .filter(
        (r, idx, arr) =>
          idx ===
          arr.findIndex(
            (x) =>
              x?.reportId === r?.reportId &&
              x?.version === r?.version,
          ),
      )
      .sort((a, b) => (b?.generatedAt || "").localeCompare(a?.generatedAt || ""));

    const artifacts = listDiagnosticPdfArtifacts(diagnosticRef).map((item) => ({
      artifactId: item.artifactId,
      version: item.version,
      fileName: item.fileName,
      byteLength: item.byteLength,
      createdAt: item.createdAt,
    }));

    return res.status(200).json({
      ok: true,
      diagnosticRef,
      reports: merged.map((r) => ({
        reportId: r.reportId,
        version: r.version,
        generatedAt: r.generatedAt,
        htmlPath: r.htmlPath ?? null,
        pdfPath: r.pdfPath ?? null,
        archivedArtifactId: r.archivedArtifactId ?? null,
        archivedAt: r.archivedAt ?? null,
      })),
      artifacts,
    });
  } catch (error) {
    console.error("[diagnostics/report/history]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
