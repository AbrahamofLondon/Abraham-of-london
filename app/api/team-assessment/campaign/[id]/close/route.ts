export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { closeTeamAssessmentCampaign } from "@/lib/team/team-assessment-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const aggregate = await closeTeamAssessmentCampaign(id);
    return NextResponse.json({ ok: true, aggregate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to close campaign.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
