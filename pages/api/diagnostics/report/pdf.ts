/* pages/api/diagnostics/report/pdf.ts */
import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { getDiagnosticRecordByRef } from "@/lib/server/diagnostics/store";
import { canUnlockReport } from "@/lib/server/diagnostics/report-engine";
import { resolveDiagnosticReport } from "@/lib/server/diagnostics/report-resolver";
import { buildDiagnosticReportPdfBuffer } from "@/lib/server/diagnostics/report-pdf";
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

    const sessionId = readAccessCookie(req);
    if (!sessionId) return res.status(401).send("AUTH_REQUIRED");

    const ctx = await getSessionContext(sessionId);
    if (!ctx?.ok || !ctx?.valid) return res.status(401).send("SESSION_INVALID");

    const item = await getDiagnosticRecordByRef(diagnosticRef);
    if (!item) return res.status(404).send("NOT_FOUND");

    const isAdmin = tierAtLeast(String(ctx.tier || "public"), "private");

    if (!isAdmin && item.actor.userId && item.actor.userId !== ctx.memberId) {
      return res.status(403).send("FORBIDDEN");
    }

    const unlocked = canUnlockReport({
      record: item,
      userTier: String(ctx.tier || "public"),
      isAdmin,
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