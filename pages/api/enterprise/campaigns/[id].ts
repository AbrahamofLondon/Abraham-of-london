// pages/api/enterprise/campaigns/[id].ts
// Returns campaign summary (participants, status, org linkage) for admin use.
//
// Access scope: All authenticated admins are global operators in this system.
// There is no organisation-scoped user role — every admin can access every campaign.
// If org-scoped access is ever added, a dedicated campaign ownership check must be
// inserted here before getCampaignById is called.
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { getCampaignById } from "@/lib/alignment/enterprise-repository";
import { isCohortSafe } from "@/lib/alignment/anonymity-service";

// Accepts CUID (26 chars), UUID (36 chars), and short slug-style IDs.
function isValidCampaignId(id: string): boolean {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "enterprise-campaigns",
    rateLimit: { limit: 30, windowMs: 15 * 60_000 },
  });
  if (!session) return;

  const { id } = req.query;
  if (!id || typeof id !== "string" || !isValidCampaignId(id.trim())) {
    return res.status(400).json({ error: "INVALID_CAMPAIGN_ID" });
  }

  let campaign: Awaited<ReturnType<typeof getCampaignById>>;
  try {
    campaign = await getCampaignById(id.trim());
  } catch {
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }

  if (!campaign) {
    return res.status(404).json({ error: "CAMPAIGN_NOT_FOUND" });
  }

  const allParticipants = campaign.participants ?? [];
  const completedCount = allParticipants.filter(
    (p: { status?: string }) => p.status === "completed",
  ).length;
  const invitedCount = allParticipants.length;
  const completionRate =
    invitedCount > 0 ? Math.round((completedCount / invitedCount) * 100) : 0;

  // Never return participant-level identifiers — aggregate counts only.
  return res.status(200).json({
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    organisationId: campaign.organisationId,
    organisationName: campaign.organisation?.name ?? null,
    invitedCount,
    completedCount,
    completionRate,
    cohortSafe: isCohortSafe(completedCount),
    reportReady: isCohortSafe(completedCount),
  });
}
