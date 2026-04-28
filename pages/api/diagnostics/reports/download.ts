/* pages/api/diagnostics/reports/download.ts */

import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "@/lib/prisma";
import { verifySignedDownloadToken } from "@/lib/security/download-signing";
import {
  consumeRateLimit,
  attachRateLimitHeaders,
} from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import { getDiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage";

export const config = {
  api: {
    responseLimit: false,
  },
};

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function normalizeEmail(value: unknown): string {
  return safeString(value).trim().toLowerCase();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const ip = getClientIp(req);
  const userAgent = safeString(req.headers["user-agent"] || "");

  const rl = await consumeRateLimit({
    key: `report-download:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });

  attachRateLimitHeaders(res, rl);

  if (!rl.ok) {
    return res.status(429).json({ ok: false, reason: "RATE_LIMITED" });
  }

  const token = safeString(req.query.token).trim();
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
      userAgent,
      metadata: {
        route: "/api/diagnostics/reports/download",
      },
    });

    return res
      .status(403)
      .json({ ok: false, reason: "INVALID_OR_EXPIRED_TOKEN" });
  }

  const artifactId = safeString(verified.artifactId).trim();
  const diagnosticRef = safeString(verified.diagnosticRef).trim();
  const email = normalizeEmail(verified.email);

  if (!artifactId || !diagnosticRef || !email) {
    await writeSecurityAudit({
      action: "REPORT_DOWNLOAD_DENIED",
      severity: "warning",
      status: "TOKEN_PAYLOAD_INVALID",
      ip,
      userAgent,
      metadata: {
        artifactId,
        diagnosticRef,
        email,
      },
    });

    return res.status(403).json({ ok: false, reason: "TOKEN_PAYLOAD_INVALID" });
  }

  const grant = await prisma.diagnosticArtifactAccessGrant.findFirst({
    where: {
      artifactId,
      diagnosticRef,
      granteeEmail: email,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!grant) {
    await writeSecurityAudit({
      action: "REPORT_DOWNLOAD_DENIED",
      severity: "warning",
      status: "ACCESS_GRANT_NOT_FOUND",
      subjectEmail: email,
      ip,
      userAgent,
      metadata: {
        artifactId,
        diagnosticRef,
      },
    });

    return res.status(403).json({ ok: false, reason: "ACCESS_NOT_GRANTED" });
  }

  const artifact = await prisma.diagnosticArtifact.findFirst({
    where: {
      id: artifactId,
      diagnosticRef,
      isRevoked: false,
      revokedAt: null,
    },
  });

  if (!artifact) {
    await writeSecurityAudit({
      action: "REPORT_DOWNLOAD_DENIED",
      severity: "warning",
      status: "ARTIFACT_NOT_FOUND_OR_REVOKED",
      subjectEmail: email,
      ip,
      userAgent,
      metadata: {
        artifactId,
        diagnosticRef,
      },
    });

    return res.status(404).json({ ok: false, reason: "ARTIFACT_NOT_AVAILABLE" });
  }

  try {
    const storage = getDiagnosticStorageAdapter();
    const bytes = await storage.getObjectBuffer(artifact.objectKey);

    if (!bytes || !bytes.length) {
      await writeSecurityAudit({
        action: "REPORT_DOWNLOAD_FAILED",
        severity: "critical",
        status: "ARTIFACT_BINARY_MISSING",
        subjectEmail: email,
        ip,
        userAgent,
        metadata: {
          artifactId: artifact.id,
          diagnosticRef: artifact.diagnosticRef,
          objectKey: artifact.objectKey,
          storageProvider: artifact.storageProvider,
        },
      });

      return res.status(404).json({ ok: false, reason: "ARTIFACT_BINARY_MISSING" });
    }

    await prisma.diagnosticLineageEvent.create({
      data: {
        diagnosticRef: artifact.diagnosticRef,
        artifactId: artifact.id,
        eventType: "artifact_downloaded",
        version: artifact.version,
        actor: email,
        diagnosticId: artifact.diagnosticId,
        metadata: JSON.stringify({
          artifactId: artifact.id,
          ip,
          objectKey: artifact.objectKey,
          storageProvider: artifact.storageProvider,
          byteLength: artifact.byteLength,
        }),
      },
    });

    await writeSecurityAudit({
      action: "REPORT_DOWNLOADED",
      severity: "info",
      status: "SUCCESS",
      subjectEmail: email,
      ip,
      userAgent,
      metadata: {
        artifactId: artifact.id,
        diagnosticRef: artifact.diagnosticRef,
        version: artifact.version,
        fileName: artifact.fileName,
      },
    });

    res.setHeader("Content-Type", artifact.mimeType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${safeString(
        artifact.fileName,
        "diagnostic-report.pdf",
      ).replace(/"/g, "")}"`,
    );
    res.setHeader("Content-Length", String(bytes.length));
    res.setHeader("Cache-Control", "private, no-store, max-age=0");

    return res.send(bytes);
  } catch (error: any) {
    console.error("[REPORT_DOWNLOAD_STORAGE_ERROR]", error);

    await writeSecurityAudit({
      action: "REPORT_DOWNLOAD_FAILED",
      severity: "critical",
      status: "STORAGE_READ_FAILED",
      subjectEmail: email,
      ip,
      userAgent,
      metadata: {
        artifactId,
        diagnosticRef,
        error: error?.message || "UNKNOWN_ERROR",
      },
    });

    return res.status(500).json({ ok: false, reason: "STORAGE_READ_FAILED" });
  }
}
