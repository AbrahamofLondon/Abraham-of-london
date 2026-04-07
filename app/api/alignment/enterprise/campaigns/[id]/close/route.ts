// app/api/alignment/enterprise/campaigns/[id]/close/route.ts
import { NextResponse } from "next/server";
import { updateCampaignStatus } from "@/lib/alignment/enterprise-repository";
import { generateCampaignSnapshots } from "@/lib/alignment/enterprise-snapshot-service";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(
  _req: Request,
  { params }: RouteContext
) {
  try {
    const campaignId = params.id;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // ✅ FIX: Passed id and status as two separate arguments 
    // to match the repository signature: updateCampaignStatus(id: string, status: string)
    await updateCampaignStatus(campaignId, "closed");

    // 2. Generate Final Intelligence Snapshots
    // This ensures all data is aggregated and finalized upon closing
    const result = await generateCampaignSnapshots(campaignId);

    return NextResponse.json({ 
      success: true, 
      message: "Campaign closed and snapshots generated successfully.",
      result 
    });
  } catch (error: any) {
    console.error("[ENTERPRISE_CAMPAIGN_CLOSE_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to close campaign" }, 
      { status: 500 }
    );
  }
}