import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ ok: false, reason: "UNAUTHORIZED" });
  }

  const email = session.user.email.toLowerCase();

  // Schema alignment: DiagnosticArtifact has no `subjectEmail` / `artifactType`
  // / `regeneratedAt` / `storagePath` columns. The user→artifact chain runs
  // through the parent DiagnosticRecord (`diagnostic.userEmail`). The artifact
  // type discriminator is `kind` (DiagnosticArtifactKind enum). The storage
  // location is `objectKey`. There is no regeneratedAt column.
  const reports = await prisma.diagnosticArtifact.findMany({
    where: { diagnostic: { userEmail: email } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      kind: true,
      version: true,
      createdAt: true,
      revokedAt: true,
      retentionClass: true,
      objectKey: true,
    },
  });

  return res.status(200).json({
    ok: true,
    reports: reports.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      revokedAt: r.revokedAt?.toISOString() || null,
    })),
  });
}