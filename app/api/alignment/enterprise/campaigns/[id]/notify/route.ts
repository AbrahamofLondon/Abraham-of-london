export const dynamic = "force-dynamic";
// app/api/alignment/enterprise/campaigns/[id]/notify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getCampaignById, getOrganisationSnapshot } from "@/lib/alignment/enterprise-repository";
import { sendExecutiveBriefNotification } from "@/lib/mail/enterprise-mail-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Fetch current status
    const campaign = await getCampaignById(id);
    const snapshot = await getOrganisationSnapshot(id);

    if (!campaign || !snapshot) {
      return NextResponse.json({ error: "Campaign data incomplete" }, { status: 404 });
    }

    // 2. The "Intelligence 75" Threshold Check
    const target = 75; 
    const current = snapshot.respondentCount;

    if (current >= target && !campaign.executiveNotified) {
      // 3. Dispatch the Premium Email
      const mailResult = await sendExecutiveBriefNotification({
        email: campaign.executiveEmail, // The CEO/Lead contact
        organisationName: campaign.organisationName,
        campaignTitle: campaign.title,
        dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/enterprise/alignment/dashboard/${id}`,
        respondentCount: current
      });

      if (!mailResult.ok) {
        console.error('[NOTIFY_MAIL_FAIL]', mailResult.error);
      }

      // 4. Mark as notified in DB to prevent duplicate pings
      // await updateCampaignNotificationStatus(id, true);

      return NextResponse.json({ 
        ok: true, 
        triggered: true, 
        message: `Threshold met (${current}). Notification dispatched.` 
      });
    }

    return NextResponse.json({ 
      ok: true, 
      triggered: false, 
      message: `Threshold not yet met (${current}/${target}).` 
    });

  } catch (error) {
    console.error("[NOTIFY_ERROR]:", error);
    return NextResponse.json({ error: "Internal dispatch error" }, { status: 500 });
  }
}