// app/api/alignment/enterprise/assessments/route.ts
import { NextRequest, NextResponse } from "next/server";
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
import { submitEnterpriseAssessmentSchema } from "@/lib/alignment/enterprise-schemas";
import { scoreEnterpriseAssessment } from "@/lib/alignment/enterprise-score";
import { adaptEnterpriseAssessmentToConstitution } from "@/lib/alignment/enterprise-constitution-adapter";

function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse("Missing authentication token", 400);
    }

    const payload = verifyEnterpriseInviteToken(token);
    if (!payload) {
      return errorResponse("Invite is invalid or expired", 401);
    }

    const participant = await getParticipantByInviteTokenHash(
      hashEnterpriseInviteToken(token),
    );

    if (!participant) {
      return errorResponse("Participant record not found", 404);
    }

    if (participant.status === "invited") {
      await markParticipantOpened(participant.id);
    }

    return NextResponse.json({
      ok: true,
      data: {
        participantId: participant.id,
        campaignId: participant.campaignId,
        organisationId: participant.campaign.organisationId,
        organisationName: participant.campaign.organisation.name,
        campaignTitle: participant.campaign.title,
        campaignStatus: participant.campaign.status,
        participantStatus: participant.status,
        openedAt: participant.openedAt,
        isExecutive: participant.membership?.isExecutive ?? false,
        teamName: participant.membership?.teamName ?? "General Operations",
        fullName: participant.membership?.fullName ?? null,
        roleTitle: participant.membership?.roleTitle ?? null,
      },
    });
  } catch (error) {
    console.error("[ENTERPRISE_ASSESSMENT_GET_ERROR]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return errorResponse("Missing authentication token", 401);
    }

    const payload = verifyEnterpriseInviteToken(token);
    if (!payload) {
      return errorResponse("Invite is invalid or expired", 401);
    }

    const participant = await getParticipantByInviteTokenHash(
      hashEnterpriseInviteToken(token),
    );

    if (!participant) {
      return errorResponse("Identity mismatch or invalid token", 401);
    }

    // Email is on membership, not directly on participant
    const participantEmail = participant.membership?.userEmail;
    if (!participantEmail || participantEmail.toLowerCase() !== payload.email.toLowerCase()) {
      return errorResponse("Invite identity mismatch", 403);
    }

    if (participant.status === "completed") {
      return errorResponse("Assessment already finalized", 409);
    }

    if (["closed", "archived"].includes(participant.campaign.status)) {
      return errorResponse("The campaign is currently closed to new entries", 409);
    }

    const validated = submitEnterpriseAssessmentSchema.safeParse({
      answers: body?.answers,
    });

    if (!validated.success) {
      return errorResponse(
        "Data integrity validation failed",
        400,
        validated.error.flatten(),
      );
    }

    const score = scoreEnterpriseAssessment(validated.data.answers);
    const constitutional = adaptEnterpriseAssessmentToConstitution(score);

    // ✅ FIX: Pass the object directly, NOT JSON.stringify
    // The repository's toPrismaJsonValue will handle serialization correctly
    const assessment = await saveEnterpriseAssessment({
      campaignId: participant.campaignId,
      participantId: participant.id,
      organisationId: participant.campaign.organisationId,
      teamName: participant.membership?.teamName ?? null,
      isExecutive: participant.membership?.isExecutive ?? false,
      answersJson: validated.data.answers, // Pass object directly, not stringified
      totalScore: score.totalScore,
      possibleScore: score.possibleScore,
      percentScore: score.percentScore,
      band: score.band,
      weakestDomains: score.weakestDomains,
      strongestDomains: score.strongestDomains,
      domainScores: score.domainScores,
    });

    await markParticipantCompleted(participant.id);

    // Trigger aggregation asynchronously without blocking response
    try {
      await aggregateEnterpriseCampaign(participant.campaignId);
    } catch (aggErr) {
      console.error("[ENTERPRISE_AGGREGATION_ERROR]", aggErr);
      // Don't fail the request if aggregation fails
    }

    return NextResponse.json(
      {
        ok: true,
        registryId: assessment.id,
        campaignId: participant.campaignId,
        organisationId: participant.campaign.organisationId,
        result: {
          totalScore: score.totalScore,
          possibleScore: score.possibleScore,
          percentScore: score.percentScore,
          band: score.band,
          weakestDomains: score.weakestDomains,
          strongestDomains: score.strongestDomains,
          domainScores: score.domainScores,
        },
        constitutional,
        message: "Enterprise assessment committed successfully.",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[ENTERPRISE_ASSESSMENT_POST_ERROR]", error);
    return errorResponse(
      error?.message || "Failed to process enterprise assessment",
      400,
    );
  }
}