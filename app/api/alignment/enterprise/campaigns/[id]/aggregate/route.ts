import { NextRequest, NextResponse } from "next/server";
import { aggregateEnterpriseCampaign } from "@/lib/alignment/enterprise-aggregation";

/**
 * Enterprise Aggregation Endpoint
 * Triggers the geometric and statistical processing for a specific campaign.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Destructure from the awaited params for Next.js 15+ compatibility
  const { id } = await params;

  try {
    if (!id) {
      return NextResponse.json(
        { error: "Missing campaign identifier" },
        { status: 400 }
      );
    }

    const result = await aggregateEnterpriseCampaign(id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Aggregate] Error:", error);
    return NextResponse.json(
      { error: "Failed to aggregate campaign data" },
      { status: 500 }
    );
  }
}