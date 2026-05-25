// POST /api/admin/intelligence-foundry/runs/[id]/defer
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";
import { DeferRunSchema } from "@/lib/research/research-run-validation";
import { ZodError } from "zod";
import { FoundryHonestyError, FoundryNotFoundError } from "@/lib/research/errors";
import { StatusTransitionError } from "@/lib/research/status-state-machine";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { deferredReason } = DeferRunSchema.parse(body);

    const run = await ResearchRunRepository.defer(
      params.id,
      { id: auth.userId, email: auth.email ?? "" },
      deferredReason,
    );
    return NextResponse.json({ ok: true, run });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "Deferral reason required (minimum 20 characters)" }, { status: 400 });
    }
    if (error instanceof FoundryHonestyError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (error instanceof FoundryNotFoundError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    if (error instanceof StatusTransitionError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    }
    console.error("[FOUNDRY_DEFER]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
