// pages/api/admin/diagnostics/grants/revoke.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { prisma } from "@/lib/prisma.server";
import { writeDiagnosticAudit } from "@/lib/server/diagnostics/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-diagnostics-grants-revoke",
  });
  if (!session) return;

  const { grantId } = req.body || {};
  if (!grantId) return res.status(400).json({ ok: false, reason: "GRANT_ID_REQUIRED" });

  const grant = await prisma.diagnosticArtifactAccessGrant.update({
    where: { id: grantId },
    data: { status: "revoked" },
  });

  await writeDiagnosticAudit({
    diagnosticRef: grant.diagnosticRef,
    action: "grant_revoked",
    actor: "admin",
    metadata: { grantId },
  });

  import("@/lib/reporting/report-lineage").then(({ writeReportLineageEvent }) =>
    writeReportLineageEvent({
      reportType: "DIAGNOSTIC_REPORT",
      eventType: "REVOKED",
      resourceId: grant.diagnosticRef,
      actorEmail: session.user?.email ?? null,
      metadata: { grantId },
    })
  ).catch(() => { /* lineage must not break revocation flow */ });

  return res.json({ ok: true });
}
