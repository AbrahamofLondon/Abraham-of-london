import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

    // 1. Fetch Campaign and all completed responses
    const campaign = await db.alignmentCampaign.findUnique({
      where: { id: campaignId },
      include: {
        organisation: true,
        participants: {
          where: { status: 'completed' },
          include: { 
            membership: true,
            responses: true // Assuming a relation to the actual data points
          }
        }
      }
    });

    if (!campaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    // 2. STRICT ANONYMITY GUARD
    const ANONYMITY_THRESHOLD = 5;
    if (campaign.participants.length < ANONYMITY_THRESHOLD) {
      return NextResponse.json({ 
        ok: false, 
        error: "Anonymity Threshold Not Met",
        details: `Need ${ANONYMITY_THRESHOLD - campaign.participants.length} more responses.`
      }, { status: 403 });
    }

    // 3. AGGREGATE METRICS (Logic Example)
    const executiveResponses = campaign.participants.filter(p => p.membership.isExecutive);
    const operationalResponses = campaign.participants.filter(p => !p.membership.isExecutive);

    // This is where you would calculate the 'Delta' between leadership and operations
    const reportData = {
      campaignTitle: campaign.title,
      organisation: campaign.organisation.name,
      generatedAt: new Date().toISOString(),
      summary: {
        totalResponses: campaign.participants.length,
        execCount: executiveResponses.length,
        opCount: operationalResponses.length,
      },
      // Placeholder for your actual alignment math
      alignmentScore: 72, 
      leadershipGap: 14,
      dissonanceLevel: "High"
    };

    return NextResponse.json({ 
      ok: true, 
      report: reportData 
    });

  } catch (error) {
    console.error("[REPORT_ERROR]", error);
    return new NextResponse("Internal Analytics Error", { status: 500 });
  }
}