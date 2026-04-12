// pages/api/admin/diagnostics/grants/revoke.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { writeDiagnosticAudit } from "@/lib/server/diagnostics/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const role = (session as any)?.user?.role ?? (session as any)?.aol?.tier;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "owner" && role !== "architect")) {
    return res.status(401).json({ ok: false, error: "Admin access required" });
  }

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

  return res.json({ ok: true });
}