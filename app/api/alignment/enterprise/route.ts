app/api/alignment/enterprise/campaigns/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createCampaignSchema } from "@/lib/alignment/enterprise-schemas";
import { createCampaign } from "@/lib/alignment/enterprise-repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCampaignSchema.parse(body);

    const campaign = await createCampaign({
      organisationId: parsed.organisationId,
      title: parsed.title,
      objective: parsed.objective ?? null,
      opensAt: parsed.opensAt ? new Date(parsed.opensAt) : null,
      closesAt: parsed.closesAt ? new Date(parsed.closesAt) : null,
      cadenceType: parsed.cadenceType,
      createdByMembershipId: parsed.createdByMembershipId ?? null,
    });

    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}