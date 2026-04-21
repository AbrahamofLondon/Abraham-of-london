export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import {
  getTeamAssessmentRespondentContext,
  submitTeamAssessmentResponse,
} from "@/lib/team/team-assessment-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const context = await getTeamAssessmentRespondentContext(token);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Invite is invalid or expired." }, { status: 401 });
  }
  if (context.deniedReason) {
    return NextResponse.json({ ok: false, error: context.deniedReason }, { status: 403 });
  }

  const domains = JSON.parse(context.campaign.domainsJson || "[]");
  return NextResponse.json({
    ok: true,
    kind: "team_assessment",
    mode: context.campaign.mode,
    anonymityMode: context.campaign.anonymityMode,
    invite: {
      id: context.invite.id,
      email: context.campaign.anonymityMode === "attributed" ? context.invite.email : null,
      roleLabel: context.invite.roleLabel,
      status: context.invite.status,
    },
    campaign: {
      id: context.campaign.id,
      title: context.campaign.title,
      status: context.campaign.status,
      domains,
      minimumResponseThreshold: context.campaign.minimumResponseThreshold,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const body = await request.json();
    if (!body?.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
      return NextResponse.json({ ok: false, error: "answers payload is required." }, { status: 400 });
    }
    const result = await submitTeamAssessmentResponse({ token, answers: body.answers });
    return NextResponse.json({
      ok: true,
      kind: "team_assessment",
      responseId: result.response.id,
      aggregate: result.aggregate,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit response.";
    const status = /already|closed|expired/i.test(message) ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
