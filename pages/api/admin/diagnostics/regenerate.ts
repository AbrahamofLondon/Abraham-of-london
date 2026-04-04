// pages/api/admin/diagnostics/regenerate.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { writeDiagnosticAudit } from "@/lib/server/diagnostics/audit";
import { enqueue } from "@/lib/jobs/queue";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { diagnosticRef, artifactId } = req.body || {};
  if (!diagnosticRef) return res.status(400).json({ ok: false, reason: "REF_REQUIRED" });

  // Get the latest report artifact if artifactId not provided
  let targetArtifactId = artifactId;
  if (!targetArtifactId) {
    const latestArtifact = await prisma.diagnosticArtifact.findFirst({
      where: { diagnosticRef },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    targetArtifactId = latestArtifact?.id;
    if (!targetArtifactId) {
      return res.status(404).json({ ok: false, reason: "NO_ARTIFACT_FOUND" });
    }
  }

  const job = await enqueue({
    type: "report.regenerate",
    payload: { artifactId: targetArtifactId, diagnosticRef },
    maxAttempts: 5,
    nextRunAt: Date.now(),
  });

  await writeDiagnosticAudit({
    diagnosticRef,
    action: "regeneration_queued",
    actor: "admin",
    metadata: { jobId: job.id, artifactId: targetArtifactId },
  });

  return res.json({ ok: true, jobId: job.id });
}