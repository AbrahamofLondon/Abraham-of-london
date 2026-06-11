// pages/api/admin/retainers/index.ts
// GET — list retainer readiness candidates (admin only)
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { listReadinessCandidates } from "@/lib/retainers/retainer-pipeline-service";
import { prisma } from "@/lib/prisma.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-retainers" });
  if (!session) return;

  const { status } = req.query;
  const filter = typeof status === "string" ? status.split(",").map(s => s.trim().toUpperCase()) : undefined;

  try {
    const [candidates, activeContracts] = await Promise.all([
      listReadinessCandidates({ readinessClass: filter }),
      prisma.retainerContract.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, tier: true, status: true, startDate: true, organisationId: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return res.status(200).json({ ok: true, candidates, activeContracts });
  } catch (error) {
    console.error("[ADMIN_RETAINERS_LIST]", error);
    return res.status(500).json({ ok: false, error: "LIST_FAILED" });
  }
}
