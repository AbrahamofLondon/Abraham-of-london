// pages/api/enterprise/report/[campaignId].ts
// Returns the enriched enterprise decision report for a given campaign.
//
// Access scope: All authenticated admins are global operators in this system.
// There is no organisation-scoped user role — every admin can access every campaign.
// If org-scoped access is ever added, a campaign ownership check must be inserted
// before runEnterprisePipeline is called.
//
// Error handling: raw pipeline detail (Prisma errors, stack fragments) is never
// forwarded to the client. Only the reason enum is returned.
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { runEnterprisePipeline } from "@/lib/alignment/enterprise-pipeline";

const ERROR_STATUS: Record<string, number> = {
  CAMPAIGN_NOT_FOUND: 404,
  NO_SNAPSHOT: 404,
  COHORT_TOO_SMALL: 422,
  PIPELINE_ERROR: 500,
};

// Accepts CUID (26 chars), UUID (36 chars), and short slug-style IDs.
function isValidCampaignId(id: string): boolean {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Stricter rate limit — report generation is expensive (multi-stage pipeline).
  const session = await requireAdminServer(req, res, {
    routeKey: "enterprise-report",
    rateLimit: { limit: 20, windowMs: 15 * 60_000 },
  });
  if (!session) return;

  const { campaignId } = req.query;
  if (!campaignId || typeof campaignId !== "string" || !isValidCampaignId(campaignId.trim())) {
    return res.status(400).json({ error: "INVALID_CAMPAIGN_ID" });
  }

  let result: Awaited<ReturnType<typeof runEnterprisePipeline>>;
  try {
    result = await runEnterprisePipeline(campaignId.trim());
  } catch {
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }

  if (!result.ok) {
    const status = ERROR_STATUS[result.reason] ?? 500;
    // Never forward `detail` — it may contain raw Prisma/internal error strings.
    return res.status(status).json({
      error: result.reason,
      // Expose participantCount only for COHORT_TOO_SMALL so the caller can
      // show the user how many more responses are needed.
      ...(result.reason === "COHORT_TOO_SMALL" &&
        result.participantCount !== undefined && {
          participantCount: result.participantCount,
        }),
    });
  }

  return res.status(200).json(result.report);
}
