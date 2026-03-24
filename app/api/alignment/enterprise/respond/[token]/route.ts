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
import { scoreEnterpriseAssessment } from "@/lib/alignment/scoring/enterprise";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * GET: Validates the token and returns campaign/participant metadata.
 * Used to hydrate the frontend assessment form.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // 1. Verify token signature and expiry
  const payload = verifyEnterpriseInviteToken(token);
  if (!payload) {
    return errorResponse("Invite is invalid or expired", 400);
  }

  // 2. Fetch participant using the hash of the token
  const participant = await getParticipantByInviteTokenHash(
    hashEnterpriseInviteToken(token)
  );

  if (!participant) {
    return errorResponse("Participant record not found in system", 404);
  }

  // 3. Status Tracking: Mark as "opened" on first view
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

/**
 * POST: Processes the assessment submission, saves the result, 
 * and triggers an immediate campaign-wide aggregation.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // 1. Double-verification of token and participant status
    const payload = verifyEnterpriseInviteToken(token);
    if (!payload) return errorResponse("Invite is invalid or expired", 400);

    const participant = await getParticipantByInviteTokenHash(
      hashEnterpriseInviteToken(token)
    );

    if (!participant) return errorResponse("Participant not found", 404);

    // 2. Security: Ensure the token hasn't been "swapped" or hijacked
    if (participant.email.toLowerCase() !== payload.email.toLowerCase()) {
      return errorResponse("Invite identity mismatch", 403);
    }

    if (participant.status === "completed") {
      return errorResponse("This assessment has already been submitted", 409);
    }

    if (["closed", "archived"].includes(participant.campaign.status)) {
      return errorResponse("The campaign is currently closed to new entries", 409);
    }

    // 3. Parse and Score
    const body = await req.json();
    const parsed = submitEnterpriseAssessmentSchema.parse(body);
    const score = scoreEnterpriseAssessment(parsed.answers);

    // 4. Persistence Transactional Flow
    const assessment = await saveEnterpriseAssessment({
      campaignId: participant.campaignId,
      participantId: participant.id,
      organisationId: participant.campaign.organisationId,
      teamName: participant.membership?.teamName ?? null,
      isExecutive: participant.membership?.isExecutive ?? false,
      answersJson: parsed.answers,
      score,
    });

    await markParticipantCompleted(participant.id);

    // 5. Aggregation: Refresh snapshots immediately for real-time dashboarding
    // We wrap this to ensure a failure in aggregation doesn't block the user's success response
    try {
      await aggregateEnterpriseCampaign(participant.campaignId);
    } catch (aggErr) {
      console.error("Post-submission aggregation failed:", aggErr);
    }

    return NextResponse.json({
      ok: true,
      assessmentId: assessment.id,
      result: score,
      campaignId: participant.campaignId,
      organisationId: participant.campaign.organisationId,
    });
  } catch (error) {
    console.error("Submission error:", error);
    if (error instanceof Error) return errorResponse(error.message, 400);
    return errorResponse("Unable to submit enterprise assessment", 400);
  }
}