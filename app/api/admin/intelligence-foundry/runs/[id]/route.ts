// GET /api/admin/intelligence-foundry/runs/[id]
// PATCH /api/admin/intelligence-foundry/runs/[id] — metadata only, no lifecycle fields
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";
import { UpdateResearchRunSchema } from "@/lib/research/research-run-validation";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const run = await ResearchRunRepository.findById(params.id);
    if (!run) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, run });
  } catch (error) {
    console.error("[FOUNDRY_RUN_GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();

    // Reject any attempt to mutate lifecycle fields via PATCH.
    const lifecycleFields = ["status", "severity", "archivedAt", "implementedAt", "resurrectionCount"];
    const forbidden = lifecycleFields.filter((f) => f in body);
    if (forbidden.length > 0) {
      return NextResponse.json(
        { ok: false, error: `PATCH cannot mutate lifecycle fields: ${forbidden.join(", ")}. Use the dedicated action endpoints.` },
        { status: 422 },
      );
    }

    const patch = UpdateResearchRunSchema.parse(body);
    const run = await ResearchRunRepository.updateMetadata(
      params.id,
      patch,
      { email: auth.email ?? undefined },
    );
    return NextResponse.json({ ok: true, run });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("[FOUNDRY_RUN_PATCH]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
