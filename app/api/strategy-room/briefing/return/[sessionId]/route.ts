import { NextRequest, NextResponse } from "next/server";
import { generateReturnBrief } from "@/lib/server/strategy-room/return-brief.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  if (!sessionId || sessionId.length < 5) {
    return NextResponse.json({ ok: false, error: "Invalid session ID" }, { status: 400 });
  }

  try {
    const brief = await generateReturnBrief(sessionId);

    if (!brief) {
      return NextResponse.json({
        ok: true,
        briefAvailable: false,
        message: "No return brief is warranted at this time.",
      });
    }

    return NextResponse.json({
      ok: true,
      briefAvailable: true,
      brief,
    });
  } catch (error) {
    console.error("[RETURN_BRIEF_ERROR]", error);
    return NextResponse.json({ ok: false, error: "Unable to generate briefing" }, { status: 500 });
  }
}
