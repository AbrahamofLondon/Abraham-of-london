import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { revokeArtifact } from "@/lib/server/diagnostics/revocation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-diagnostics-revoke",
  });
  if (!session) return;

  const { ref, version, reason } = req.body;

  const count = await revokeArtifact({
    diagnosticRef: ref,
    version,
    reason: reason || "manual_revoke",
  });

  if (count > 0 && ref) {
    import("@/lib/reporting/report-lineage").then(({ writeReportLineageEvent }) =>
      writeReportLineageEvent({
        reportType: "DIAGNOSTIC_REPORT",
        eventType: "REVOKED",
        resourceId: String(ref),
        actorEmail: session.user?.email ?? null,
        metadata: { version: version ?? null, reason: reason ?? "manual_revoke", revokedCount: count },
      })
    ).catch(() => { /* lineage must not break revocation flow */ });
  }

  return res.json({ ok: true, revoked: count });
}
