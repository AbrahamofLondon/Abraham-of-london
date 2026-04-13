// server-only guard removed — Pages Router incompatible

/* ============================================================================
   FILE: lib/server/diagnostics/retention.ts
   PURPOSE:
   - Interim-but-serious retention policy for diagnostic artefacts
   - Can sit on Prisma now, remains upgrade-safe later
============================================================================ */

import { prisma } from "@/lib/prisma";

export async function runDiagnosticsRetentionSweep() {
  const now = new Date();

  const expiredReports = await prisma.diagnosticArtifact.findMany({
    where: {
      revokedAt: null,
      expiresAt: { lte: now },
    },
    select: { id: true },
  });

  let revoked = 0;

  for (const report of expiredReports) {
    await prisma.diagnosticArtifact.update({
      where: { id: report.id },
      data: {
        revokedAt: now,
        revokedReason: "Retention expiry",
      },
    });
    revoked++;
  }

  const oldLineage = await prisma.diagnosticLineageEvent.deleteMany({
    where: {
      createdAt: {
        lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return {
    revokedReports: revoked,
    purgedLineageEvents: oldLineage.count,
    runAt: now.toISOString(),
  };
}

