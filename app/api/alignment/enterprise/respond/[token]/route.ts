export const dynamic = "force-dynamic";
// app/api/alignment/enterprise/respond/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { submitEnterpriseAssessmentSchema } from "@/lib/alignment/enterprise-schemas";
import {
  getParticipantByInviteTokenHash,
  markParticipantCompleted,
  markParticipantOpened,
  saveEnterpriseAssessment,
} from "@/lib/alignment/enterprise-repository";
import { aggregateEnterpriseCampaign } from "@/lib/alignment/enterprise-aggregation";
import {
  hashEnterpriseInviteToken,
  verifyEnterpriseInviteToken,
} from "@/lib/alignment/enterprise-invites";
import { scoreEnterpriseAssessment } from "@/lib/alignment/enterprise-score";
import { adaptEnterpriseAssessmentToConstitution } from "@/lib/alignment/enterprise-constitution-adapter";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const payload = verifyEnterpriseInviteToken(token);
  if (!payload) {
    return errorResponse("Invite is invalid or expired", 400);
  }

  const participant = await getParticipantByInviteTokenHash(
    hashEnterpriseInviteToken(token),
  );

  if (!participant) {
    return errorResponse("Participant record not found in system", 404);
  }

  if (participant.status === "invited") {
    await markParticipantOpened(participant.id);
  }

  return NextResponse.json({
    ok: true,
    campaign: {
      id: participant.campaign.id,
      title: participant.campaign.title,
      organisationName: participant.campaign.organisation.name,
      objective: participant.campaign.objective,
      status: participant.campaign.status,
    },
    participant: {
      id: participant.id,
      email: participant.email,
      fullName: participant.membership?.fullName ?? null,
      teamName: participant.membership?.teamName ?? null,
      roleTitle: participant.membership?.roleTitle ?? null,
      isExecutive: participant.membership?.isExecutive ?? false,
      status: participant.status,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const payload = verifyEnterpriseInviteToken(token);
    if (!payload) return errorResponse("Invite is invalid or expired", 400);

    const participant = await getParticipantByInviteTokenHash(
      hashEnterpriseInviteToken(token),
    );

    if (!participant) return errorResponse("Participant not found", 404);

    if (participant.email.toLowerCase() !== payload.email.toLowerCase()) {
      return errorResponse("Invite identity mismatch", 403);
    }

    if (participant.status === "completed") {
      return errorResponse("This assessment has already been submitted", 409);
    }

    if (["closed", "archived"].includes(participant.campaign.status)) {
      return errorResponse("The campaign is currently closed to new entries", 409);
    }

    const body = await req.json();
    const parsed = submitEnterpriseAssessmentSchema.parse(body);

    const score = scoreEnterpriseAssessment(parsed.answers);
    const constitutional = adaptEnterpriseAssessmentToConstitution(score);

    const assessment = await saveEnterpriseAssessment({
      campaignId: participant.campaignId,
      participantId: participant.id,
      organisationId: participant.campaign.organisationId,
      teamName: participant.membership?.teamName ?? null,
      isExecutive: participant.membership?.isExecutive ?? false,
      answersJson: parsed.answers,
      totalScore: score.totalScore,
      possibleScore: score.possibleScore,
      percentScore: score.percentScore,
      band: score.band,
      weakestDomains: score.weakestDomains,
      strongestDomains: score.strongestDomains,
      domainScores: score.domainScores,
    });

    await markParticipantCompleted(participant.id);

    try {
      await aggregateEnterpriseCampaign(participant.campaignId);
    } catch (aggErr) {
      console.error("[ENTERPRISE_AGGREGATION_ERROR]", aggErr);
    }

    return NextResponse.json({
      ok: true,
      assessmentId: assessment.id,
      campaignId: participant.campaignId,
      organisationId: participant.campaign.organisationId,
      result: score,
      constitutional,
    });
  } catch (error) {
    console.error("[ENTERPRISE_RESPOND_POST_ERROR]", error);

    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }

    return errorResponse("Unable to submit enterprise assessment", 400);
  }
}