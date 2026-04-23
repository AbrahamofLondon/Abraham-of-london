export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { aggregateCampaignRespondents } from "@/lib/diagnostics/cross-respondent-engine";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Campaign id is required" }, { status: 400 });
    }
    const result = await aggregateCampaignRespondents(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to aggregate campaign respondents",
      },
      { status: 400 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return GET(request, context);
}
