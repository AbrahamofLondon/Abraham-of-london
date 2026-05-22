/* pages/api/admin/diagnostics/telemetry.ts — Artefact Control Plane Stats */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-diagnostics-telemetry" });
  if (!session) return;

  try {
    const [artifacts, grants, entitlements, recent, lineage] = await Promise.all([
      prisma.diagnosticRecord.count().catch(() => 0),
      prisma.diagnosticArtifactAccessGrant.count().catch(() => 0),
      prisma.innerCircleMember.count().catch(() => 0),
      prisma.systemAuditLog
        .findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          select: { id: true, action: true, createdAt: true },
        })
        .catch(() => [] as Array<{ id: string; action: string; createdAt: Date }>),
      prisma.diagnosticLineageEvent.count().catch(() => 0),
    ]);

    return res.status(200).json({
      stats: { artifacts, lineage, grants, entitlements },
      recent: recent.map((r) => ({
        id: r.id,
        eventType: r.action,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[TELEMETRY_ERROR]", error);
    return res.status(500).json({ error: "Telemetry retrieval failed." });
  }
}
