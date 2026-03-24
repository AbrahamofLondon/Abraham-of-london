import { NextRequest, NextResponse } from "next/server";
import { aggregateEnterpriseCampaign } from "@/lib/alignment/enterprise-aggregation";

/**
 * Enterprise Aggregation Endpoint
 * Triggers the geometric and statistical processing for a specific campaign.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> } 
) {
  // Destructure from the awaited params for Next.js 15+ compatibility
  const { campaignId } = await params;

  try {
    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaign identifier" },
        { status: 400 }
      );
    }

    const result = await aggregateEnterpriseCampaign(campaignId);

    return NextResponse.json({
      success: true,
      message: "Aggregation completed successfully",
      ...result,
    });
  } catch (error) {
    // campaignId is now in scope here
    console.error(`[AGGREGATION_ERROR]: ${campaignId}`, error);

    return NextResponse.json(
      {
        error: "Failed to aggregate enterprise data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}