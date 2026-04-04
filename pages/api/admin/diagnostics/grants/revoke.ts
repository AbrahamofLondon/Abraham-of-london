// pages/api/admin/diagnostics/grants/revoke.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { writeDiagnosticAudit } from "@/lib/server/diagnostics/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

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