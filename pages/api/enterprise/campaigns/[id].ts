// pages/api/enterprise/campaigns/[id].ts
// Returns campaign summary (participants, status, org linkage) for admin use.
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { getCampaignById } from "@/lib/alignment/enterprise-repository";
import { isCohortSafe } from "@/lib/alignment/anonymity-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "enterprise-campaigns",
  });
  if (!session) return;

  const { id } = req.query;
  if (!id || typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ error: "Missing campaign id" });
  }

  const campaign = await getCampaignById(id.trim()).catch(() => null);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const allParticipants = campaign.participants ?? [];
  const completedCount = allParticipants.filter(
    (p: { status?: string }) => p.status === "completed",
  ).length;
  const invitedCount = allParticipants.length;
  const completionRate =
    invitedCount > 0 ? Math.round((completedCount / invitedCount) * 100) : 0;

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
