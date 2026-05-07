/* pages/api/diagnostics/report/pdf.ts */
import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";
import { getDiagnosticRecordByRef } from "@/lib/server/diagnostics/store";
import {
  assertDiagnosticReportAccess,
  canUnlockReport,
} from "@/lib/server/diagnostics/report-engine";
import { resolveDiagnosticReport } from "@/lib/server/diagnostics/report-resolver";
import {
  getArchivedDiagnosticPdf,
  getArchivedDiagnosticPdfSignedUrl,
} from "@/lib/server/diagnostics/report-archive";
import { getDiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage";

export const config = {
  api: {
    responseLimit: false,
  },
};

function safeFileSegment(v: string): string {
  return v.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("METHOD_NOT_ALLOWED");
  }

  try {
    const diagnosticRef = String(req.query.ref || "").trim();
    const version = typeof req.query.version === "string" ? req.query.version.trim() : "";
    const mode = typeof req.query.mode === "string" ? req.query.mode.trim().toLowerCase() : "";

    if (!diagnosticRef) {
      return res.status(400).send("REF_MISSING");
    }

    const item = await getDiagnosticRecordByRef(diagnosticRef);
    if (!item) return res.status(404).send("NOT_FOUND");

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
      return res.status(access.status).send(access.error);
    }

    const unlocked = canUnlockReport({
      record: item,
      userTier: String(ctx?.ok && ctx?.valid ? ctx.tier || "public" : "public"),
      isAdmin: false,
      accessGranted: true,
    });

    if (!unlocked) {
      return res.status(403).send("REPORT_LOCKED");
    }

    const storage = getDiagnosticStorageAdapter();

    if (storage.provider === "s3" && mode !== "stream") {
      const signed = await getArchivedDiagnosticPdfSignedUrl({
        diagnosticRef,
        version: version || null,
      });

      if (signed?.url) {
        return res.redirect(302, signed.url);
      }
    }

    const archived = await getArchivedDiagnosticPdf({
      diagnosticRef,
      version: version || null,
    });

    if (archived) {
      const filename = `${safeFileSegment(archived.artifact.diagnosticRef)}-${safeFileSegment(
        archived.artifact.version,
      )}.pdf`;

      res.setHeader("Content-Type", archived.artifact.mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
      res.setHeader("Content-Length", String(archived.bytes.length));
      return res.status(200).send(archived.bytes);
    }

    const report = resolveDiagnosticReport({
      item,
      unlocked,
    });

    const { buildDiagnosticReportPdfBuffer } = await import(
      "@/lib/server/diagnostics/report-pdf"
    );
    const pdfBuffer = await buildDiagnosticReportPdfBuffer({
      item,
      report,
    });

    const filename = `${safeFileSegment(item.diagnosticRef)}-${safeFileSegment(
      report.version || "2026.1",
    )}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("Content-Length", String(pdfBuffer.length));

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("[diagnostics/report/pdf]", error);
    return res.status(500).send("INTERNAL_ERROR");
  }
}
