// pages/api/admin/diagnostics/retention/run.ts
// POST — trigger a diagnostic artifact retention sweep (admin only).
// Marks expired or revoked artifacts for archival; does not hard-delete.
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { prisma } from "@/lib/prisma.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-diagnostics-retention-run" });
  if (!session) return;

  try {
    const now = new Date();

    // Mark artifacts whose parent diagnostic is older than retention threshold (90 days)
    // and not yet revoked — flag them as expired in retentionClass.
    const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const result = await prisma.diagnosticArtifact.updateMany({
      where: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        retentionClass: null as any,
        revokedAt: null,
        createdAt: { lt: cutoff },
      },
      data: {
        retentionClass: "EXPIRED",
      },
    });

    await prisma.accessAuditLog.create({
      data: {
        actorType: "ADMIN",
        actorEmail: session.user?.email ?? "admin",
        action: "diagnostics.retention_sweep",
        targetType: "diagnostic_artifact",
        targetKey: "bulk",
        success: true,
        reason: "Admin-triggered retention sweep",
        metadata: { markedExpired: result.count, cutoffDate: cutoff.toISOString() } as any,
      },
    }).catch(() => undefined);

    return res.status(200).json({
      ok: true,
      markedExpired: result.count,
      cutoffDate: cutoff.toISOString(),
    });
  } catch (error) {
    console.error("[ADMIN_RETENTION_RUN]", error);
    return res.status(500).json({ ok: false, error: "RETENTION_SWEEP_FAILED" });
  }
}
