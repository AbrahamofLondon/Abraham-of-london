export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { checkCaseEligibility } from "@/lib/evidence/case-eligibility";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const outcomeId = searchParams.get("outcomeId");

    if (!outcomeId) {
      return NextResponse.json(
        { ok: false, error: "outcomeId query parameter is required" },
        { status: 400 },
      );
    }

    const eligibility = await checkCaseEligibility(outcomeId);

    return NextResponse.json({ ok: true, ...eligibility });
  } catch (error) {
    console.error("[CASE_ELIGIBILITY_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to check eligibility" },
      { status: 500 },
    );
  }
}
