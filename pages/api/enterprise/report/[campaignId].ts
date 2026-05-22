// pages/api/enterprise/report/[campaignId].ts
// Returns the enriched enterprise decision report for a given campaign.
// Requires admin session. Protected by requireAdminServer.
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { runEnterprisePipeline } from "@/lib/alignment/enterprise-pipeline";

const ERROR_STATUS: Record<string, number> = {
  CAMPAIGN_NOT_FOUND: 404,
  NO_SNAPSHOT: 404,
  COHORT_TOO_SMALL: 422,
  PIPELINE_ERROR: 500,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "enterprise-report",
  });
  if (!session) return;

  const { campaignId } = req.query;
  if (!campaignId || typeof campaignId !== "string" || !campaignId.trim()) {
    return res.status(400).json({ error: "Missing campaignId" });
  }

  const result = await runEnterprisePipeline(campaignId.trim());

  if (!result.ok) {
    const status = ERROR_STATUS[result.reason] ?? 500;
    return res.status(status).json({
      error: result.reason,
      ...(result.participantCount !== undefined && { participantCount: result.participantCount }),
    });
  }

  return res.status(200).json(result.report);
}
