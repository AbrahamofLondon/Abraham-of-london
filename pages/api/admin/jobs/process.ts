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

  await prisma.diagnosticArtifact.update({
    where: { id: artifact.id },
    data: {
      regeneratedAt: new Date(),
      version: `${artifact.version || "v1"}-regen`,
    },
  });
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ ok: false, reason: "UNAUTHORIZED" });
  }

  const role = (session as any)?.user?.role ?? (session as any)?.aol?.tier;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "owner" && role !== "architect") {
    return res.status(403).json({ ok: false, reason: "ADMIN_REQUIRED" });
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