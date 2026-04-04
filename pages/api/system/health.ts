import type { NextApiRequest, NextApiResponse } from "next";
import { snapshotMetrics } from "@/lib/observability/metrics";
import { logger } from "@/lib/observability/logger";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const metrics = snapshotMetrics();

    return res.status(200).json({
      ok: true,
      service: "abraham-of-london",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development",
      metrics,
    });
  } catch (error: any) {
    logger.error("Health endpoint failed", "system.health", { error: error?.message });

    return res.status(500).json({
      ok: false,
      error: "HEALTH_CHECK_FAILED",
    });
  }
}