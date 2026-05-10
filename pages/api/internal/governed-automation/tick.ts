import type { NextApiRequest, NextApiResponse } from "next";

/**
 * POST /api/internal/governed-automation/tick
 *
 * Runs the governed automation sweep. Requires either:
 * - CRON_SECRET header match (for scheduled invocation)
 * - Admin session (for operator-triggered runs)
 *
 * Supports dryRun=true for preview without side effects.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth: CRON_SECRET or admin session
  const cronSecret = process.env.OVERSIGHT_CRON_SECRET || process.env.RETAINED_CADENCE_TICK_SECRET;
  const headerSecret = req.headers["x-automation-secret"] ?? req.headers["x-retained-cadence-secret"];
  let triggeredBy: "SYSTEM" | "ADMIN" | "OPERATOR" = "SYSTEM";

  if (headerSecret && cronSecret && headerSecret === cronSecret) {
    triggeredBy = "SYSTEM";
  } else {
    try {
      const { requireAdminApi } = await import("@/lib/access/server");
      const admin = await requireAdminApi(req, res);
      if (!admin) return; // 403 already sent
      triggeredBy = "ADMIN";
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const dryRun = req.query.dryRun === "true" || req.body?.dryRun === true;

  try {
    const { runGovernedAutomationSweep } = await import("@/lib/product/governed-automation-orchestrator");
    const result = await runGovernedAutomationSweep({
      scopeId: typeof req.body?.scopeId === "string" ? req.body.scopeId : undefined,
      organisationId: typeof req.body?.organisationId === "string" ? req.body.organisationId : undefined,
      dryRun,
      triggeredBy,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("[governed-automation-tick]", err);
    return res.status(500).json({ error: "Automation sweep failed" });
  }
}
