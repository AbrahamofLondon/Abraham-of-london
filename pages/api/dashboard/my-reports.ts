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

  const reports = await prisma.artifactManifest.findMany({
    where: { subjectEmail: email },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      artifactId: true,
      artifactType: true,
      version: true,
      createdAt: true,
      revokedAt: true,
      retentionClass: true,
      storagePath: true,
      expiresAt: true,
    },
  });

  return res.status(200).json({
    ok: true,
    reports: reports.map((r) => ({
      id: r.artifactId,
      artifactType: r.artifactType,
      version: r.version,
      retentionClass: r.retentionClass,
      storagePath: r.storagePath,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt?.toISOString() || null,
      revokedAt: r.revokedAt?.toISOString() || null,
    })),
  });
}
