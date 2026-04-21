export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createTeamAssessmentCampaign } from "@/lib/team/team-assessment-store";
import { TEAM_ASSESSMENT_DOMAINS, type TeamAssessmentMode } from "@/lib/team/sentiment-aggregation";

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function mode(value: unknown): TeamAssessmentMode {
  return value === "multi_respondent" ? "multi_respondent" : "leader_estimate";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const selectedMode = mode(body?.mode);
    const title = s(body?.title);
    if (!title) {
      return NextResponse.json({ ok: false, error: "Campaign title is required." }, { status: 400 });
    }

    const campaign = await createTeamAssessmentCampaign({
      organisationId: s(body?.organisationId) || null,
      sponsorUserId: s(body?.sponsorUserId) || null,
      slug: s(body?.slug) || null,
      title,
      mode: selectedMode,
      status: selectedMode === "multi_respondent" ? "live" : "draft",
      closesAt: s(body?.closesAt) || null,
      minimumResponseThreshold: Number(body?.minimumResponseThreshold) || 3,
      anonymityMode: body?.anonymityMode === "attributed" ? "attributed" : "anonymous",
      domains: Array.isArray(body?.domains) && body.domains.length ? body.domains : TEAM_ASSESSMENT_DOMAINS,
      leaderEstimate:
        body?.leaderEstimate && typeof body.leaderEstimate === "object" ? body.leaderEstimate : null,
    });

    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    console.error("[TEAM_ASSESSMENT_CAMPAIGN_CREATE_ERROR]", error);
    return NextResponse.json({ ok: false, error: "Failed to create team assessment campaign." }, { status: 500 });
  }
}
