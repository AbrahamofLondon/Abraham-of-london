import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCampaignById } from "@/lib/alignment/enterprise-repository";
// Replace with your actual mail provider (Postmark/Resend/SendGrid)
// import { sendNudgeEmail } from "@/lib/mail/service"; 

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 1. Fetch Campaign and Participants
    const campaign = await getCampaignById(id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // 2. Filter for 'Incomplete' (status is 'invited' or 'opened')
    const targets = campaign.participants.filter(
      (p) => p.status === "invited" || p.status === "opened"
    );

    if (targets.length === 0) {
      return NextResponse.json({ message: "No pending participants to nudge." });
    }

    // 3. Execution Loop
    // In a production environment, move this to a Background Job (BullMQ/Vercel Cron)
    const results = await Promise.allSettled(
      targets.map(async (participant) => {
        // Logic: Only nudge if last activity was > 24h ago to prevent fatigue
        const lastActivity = participant.openedAt || participant.createdAt;
        const hoursSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / 3600000;

        if (hoursSinceActivity < 24) return { skipped: true, email: participant.email };

        /* await sendNudgeEmail({
          email: participant.email,
          campaignTitle: campaign.title,
          inviteToken: participant.inviteTokenHash, // Or the raw token if stored
          orgName: campaign.organisation.name
        });
        */

        return { sent: true, email: participant.email };
      })
    );

    const sentCount = results.filter((r: any) => r.value?.sent).length;
    const skippedCount = results.filter((r: any) => r.value?.skipped).length;

    return NextResponse.json({
      ok: true,
      summary: {
        totalTargets: targets.length,
        sent: sentCount,
        skipped: skippedCount,
      },
    });
  } catch (error) {
    console.error("BATCH_NUDGE_ERROR:", error);
    return NextResponse.json({ error: "Internal Execution Error" }, { status: 500 });
  }
}