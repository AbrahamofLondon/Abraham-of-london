export const dynamic = "force-dynamic";
// app/api/alignment/enterprise/assessments/route.ts
import { NextRequest, NextResponse } from "next/server";

// Dynamic imports to avoid build-time reference errors from transitive dependencies
async function loadModules() {
  const [repo, agg, invites, schemas, score, adapter] = await Promise.all([
    import("@/lib/alignment/enterprise-repository"),
    import("@/lib/alignment/enterprise-aggregation"),
    import("@/lib/alignment/enterprise-invites"),
    import("@/lib/alignment/enterprise-schemas"),
    import("@/lib/alignment/enterprise-score"),
    import("@/lib/alignment/enterprise-constitution-adapter"),
  ]);
  return { ...repo, ...agg, ...invites, ...schemas, ...score, ...adapter };
}

function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const m = await loadModules();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse("Missing authentication token", 400);
    }

    const payload = m.verifyEnterpriseInviteToken(token);
    if (!payload) {
      return errorResponse("Invite is invalid or expired", 401);
    }

    const participant = await m.getParticipantByInviteTokenHash(
      m.hashEnterpriseInviteToken(token),
    );

    if (!participant) {
      return errorResponse("Participant record not found", 404);
    }

    if (participant.status === "invited") {
      await m.markParticipantOpened(participant.id);
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
    const m = await loadModules();
    const body = await req.json();
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return errorResponse("Missing authentication token", 401);
    }

    const payload = m.verifyEnterpriseInviteToken(token);
    if (!payload) {
      return errorResponse("Invite is invalid or expired", 401);
    }

    const participant = await m.getParticipantByInviteTokenHash(
      m.hashEnterpriseInviteToken(token),
    );

    if (!participant) {
      return errorResponse("Identity mismatch or invalid token", 401);
    }

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

    const validated = m.submitEnterpriseAssessmentSchema.safeParse({
      answers: body?.answers,
    });

    if (!validated.success) {
      return errorResponse(
        "Data integrity validation failed",
        400,
        validated.error.flatten(),
      );
    }

    const score = m.scoreEnterpriseAssessment(validated.data.answers);
    const constitutional = m.adaptEnterpriseAssessmentToConstitution(score);

    const assessment = await m.saveEnterpriseAssessment({
      campaignId: participant.campaignId,
      participantId: participant.id,
      organisationId: participant.campaign.organisationId,
      teamName: participant.membership?.teamName ?? null,
      isExecutive: participant.membership?.isExecutive ?? false,
      answersJson: validated.data.answers,
      totalScore: score.totalScore,
      possibleScore: score.possibleScore,
      percentScore: score.percentScore,
      band: score.band,
      weakestDomains: score.weakestDomains,
      strongestDomains: score.strongestDomains,
      domainScores: score.domainScores,
    });

    await m.markParticipantCompleted(participant.id);

    try {
      await m.aggregateEnterpriseCampaign(participant.campaignId);
    } catch (aggErr) {
      console.error("[ENTERPRISE_AGGREGATION_ERROR]", aggErr);
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
