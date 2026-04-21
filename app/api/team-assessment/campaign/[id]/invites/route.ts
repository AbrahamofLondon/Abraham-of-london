export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import {
  fetchTeamAssessmentCampaignStatus,
  issueTeamAssessmentInvites,
} from "@/lib/team/team-assessment-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const status = await fetchTeamAssessmentCampaignStatus(id);
  if (!status) {
    return NextResponse.json({ ok: false, error: "Campaign not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, campaign: status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const invites = Array.isArray(body?.invites) ? body.invites : [];
    if (!invites.length) {
      return NextResponse.json({ ok: false, error: "At least one invite is required." }, { status: 400 });
    }

    const issued = await issueTeamAssessmentInvites({
      campaignId: id,
      invites: invites.map((invite: any) => ({
        email: typeof invite.email === "string" ? invite.email : null,
        roleLabel: typeof invite.roleLabel === "string" ? invite.roleLabel : null,
      })),
      expiresInDays: Number(body?.expiresInDays) || 14,
    });

    return NextResponse.json({ ok: true, invites: issued });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to issue invites.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
