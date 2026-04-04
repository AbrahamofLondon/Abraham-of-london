// app/api/alignment/enterprise/campaigns/[id]/close/route.ts

import { NextResponse } from "next/server";
import { updateCampaignStatus } from "@/lib/alignment/enterprise-repository";
import { generateCampaignSnapshots } from "@/lib/alignment/enterprise-snapshot-service";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Update Status to Closed
    await updateCampaignStatus({
      id: params.id,
      status: "closed"
    });

    // 2. Generate Final Intelligence Snapshots
    const result = await generateCampaignSnapshots(params.id);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}