/* pages/api/diagnostics/reports/download.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { verifySignedDownloadToken } from "@/lib/security/download-signing";
import { consumeRateLimit, attachRateLimitHeaders } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { writeSecurityAudit } from "@/lib/security/audit-log";

export const config = {
  api: {
    responseLimit: false,
  },
};

function streamPdf(res: NextApiResponse, artifact: any) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${artifact.fileName || "diagnostic-report.pdf"}"`
  );

  doc.pipe(res);

  doc.fontSize(20).text(artifact.title || "Diagnostic Report");
  doc.moveDown();

  doc.fontSize(10).fillColor("gray").text(`Diagnostic Ref: ${artifact.diagnosticRef}`);
  doc.text(`Version: ${artifact.version || "v1"}`);
  doc.text(`Score: ${artifact.score ?? "—"}`);
  doc.moveDown();

  doc.fillColor("black").fontSize(12).text("Narrative", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(artifact.narrative || "No narrative provided.");
  doc.moveDown();

  doc.fontSize(12).text("Sections", { underline: true });
  doc.moveDown(0.5);

  const sections = Array.isArray(artifact.sections) ? artifact.sections : [];
  for (const section of sections) {
    doc.fontSize(11).text(`• ${section?.title || "Untitled Section"}`);
    if (section?.body) {
      doc.moveDown(0.25);
      doc.fontSize(10).fillColor("gray").text(String(section.body));
      doc.fillColor("black");
      doc.moveDown(0.5);
    }
  }

  doc.moveDown();
  doc.fontSize(9).fillColor("gray").text("Generated under controlled diagnostic reporting protocol.");

  doc.end();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const ip = getClientIp(req);
  const rl = consumeRateLimit({
    key: `report-download:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  attachRateLimitHeaders(res, rl);

  if (!rl.ok) {
    return res.status(429).json({ ok: false, reason: "RATE_LIMITED" });
  }

  const token = String(req.query.token || "");
  if (!token) {
    return res.status(400).json({ ok: false, reason: "TOKEN_MISSING" });
  }

  const verified = verifySignedDownloadToken(token);
  if (!verified) {
    await writeSecurityAudit({
      action: "REPORT_DOWNLOAD_DENIED",
      severity: "warning",
      status: "INVALID_TOKEN",
      ip,
      userAgent: String(req.headers["user-agent"] || ""),
    });

    return res.status(403).json({ ok: false, reason: "INVALID_OR_EXPIRED_TOKEN" });
  }

  const artifact = await prisma.diagnosticArtifact.findFirst({
    where: {
      id: verified.artifactId,
      diagnosticRef: verified.diagnosticRef,
      granteeEmail: verified.email.toLowerCase(),
      status: "issued",
      revokedAt: null,
    },
  });

  if (!artifact) {
    await writeSecurityAudit({
      action: "REPORT_DOWNLOAD_DENIED",
      severity: "warning",
      status: "ARTIFACT_NOT_FOUND_OR_REVOKED",
      subjectEmail: verified.email,
      ip,
      userAgent: String(req.headers["user-agent"] || ""),
      metadata: { artifactId: verified.artifactId, diagnosticRef: verified.diagnosticRef },
    });

    return res.status(404).json({ ok: false, reason: "ARTIFACT_NOT_AVAILABLE" });
  }

  await prisma.diagnosticLineageEvent.create({
    data: {
      diagnosticRef: artifact.diagnosticRef,
      eventType: "artifact_downloaded",
      version: artifact.version,
      actor: verified.email,
      metadata: {
        artifactId: artifact.id,
        ip,
      },
    },
  });

  await writeSecurityAudit({
    action: "REPORT_DOWNLOADED",
    severity: "info",
    status: "SUCCESS",
    subjectEmail: verified.email,
    ip,
    userAgent: String(req.headers["user-agent"] || ""),
    metadata: { artifactId: artifact.id, diagnosticRef: artifact.diagnosticRef },
  });

  return streamPdf(res, artifact);
}