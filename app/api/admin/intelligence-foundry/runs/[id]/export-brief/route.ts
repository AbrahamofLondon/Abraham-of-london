// POST /api/admin/intelligence-foundry/runs/[id]/export-brief
// Produces an immutable stored ActionBrief with SHA-256 content hash.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ActionBriefExporter } from "@/lib/research/action-brief-exporter";
import { FoundryNotFoundError } from "@/lib/research/errors";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const result = await ActionBriefExporter.export(params.id, {
      email: auth.email ?? undefined,
    });
    return NextResponse.json({ ok: true, brief: result.brief, contentHash: result.contentHash });
  } catch (error) {
    if (error instanceof FoundryNotFoundError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    console.error("[FOUNDRY_EXPORT_BRIEF]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
