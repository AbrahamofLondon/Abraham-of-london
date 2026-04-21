export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import {
  computeAndPersistTeamAssessmentAggregate,
  fetchTeamAssessmentCampaignStatus,
} from "@/lib/team/team-assessment-store";
import { decideClaim } from "@/lib/claims/claim-governor";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const status = await fetchTeamAssessmentCampaignStatus(id);
    if (!status) {
      return NextResponse.json({ ok: false, error: "Campaign not found." }, { status: 404 });
    }
    const aggregate = await computeAndPersistTeamAssessmentAggregate(id);
    const claim = decideClaim("team-wide sentiment", {
      teamAssessmentMode: aggregate.mode,
      respondentCount: aggregate.respondentCount,
      completionRate: aggregate.completionRate,
      confidence: aggregate.confidence,
      campaignStatus: aggregate.status,
    });
    return NextResponse.json({ ok: true, campaign: status, aggregate, claim });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compute aggregate.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return GET(request, context);
}
