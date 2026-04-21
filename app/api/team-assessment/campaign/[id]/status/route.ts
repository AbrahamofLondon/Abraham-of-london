export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { fetchTeamAssessmentCampaignStatus } from "@/lib/team/team-assessment-store";
import { decideClaim } from "@/lib/claims/claim-governor";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaign = await fetchTeamAssessmentCampaignStatus(id);
  if (!campaign) {
    return NextResponse.json({ ok: false, error: "Campaign not found." }, { status: 404 });
  }
  const claim = decideClaim("team-wide sentiment", {
    teamAssessmentMode: campaign.mode,
    respondentCount: campaign.aggregate?.respondentCount ?? 0,
    completionRate: campaign.aggregate?.completionRate ?? campaign.completionRate,
    confidence: campaign.aggregate?.confidence ?? 0,
    campaignStatus: campaign.status,
  });

  return NextResponse.json({
    ok: true,
    campaign: {
      ...campaign,
      claim,
    },
  });
}
