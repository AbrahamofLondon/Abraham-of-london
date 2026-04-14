import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processJobBatch, registerJobHandler } from "@/lib/jobs/processor-v2";
import { logger } from "@/lib/observability/logger";
import { withCircuitBreaker } from "@/lib/resilience/circuit-breaker";
import { prisma } from "@/lib/prisma";

registerJobHandler("diagnostic.report.regenerate", async (payload) => {
  const artifact = await prisma.diagnosticArtifact.findUnique({
    where: { id: payload.artifactId },
  });

  if (!artifact) throw new Error("ARTIFACT_NOT_FOUND");

  // Schema alignment: DiagnosticArtifact has no `regeneratedAt` column.
  // The version bump (`-regen` suffix) is the existing canonical signal that
  // a regeneration occurred — readers can detect regeneration from the version
  // string. C17-class — provisional until/unless the schema gains a dedicated
  // regeneratedAt column.
  await prisma.diagnosticArtifact.update({
    where: { id: artifact.id },
    data: {
      version: `${artifact.version || "v1"}-regen`,
    },
  });
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ ok: false, reason: "UNAUTHORIZED" });
  }

  try {
    const result = await withCircuitBreaker("jobs.process", async () => {
      return processJobBatch(25);
    });

    logger.info("Admin processed jobs", "admin.jobs.process", result);

    return res.status(200).json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    logger.error("Admin job process failed", "admin.jobs.process", {
      error: error?.message,
    });

    return res.status(500).json({
      ok: false,
      reason: error?.message || "PROCESS_FAILED",
    });
  }
}