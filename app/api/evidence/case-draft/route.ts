export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { buildCaseDraft } from "@/lib/evidence/case-draft-builder";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAppRoute();
    if (!auth.authorized) return auth.response;

    const body = await req.json().catch(() => ({}));
    const outcomeId = typeof body.outcomeId === "string" ? body.outcomeId.trim() : "";

    if (!outcomeId) {
      return NextResponse.json(
        { ok: false, error: "outcomeId is required in request body" },
        { status: 400 },
      );
    }

    const draft = await buildCaseDraft(outcomeId);

    if (!draft) {
      return NextResponse.json(
        { ok: false, error: "Outcome does not meet eligibility criteria for case study generation" },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    console.error("[CASE_DRAFT_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to build case draft" },
      { status: 500 },
    );
  }
}
