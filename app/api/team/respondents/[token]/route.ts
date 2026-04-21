export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import {
  getParticipantByInviteTokenHash,
  markParticipantCompleted,
  markParticipantOpened,
} from "@/lib/alignment/enterprise-repository";
import {
  hashEnterpriseInviteToken,
  verifyEnterpriseInviteToken,
} from "@/lib/alignment/enterprise-invites";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import { aggregateTeamSentiment, type SentimentResponse } from "@/lib/team/sentiment-aggregation";

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const payload = verifyEnterpriseInviteToken(token);
  if (!payload) return error("Invite is invalid or expired", 401);

  const participant = await getParticipantByInviteTokenHash(hashEnterpriseInviteToken(token));
  if (!participant) return error("Participant not found", 404);
  if (participant.status === "invited") await markParticipantOpened(participant.id);

  return NextResponse.json({
    ok: true,
    mode: "multi_respondent",
    anonymous: true,
    participant: {
      id: participant.id,
      teamName: participant.membership?.teamName ?? "General Operations",
      status: participant.status,
    },
    campaign: {
      id: participant.campaign.id,
      title: participant.campaign.title,
      organisationName: participant.campaign.organisation.name,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const payload = verifyEnterpriseInviteToken(token);
  if (!payload) return error("Invite is invalid or expired", 401);

  const participant = await getParticipantByInviteTokenHash(hashEnterpriseInviteToken(token));
  if (!participant) return error("Participant not found", 404);
  if (participant.email.toLowerCase() !== payload.email.toLowerCase()) {
    return error("Invite identity mismatch", 403);
  }
  if (participant.status === "completed") return error("Response already submitted", 409);

  const body = await req.json();
  const scores = body?.scores && typeof body.scores === "object" ? body.scores : null;
  if (!scores) return error("scores payload is required", 400);

  const response: SentimentResponse = {
    respondentId: participant.id,
    teamName: participant.membership?.teamName ?? "General Operations",
    scores,
  };
  const aggregate = aggregateTeamSentiment([response]);

  await markParticipantCompleted(participant.id);
  await persistDiagnosticStage({
    email: participant.email,
    campaignId: participant.campaignId,
    organisation: participant.campaign.organisation.name,
    stage: "team",
    payload: {
      mode: "multi_respondent",
      response,
      aggregate,
    },
    tensions: aggregate.domains
      .filter((domain) => domain.anomalyFlag)
      .map((domain) => `${domain.domain} sentiment anomaly`),
    routeDecision: { mode: "multi_respondent", source: "tokenized_participant" },
    snapshot: {
      timestamp: new Date().toISOString(),
      stage: "team",
      coreMetrics: Object.fromEntries(
        aggregate.domains.map((domain) => [domain.domain, domain.aggregateMean]),
      ),
      tensions: aggregate.domains
        .filter((domain) => domain.anomalyFlag)
        .map((domain) => domain.domain),
      escalationLevel: aggregate.confidence >= 60 ? 2 : 1,
      directive: "aggregate_team_sentiment",
    },
  });

  return NextResponse.json({
    ok: true,
    mode: "multi_respondent",
    respondentDerived: true,
    aggregate,
  });
}
