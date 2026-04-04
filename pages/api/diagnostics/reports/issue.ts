/* pages/api/diagnostics/reports/issue.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, attachRateLimitHeaders } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { createSignedDownloadToken } from "@/lib/security/download-signing";
import { assessFraud } from "@/lib/security/fraud";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import { withCircuitBreaker } from "@/lib/resilience/circuit-breaker";
import { logger } from "@/lib/observability/logger";
import { increment } from "@/lib/observability/metrics";

type OkResponse = {
  ok: true;
  artifactId: string;
  diagnosticRef: string;
  signedDownloadUrl: string;
  expiresAt: string;
};

type FailResponse = {
  ok: false;
  reason: string;
  details?: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkResponse | FailResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const ip = getClientIp(req);
  const rl = consumeRateLimit({
    key: `report-issue:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  attachRateLimitHeaders(res, rl);

  if (!rl.ok) {
    return res.status(429).json({ ok: false, reason: "RATE_LIMITED" });
  }

  const session = await getServerSession(req, res, authOptions);
  const sessionEmail = session?.user?.email?.toLowerCase() || null;

  const {
    diagnosticRef,
    reportId,
    version,
    title,
    narrative,
    sections,
    score,
    viewerEmail,
    productCode,
  } = req.body || {};

  if (
    !diagnosticRef ||
    !reportId ||
    !title ||
    !viewerEmail ||
    typeof score !== "number"
  ) {
    return res.status(400).json({ ok: false, reason: "INVALID_PAYLOAD" });
  }

  const email = String(viewerEmail).toLowerCase();
  const userAgent = String(req.headers["user-agent"] || "");

  const activeEntitlement = await prisma.clientEntitlement.findFirst({
    where: {
      email,
      status: "active",
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });

  const recentArtifacts = await prisma.diagnosticArtifact.count({
    where: {
      createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
      granteeEmail: email,
    },
  });

  const failedAttempts = await prisma.systemAuditLog.count({
    where: {
      subjectEmail: email,
      action: "REPORT_ISSUE_DENIED",
      createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  const fraud = assessFraud({
    email,
    sessionEmail,
    ip,
    userAgent,
    productCode: productCode || null,
    entitlementStatus: activeEntitlement?.status || null,
    artifactCountLastHour: recentArtifacts,
    failedAttemptsLastHour: failedAttempts,
    hasEntitlement: !!activeEntitlement,
  });

  if (!fraud.allowed) {
    await writeSecurityAudit({
      action: "REPORT_ISSUE_DENIED",
      severity: "warning",
      status: "BLOCKED",
      subjectEmail: email,
      ip,
      userAgent,
      metadata: {
        fraudScore: fraud.score,
        reasons: fraud.reasons,
        diagnosticRef,
      },
    });

    return res.status(403).json({
      ok: false,
      reason: "FRAUD_OR_ENTITLEMENT_BLOCK",
      details: fraud.reasons,
    });
  }

  // ✅ WRAPPED WITH CIRCUIT BREAKER
  const artifact = await withCircuitBreaker("diagnostics.report.issue", async () => {
    // Existing report issuance logic
    const created = await prisma.diagnosticArtifact.create({
      data: {
        diagnosticRef: String(diagnosticRef),
        reportId: String(reportId),
        version: String(version || "v1"),
        fileName: `${String(title).trim().replace(/[^\w.-]+/g, "-").toLowerCase()}.pdf`,
        title: String(title),
        narrative: narrative || "",
        sections: Array.isArray(sections) ? sections : [],
        score,
        granteeEmail: email,
        artifactType: "diagnostic-report",
        status: "issued",
      },
    });

    await prisma.diagnosticLineageEvent.create({
      data: {
        diagnosticRef: String(diagnosticRef),
        eventType: "artifact_issued",
        version: String(version || "v1"),
        actor: sessionEmail || email,
        metadata: {
          artifactId: created.id,
          granteeEmail: email,
          score,
        },
      },
    });

    return created;
  });

  // ✅ OBSERVABILITY METRICS & LOGGING
  increment("reports.issued", 1, { type: artifact.artifactType });
  logger.info("Report issued", "diagnostics.report.issue", {
    artifactId: artifact.id,
    type: artifact.artifactType,
    diagnosticRef,
    granteeEmail: email,
  });

  const expiresAt = Date.now() + 15 * 60 * 1000;
  const token = createSignedDownloadToken({
    artifactId: artifact.id,
    diagnosticRef: String(diagnosticRef),
    email,
    exp: expiresAt,
  });

  await writeSecurityAudit({
    action: "REPORT_ISSUED",
    severity: "info",
    status: "SUCCESS",
    subjectEmail: email,
    ip,
    userAgent,
    metadata: {
      artifactId: artifact.id,
      diagnosticRef,
    },
  });

  return res.status(200).json({
    ok: true,
    artifactId: artifact.id,
    diagnosticRef: String(diagnosticRef),
    signedDownloadUrl: `/api/diagnostics/reports/download?token=${encodeURIComponent(token)}`,
    expiresAt: new Date(expiresAt).toISOString(),
  });
}