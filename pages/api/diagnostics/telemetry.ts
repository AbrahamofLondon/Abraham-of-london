// pages/api/admin/diagnostics/telemetry.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const [artifacts, lineage, grants, entitlements] = await Promise.all([
    prisma.diagnosticArtifact.count(),
    prisma.diagnosticLineageEvent.count(),
    prisma.diagnosticArtifactAccessGrant.count({ where: { status: "active" } }),
    prisma.clientEntitlement.count({ where: { status: "active" } }),
  ]);

  const recent = await prisma.diagnosticLineageEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return res.json({
    ok: true,
    stats: { artifacts, lineage, grants, entitlements },
    recent,
  });
}