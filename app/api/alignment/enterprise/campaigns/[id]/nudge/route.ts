import { NextRequest, NextResponse } from "next/server";
import { getCampaignById } from "@/lib/alignment/enterprise-repository";
import { sendCampaignNudgeEmail } from "@/lib/mail";

export const runtime = "nodejs";

type CampaignParticipantLite = {
  email: string;
  status: string;
  openedAt: Date | string | null;
  createdAt: Date | string;
  inviteTokenHash: string;
};

type CampaignLite = {
  id: string;
  title: string;
  organisation: {
    name: string;
  } | null;
  participants: CampaignParticipantLite[];
};

type NudgeResult =
  | {
      sent: true;
      email: string;
    }
  | {
      skipped: true;
      email: string;
      reason: string;
    };

function normalizeString(value: unknown): string {
  return String(value || "").trim();
}

function isFulfilledResult(
  result: PromiseSettledResult<NudgeResult>,
): result is PromiseFulfilledResult<NudgeResult> {
  return result.status === "fulfilled";
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = normalizeString(params.id);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Campaign id is required" },
        { status: 400 },
      );
    }

    const campaign = (await getCampaignById(id)) as CampaignLite | null;

    if (!campaign) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found" },
        { status: 404 },
      );
    }

    const targets = campaign.participants.filter(
      (participant: CampaignParticipantLite) =>
        participant.status === "invited" || participant.status === "opened",
    );

    if (targets.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No pending participants to nudge.",
        summary: {
          totalTargets: 0,
          sent: 0,
          skipped: 0,
          failed: 0,
        },
      });
    }

    const results: PromiseSettledResult<NudgeResult>[] = await Promise.allSettled(
      targets.map(async (participant: CampaignParticipantLite): Promise<NudgeResult> => {
        const lastActivity = participant.openedAt || participant.createdAt;
        const lastActivityMs = new Date(lastActivity).getTime();

        if (!Number.isFinite(lastActivityMs)) {
          return {
            skipped: true,
            email: participant.email,
            reason: "INVALID_ACTIVITY_TIMESTAMP",
          };
        }

        const hoursSinceActivity = (Date.now() - lastActivityMs) / 3_600_000;

        if (hoursSinceActivity < 24) {
          return {
            skipped: true,
            email: participant.email,
            reason: "RECENT_ACTIVITY",
          };
        }

        const sent = await sendCampaignNudgeEmail({
          email: participant.email,
          campaignTitle: campaign.title,
          organisationName: campaign.organisation?.name || "Organisation",
          inviteToken: participant.inviteTokenHash,
        });

        if (!sent.success) {
          throw new Error(
            sent.error || `Failed to send nudge to ${participant.email}`,
          );
        }

        return {
          sent: true,
          email: participant.email,
        };
      }),
    );

    const fulfilled = results.filter(isFulfilledResult);

    const sentCount = fulfilled.filter((result) => "sent" in result.value).length;

    const skippedCount = fulfilled.filter((result) => "skipped" in result.value).length;

    const failedCount = results.filter(
      (result) => result.status === "rejected",
    ).length;

    return NextResponse.json({
      ok: true,
      summary: {
        totalTargets: targets.length,
        sent: sentCount,
        skipped: skippedCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error("[BATCH_NUDGE_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal execution error" },
      { status: 500 },
    );
  }
}