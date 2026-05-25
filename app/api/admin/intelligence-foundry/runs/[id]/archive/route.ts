// POST /api/admin/intelligence-foundry/runs/[id]/archive
// OWNER-only: archive a run. Blocked for HIGH/CRITICAL without decision path.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";
import { ArchiveRunSchema } from "@/lib/research/research-run-validation";
import { ZodError } from "zod";
import { FoundryHonestyError, FoundryNotFoundError } from "@/lib/research/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  // Destructive — requires OWNER
  if (!(auth.access as any)?.permissions?.isOwner) {
    return NextResponse.json({ ok: false, error: "Owner access required to archive runs" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const opts = ArchiveRunSchema.parse(body);

    const run = await ResearchRunRepository.archive(
      params.id,
      { id: auth.userId, email: auth.email ?? "" },
      opts,
    );

    return NextResponse.json({ ok: true, run });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "Validation failed", details: error.errors }, { status: 400 });
    }
    if (error instanceof FoundryHonestyError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    }
    if (error instanceof FoundryNotFoundError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    console.error("[FOUNDRY_ARCHIVE]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
